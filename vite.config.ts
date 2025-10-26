import { defineConfig } from "vite";
// @ts-expect-error - There are no types available
import eslint from "vite-plugin-eslint";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [eslint(), tsconfigPaths()],
});
