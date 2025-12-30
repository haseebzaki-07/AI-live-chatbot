/**
 * Web Channel Adapter
 *
 * Handles web-based chat (current implementation)
 * This is the default channel for the web interface
 */

import { BaseChannelAdapter } from "../base";
import type { ChannelMessage, ChannelResponse } from "../types";

export class WebAdapter extends BaseChannelAdapter {
  constructor() {
    super("web");
  }

  async receiveMessage(message: ChannelMessage): Promise<ChannelMessage> {
    // Web channel messages are already in the correct format
    // Just normalize and return
    return this.normalizeMessage(message);
  }

  async sendMessage(
    userId: string,
    text: string,
    metadata?: Record<string, unknown>
  ): Promise<ChannelResponse> {
    // Web channel messages are sent via HTTP response
    // This is handled by the API route directly
    return {
      success: true,
      messageId: metadata?.messageId as string,
    };
  }

  async validateWebhook(request: Request): Promise<boolean> {
    // Web channel doesn't require webhook validation
    // Authentication is handled at the API route level
    return true;
  }
}
