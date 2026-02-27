"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";
import { Bot, FolderTree, User } from "lucide-react";

// ---------------------------------------------------------------------------
// Shared timestamp helper
// ---------------------------------------------------------------------------

function TimeStamp({ date }: { date: Date }) {
  return (
    <span className="text-xs text-muted-foreground">
      {date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </span>
  );
}

// ---------------------------------------------------------------------------
// User message
// ---------------------------------------------------------------------------

function UserMessageBubble({ message }: { message: Extract<ChatMessage, { role: "user" }> }) {
  return (
    <div className="flex items-start gap-3 justify-end">
      <div className="flex flex-col items-end gap-1 max-w-[75%]">
        <div className="rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-2.5 text-sm text-white">
          {message.content}
        </div>
        <TimeStamp date={message.timestamp} />
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400">
        <User className="h-4 w-4" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Copilot message
// ---------------------------------------------------------------------------

function CopilotMessageBubble({ message }: { message: Extract<ChatMessage, { role: "copilot" }> }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400">
        <Bot className="h-4 w-4" />
      </div>
      <div className="flex flex-col gap-1 max-w-[75%]">
        <div className="rounded-2xl rounded-tl-sm bg-card px-4 py-2.5 text-sm text-card-foreground border border-border">
          {message.content}
          {message.isStreaming && (
            <span className="ml-1 inline-block animate-pulse">▍</span>
          )}
        </div>
        <TimeStamp date={message.timestamp} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// File system message
// ---------------------------------------------------------------------------

function FileSystemMessageBubble({ message }: { message: Extract<ChatMessage, { role: "filesystem" }> }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          message.success
            ? "bg-amber-600/20 text-amber-400"
            : "bg-red-600/20 text-red-400"
        )}
      >
        <FolderTree className="h-4 w-4" />
      </div>
      <div className="flex flex-col gap-1 max-w-[85%]">
        <div
          className={cn(
            "rounded-2xl rounded-tl-sm border px-4 py-2.5 text-sm",
            message.success
              ? "border-amber-500/20 bg-amber-500/5 text-foreground"
              : "border-red-500/20 bg-red-500/5 text-foreground"
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                message.success
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-red-500/20 text-red-400"
              )}
            >
              {message.action}
            </span>
            <span className="truncate font-mono text-xs text-muted-foreground">
              {message.path}
            </span>
          </div>
          <p className="text-muted-foreground">{message.summary}</p>
        </div>
        <TimeStamp date={message.timestamp} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export default function ChatMessageBubble({ message }: { message: ChatMessage }) {
  switch (message.role) {
    case "user":
      return <UserMessageBubble message={message} />;
    case "copilot":
      return <CopilotMessageBubble message={message} />;
    case "filesystem":
      return <FileSystemMessageBubble message={message} />;
  }
}
