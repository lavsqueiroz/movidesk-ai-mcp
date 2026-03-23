/**
 * Queue Manager - Gerencia fila de tickets para processamento
 * 
 * FLUXO:
 * 1. Webhook recebe ticket → salva na fila (SQLite)
 * 2. Usuário conecta MCP → processa fila em lote
 * 3. Tickets processados são marcados como concluídos
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface QueuedTicket {
  id: number;
  ticket_id: string;
  ticket_data: string; // JSON stringified
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  processed_at?: string;
  error?: string;
}

export class QueueManager {
  private db: Database.Database;
  private dbPath: string;

  constructor() {
    // Criar diretório data se não existir
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.dbPath = path.join(dataDir, 'fila_tickets.db');
    this.db = new Database(this.dbPath);
    this.initDatabase();
  }

  /**
   * Inicializa estrutura do banco
   */
  private initDatabase(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id TEXT NOT NULL,
        ticket_data TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        processed_at DATETIME,
        error TEXT
      )
    `);

    console.log('✅ Banco de dados da fila inicializado:', this.dbPath);
  }

  /**
   * Adiciona ticket na fila
   */
  addToQueue(ticketData: any): number {
    const stmt = this.db.prepare(`
      INSERT INTO queue (ticket_id, ticket_data, status)
      VALUES (?, ?, 'pending')
    `);

    const ticketId = ticketData.ticket_id || ticketData.id;
    const result = stmt.run(ticketId, JSON.stringify(ticketData));

    console.log(`📥 Ticket ${ticketId} adicionado à fila (ID: ${result.lastInsertRowid})`);
    return result.lastInsertRowid as number;
  }

  /**
   * Busca tickets pendentes
   */
  getPendingTickets(): QueuedTicket[] {
    const stmt = this.db.prepare(`
      SELECT * FROM queue
      WHERE status = 'pending'
      ORDER BY created_at ASC
    `);

    return stmt.all() as QueuedTicket[];
  }

  /**
   * Marca ticket como processando
   */
  markAsProcessing(id: number): void {
    const stmt = this.db.prepare(`
      UPDATE queue
      SET status = 'processing'
      WHERE id = ?
    `);

    stmt.run(id);
  }

  /**
   * Marca ticket como completado
   */
  markAsCompleted(id: number): void {
    const stmt = this.db.prepare(`
      UPDATE queue
      SET status = 'completed',
          processed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(id);
    console.log(`✅ Ticket fila ID ${id} marcado como completado`);
  }

  /**
   * Marca ticket como falhou
   */
  markAsFailed(id: number, error: string): void {
    const stmt = this.db.prepare(`
      UPDATE queue
      SET status = 'failed',
          error = ?,
          processed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(error, id);
    console.log(`❌ Ticket fila ID ${id} marcado como falhou:`, error);
  }

  /**
   * Estatísticas da fila
   */
  getQueueStats(): any {
    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM queue
    `).get();

    return stats;
  }

  /**
   * Limpa tickets antigos completados (mais de 7 dias)
   */
  cleanOldTickets(): number {
    const stmt = this.db.prepare(`
      DELETE FROM queue
      WHERE status IN ('completed', 'failed')
        AND processed_at < datetime('now', '-7 days')
    `);

    const result = stmt.run();
    console.log(`🗑️  Removidos ${result.changes} tickets antigos da fila`);
    return result.changes;
  }

  /**
   * Fecha conexão com banco
   */
  close(): void {
    this.db.close();
  }
}

// Singleton
let instance: QueueManager | null = null;

export function getQueueManager(): QueueManager {
  if (!instance) {
    instance = new QueueManager();
  }
  return instance;
}
