import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative base keeps static builds portable (for GitHub Pages and similar hosts).
  base: "./",
  test: {
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/lib/**/*.test.ts", "src/store/**/*.test.ts"]
  }
});
