#!/usr/bin/env node
/**
 * MCP Queue Server - Servidor MCP para processar fila de tickets
 * 
 * Este servidor expõe ferramentas MCP que permitem:
 * - Ver status da fila
 * - Processar tickets da fila
 * - Criar notas no Movidesk
 * 
 * USO NO CLAUDE DESKTOP:
 * 1. Conectar este MCP
 * 2. Perguntar: "Tem tickets na fila do Movidesk?"
 * 3. Claude usa ferramentas para processar
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { getQueueManager } from '../services/QueueManager.js';
import { getTicketProcessor } from '../services/TicketProcessor.js';
import { getMovideskClient } from '../services/MovideskClient.js';

const queueManager = getQueueManager();
const ticketProcessor = getTicketProcessor();
const movideskClient = getMovideskClient();

// Criar servidor MCP
const server = new Server(
  {
    name: 'movidesk-queue',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ═══════════════════════════════════════════════════════════
// LISTA DE TOOLS
// ═══════════════════════════════════════════════════════════

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'check_queue',
        description: 'Verifica quantos tickets estão na fila aguardando processamento. Use para saber se há trabalho pendente.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_pending_tickets',
        description: 'Lista todos os tickets pendentes na fila com seus detalhes. Use para ver o que precisa ser processado.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Número máximo de tickets para retornar (padrão: 10)',
            },
          },
        },
      },
      {
        name: 'process_ticket',
        description: 'Processa um ticket específico da fila (N1 → N2 → N3) consultando SuperDoc e criando nota no Movidesk.',
        inputSchema: {
          type: 'object',
          properties: {
            queue_id: {
              type: 'number',
              description: 'ID do ticket na fila (não é o ticket_id do Movidesk)',
            },
          },
          required: ['queue_id'],
        },
      },
      {
        name: 'process_all_pending',
        description: 'Processa TODOS os tickets pendentes na fila em lote. Use quando quiser processar tudo de uma vez.',
        inputSchema: {
          type: 'object',
          properties: {
            max_tickets: {
              type: 'number',
              description: 'Número máximo de tickets para processar (padrão: 50)',
            },
          },
        },
      },
    ],
  };
});

// ═══════════════════════════════════════════════════════════
// EXECUTAR TOOLS
// ═══════════════════════════════════════════════════════════

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // ───────────────────────────────────────────────────────
      // CHECK_QUEUE
      // ───────────────────────────────────────────────────────
      case 'check_queue': {
        const stats = queueManager.getQueueStats();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                queue_stats: stats,
                message: stats.pending > 0 
                  ? `📦 Existem ${stats.pending} tickets aguardando processamento!`
                  : '✅ Fila vazia! Nenhum ticket pendente.',
              }, null, 2),
            },
          ],
        };
      }

      // ───────────────────────────────────────────────────────
      // GET_PENDING_TICKETS
      // ───────────────────────────────────────────────────────
      case 'get_pending_tickets': {
        const limit = (args as any).limit || 10;
        const pending = queueManager.getPendingTickets().slice(0, limit);
        
        const tickets = pending.map(t => {
          const data = JSON.parse(t.ticket_data);
          return {
            queue_id: t.id,
            ticket_id: t.ticket_id,
            titulo: data.titulo || data.subject,
            created_at: t.created_at,
          };
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                count: tickets.length,
                tickets,
              }, null, 2),
            },
          ],
        };
      }

      // ───────────────────────────────────────────────────────
      // PROCESS_TICKET
      // ───────────────────────────────────────────────────────
      case 'process_ticket': {
        const queueId = (args as any).queue_id;
        
        if (!queueId) {
          throw new Error('queue_id é obrigatório');
        }
        
        // Buscar ticket na fila
        const pending = queueManager.getPendingTickets();
        const ticket = pending.find(t => t.id === queueId);
        
        if (!ticket) {
          throw new Error(`Ticket fila ID ${queueId} não encontrado ou já processado`);
        }
        
        // Marcar como processando
        queueManager.markAsProcessing(queueId);
        
        // Processar ticket
        const ticketData = JSON.parse(ticket.ticket_data);
        const result = await ticketProcessor.processTicket(ticketData);
        
        if (result.success) {
          queueManager.markAsCompleted(queueId);
        } else {
          queueManager.markAsFailed(queueId, result.error || 'Erro desconhecido');
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: result.success ? 'success' : 'failed',
                queue_id: queueId,
                ticket_id: ticket.ticket_id,
                result,
              }, null, 2),
            },
          ],
        };
      }

      // ───────────────────────────────────────────────────────
      // PROCESS_ALL_PENDING
      // ───────────────────────────────────────────────────────
      case 'process_all_pending': {
        const maxTickets = (args as any).max_tickets || 50;
        const pending = queueManager.getPendingTickets().slice(0, maxTickets);
        
        const results = [];
        
        for (const ticket of pending) {
          try {
            queueManager.markAsProcessing(ticket.id);
            
            const ticketData = JSON.parse(ticket.ticket_data);
            const result = await ticketProcessor.processTicket(ticketData);
            
            if (result.success) {
              queueManager.markAsCompleted(ticket.id);
              results.push({
                queue_id: ticket.id,
                ticket_id: ticket.ticket_id,
                status: 'success',
              });
            } else {
              queueManager.markAsFailed(ticket.id, result.error || 'Erro desconhecido');
              results.push({
                queue_id: ticket.id,
                ticket_id: ticket.ticket_id,
                status: 'failed',
                error: result.error,
              });
            }
          } catch (error: any) {
            queueManager.markAsFailed(ticket.id, error.message);
            results.push({
              queue_id: ticket.id,
              ticket_id: ticket.ticket_id,
              status: 'failed',
              error: error.message,
            });
          }
        }
        
        const successCount = results.filter(r => r.status === 'success').length;
        const failedCount = results.filter(r => r.status === 'failed').length;
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'completed',
                processed: results.length,
                success: successCount,
                failed: failedCount,
                results,
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Tool desconhecida: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: 'error',
            message: error.message,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// ═══════════════════════════════════════════════════════════
// INICIAR SERVIDOR
// ═══════════════════════════════════════════════════════════

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('✅ Movidesk Queue MCP Server iniciado!');
  console.error('📦 Fila pronta para processar tickets');
}

main().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
