/**
 * Channel Integration Types
 *
 * Base types and interfaces for multi-channel support
 */

export type ChannelType = "web" | "whatsapp" | "instagram" | "telegram" | "sms";

export interface ChannelMessage {
  id: string;
  channel: ChannelType;
  userId: string;
  text: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ChannelResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface ChannelAdapter {
  /**
   * Process incoming message from channel
   */
  receiveMessage(message: ChannelMessage): Promise<ChannelMessage>;

  /**
   * Send message through channel
   */
  sendMessage(
    userId: string,
    text: string,
    metadata?: Record<string, unknown>
  ): Promise<ChannelResponse>;

  /**
   * Validate webhook signature/authentication
   */
  validateWebhook(request: Request): Promise<boolean>;
}
