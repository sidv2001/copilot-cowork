/**
 * Copilot Cowork - Electrobun Webview Bridge
 *
 * This script runs inside the webview and provides a bridge between
 * the Electrobun native APIs and the Next.js frontend.
 * It's transpiled by Electrobun and available at views://main-ui/index.js
 */
import { Electroview } from "electrobun/view";

// Initialize the Electrobun browser-side API
const electrobun = new Electroview({ rpc: null });

// Expose a global to let the Next.js app know it's running inside Electrobun
(window as any).__ELECTROBUN__ = true;
(window as any).__COPILOT_COWORK__ = {
  platform: navigator.platform,
  isDesktop: true,
};

console.log("[Copilot Cowork] Electrobun webview bridge loaded");
