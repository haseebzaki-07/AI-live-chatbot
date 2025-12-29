import { MessageSender } from "@prisma/client";

/**
 * API Request Types
 */

export interface ChatMessageRequest {
  message: string;
  sessionId?: string;
}

/**
 * API Response Types
 */

export interface ChatMessageResponse {
  reply: string;
  sessionId: string;
  messageId: string;
  timestamp: Date | string;
}

export interface ConversationHistoryResponse {
  sessionId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  messages: MessageResponse[];
}

/**
 * Message Response Type
 * Used in API responses to represent a message from the database
 */
export interface MessageResponse {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: Date | string;
}

/**
 * Error Response Types
 */

export interface ErrorResponse {
  error: string;
  message?: string;
  details?: Array<{
    path: (string | number)[];
    message: string;
  }>;
}

/**
 * Prisma Types (for internal use)
 */

import type { Message, Conversation } from "@prisma/client";

export type MessageWithConversation = Message & {
  conversation: Conversation;
};

export type ConversationWithMessages = Conversation & {
  messages: Message[];
};
