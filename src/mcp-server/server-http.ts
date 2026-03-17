// ═══════════════════════════════════════════════════════════════
// MOVIDESK AI MCP - HTTP SERVER
// ═══════════════════════════════════════════════════════════════

import express, { Express, Request, Response, NextFunction } from 'express';

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
 * Servidor MCP HTTP
 */
export class MCPHTTPServer {
  private app: Express;
  private config: MCPServerConfig;
  private server: any | null = null;
  private tools: Map<string, ToolDefinition> = new Map();

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
      res.json({
        status: 'ok',
        service: 'movidesk-ai-mcp',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
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

    // Webhook do Movidesk (será implementado depois)
    this.app.post('/webhook/ticket-created', async (req: Request, res: Response) => {
      console.log('📨 Webhook recebido do Movidesk:', req.body);
      
      // TODO: Processar ticket aqui
      
      res.json({ status: 'received', message: 'Webhook recebido com sucesso' });
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
        console.log('');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`  🚀 MOVIDESK AI MCP SERVER`);
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');
        console.log(`  📍 Endereço: http://${this.config.host}:${this.config.port}`);
        console.log(`  🛠️  Tools: ${this.tools.size} registradas`);
        console.log('');
        console.log('  🔓 Rotas PÚBLICAS:');
        console.log('     GET  /health              - Health check');
        console.log('     GET  /info                - Server info');
        console.log('     GET  /tools               - Lista de tools');
        console.log('     POST /webhook/ticket-created - Webhook Movidesk');
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
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }
}