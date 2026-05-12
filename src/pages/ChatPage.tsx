import { Bot, Send as SendIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hey! I'm the Auquire AI orchestrator. I can help you run agents, look up listings, check market data, or answer questions about your dealership. What do you need?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsThinking(true);

    // Placeholder — will be wired to a Convex action that calls the orchestrator
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm being wired up right now! Soon I'll be able to run agents, look up listings, and generate market reports for you. Check back shortly.",
        },
      ]);
      setIsThinking(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
        <div className="size-10 rounded-xl bg-blue-400/10 flex items-center justify-center">
          <Bot className="size-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">AI Chat</h1>
          <p className="text-xs text-muted-foreground">
            Ask anything — run agents, look up data, get insights
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-card border border-white/[0.06] text-foreground"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-1">
                  <Bot className="size-3.5 text-blue-400" />
                  <span className="text-[10px] font-medium text-blue-400">Auquire AI</span>
                </div>
              )}
              {msg.content}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-card border border-white/[0.06] rounded-2xl px-4 py-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Bot className="size-3.5 text-blue-400" />
                <span className="text-[10px] font-medium text-blue-400">Auquire AI</span>
              </div>
              <div className="flex gap-1">
                <span className="size-2 rounded-full bg-muted-foreground/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="size-2 rounded-full bg-muted-foreground/30 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="size-2 rounded-full bg-muted-foreground/30 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-white/[0.06] pt-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask something... e.g. 'Run Hunter now' or 'What's the market like for Hilux in NSW?'"
            rows={1}
            className="bg-card resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={isThinking || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 px-4"
          >
            <SendIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
