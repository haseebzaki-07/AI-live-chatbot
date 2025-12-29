"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Send, User, Bot, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "agent"
  content: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content }),
      })

      if (!response.ok) throw new Error("Failed to fetch response")

      const data = await response.json()

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        content: data.reply,
      }

      setMessages((prev) => [...prev, agentMessage])
    } catch (error) {
      console.error("[v0] Chat error:", error)
      // Optional: Add error message to UI
    } finally {
      setIsLoading(false)
    }
  }

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
      </header>

      {/* Message List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <Bot size={48} />
            <div className="space-y-1">
              <p className="font-medium">No messages yet</p>
              <p className="text-sm">Start a conversation with the AI assistant.</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex w-full gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
              message.role === "user" ? "flex-row-reverse" : "flex-row",
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                message.role === "user" ? "bg-secondary" : "bg-card",
              )}
            >
              {message.role === "user" ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div
              className={cn("flex flex-col gap-1 max-w-[80%]", message.role === "user" ? "items-end" : "items-start")}
            >
              <div
                className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-muted text-foreground rounded-tl-none border",
                )}
              >
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
        <form onSubmit={handleSend} className="relative flex items-center gap-2">
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
        <p className="text-[10px] text-center text-muted-foreground mt-3">Powered by Next.js & Vercel</p>
      </footer>
    </main>
  )
}
