"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatInput from "@/components/ChatInput";
import ChatMessageBubble from "@/components/ChatMessage";
import type { ChatMessage } from "@/types/chat";
import { useCopilotChat } from "@/hooks/useCopilotSDK";
import { Bot } from "lucide-react";

// ---------------------------------------------------------------------------
// Chat container
// ---------------------------------------------------------------------------

export default function ChatContainer() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "copilot",
      content:
        "Hi! I'm Copilot Cowork — your AI-powered assistant. I can create text files on your computer. Just tell me what file you'd like to create, where to put it, and what content it should have!",
      timestamp: new Date(),
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { sendMessage, loading, bridgeReady } = useCopilotChat();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(
    async (content: string) => {
      // Add the user message
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // If bridge isn't ready, show a fallback
      if (!bridgeReady) {
        const fallbackMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "copilot",
          content:
            "I'm not connected to the Copilot backend yet. Please make sure you're running in the Electrobun desktop app.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
        return;
      }

      // Add a "thinking" placeholder
      const thinkingId = crypto.randomUUID();
      const thinkingMsg: ChatMessage = {
        id: thinkingId,
        role: "copilot",
        content: "Thinking…",
        isStreaming: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, thinkingMsg]);

      // Call the Copilot SDK
      const result = await sendMessage(content);

      // Replace the thinking message with the real response
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== thinkingId) return msg;
          if (result.ok && result.reply) {
            return {
              ...msg,
              content: result.reply,
              isStreaming: false,
              timestamp: new Date(),
            } as ChatMessage;
          }
          return {
            ...msg,
            content: result.error ?? "Something went wrong. Please try again.",
            isStreaming: false,
            timestamp: new Date(),
          } as ChatMessage;
        }),
      );
    },
    [bridgeReady, sendMessage],
  );

  return (
    <div className="flex h-full flex-col">
      {/* Message list */}
      <ScrollArea className="flex-1 px-4">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 py-6">
          {messages.length === 0 && <EmptyState />}
          {messages.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border bg-background px-4 py-3">
        <div className="mx-auto w-full max-w-3xl">
          <ChatInput
            onSend={handleSend}
            disabled={loading}
            placeholder={
              !bridgeReady
                ? "Waiting for Copilot connection…"
                : loading
                  ? "Copilot is responding…"
                  : "Ask Copilot to create a file…"
            }
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600/20 text-emerald-400">
        <Bot className="h-7 w-7" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          Start a conversation
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Type a message below to chat with Copilot.
        </p>
      </div>
    </div>
  );
}
