/**
 * Electrobun Build Configuration for Copilot Cowork
 *
 * This tells the Electrobun CLI how to build and bundle the app.
 * - The bun entrypoint is the main desktop process
 * - Views are webview-side TypeScript (transpiled for the browser)
 * - Copy maps static assets (like Next.js export output) into the bundle
 */
import type { ElectrobunConfig } from "electrobun";

export default {
  app: {
    name: "Copilot Cowork",
    identifier: "dev.copilotcowork.app",
    version: "0.1.0",
  },
  runtime: {
    exitOnLastWindowClosed: true,
  },
  build: {
    bun: {
      entrypoint: "src/bun/index.ts",
    },
    views: {
      "main-ui": {
        entrypoint: "src/ui/index.ts",
      },
    },
    copy: {
      // Copy the webview bridge HTML
      "src/ui/index.html": "views/main-ui/bridge.html",
      // Next.js static export output — copy to views root so /_next/ paths resolve
      "frontend/out": "views/main-ui",
    },
  },
} satisfies ElectrobunConfig;
