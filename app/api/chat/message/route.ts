import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { llmService } from "@/lib/llm";
import { z } from "zod";

// Request validation schema
const ChatMessageSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message too long"),
  sessionId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = ChatMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { message, sessionId } = validation.data;

    // Get or create conversation
    let conversation;
    if (sessionId) {
      // Try to find existing conversation
      conversation = await prisma.conversation.findUnique({
        where: { id: sessionId },
        include: {
          messages: {
            orderBy: { timestamp: "asc" },
            take: 10, // Limit history for LLM context
          },
        },
      });

      // If sessionId provided but not found, return error
      if (!conversation) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }
    } else {
      // Create new conversation
      conversation = await prisma.conversation.create({
        data: {
          metadata: {
            startedAt: new Date().toISOString(),
          },
        },
        include: {
          messages: true,
        },
      });
    }

    // Save user message to database
    const userMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: "USER",
        text: message,
      },
    });

    // Generate AI reply using LLM
    const aiReplyText = await llmService.generateReply(
      conversation.messages,
      message
    );

    // Save AI reply to database
    const aiMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: "AI",
        text: aiReplyText,
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    // Return response
    return NextResponse.json(
      {
        reply: aiReplyText,
        sessionId: conversation.id,
        messageId: aiMessage.id,
        timestamp: aiMessage.timestamp,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Chat API Error:", error);

    // Handle specific error types
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        error: "An error occurred processing your message",
        message: "Please try again later or contact support",
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to retrieve conversation history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { timestamp: "asc" },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        sessionId: conversation.id,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messages: conversation.messages.map((msg) => ({
          id: msg.id,
          sender: msg.sender,
          text: msg.text,
          timestamp: msg.timestamp,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get conversation error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve conversation" },
      { status: 500 }
    );
  }
}
