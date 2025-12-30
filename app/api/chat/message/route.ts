import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { llmService } from "@/lib/llm";
import {
  getCachedConversation,
  cacheConversation,
  invalidateConversationCache,
} from "@/lib/redis";
import { z } from "zod";
import type {
  ChatMessageResponse,
  ConversationHistoryResponse,
  MessageResponse,
  ErrorResponse,
} from "@/lib/types";

// Message type matching Prisma schema
interface Message {
  id: string;
  conversationId: string;
  sender: "USER" | "AI";
  text: string;
  timestamp: Date;
}

// Conversation type with messages
interface ConversationWithMessages {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: any;
  messages: Message[];
}

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
      const errorResponse: ErrorResponse = {
        error: "Invalid request",
        details: validation.error.errors.map((err) => ({
          path: err.path,
          message: err.message,
        })),
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { message, sessionId } = validation.data;

    // Get or create conversation
    let conversation: ConversationWithMessages;
    if (sessionId) {
      // Try cache first
      const cached = await getCachedConversation(sessionId);
      if (cached) {
        conversation = cached as ConversationWithMessages;
      } else {
        // Cache miss - fetch from DB
        const dbConversation = await prisma.conversation.findUnique({
          where: { id: sessionId },
          include: {
            messages: {
              orderBy: { timestamp: "asc" },
              take: 10, // Limit history for LLM context
            },
          },
        });

        // If sessionId provided but not found, return error
        if (!dbConversation) {
          const errorResponse: ErrorResponse = {
            error: "Session not found",
          };
          return NextResponse.json(errorResponse, { status: 404 });
        }

        conversation = dbConversation as ConversationWithMessages;

        // Cache the conversation
        await cacheConversation(sessionId, conversation);
      }
    } else {
      // Create new conversation
      const newConversation = await prisma.conversation.create({
        data: {
          metadata: {
            startedAt: new Date().toISOString(),
          },
        },
        include: {
          messages: true,
        },
      });

      conversation = newConversation as ConversationWithMessages;
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

    // Invalidate cache after new message
    await invalidateConversationCache(conversation.id);

    // Return response
    const response: ChatMessageResponse = {
      reply: aiReplyText,
      sessionId: conversation.id,
      messageId: aiMessage.id,
      timestamp: aiMessage.timestamp,
    };
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Chat API Error:", error);

    // Handle specific error types
    if (error instanceof SyntaxError) {
      const errorResponse: ErrorResponse = {
        error: "Invalid JSON in request body",
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Generic error response
    const errorResponse: ErrorResponse = {
      error: "An error occurred processing your message",
      message: "Please try again later or contact support",
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// GET endpoint to retrieve conversation history with caching
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      const errorResponse: ErrorResponse = {
        error: "sessionId is required",
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Try cache first
    const cached = await getCachedConversation(sessionId);
    let conversation: ConversationWithMessages;

    if (cached) {
      conversation = cached as ConversationWithMessages;
    } else {
      // Cache miss - fetch from DB
      const dbConversation = await prisma.conversation.findUnique({
        where: { id: sessionId },
        include: {
          messages: {
            orderBy: { timestamp: "asc" },
          },
        },
      });

      if (!dbConversation) {
        const errorResponse: ErrorResponse = {
          error: "Session not found",
        };
        return NextResponse.json(errorResponse, { status: 404 });
      }

      conversation = dbConversation as ConversationWithMessages;

      // Cache for future requests
      await cacheConversation(sessionId, conversation);
    }

    // Map messages to response format
    const messages: MessageResponse[] = conversation.messages.map(
      (msg: Message) => ({
        id: msg.id,
        sender: msg.sender,
        text: msg.text,
        timestamp: msg.timestamp,
      })
    );

    const response: ConversationHistoryResponse = {
      sessionId: conversation.id,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Get conversation error:", error);
    const errorResponse: ErrorResponse = {
      error: "Failed to retrieve conversation",
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
