import { svelte } from "@sveltejs/vite-plugin-svelte";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      src: fileURLToPath(new URL("./src", import.meta.url)),
      server: fileURLToPath(new URL("./server", import.meta.url)),
    },
    conditions: ["browser"],
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.ts"],
  },
});
