#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// MOVIDESK AI MCP - HTTP SERVER ENTRY POINT
// ═══════════════════════════════════════════════════════════════
// Entry point para inicialização do servidor
// ═══════════════════════════════════════════════════════════════

import 'dotenv/config';
import { MCPHTTPServer } from './server-http.js';
import { 
  initializeTools,
  getToolSchemas,
  getToolHandler
} from '../tools/index.js';

/**
 * Configuração do servidor HTTP
 */
const config = {
  port: parseInt(process.env.MCP_HTTP_PORT || '9002'),
  host: process.env.MCP_HTTP_HOST || '0.0.0.0',
};

/**
 * Criar e iniciar servidor
 */
async function main() {
  try {
    console.log('🚀 Iniciando Movidesk AI MCP Server...');
    console.log(`📍 Porta: ${config.port}`);
    console.log(`📍 Host: ${config.host}`);
    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // 1. INICIALIZAR TOOLS
    // ═══════════════════════════════════════════════════════════════
    
    await initializeTools();
    
    const schemas = getToolSchemas();
    
    if (schemas.length === 0) {
      console.error('❌ ERRO CRÍTICO: Nenhuma tool disponível!');
      console.error('   Verifique erros de compilação em src/tools/');
      process.exit(1);
    }

    console.log(`✅ ${schemas.length} tools carregadas com sucesso`);
    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // 2. CRIAR SERVIDOR
    // ═══════════════════════════════════════════════════════════════

    const server = new MCPHTTPServer(config);

    // ═══════════════════════════════════════════════════════════════
    // 3. REGISTRAR TOOLS
    // ═══════════════════════════════════════════════════════════════
    
    for (const schema of schemas) {
      const handler = getToolHandler(schema.name);
      
      server.registerTool({
        name: schema.name,
        description: schema.description,
        inputSchema: schema.inputSchema,
        handler: handler as any,
      });
    }
    
    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // 4. INICIAR SERVIDOR
    // ═══════════════════════════════════════════════════════════════

    await server.start();

    console.log('✅ Servidor HTTP iniciado com sucesso!\n');

    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      console.log(`\n📡 Received ${signal}, shutting down gracefully...`);
      try {
        await server.stop();
        console.log('✅ Servidor encerrado com sucesso');
        process.exit(0);
      } catch (error) {
        console.error('❌ Erro ao encerrar servidor:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Erro fatal ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Iniciar
main();