/**
 * Base Tool Implementation
 *
 * Abstract base class for all tool integrations
 */

import type { Tool, ToolConfig, ToolResult } from "./types";

export abstract class BaseTool implements Tool {
  abstract readonly name: string;
  abstract readonly type: Tool["type"];

  protected config: ToolConfig | null = null;

  constructor(config?: ToolConfig) {
    if (config) {
      this.config = config;
    }
  }

  /**
   * Execute tool with given parameters
   * Subclasses must implement this
   */
  abstract execute(params: Record<string, unknown>): Promise<ToolResult>;

  /**
   * Validate tool configuration
   * Subclasses can override for custom validation
   */
  validateConfig(config: ToolConfig): boolean {
    return config.type === this.type && config.enabled === true;
  }

  /**
   * Check if tool is available/enabled
   */
  isAvailable(): boolean {
    return this.config?.enabled === true;
  }

  /**
   * Set tool configuration
   */
  setConfig(config: ToolConfig): void {
    if (this.validateConfig(config)) {
      this.config = config;
    } else {
      throw new Error(`Invalid configuration for tool: ${this.name}`);
    }
  }

  /**
   * Get tool configuration
   */
  getConfig(): ToolConfig | null {
    return this.config;
  }
}
