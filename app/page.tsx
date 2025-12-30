"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import {
  Send,
  User,
  Bot,
  Loader2,
  AlertCircle,
  Plus,
  Package,
  Truck,
  RotateCcw,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  error?: boolean;
}

interface QuickAction {
  id: string;
  label: string;
  message: string;
  icon: React.ReactNode;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "track-order",
    label: "Track Order",
    message: "I'd like to track my order",
    icon: <Package size={14} />,
  },
  {
    id: "shipping-inquiry",
    label: "Shipping Inquiry",
    message: "I have a question about shipping",
    icon: <Truck size={14} />,
  },
  {
    id: "refund-options",
    label: "Refund Options",
    message: "I need information about refunds and returns",
    icon: <RotateCcw size={14} />,
  },
  {
    id: "general-help",
    label: "General Help",
    message: "I need help with something",
    icon: <HelpCircle size={14} />,
  },
];

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
        // Silently handle history loading errors - don't show error to user
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

  const handleSend = async (e?: React.FormEvent, messageText?: string) => {
    e?.preventDefault();
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading || textToSend.length > 1800) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      let response ;
      try {
        response = await fetch("/api/chat/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: textToSend,
            sessionId: sessionId || undefined,
          }),
        });
      } catch (fetchError) {
        // Handle network errors (timeout, connection failures, etc.)
        throw new Error(
          "We're having trouble connecting right now. Please check your internet connection and try again in a moment."
        );
      }

      // Handle HTTP errors
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          // If JSON parsing fails, use status-based messages
          errorData = {};
        }

        // Determine friendly error message based on status code
        let friendlyMessage =
          "We're experiencing some technical difficulties. Please try again in a moment.";

        if (response.status === 401 || response.status === 403) {
          friendlyMessage =
            "We're temporarily unavailable. Our team is working on it and we'll be back soon!";
        } else if (response.status === 429) {
          friendlyMessage =
            "We're receiving a lot of requests right now. Please wait a moment and try again.";
        } else if (response.status >= 500) {
          friendlyMessage =
            "Our service is temporarily unavailable. We'll be back soon - thank you for your patience!";
        } else if (errorData.error || errorData.message) {
          // For other errors, use a generic friendly message
          friendlyMessage =
            "We're experiencing some technical difficulties. Please try again in a moment.";
        }

        throw new Error(friendlyMessage);
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // Handle JSON parsing errors
        throw new Error(
          "We received an unexpected response. Please try again in a moment."
        );
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

      // Display friendly error message to user
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        content:
          error instanceof Error
            ? error.message
            : "We're experiencing some technical difficulties. Please try again in a moment.",
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
            <h1 className="font-semibold text-sm leading-none">
              TechMart AI Assistant
            </h1>
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
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 px-4">
            <Bot size={48} className="opacity-50" />
            <div className="space-y-1">
              <p className="font-medium">No messages yet</p>
              <p className="text-sm text-muted-foreground">
                👋 Hi there! How can I help you today?
              </p>
            </div>
            <div className="w-full max-w-md space-y-3">
              <p className="text-xs text-muted-foreground font-medium">
                Popular questions:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_ACTIONS.map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSend(undefined, action.message)}
                    disabled={isLoading}
                    className="gap-2 h-auto py-2 px-3 text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                ))}
              </div>
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
                      ? "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 rounded-tl-none border border-amber-200 dark:border-amber-800"
                      : "bg-muted text-foreground rounded-tl-none border"
                  )}
                >
                  {message.error && (
                    <div className="flex items-center gap-2 mb-1.5">
                      <AlertCircle
                        size={14}
                        className="text-amber-600 dark:text-amber-400"
                      />
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                        Notice
                      </span>
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
        {messages.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                onClick={() => handleSend(undefined, action.message)}
                disabled={isLoading}
                className="gap-2 h-auto py-1.5 px-3 text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        )}
        <form
          onSubmit={handleSend}
          className="relative flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= 1800) {
                setInput(value);
              }
            }}
            placeholder="Type your message..."
            className="pr-12 py-6 bg-background rounded-xl border-2 focus-visible:ring-primary/20"
            disabled={isLoading}
            maxLength={1800}
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
        {input.length >= 1800 && (
          <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <AlertCircle
              size={14}
              className="text-amber-600 dark:text-amber-400 shrink-0"
            />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Hey seems like you message is too long. Please shorten it to
              continue.
            </p>
          </div>
        )}
        <div className="flex items-center justify-between mt-2">
          <p
            className={cn(
              "text-[10px]",
              input.length >= 1800
                ? "text-amber-600 dark:text-amber-400 font-medium"
                : "text-muted-foreground"
            )}
          >
            {input.length}/1800 characters
          </p>
          <p className="text-[10px] text-center text-muted-foreground">
            Powered by Next.js & Vercel
          </p>
        </div>
      </footer>
    </main>
  );
}
