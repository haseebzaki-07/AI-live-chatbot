/**
 * Tools Export
 *
 * Central export point for all tool integrations
 */

import { BaseTool } from "./base";

export { BaseTool } from "./base";
export * from "./types";

export { OrderLookupTool } from "./order-lookup";
export { ShippingTrackerTool } from "./shipping-tracker";
export { InventoryCheckTool } from "./inventory-check";

/**
 * Tool registry
 * Manages available tools and their configurations
 */
class ToolRegistry {
  private tools: Map<string, BaseTool> = new Map();

  /**
   * Register a tool
   */
  register(tool: BaseTool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Get a tool by name
   */
  get(name: string): BaseTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all available tools
   */
  getAll(): BaseTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by type
   */
  getByType(type: string): BaseTool[] {
    return this.getAll().filter((tool) => tool.type === type);
  }
}

// Export singleton instance
export const toolRegistry = new ToolRegistry();
