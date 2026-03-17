/**
 * Movidesk AI MCP Tools - Export Central
 * 
 * Carrega tools dinamicamente com isolamento de erros
 */

import { getToolRegistry, ToolEntry } from './ToolRegistry.js';

/**
 * Inicializa o registry de tools
 */
export async function initializeTools(): Promise<void> {
  const registry = getToolRegistry();
  await registry.loadAll();
}

/**
 * Obtém todos os schemas das tools disponíveis
 */
export function getToolSchemas(): any[] {
  const registry = getToolRegistry();
  return registry.getAvailableSchemas();
}

/**
 * Obtém handler de uma tool
 */
export function getToolHandler(toolName: string): Function {
  const registry = getToolRegistry();
  return registry.getHandler(toolName);
}

/**
 * Health check das tools
 */
export function getToolsHealth() {
  const registry = getToolRegistry();
  return {
    stats: registry.getStats(),
    tools: registry.getHealthStatus()
  };
}