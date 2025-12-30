/**
 * Base Channel Adapter
 *
 * Abstract base class for all channel implementations
 */

import type { ChannelAdapter, ChannelMessage, ChannelResponse } from "./types";

export abstract class BaseChannelAdapter implements ChannelAdapter {
  protected channelType: string;

  constructor(channelType: string) {
    this.channelType = channelType;
  }

  /**
   * Process incoming message from channel
   * Subclasses must implement this
   */
  abstract receiveMessage(message: ChannelMessage): Promise<ChannelMessage>;

  /**
   * Send message through channel
   * Subclasses must implement this
   */
  abstract sendMessage(
    userId: string,
    text: string,
    metadata?: Record<string, unknown>
  ): Promise<ChannelResponse>;

  /**
   * Validate webhook signature/authentication
   * Subclasses must implement this
   */
  abstract validateWebhook(request: Request): Promise<boolean>;

  /**
   * Normalize message format for internal processing
   */
  protected normalizeMessage(message: ChannelMessage): ChannelMessage {
    return {
      ...message,
      channel: this.channelType as ChannelMessage["channel"],
      timestamp: new Date(message.timestamp),
    };
  }
}
