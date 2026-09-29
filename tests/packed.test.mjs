import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, execSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// Packs the package with `npm pack`, installs the tarball into a new project in a
// temp folder, and uses it from there: every file package.json points to exists,
// every subpath imports as ESM and requires as CommonJS, and TypeScript resolves
// every subpath's types. The other tests use the working tree; this one only sees
// what npm would publish. Needs a built dist/ (`npm test` builds it first).

const root = fileURLToPath(new URL("..", import.meta.url));
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const specifiers = Object.keys(pkg.exports).map((subpath) =>
  subpath === "." ? pkg.name : `${pkg.name}/${subpath.slice(2)}`,
);

let consumer;
let installed;

before(() => {
  consumer = mkdtempSync(join(tmpdir(), "3d-spinner-packed-"));
  const [packed] = JSON.parse(
    execSync(`npm pack --json --ignore-scripts --pack-destination "${consumer}"`, {
      cwd: root,
      encoding: "utf8",
    }),
  );
  writeFileSync(
    join(consumer, "package.json"),
    JSON.stringify({ name: "consumer", private: true }),
  );
  execSync(
    `npm install --offline --no-audit --no-fund --ignore-scripts "${join(consumer, packed.filename)}"`,
    { cwd: consumer, stdio: "ignore" },
  );
  installed = join(consumer, "node_modules", pkg.name);
});

after(() => {
  if (consumer) rmSync(consumer, { recursive: true, force: true });
});

/** Every file path in a package.json `exports` value, however deeply nested. */
function exportTargets(value) {
  if (typeof value === "string") return [value];
  return Object.values(value).flatMap(exportTargets);
}

/** Run `code` with Node inside the consumer project and return its output. */
function runInConsumer(args, code) {
  return execFileSync(process.execPath, [...args, "-e", code], {
    cwd: consumer,
    encoding: "utf8",
  });
}

test("the installed package contains every file its package.json points to", () => {
  const fields = ["main", "module", "types", "browser", "unpkg", "jsdelivr"];
  const targets = [
    ...fields.map((field) => pkg[field]).filter(Boolean),
    ...exportTargets(pkg.exports),
  ];
  const missing = targets.filter((target) => !existsSync(join(installed, target)));
  assert.deepEqual(missing, []);
});

test("every subpath of the installed package imports as ESM", () => {
  const code = `
    for (const specifier of ${JSON.stringify(specifiers)}) {
      const module = await import(specifier);
      if (Object.keys(module).length === 0) throw new Error(specifier + " has no exports");
    }
    console.log("ok");`;
  assert.equal(runInConsumer(["--input-type=module"], code).trim(), "ok");
});

test("every subpath of the installed package loads with require()", () => {
  const code = `
    for (const specifier of ${JSON.stringify(specifiers)}) {
      const module = require(specifier);
      if (Object.keys(module).length === 0) throw new Error(specifier + " has no exports");
    }
    console.log("ok");`;
  assert.equal(runInConsumer(["--input-type=commonjs"], code).trim(), "ok");
});

test("TypeScript resolves every subpath's types from the installed package", () => {
  const esm = specifiers
    .map((specifier, i) => `import * as m${i} from "${specifier}";\nexport { m${i} };`)
    .join("\n");
  const cjs = specifiers
    .map((specifier, i) => `import m${i} = require("${specifier}");\nexport { m${i} };`)
    .join("\n");
  writeFileSync(join(consumer, "esm.mts"), esm);
  writeFileSync(join(consumer, "cjs.cts"), cjs);
  writeFileSync(join(consumer, "bundler.ts"), esm);
  const base = {
    target: ts.ScriptTarget.ES2022,
    lib: ["lib.es2022.d.ts", "lib.dom.d.ts"],
    strict: true,
    noEmit: true,
    skipLibCheck: false,
    types: [],
  };
  const setups = {
    node16: [["esm.mts", "cjs.cts"], ts.ModuleKind.Node16, ts.ModuleResolutionKind.Node16],
    nodenext: [["esm.mts", "cjs.cts"], ts.ModuleKind.NodeNext, ts.ModuleResolutionKind.NodeNext],
    bundler: [["bundler.ts"], ts.ModuleKind.ESNext, ts.ModuleResolutionKind.Bundler],
  };
  for (const [name, [files, module, moduleResolution]] of Object.entries(setups)) {
    const program = ts.createProgram(
      files.map((file) => join(consumer, file)),
      { ...base, module, moduleResolution },
    );
    const found = ts
      .getPreEmitDiagnostics(program)
      .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " "));
    assert.deepEqual(found, [], name);
  }
});
