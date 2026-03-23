// ═══════════════════════════════════════════════════════════════
// MOVIDESK AI MCP - HTTP SERVER COM SISTEMA DE FILA
// ═══════════════════════════════════════════════════════════════

import express, { Express, Request, Response, NextFunction } from 'express';
import { getQueueManager } from '../services/QueueManager.js';
import { getMovideskClient } from '../services/MovideskClient.js';

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
  private movideskClient = getMovideskClient();

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

    // ═══════════════════════════════════════════════════════
    // MOVIDESK - Listar Tickets
    // ═══════════════════════════════════════════════════════
    this.app.get('/movidesk/tickets', async (req: Request, res: Response) => {
      try {
        console.log('\n📋 Buscando tickets do Movidesk...');
        
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
        
        // Buscar tickets via API Movidesk
        const tickets = await this.movideskClient.listTickets({ limit });
        
        console.log(`✅ ${tickets.length} tickets retornados`);
        
        res.json({
          status: 'success',
          count: tickets.length,
          tickets: tickets.map(t => ({
            id: t.id,
            protocol: t.protocol,
            subject: t.subject,
            status: t.status,
            createdDate: t.createdDate,
          })),
        });
        
      } catch (error: any) {
        console.error('❌ Erro ao buscar tickets:', error);
        res.status(500).json({
          status: 'error',
          message: error.message,
        });
      }
    });

    // ═══════════════════════════════════════════════════════
    // MOVIDESK - Buscar 1 Ticket Específico
    // ═══════════════════════════════════════════════════════
    this.app.get('/movidesk/tickets/:id', async (req: Request, res: Response) => {
      try {
        const ticketId = req.params.id;
        console.log(`\n📋 Buscando ticket ${ticketId}...`);
        
        const ticket = await this.movideskClient.getTicket(ticketId);
        
        res.json({
          status: 'success',
          ticket,
        });
        
      } catch (error: any) {
        console.error('❌ Erro ao buscar ticket:', error);
        res.status(500).json({
          status: 'error',
          message: error.message,
        });
      }
    });

    // ═══════════════════════════════════════════════════════
    // MOVIDESK - TESTE: Criar Nota Interna
    // ═══════════════════════════════════════════════════════
    this.app.post('/movidesk/tickets/:id/note', async (req: Request, res: Response) => {
      try {
        const ticketId = req.params.id;
        const { description } = req.body;

        if (!description) {
          return res.status(400).json({
            status: 'error',
            message: 'Campo "description" é obrigatório',
          });
        }

        console.log(`\n📝 Criando nota no ticket ${ticketId}...`);

        const success = await this.movideskClient.createInternalNote({
          ticketId,
          description,
          isInternal: true,
        });

        if (success) {
          res.json({
            status: 'success',
            message: 'Nota criada com sucesso',
            ticket_id: ticketId,
          });
        } else {
          res.status(500).json({
            status: 'error',
            message: 'Falha ao criar nota',
          });
        }
        
      } catch (error: any) {
        console.error('❌ Erro ao criar nota:', error);
        res.status(500).json({
          status: 'error',
          message: error.message,
        });
      }
    });

    // Webhook do Movidesk - ADICIONA NA FILA
    this.app.post('/webhook/ticket-created', async (req: Request, res: Response) => {
      try {
        console.log('\n📨 Webhook recebido do Movidesk');
        
        const ticketData = req.body;
        const ticketId = ticketData.ticket_id || ticketData.id;
        
        // Adicionar na fila
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

    // Estatísticas da fila
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
        console.log(`  🚀 MOVIDESK AI MCP SERVER`);
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');
        console.log(`  📍 Endereço: http://${this.config.host}:${this.config.port}`);
        console.log(`  📦 Fila: ${stats.pending} pendentes, ${stats.completed} processados`);
        console.log('');
        console.log('  🔓 ROTAS:');
        console.log('     GET  /health                       - Health check');
        console.log('     GET  /movidesk/tickets             - Listar tickets');
        console.log('     GET  /movidesk/tickets/:id         - Buscar 1 ticket');
        console.log('     POST /movidesk/tickets/:id/note    - Criar nota (TESTE)');
        console.log('     POST /webhook/ticket-created       - Webhook (→ fila)');
        console.log('     GET  /queue/stats                  - Estatísticas fila');
        console.log('     GET  /queue/pending                - Tickets pendentes');
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
