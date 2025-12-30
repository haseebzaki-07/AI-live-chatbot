/**
 * Tools Integration Types
 *
 * Base types and interfaces for external tool integrations
 */

export type ToolType =
  | "order_lookup"
  | "inventory_check"
  | "payment_processor"
  | "shipping_tracker"
  | "crm_integration"
  | "analytics"
  | "notification";

export interface ToolConfig {
  type: ToolType;
  enabled: boolean;
  credentials?: Record<string, string>;
  settings?: Record<string, unknown>;
}

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface Tool {
  /**
   * Tool identifier
   */
  readonly name: string;

  /**
   * Tool type
   */
  readonly type: ToolType;

  /**
   * Execute tool with given parameters
   */
  execute(params: Record<string, unknown>): Promise<ToolResult>;

  /**
   * Validate tool configuration
   */
  validateConfig(config: ToolConfig): boolean;

  /**
   * Check if tool is available/enabled
   */
  isAvailable(): boolean;
}
