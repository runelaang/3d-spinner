import { readFileSync } from "node:fs";

/**
 * The public entry points, read from package.json "exports" so the export map is
 * the only list to maintain. Each entry maps its ESM output (`./dist/<path>.js`)
 * back to its source (`src/<path>.ts`). Throws when an entry's types, import, and
 * require targets disagree about that path.
 */
export function publicEntries() {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  return Object.entries(pkg.exports).map(([subpath, target]) => {
    const match = /^\.\/dist\/(.+)\.js$/.exec(target.import?.default ?? "");
    if (!match) throw new Error(`exports["${subpath}"]: unexpected import target`);
    const path = match[1];
    const expected = {
      "import.types": `./dist/${path}.d.ts`,
      "require.types": `./dist/cjs/${path}.d.cts`,
      "require.default": `./dist/cjs/${path}.cjs`,
    };
    for (const [key, value] of Object.entries(expected)) {
      const [condition, field] = key.split(".");
      if (target[condition]?.[field] !== value) {
        throw new Error(`exports["${subpath}"].${key} should be ${value}`);
      }
    }
    return { subpath, path, source: `src/${path}.ts` };
  });
}
