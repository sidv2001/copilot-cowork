export type MessageRole = "user" | "copilot" | "filesystem";

export interface BaseMessage {
  id: string;
  role: MessageRole;
  timestamp: Date;
}

export interface UserMessage extends BaseMessage {
  role: "user";
  content: string;
}

export interface CopilotMessage extends BaseMessage {
  role: "copilot";
  content: string;
  isStreaming?: boolean;
}

export interface FileSystemMessage extends BaseMessage {
  role: "filesystem";
  action: string; // e.g. "read", "write", "list", "delete"
  path: string;
  summary: string;
  success: boolean;
}

export type ChatMessage = UserMessage | CopilotMessage | FileSystemMessage;
