import ChatContainer from "@/components/ChatContainer";

export default function Home() {
  return (
    <div className="flex h-screen flex-col bg-background font-sans text-foreground dark">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
          CC
        </div>
        <h1 className="text-base font-semibold tracking-tight">
          Copilot Cowork
        </h1>
      </header>

      {/* Chat */}
      <ChatContainer />
    </div>
  );
}
