"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { Send, User, Bot, Loader2, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  error?: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load session from localStorage and fetch chat history
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const storedSessionId = localStorage.getItem("chatSessionId");

        if (storedSessionId) {
          // Fetch conversation history
          const response = await fetch(
            `/api/chat/message?sessionId=${storedSessionId}`
          );

          if (response.ok) {
            const data = await response.json();

            // Convert database messages to UI format
            const loadedMessages: Message[] = data.messages.map((msg: any) => ({
              id: msg.id,
              role: msg.sender === "USER" ? "user" : "agent",
              content: msg.text,
            }));

            setMessages(loadedMessages);
            setSessionId(storedSessionId);
          } else {
            // Session not found or expired, clear localStorage
            localStorage.removeItem("chatSessionId");
          }
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
        localStorage.removeItem("chatSessionId");
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, []);

  // Save sessionId to localStorage whenever it changes
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem("chatSessionId", sessionId);
    }
  }, [sessionId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId: sessionId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle API errors
        const errorMessage =
          data.error || data.message || "Failed to get response";
        throw new Error(errorMessage);
      }

      // Store sessionId for conversation continuity
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }

      const agentMessage: Message = {
        id: data.messageId || (Date.now() + 1).toString(),
        role: "agent",
        content: data.reply,
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      console.error("Chat error:", error);

      // Display error message to user
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        content:
          error instanceof Error
            ? error.message
            : "Sorry, I'm having trouble connecting. Please check your internet connection and try again.",
        error: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    // Clear current session
    setMessages([]);
    setSessionId(null);
    localStorage.removeItem("chatSessionId");
    setInput("");
  };

  return (
    <main className="flex flex-col h-screen max-w-3xl mx-auto bg-background border-x">
      {/* Header */}
      <header className="p-4 border-b flex items-center justify-between bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
            <Bot size={18} />
          </div>
          <div>
            <h1 className="font-semibold text-sm leading-none">AI Assistant</h1>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewChat}
            className="gap-2"
          >
            <Plus size={14} />
            New Chat
          </Button>
        )}
      </header>

      {/* Message List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
      >
        {isLoadingHistory ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <Loader2 size={48} className="animate-spin" />
            <div className="space-y-1">
              <p className="font-medium">Loading chat history...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <Bot size={48} />
            <div className="space-y-1">
              <p className="font-medium">No messages yet</p>
              <p className="text-sm">
                Start a conversation with the AI assistant.
              </p>
            </div>
          </div>
        ) : null}

        {!isLoadingHistory &&
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex w-full gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                  message.role === "user" ? "bg-secondary" : "bg-card"
                )}
              >
                {message.role === "user" ? (
                  <User size={14} />
                ) : (
                  <Bot size={14} />
                )}
              </div>
              <div
                className={cn(
                  "flex flex-col gap-1 max-w-[80%]",
                  message.role === "user" ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : message.error
                      ? "bg-destructive/10 text-destructive rounded-tl-none border border-destructive/20"
                      : "bg-muted text-foreground rounded-tl-none border"
                  )}
                >
                  {message.error && (
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle size={14} />
                      <span className="text-xs font-medium">Error</span>
                    </div>
                  )}
                  {message.content}
                </div>
              </div>
            </div>
          ))}

        {isLoading && (
          <div className="flex gap-3 animate-in fade-in duration-300">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border bg-card">
              <Bot size={14} />
            </div>
            <div className="bg-muted text-muted-foreground rounded-2xl rounded-tl-none px-4 py-2.5 text-xs flex items-center gap-2 border">
              <Loader2 size={12} className="animate-spin" />
              Agent is typing...
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <footer className="p-4 border-t bg-card/50 backdrop-blur-md">
        <form
          onSubmit={handleSend}
          className="relative flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="pr-12 py-6 bg-background rounded-xl border-2 focus-visible:ring-primary/20"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="absolute right-1.5 h-9 w-9 rounded-lg transition-all"
          >
            <Send size={18} />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
        <p className="text-[10px] text-center text-muted-foreground mt-3">
          Powered by Next.js & Vercel
        </p>
      </footer>
    </main>
  );
}
