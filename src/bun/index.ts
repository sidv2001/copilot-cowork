/**
 * Copilot Cowork - Electrobun Main Process
 *
 * This is the main bun process that creates the desktop window
 * and loads the Next.js frontend (dev server or static export).
 */
import { BrowserWindow, BrowserView, ApplicationMenu } from "electrobun/bun";
import { readdir, stat, mkdir } from "node:fs/promises";
import { join, basename, resolve, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { CopilotClient } from "@github/copilot-sdk";
import type { CopilotSession } from "@github/copilot-sdk";
import type { MainUIRPCType } from "../shared/rpc-types";

// ---------------------------------------------------------------------------
// Copilot SDK — lazily-initialized client
// ---------------------------------------------------------------------------

let copilotClient: CopilotClient | null = null;

function getPrebuiltCliPath(): string {
  try {
    const pkgName = `@github/copilot-${process.platform}-${process.arch}`;
    const binaryUrl = import.meta.resolve(pkgName);
    return fileURLToPath(binaryUrl);
  } catch (err) {
    console.error(`[Copilot SDK] Failed to resolve prebuilt binary:`, err);
    throw new Error(`Could not find prebuilt Copilot CLI for ${process.platform}-${process.arch}`);
  }
}

async function getCopilotClient(): Promise<CopilotClient> {
  if (!copilotClient) {
    console.log("[Copilot SDK] Creating CopilotClient...");
    const cliPath = getPrebuiltCliPath();
    console.log(`[Copilot SDK] Using prebuilt CLI at: ${cliPath}`);
    copilotClient = new CopilotClient({
      logLevel: "info",
      cliPath: cliPath,
      cliArgs: [], // No extra args needed for the prebuilt binary
    });
    console.log("[Copilot SDK] Starting client...");
    await copilotClient.start();
    console.log("[Copilot SDK] Client started.");
  }
  return copilotClient;
}

// COPILOT_COWORK_DEV_SERVER=1 is set by the `dev` script when
// the Next.js dev server is actually running on localhost:3000.
// Otherwise (including `bun start`), use the bundled static export.
const useDevServer = process.env.COPILOT_COWORK_DEV_SERVER === "1";

// ---------------------------------------------------------------------------
// Persistent Copilot chat session (lazily created, reused across messages)
// ---------------------------------------------------------------------------

let chatSession: CopilotSession | null = null;

/**
 * The `create_file` tool exposed to the Copilot agent.
 * It lets Copilot create a text file at a given path with given content.
 */
const createFileTool = {
  name: "create_file",
  description:
    "Create a new text file at the specified absolute path with the provided content. " +
    "The directory will be created if it does not exist. Only creates .txt files.",
  parameters: {
    type: "object" as const,
    properties: {
      path: {
        type: "string",
        description: "The absolute file path where the text file should be created. Must end with .txt",
      },
      content: {
        type: "string",
        description: "The text content to write into the file.",
      },
    },
    required: ["path", "content"],
  },
  handler: async (args: { path: string; content: string }) => {
    console.log(`[create_file tool] Creating file: ${args.path}`);
    try {
      const resolvedPath = resolve(args.path);
      // Ensure it's a .txt file
      if (!resolvedPath.endsWith(".txt")) {
        return { success: false, error: "Only .txt files are supported. Path must end with .txt" };
      }
      // Create directory if needed
      const dir = dirname(resolvedPath);
      await mkdir(dir, { recursive: true });
      // Write the file
      await Bun.write(resolvedPath, args.content);
      console.log(`[create_file tool] Successfully created: ${resolvedPath}`);
      return { success: true, path: resolvedPath, message: `File created at ${resolvedPath}` };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[create_file tool] Failed:`, message);
      return { success: false, error: message };
    }
  },
};

async function getChatSession(): Promise<CopilotSession> {
  if (!chatSession) {
    const client = await getCopilotClient();
    console.log("[Copilot SDK] Creating chat session with create_file tool...");
    chatSession = await client.createSession({
      systemMessage: {
        mode: "append",
        content:
          "You are Copilot Cowork, an AI assistant integrated into a desktop application. " +
          "You can create text files on the user's computer using the create_file tool. " +
          "When the user asks you to create a file, use the create_file tool with an absolute path and the content they specify. " +
          "Always confirm with the user what path and content they want before creating a file. " +
          "Only create .txt files. If the user doesn't specify a path, suggest a reasonable location in their home directory.",
      },
      tools: [createFileTool],
      onPermissionRequest: async (request) => {
        console.log("[Copilot SDK] Permission request:", JSON.stringify(request));
        // Auto-approve write permissions for our managed tool
        return { kind: "approved" };
      },
    });
    console.log(`[Copilot SDK] Chat session created: ${chatSession.sessionId}`);
  }
  return chatSession;
}

const appUrl = useDevServer
  ? "http://localhost:3000"
  : "views://main-ui/index.html";

// ---------------------------------------------------------------------------
// RPC handlers — file-system operations exposed to the webview
// ---------------------------------------------------------------------------

console.log("[Copilot Cowork] Defining RPC handlers for file-system operations...");

const mainUIRPC = BrowserView.defineRPC<MainUIRPCType>({
  maxRequestTime: 120_000,
  handlers: {
    requests: {
      /**
       * List directory contents. Returns an array of entries with metadata.
       */
      readDirectory: async ({ path: dirPath }) => {
        console.log(`[RPC] readDirectory called: ${dirPath}`);
        const resolvedPath = resolve(dirPath);
        const names = await readdir(resolvedPath);

        const entries = await Promise.all(
          names.map(async (name) => {
            const fullPath = join(resolvedPath, name);
            try {
              const info = await stat(fullPath);
              return {
                name,
                path: fullPath,
                isDirectory: info.isDirectory(),
                isFile: info.isFile(),
                size: info.size,
                modifiedAt: info.mtime.toISOString(),
              };
            } catch {
              // Permission denied or broken symlink — return a minimal entry
              return {
                name,
                path: fullPath,
                isDirectory: false,
                isFile: false,
                size: 0,
                modifiedAt: new Date(0).toISOString(),
              };
            }
          }),
        );

        // Sort: directories first, then alphabetically
        entries.sort((a, b) => {
          if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
          return a.name.localeCompare(b.name);
        });

        return { entries, path: resolvedPath };
      },

      /**
       * Read the UTF-8 text content of a file.
       */
      readFile: async ({ path: filePath }) => {
        console.log(`[RPC] readFile called: ${filePath}`);
        const resolvedPath = resolve(filePath);
        const file = Bun.file(resolvedPath);
        const content = await file.text();
        const info = await stat(resolvedPath);

        return {
          path: resolvedPath,
          content,
          size: info.size,
          modifiedAt: info.mtime.toISOString(),
        };
      },

      /**
       * Get metadata for a single path (file or directory).
       */
      getFileInfo: async ({ path: targetPath }) => {
        console.log(`[RPC] getFileInfo called: ${targetPath}`);
        const resolvedPath = resolve(targetPath);
        const info = await stat(resolvedPath);

        return {
          path: resolvedPath,
          name: basename(resolvedPath),
          isDirectory: info.isDirectory(),
          isFile: info.isFile(),
          size: info.size,
          modifiedAt: info.mtime.toISOString(),
          createdAt: info.birthtime.toISOString(),
        };
      },

      /**
       * Return the current user's home directory.
       */
      getHomePath: () => {
        console.log(`[RPC] getHomePath called, returning: ${homedir()}`);
        return { homePath: homedir() };
      },

      /**
       * Ping the Copilot SDK to check connectivity.
       * Starts the client if not already running.
       */
      pingCopilot: async () => {
        console.log("[RPC] pingCopilot called");
        try {
          const client = await getCopilotClient();
          const state = client.getState();
          console.log(`[Copilot SDK] Connection state: ${state}`);
          const result = await client.ping("hello from copilot-cowork");
          console.log("[Copilot SDK] Ping result:", result);
          return {
            ok: true,
            state: String(state),
            message: result.message,
            timestamp: result.timestamp,
            error: null,
          };
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.error("[Copilot SDK] Ping failed:", message);
          return {
            ok: false,
            state: "error",
            message: null,
            timestamp: null,
            error: message,
          };
        }
      },

      /**
       * Create a text file at the given path with the given content.
       */
      createFile: async ({ path: filePath, content }) => {
        console.log(`[RPC] createFile called: ${filePath}`);
        try {
          const resolvedPath = resolve(filePath);
          if (!resolvedPath.endsWith(".txt")) {
            return { ok: false, path: resolvedPath, error: "Only .txt files are supported." };
          }
          const dir = dirname(resolvedPath);
          await mkdir(dir, { recursive: true });
          await Bun.write(resolvedPath, content);
          console.log(`[RPC] File created: ${resolvedPath}`);
          return { ok: true, path: resolvedPath, error: null };
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`[RPC] createFile failed:`, message);
          return { ok: false, path: filePath, error: message };
        }
      },

      /**
       * Send a chat message to the Copilot SDK and return the final response.
       * Streaming events are pushed to the webview via copilotChatEvent messages.
       */
      chatWithCopilot: async ({ message }) => {
        console.log(`[RPC] chatWithCopilot called: "${message.slice(0, 80)}..."`);
        try {
          const session = await getChatSession();

          // Send message and wait for the agent to finish (120s timeout)
          const result = await session.sendAndWait({ prompt: message }, 120_000);

          const reply = result?.data?.content ?? null;
          console.log(`[Copilot SDK] Chat reply: "${(reply ?? "").slice(0, 100)}..."`);

          return { ok: true, reply, error: null };
        } catch (err: unknown) {
          const message2 = err instanceof Error ? err.message : String(err);
          console.error("[Copilot SDK] Chat failed:", message2);
          return { ok: false, reply: null, error: message2 };
        }
      },
    },
    messages: {},
  },
});

// ---------------------------------------------------------------------------
// Application menu
// ---------------------------------------------------------------------------

// Set up the application menu with standard Edit shortcuts
ApplicationMenu.setApplicationMenu([
  {
    submenu: [{ label: "Quit", role: "quit" }],
  },
  {
    label: "Edit",
    submenu: [
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      { role: "pasteAndMatchStyle" },
      { role: "delete" },
      { role: "selectAll" },
    ],
  },
]);

// ---------------------------------------------------------------------------
// Main window
// ---------------------------------------------------------------------------

// In dev mode the window loads http://localhost:3000 (Next.js dev server)
// which does NOT include the Electrobun bridge script. We use the `preload`
// option to inject the compiled bridge so RPC is available on any URL.
// Note: The preload script must be a valid URL or inline JS.
// We use inline JS to fetch and execute the bridge script.
const preloadScript = useDevServer
  ? `
    if (!window.__BRIDGE_LOADED__) {
      window.__BRIDGE_LOADED__ = true;
      console.log("[preload] Fetching bridge script...");
      fetch("views://main-ui/index.js")
        .then(res => res.text())
        .then(code => {
          console.log("[preload] Executing bridge script...");
          const script = document.createElement("script");
          script.textContent = code;
          document.head.appendChild(script);
        })
        .catch(err => console.error("[preload] Failed to load bridge:", err));
    } else {
      console.log("[preload] Bridge already loaded, skipping.");
    }
  `
  : undefined;

console.log(`[Copilot Cowork] Creating BrowserWindow`);
console.log(`[Copilot Cowork]   url      = ${appUrl}`);
console.log(`[Copilot Cowork]   preload  = ${preloadScript ? "(inline script)" : "(none — bridge loaded via <script> in index.html)"}`);
console.log(`[Copilot Cowork]   rpc      = ${mainUIRPC ? "defined" : "NOT defined"}`);

// Create the main browser window — pass the RPC object so the webview bridge
// can call these handlers.
const mainWindow = new BrowserWindow({
  title: "Copilot Cowork",
  url: appUrl,
  frame: {
    x: 0,
    y: 0,
    width: 1280,
    height: 820,
  },
  rpc: mainUIRPC,
  ...(preloadScript ? { preload: preloadScript } : {}),
});

console.log(`[Copilot Cowork] App started in ${useDevServer ? "development" : "production"} mode`);
console.log(`[Copilot Cowork] Loading: ${appUrl}`);
