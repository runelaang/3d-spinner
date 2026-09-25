import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// Type-checks tiny consumer files against the built package the way a consumer's
// TypeScript would see it: resolved by package name through "exports", with
// declaration files checked (no skipLibCheck). The consumer files live in memory,
// placed inside this package so the name resolves to it by self-reference.

const root = fileURLToPath(new URL("..", import.meta.url)).replace(/\\/g, "/");
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const specifiers = Object.keys(pkg.exports).map((subpath) =>
  subpath === "." ? pkg.name : `${pkg.name}/${subpath.slice(2)}`,
);

const esmConsumer = specifiers
  .map((specifier, i) => `import * as m${i} from "${specifier}";\nexport { m${i} };`)
  .join("\n");
const cjsConsumer = specifiers
  .map((specifier, i) => `import m${i} = require("${specifier}");\nexport { m${i} };`)
  .join("\n");

/** Compile the in-memory consumer files and return their diagnostics as readable lines. */
function diagnostics(files, options) {
  const virtual = new Map(Object.entries(files).map(([name, text]) => [`${root}${name}`, text]));
  const normalize = (file) => file.replace(/\\/g, "/");
  const host = ts.createCompilerHost(options);
  const { getSourceFile, fileExists, readFile } = host;
  host.getSourceFile = (file, language, ...rest) => {
    const text = virtual.get(normalize(file));
    return text === undefined
      ? getSourceFile.call(host, file, language, ...rest)
      : ts.createSourceFile(file, text, language);
  };
  host.fileExists = (file) => virtual.has(normalize(file)) || fileExists.call(host, file);
  host.readFile = (file) => virtual.get(normalize(file)) ?? readFile.call(host, file);
  const program = ts.createProgram([...virtual.keys()], options, host);
  return ts.getPreEmitDiagnostics(program).map((diagnostic) => {
    const where = diagnostic.file ? `${diagnostic.file.fileName.replace(root, "")}: ` : "";
    return `${where}TS${diagnostic.code} ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`;
  });
}

const base = {
  target: ts.ScriptTarget.ES2022,
  lib: ["lib.es2022.d.ts", "lib.dom.d.ts"],
  strict: true,
  noEmit: true,
  skipLibCheck: false,
  types: [],
};

for (const [name, module, moduleResolution] of [
  ["node16", ts.ModuleKind.Node16, ts.ModuleResolutionKind.Node16],
  ["nodenext", ts.ModuleKind.NodeNext, ts.ModuleResolutionKind.NodeNext],
]) {
  test(`every export resolves with matching types for ESM and CommonJS consumers (${name})`, () => {
    const found = diagnostics(
      { "tests/consumer.mts": esmConsumer, "tests/consumer.cts": cjsConsumer },
      { ...base, module, moduleResolution },
    );
    assert.deepEqual(found, []);
  });
}

test("every export resolves for bundler consumers", () => {
  const found = diagnostics(
    { "tests/consumer.ts": esmConsumer },
    { ...base, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler },
  );
  assert.deepEqual(found, []);
});
