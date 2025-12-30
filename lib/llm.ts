import { Message } from "@prisma/client";

// FAQ / Domain Knowledge
export const STORE_KNOWLEDGE = {
  storeName: "TechMart E-Commerce",
  shipping: {
    policy:
      "Free shipping on orders over $50. Standard shipping takes 5-7 business days. Express shipping (2-3 days) available for $15.",
    international:
      "We ship to most countries. International orders take 10-15 business days.",
  },
  returns: {
    policy:
      "30-day return policy for unused items in original packaging. Refunds processed within 5-7 business days after receiving the return.",
    process:
      "Contact support with your order number to initiate a return. We'll provide a prepaid shipping label.",
  },
  support: {
    hours: "Monday-Friday: 9 AM - 6 PM EST. Weekend: 10 AM - 4 PM EST",
    contact: "Email: support@techmart.com | Phone: 1-800-TECH-MART",
  },
  products: {
    categories: "Electronics, Home & Garden, Fashion, Sports & Outdoors",
    warranty: "All electronics come with a 1-year manufacturer warranty",
  },
};

const SYSTEM_PROMPT = `You are a helpful support agent for ${STORE_KNOWLEDGE.storeName}, a small e-commerce store. Answer clearly and concisely.

Store Information:
- Shipping: ${STORE_KNOWLEDGE.shipping.policy} ${STORE_KNOWLEDGE.shipping.international}
- Returns: ${STORE_KNOWLEDGE.returns.policy}
- Return Process: ${STORE_KNOWLEDGE.returns.process}
- Support Hours: ${STORE_KNOWLEDGE.support.hours}
- Contact: ${STORE_KNOWLEDGE.support.contact}
- Product Categories: ${STORE_KNOWLEDGE.products.categories}
- Warranty: ${STORE_KNOWLEDGE.products.warranty}

Guidelines:
- Be friendly and professional
- Provide accurate information based on the store policies above
- If you don't know something specific, direct the customer to contact support
- Keep responses concise but helpful`;

interface LLMError {
  type: "rate_limit" | "invalid_key" | "timeout" | "unknown";
  message: string;
}

export class LLMService {
  private apiKey: string;
  private model: string;
  private maxTokens: number;
  private timeout: number;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || "";
    this.model = process.env.LLM_MODEL || "gpt-3.5-turbo";
    this.maxTokens = parseInt(process.env.MAX_TOKENS || "500");
    this.timeout = parseInt(process.env.LLM_TIMEOUT || "30000");

    if (!this.apiKey) {
      console.warn(
        "⚠️  OPENAI_API_KEY not set. LLM functionality will not work."
      );
    }
  }

  /**
   * Generate a reply using the LLM based on conversation history
   */
  async generateReply(
    history: Message[],
    userMessage: string
  ): Promise<string> {
    if (!this.apiKey) {
      return "We're temporarily unavailable. Our team is working on it and we'll be back soon!";
    }

    try {
      // Build conversation context (limit to last 10 messages for cost control)
      const recentHistory = history.slice(-10);
      const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...recentHistory.map((msg) => ({
          role: msg.sender === "USER" ? "user" : "assistant",
          content: msg.text,
        })),
        { role: "user", content: userMessage },
      ];

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            messages,
            max_tokens: this.maxTokens,
            temperature: 0.7,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await this.handleAPIError(response);
        throw error;
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content;

      if (!reply) {
        throw new Error(
          "We're experiencing some technical difficulties. Please try again in a moment."
        );
      }

      return reply.trim();
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Handle API errors and return user-friendly messages
   */
  private async handleAPIError(response: Response): Promise<LLMError> {
    const status = response.status;
    let errorData;

    try {
      errorData = await response.json();
    } catch {
      errorData = {};
    }

    // Rate limit errors
    if (status === 429) {
      return {
        type: "rate_limit",
        message:
          "We're receiving a lot of requests right now. Please wait a moment and try again. If the issue persists, feel free to contact our support team at support@techmart.com or 1-800-TECH-MART.",
      };
    }

    // Authentication/Authorization errors (invalid API key, missing key, etc.)
    if (status === 401 || status === 403) {
      return {
        type: "invalid_key",
        message:
          "We're temporarily unavailable. Our team is working on it and we'll be back soon! If the issue persists, feel free to contact our support team at support@techmart.com or 1-800-TECH-MART.",
      };
    }

    // Server errors (500, 502, 503, 504)
    if (status >= 500) {
      return {
        type: "unknown",
        message:
          "Our service is temporarily unavailable. We'll be back soon - thank you for your patience! If the issue persists, feel free to contact our support team at support@techmart.com or 1-800-TECH-MART.",
      };
    }

    // Bad request errors (400, 422, etc.)
    if (status >= 400 && status < 500) {
      return {
        type: "unknown",
        message:
          "We're experiencing some technical difficulties. Please try again in a moment. If the issue persists, feel free to contact our support team at support@techmart.com or 1-800-TECH-MART.",
      };
    }

    // Unknown errors
    return {
      type: "unknown",
      message:
        "We're experiencing some technical difficulties. Please try again in a moment.",
    };
  }

  /**
   * Handle errors and return user-friendly messages
   */
  private handleError(error: unknown): string {
    // First, check if it's an LLMError (from handleAPIError)
    // This must be checked before instanceof Error because LLMError is a plain object
    if (
      error &&
      typeof error === "object" &&
      "type" in error &&
      "message" in error
    ) {
      const llmError = error as LLMError;
      return llmError.message;
    }

    // Handle Error instances
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return "We're having trouble processing your request right now. Please try again in a moment.";
      }

      console.error("LLM Error:", error.message);
    }

    // Fallback for any other unknown errors
    return "We're experiencing some technical difficulties. Please try again in a moment. If the issue persists, feel free to contact our support team at support@techmart.com or 1-800-TECH-MART.";
  }

  /**
   * Validate that the LLM service is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Export singleton instance
export const llmService = new LLMService();
