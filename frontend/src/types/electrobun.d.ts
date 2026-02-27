/**
 * Type declarations for the globals exposed by the Electrobun webview bridge.
 *
 * The bridge (src/ui/index.ts) sets `window.__COPILOT_COWORK__` with an `fs`
 * property containing async helpers that call through to the bun process via RPC.
 */

export interface DirectoryEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
  size: number;
  /** ISO-8601 */
  modifiedAt: string;
}

export interface FileContent {
  path: string;
  content: string;
  size: number;
  modifiedAt: string;
}

export interface FileInfo {
  path: string;
  name: string;
  isDirectory: boolean;
  isFile: boolean;
  size: number;
  modifiedAt: string;
  createdAt: string;
}

export interface CreateFileResult {
  ok: boolean;
  path: string;
  error: string | null;
}

export interface CopilotCoworkFS {
  readDirectory: (path: string) => Promise<{ entries: DirectoryEntry[]; path: string }>;
  readFile: (path: string) => Promise<FileContent>;
  getFileInfo: (path: string) => Promise<FileInfo>;
  getHomePath: () => Promise<{ homePath: string }>;
  createFile: (path: string, content: string) => Promise<CreateFileResult>;
}

export interface CopilotPingResult {
  ok: boolean;
  state: string;
  message: string | null;
  timestamp: number | null;
  error: string | null;
}

export interface CopilotChatResult {
  ok: boolean;
  reply: string | null;
  error: string | null;
}

export interface CopilotCoworkCopilot {
  ping: () => Promise<CopilotPingResult>;
  chat: (message: string) => Promise<CopilotChatResult>;
}

export interface CopilotCoworkGlobal {
  platform: string;
  isDesktop: boolean;
  fs: CopilotCoworkFS;
  copilot: CopilotCoworkCopilot;
}

declare global {
  interface Window {
    __ELECTROBUN__?: boolean;
    __COPILOT_COWORK__?: CopilotCoworkGlobal;
  }
}
