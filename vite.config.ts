import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages deployment.
  base: "/super-planner-9000/",
  test: {
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/lib/**/*.test.ts", "src/store/**/*.test.ts"]
  }
});
