/**
 * Copilot Cowork - Shared RPC Type Definitions
 *
 * Defines the typed RPC schema between the bun main process and the
 * webview (browser) context. Used by both sides for type-safe communication.
 */
import type { RPCSchema } from "electrobun";

/** A single entry returned when listing a directory. */
export type DirectoryEntry = {
  name: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
  size: number;
  /** ISO-8601 date string */
  modifiedAt: string;
};

/** Result of reading a text file. */
export type FileContent = {
  path: string;
  content: string;
  size: number;
  modifiedAt: string;
};

/** Result of getting info about a single file or directory. */
export type FileInfo = {
  path: string;
  name: string;
  isDirectory: boolean;
  isFile: boolean;
  size: number;
  modifiedAt: string;
  createdAt: string;
};

/** Result of pinging the Copilot SDK. */
export type CopilotPingResult = {
  ok: boolean;
  state: string;
  message: string | null;
  timestamp: number | null;
  error: string | null;
};

/** Result of creating a text file. */
export type CreateFileResult = {
  ok: boolean;
  path: string;
  error: string | null;
};

/** A single event pushed from the Copilot session to the webview. */
export type CopilotChatEvent =
  | { type: "assistant.message_delta"; content: string }
  | { type: "assistant.message"; content: string }
  | { type: "tool.execution_start"; toolName: string; args: unknown }
  | { type: "tool.execution_complete"; toolName: string; success: boolean; result?: string; error?: string }
  | { type: "session.idle" }
  | { type: "session.error"; message: string };

/**
 * The RPC contract between the bun process and the main-ui webview.
 *
 * - `bun.requests`   — functions implemented in the bun process, callable from the browser
 * - `webview.messages` — fire-and-forget messages the bun process can push to the browser
 */
export type MainUIRPCType = {
  bun: RPCSchema<{
    requests: {
      /** List the entries of a directory. */
      readDirectory: {
        params: { path: string };
        response: { entries: DirectoryEntry[]; path: string };
      };
      /** Read the text content of a file (UTF-8). */
      readFile: {
        params: { path: string };
        response: FileContent;
      };
      /** Get metadata for a single path (file or directory). */
      getFileInfo: {
        params: { path: string };
        response: FileInfo;
      };
      /** Return the user's home directory as a starting point. */
      getHomePath: {
        params: Record<string, never>;
        response: { homePath: string };
      };
      /** Ping the Copilot SDK to verify connectivity. */
      pingCopilot: {
        params: Record<string, never>;
        response: CopilotPingResult;
      };
      /** Create a text file with the given content. */
      createFile: {
        params: { path: string; content: string };
        response: CreateFileResult;
      };
      /** Send a chat message to Copilot. The response is the final assistant message.
       *  Streaming deltas arrive via the copilotChatEvent webview message. */
      chatWithCopilot: {
        params: { message: string };
        response: { ok: boolean; reply: string | null; error: string | null };
      };
    };
    messages: {};
  }>;
  webview: RPCSchema<{
    requests: {};
    messages: {
      /** Notification pushed from bun when something changes (future use). */
      fsEvent: { eventType: string; path: string };
      /** Streaming events from a Copilot chat session. */
      copilotChatEvent: CopilotChatEvent;
    };
  }>;
};
