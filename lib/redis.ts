import { Redis } from "@upstash/redis";

// Initialize Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache TTL in seconds (24 hours)
const CACHE_TTL = 86400;

// Cache key prefixes
const CACHE_PREFIX = {
  CONVERSATION: "conv:",
  MESSAGES: "msgs:",
} as const;

/**
 * Get cached conversation with messages
 */
export async function getCachedConversation(sessionId: string): Promise<any> {
  try {
    const cacheKey = `${CACHE_PREFIX.CONVERSATION}${sessionId}`;
    const cached = await redis.get(cacheKey);
    return cached;
  } catch (error) {
    console.error("Redis get error:", error);
    return null;
  }
}

/**
 * Cache conversation with messages
 */
export async function cacheConversation(
  sessionId: string,
  conversationData: any
) {
  try {
    const cacheKey = `${CACHE_PREFIX.CONVERSATION}${sessionId}`;
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(conversationData));
  } catch (error) {
    console.error("Redis set error:", error);
    // Don't throw - caching failure shouldn't break the app
  }
}

/**
 * Invalidate conversation cache when new messages are added
 */
export async function invalidateConversationCache(sessionId: string) {
  try {
    const cacheKey = `${CACHE_PREFIX.CONVERSATION}${sessionId}`;
    await redis.del(cacheKey);
  } catch (error) {
    console.error("Redis delete error:", error);
    // Don't throw - cache invalidation failure shouldn't break the app
  }
}
