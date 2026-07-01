import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages deployment.
  base: "/super-planner-9000/",
  server: {
    // Fixed port: SSO redirect URIs are configured against this port.
    port: 5173
  },
  build: {
    // Open-source rapid-dev project: keep readable stack traces in production
    // over a smaller bundle. Disabling JS minification also disables CSS
    // minification, since cssMinify defaults to the value of minify.
    minify: false
  },
  test: {
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"]
  }
});
