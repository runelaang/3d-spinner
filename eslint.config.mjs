import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

// Type-aware linting for the published source. Among other things this rejects
// unhandled promises, `any`, and unsafe values flowing out of `any`.
export default tseslint.config(
  { ignores: ["dist/", "node_modules/", "examples/", "meshes/", "screenshots/", "scripts/", "tests/", "*.mjs"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
);
