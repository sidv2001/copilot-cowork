/**
 * Copilot Cowork - Electrobun Webview Bridge
 *
 * This script runs inside the webview and provides a bridge between
 * the Electrobun native APIs and the Next.js frontend.
 * It's transpiled by Electrobun and available at views://main-ui/index.js
 */
import { Electroview } from "electrobun/view";
import type { MainUIRPCType } from "../shared/rpc-types";

console.log("[bridge] ▶ Bridge script starting...");

// ---------------------------------------------------------------------------
// Define browser-side RPC (receives messages from bun, can call bun handlers)
// ---------------------------------------------------------------------------

try {
  console.log("[bridge] Defining browser-side RPC...");

  const rpc = Electroview.defineRPC<MainUIRPCType>({
    handlers: {
      requests: {},
      messages: {
        fsEvent: ({ eventType, path }) => {
          console.log(`[bridge] FS event: ${eventType} at ${path}`);
          (globalThis as any).dispatchEvent(
            new CustomEvent("copilot-fs-event", {
              detail: { eventType, path },
            }),
          );
        },
        copilotChatEvent: (event) => {
          console.log(`[bridge] Copilot chat event:`, event.type);
          (globalThis as any).dispatchEvent(
            new CustomEvent("copilot-chat-event", {
              detail: event,
            }),
          );
        },
      },
    },
  });

  console.log("[bridge] RPC defined, creating Electroview instance...");

  // Initialize the Electrobun browser-side API
  const electrobun = new Electroview({ rpc });

  console.log("[bridge] Electroview created. rpc available:", !!electrobun.rpc);

  // ---------------------------------------------------------------------------
  // Expose FS helpers on `window` for the Next.js app to consume
  // ---------------------------------------------------------------------------

  const fsApi = {
    readDirectory: (path: string) => {
      console.log(`[bridge] readDirectory(${path})`);
      return electrobun.rpc!.request.readDirectory({ path });
    },
    readFile: (path: string) => {
      console.log(`[bridge] readFile(${path})`);
      return electrobun.rpc!.request.readFile({ path });
    },
    getFileInfo: (path: string) => {
      console.log(`[bridge] getFileInfo(${path})`);
      return electrobun.rpc!.request.getFileInfo({ path });
    },
    getHomePath: () => {
      console.log("[bridge] getHomePath()");
      return electrobun.rpc!.request.getHomePath({});
    },
    createFile: (path: string, content: string) => {
      console.log(`[bridge] createFile(${path})`);
      return electrobun.rpc!.request.createFile({ path, content });
    },
  };

  const copilotApi = {
    ping: () => {
      console.log("[bridge] copilot.ping()");
      return electrobun.rpc!.request.pingCopilot({});
    },
    chat: (message: string) => {
      console.log("[bridge] copilot.chat()");
      return electrobun.rpc!.request.chatWithCopilot({ message });
    },
  };

  // Expose a global to let the Next.js app know it's running inside Electrobun
  (globalThis as any).__ELECTROBUN__ = true;
  (globalThis as any).__COPILOT_COWORK__ = {
    platform: navigator.platform,
    isDesktop: true,
    fs: fsApi,
    copilot: copilotApi,
  };

  console.log("[bridge] \u2714 Bridge loaded. window.__COPILOT_COWORK__ is set.");
  console.log("[bridge]   __ELECTROBUN__  =", (globalThis as any).__ELECTROBUN__);
  console.log("[bridge]   fs methods     =", Object.keys(fsApi).join(", "));
} catch (err) {
  console.error("[bridge] ✖ Bridge failed to initialize:", err);
}
