import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/handler.ts", "scripts/start-server.ts"],
  outDir: "dist",
  format: ["esm"],
  target: "node22",
  platform: "node",
  sourcemap: true,
  clean: true,
  dts: false,
  splitting: false,
  treeshake: true,
  tsconfig: "tsconfig.json",
});
