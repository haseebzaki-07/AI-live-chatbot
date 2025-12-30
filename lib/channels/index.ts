/**
 * Channel Adapters Export
 *
 * Central export point for all channel adapters
 */

export { BaseChannelAdapter } from "./base";
export * from "./types";

export { WhatsAppAdapter } from "./adapters/whatsapp";
export { InstagramAdapter } from "./adapters/instagram";
export { WebAdapter } from "./adapters/web";

/**
 * Channel adapter factory
 * Returns the appropriate adapter based on channel type
 */
export function getChannelAdapter(channelType: string) {
  // TODO: Implement adapter factory
  // switch (channelType) {
  //   case "whatsapp":
  //     return new WhatsAppAdapter();
  //   case "instagram":
  //     return new InstagramAdapter();
  //   case "web":
  //   default:
  //     return new WebAdapter();
  // }
  throw new Error("Channel adapter factory not implemented");
}
