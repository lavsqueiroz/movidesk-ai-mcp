// ═══════════════════════════════════════════════════════════════
// MOVIDESK AI MCP - HTTP SERVER COM SISTEMA DE FILA
// ═══════════════════════════════════════════════════════════════

import express, { Express, Request, Response, NextFunction } from 'express';
import { getQueueManager } from '../services/QueueManager.js';

interface MCPServerConfig {
  port: number;
  host: string;
}

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: any;
  handler: Function;
}

/**
 * Servidor MCP HTTP com Sistema de Fila
 */
export class MCPHTTPServer {
  private app: Express;
  private config: MCPServerConfig;
  private server: any | null = null;
  private tools: Map<string, ToolDefinition> = new Map();
  private queueManager = getQueueManager();

  constructor(config: MCPServerConfig) {
    this.config = config;
    this.app = express();
    this.setupMiddlewares();
    this.setupRoutes();
  }

  /**
   * Configura middlewares globais
   */
  private setupMiddlewares(): void {
    // Body parser
    this.app.use(express.json({ limit: '10mb' }));

    // CORS
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }
      
      next();
    });

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
      });
      next();
    });
  }

  /**
   * Configura rotas
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      const stats = this.queueManager.getQueueStats();
      
      res.json({
        status: 'ok',
        service: 'movidesk-ai-mcp',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        queue: stats,
      });
    });

    // Server info
    this.app.get('/info', (req: Request, res: Response) => {
      const toolsList = Array.from(this.tools.values()).map(t => ({
        name: t.name,
        description: t.description,
      }));
      
      res.json({
        name: 'movidesk-ai-mcp',
        version: '1.0.0',
        tools: toolsList,
      });
    });

    // Lista de tools
    this.app.get('/tools', (req: Request, res: Response) => {
      const toolsList = Array.from(this.tools.values()).map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      }));
      
      res.json({ tools: toolsList });
    });

    // Webhook do Movidesk - ADICIONA NA FILA
    this.app.post('/webhook/ticket-created', async (req: Request, res: Response) => {
      try {
        console.log('\n📨 Webhook recebido do Movidesk');
        
        const ticketData = req.body;
        const ticketId = ticketData.ticket_id || ticketData.id;
        
        // Adicionar na fila ao invés de processar
        const queueId = this.queueManager.addToQueue(ticketData);
        
        console.log(`✅ Ticket ${ticketId} adicionado à fila (fila ID: ${queueId})`);
        
        res.json({
          status: 'queued',
          message: 'Ticket adicionado à fila para processamento',
          queue_id: queueId,
          ticket_id: ticketId,
        });
        
      } catch (error: any) {
        console.error('❌ Erro ao adicionar ticket na fila:', error);
        res.status(500).json({
          status: 'error',
          message: error.message,
        });
      }
    });

    // Estat\u00edsticas da fila
    this.app.get('/queue/stats', (req: Request, res: Response) => {
      try {
        const stats = this.queueManager.getQueueStats();
        res.json(stats);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Ver tickets pendentes
    this.app.get('/queue/pending', (req: Request, res: Response) => {
      try {
        const pending = this.queueManager.getPendingTickets();
        res.json({
          count: pending.length,
          tickets: pending.map(t => ({
            queue_id: t.id,
            ticket_id: t.ticket_id,
            created_at: t.created_at,
          })),
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // 404
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Endpoint não encontrado: ${req.method} ${req.path}`,
      });
    });

    // Error handler
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('❌ Erro não tratado:', err);
      res.status(500).json({
        error: 'Internal server error',
        message: err.message,
      });
    });
  }

  /**
   * Registra uma tool no servidor
   */
  registerTool(tool: ToolDefinition): this {
    this.tools.set(tool.name, tool);
    console.log(`✅ Tool registrada: ${tool.name}`);
    return this;
  }

  /**
   * Inicia o servidor
   */
  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.config.port, this.config.host, () => {
        const stats = this.queueManager.getQueueStats();
        
        console.log('');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`  🚀 MOVIDESK AI MCP SERVER - COM SISTEMA DE FILA`);
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');
        console.log(`  📍 Endereço: http://${this.config.host}:${this.config.port}`);
        console.log(`  🛠️  Tools: ${this.tools.size} registradas`);
        console.log(`  📦 Fila: ${stats.pending} pendentes, ${stats.completed} processados`);
        console.log('');
        console.log('  🔓 Rotas PÚBLICAS:');
        console.log('     GET  /health              - Health check + fila status');
        console.log('     GET  /info                - Server info');
        console.log('     GET  /tools               - Lista de tools');
        console.log('     POST /webhook/ticket-created - Webhook Movidesk (→ fila)');
        console.log('     GET  /queue/stats         - Estatísticas da fila');
        console.log('     GET  /queue/pending       - Tickets pendentes');
        console.log('');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');
        resolve();
      });
    });
  }

  /**
   * Para o servidor
   */
  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err: any) => {
          if (err) reject(err);
          else {
            this.queueManager.close();
            resolve();
          }
        });
      } else {
        this.queueManager.close();
        resolve();
      }
    });
  }
}
