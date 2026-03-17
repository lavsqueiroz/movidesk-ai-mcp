/**
 * Tool Registry - Sistema de registro dinâmico de tools
 * Similar ao SuperDoc
 */

export interface ToolEntry {
  name: string;
  status: 'available' | 'error';
  schema?: any;
  handler?: Function;
  error?: string;
}

class ToolRegistry {
  private tools: Map<string, ToolEntry> = new Map();
  
  /**
   * Carrega todas as tools
   */
  async loadAll(): Promise<void> {
    console.log('📦 Carregando tools...');
    
    // Lista de tools a carregar
    const toolNames = [
      'analyze-ticket-n1',
      'analyze-ticket-n2', 
      'analyze-ticket-n3',
    ];
    
    for (const toolName of toolNames) {
      await this.loadTool(toolName);
    }
  }
  
  /**
   * Carrega uma tool específica
   */
  private async loadTool(toolName: string): Promise<void> {
    try {
      const module = await import(`./${toolName}.js`);
      
      if (module.tool && module.tool.name && module.tool.handler) {
        this.tools.set(toolName, {
          name: toolName,
          status: 'available',
          schema: module.tool,
          handler: module.tool.handler,
        });
        console.log(`  ✅ ${toolName}`);
      } else {
        throw new Error('Tool inválida (faltando name ou handler)');
      }
    } catch (error: any) {
      this.tools.set(toolName, {
        name: toolName,
        status: 'error',
        error: error.message,
      });
      console.log(`  ❌ ${toolName}: ${error.message}`);
    }
  }
  
  /**
   * Obtém schemas das tools disponíveis
   */
  getAvailableSchemas(): any[] {
    const schemas: any[] = [];
    
    for (const entry of this.tools.values()) {
      if (entry.status === 'available' && entry.schema) {
        schemas.push(entry.schema);
      }
    }
    
    return schemas;
  }
  
  /**
   * Obtém handler de uma tool
   */
  getHandler(toolName: string): Function {
    const entry = this.tools.get(toolName);
    
    if (entry && entry.status === 'available' && entry.handler) {
      return entry.handler;
    }
    
    // Fallback handler se tool não disponível
    return async () => {
      return {
        error: `Tool ${toolName} não disponível`,
        status: entry?.status || 'not-found',
      };
    };
  }
  
  /**
   * Estatísticas
   */
  getStats() {
    let available = 0;
    let errors = 0;
    
    for (const entry of this.tools.values()) {
      if (entry.status === 'available') available++;
      if (entry.status === 'error') errors++;
    }
    
    return { available, errors, total: this.tools.size };
  }
  
  /**
   * Health status
   */
  getHealthStatus() {
    return Array.from(this.tools.values());
  }
}

// Singleton
let registry: ToolRegistry | null = null;

export function getToolRegistry(): ToolRegistry {
  if (!registry) {
    registry = new ToolRegistry();
  }
  return registry;
}