import { defineConfig } from "orval";

export default defineConfig({
  pantry: {
    input: "../../packages/api-spec/tsp-output/schema/openapi.yaml",
    output: {
      mode: "tags-split",
      namingConvention: "kebab-case",
      client: "hono",
      schemas: "src/generated/schemas",
      target: "src/generated",
      override: {
        hono: {
          handlers: "src/routes",
          compositeRoute: "src/generated/routes.ts",
          validatorOutputPath: "src/generated/validator.ts",
        },
      },
    },
    hooks: {
      afterAllFilesWrite: ["oxfmt"],
    },
  },
});
