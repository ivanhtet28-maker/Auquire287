import { useAction, useMutation, useQuery } from "convex/react";
import { Bot, Send as SendIcon, Loader2, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

const quickActions = [
  { label: "🔍 Run Hunter", prompt: "Run Hunter now — scan all buy boxes" },
  { label: "📊 Morning Brief", prompt: "Generate today's morning brief" },
  { label: "💰 Audit Pricing", prompt: "Audit my current inventory pricing" },
  { label: "📈 Market Intel", prompt: "What are the latest used car market trends in Australia?" },
  { label: "📋 Pipeline Status", prompt: "Give me a summary of my current pipeline" },
];

export function ChatPage() {
  const getOrCreateSession = useMutation(api.chat.getOrCreateSession);
  const sendMessage = useAction(api.chat.sendMessage);
  const [sessionId, setSessionId] = useState<Id<"chatSessions"> | null>(null);
  const messages = useQuery(
    api.chat.getMessages,
    sessionId ? { sessionId } : "skip"
  );
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Init session
  useEffect(() => {
    getOrCreateSession({}).then(setSessionId).catch(console.error);
  }, [getOrCreateSession]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isThinking]);

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || !sessionId) return;
    setInput("");
    setIsThinking(true);

    try {
      await sendMessage({ sessionId, message: msg });
    } catch (err) {
      toast.error(
        `Error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setIsThinking(false);
    }
  };

  const displayMessages =
    messages ??
    [
      {
        _id: "welcome",
        role: "assistant" as const,
        content:
          "Hey! I'm the Auquire AI orchestrator. I can help you run agents, look up listings, check market data, or answer questions about your dealership. What do you need?",
      },
    ];

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <Bot className="size-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">AI Chat</h1>
          <p className="text-xs text-muted-foreground">
            Ask anything — run agents, look up data, get insights
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-4">
        {displayMessages.map(
          (
            msg: {
              _id: string;
              role: string;
              content: string;
              agentCalls?: Array<{ agent: string; action: string }>;
            },
            i: number
          ) => (
            <div
              key={msg._id ?? i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-card border border-border text-foreground"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <Bot className="size-3.5 text-blue-600" />
                    <span className="text-[10px] font-medium text-blue-600">
                      Auquire AI
                    </span>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.agentCalls && msg.agentCalls.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {msg.agentCalls.map(
                      (
                        call: { agent: string; action: string },
                        ci: number
                      ) => (
                        <span
                          key={ci}
                          className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                        >
                          <Zap className="size-2.5" />
                          {call.agent}: {call.action}
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        )}
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl px-4 py-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Bot className="size-3.5 text-blue-600" />
                <span className="text-[10px] font-medium text-blue-600">
                  Auquire AI
                </span>
              </div>
              <div className="flex gap-1">
                <span
                  className="size-2 rounded-full bg-muted-foreground/30 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="size-2 rounded-full bg-muted-foreground/30 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="size-2 rounded-full bg-muted-foreground/30 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {displayMessages.length <= 1 && (
        <div className="flex flex-wrap gap-2 pb-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => handleSend(action.prompt)}
              disabled={isThinking || !sessionId}
              className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-accent transition-colors text-foreground disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border pt-4">
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
            onClick={() => handleSend()}
            disabled={isThinking || !input.trim() || !sessionId}
            className="bg-blue-600 hover:bg-blue-700 px-4"
          >
            {isThinking ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <SendIcon className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
