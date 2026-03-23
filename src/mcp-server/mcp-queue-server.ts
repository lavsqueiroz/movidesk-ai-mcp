#!/usr/bin/env node
/**
 * MCP Queue Server - Servidor MCP para processar fila de tickets
 * 
 * FLUXO COM APROVAÇÃO HUMANA:
 * 1. Listar tickets novos/pendentes
 * 2. Analisar ticket com N1 (MOSTRAR resultado)
 * 3. AGUARDAR APROVAÇÃO HUMANA
 * 4. Criar nota SOMENTE após confirmação
 * 
 * NUNCA criar notas sem aprovação explícita!
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { getMovideskClient } from '../services/MovideskClient.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        name: 'list_new_tickets',
        description: 'Lista tickets novos/recém-criados do Movidesk que precisam de análise. Use para ver quais tickets estão aguardando processamento.',
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
        name: 'analyze_ticket_n1',
        description: 'Analisa UM ticket específico usando o agente N1. IMPORTANTE: Esta ferramenta APENAS analisa e mostra o resultado. NÃO cria nota automaticamente. Após ver o resultado, você deve PERGUNTAR ao usuário se pode criar a nota.',
        inputSchema: {
          type: 'object',
          properties: {
            ticket_id: {
              type: 'string',
              description: 'ID do ticket a ser analisado',
            },
          },
          required: ['ticket_id'],
        },
      },
      {
        name: 'create_note_approved',
        description: 'Cria nota interna no ticket do Movidesk. ATENÇÃO: Use esta ferramenta SOMENTE depois que o usuário APROVAR explicitamente com "sim", "pode", "ok" ou similar. NUNCA crie notas sem aprovação humana.',
        inputSchema: {
          type: 'object',
          properties: {
            ticket_id: {
              type: 'string',
              description: 'ID do ticket onde criar a nota',
            },
            note_content: {
              type: 'string',
              description: 'Conteúdo completo da nota a ser criada',
            },
          },
          required: ['ticket_id', 'note_content'],
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
      // LIST_NEW_TICKETS
      // ───────────────────────────────────────────────────────
      case 'list_new_tickets': {
        const limit = (args as any).limit || 10;
        
        // Buscar tickets do Movidesk (novos/aguardando)
        const tickets = await movideskClient.listTickets({ 
          limit,
          status: 'Aguardando', // ou 'Novo' - ajustar conforme necessário
        });
        
        const ticketsList = tickets.map(t => ({
          id: t.id,
          subject: t.subject,
          status: t.status,
          createdDate: t.createdDate,
        }));
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                count: ticketsList.length,
                tickets: ticketsList,
                message: ticketsList.length > 0 
                  ? `Encontrados ${ticketsList.length} tickets aguardando análise`
                  : 'Nenhum ticket novo encontrado',
              }, null, 2),
            },
          ],
        };
      }

      // ───────────────────────────────────────────────────────
      // ANALYZE_TICKET_N1
      // ───────────────────────────────────────────────────────
      case 'analyze_ticket_n1': {
        const ticketId = (args as any).ticket_id;
        
        if (!ticketId) {
          throw new Error('ticket_id é obrigatório');
        }
        
        // Buscar ticket completo
        const ticket = await movideskClient.getTicket(ticketId);
        
        if (!ticket) {
          throw new Error(`Ticket ${ticketId} não encontrado`);
        }
        
        // Carregar prompt N1
        const promptPath = path.join(__dirname, '../../prompts/N1_SUPPORT_AGENT.md');
        const promptN1 = fs.readFileSync(promptPath, 'utf-8');
        
        // Preparar contexto do ticket
        const ticketContext = `
TICKET ID: ${ticket.id}
ASSUNTO: ${ticket.subject}
STATUS: ${ticket.status}
CRIADO EM: ${ticket.createdDate}

DESCRIÇÃO:
${ticket.actions && ticket.actions.length > 0 ? ticket.actions[0].description : 'Sem descrição'}
        `.trim();
        
        return {
          content: [
            {
              type: 'text',
              text: `# ANÁLISE N1 - Ticket ${ticketId}

${ticketContext}

---

**PROMPT N1 CARREGADO**

Agora você deve:
1. Analisar este ticket usando as instruções do prompt N1
2. Gerar a orientação para o analista E a resposta para o cliente
3. MOSTRAR o resultado completo para o usuário
4. PERGUNTAR: "Posso criar esta nota no ticket ${ticketId}? (sim/não)"

**AGUARDE APROVAÇÃO ANTES DE CRIAR A NOTA!**

---

**Prompt N1:**
${promptN1}
`,
            },
          ],
        };
      }

      // ───────────────────────────────────────────────────────
      // CREATE_NOTE_APPROVED
      // ───────────────────────────────────────────────────────
      case 'create_note_approved': {
        const ticketId = (args as any).ticket_id;
        const noteContent = (args as any).note_content;
        
        if (!ticketId || !noteContent) {
          throw new Error('ticket_id e note_content são obrigatórios');
        }
        
        // Criar nota no Movidesk
        const success = await movideskClient.createInternalNote({
          ticketId,
          description: noteContent,
          isInternal: true,
        });
        
        if (success) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'success',
                  message: `✅ Nota criada com sucesso no ticket ${ticketId}`,
                  ticket_id: ticketId,
                  ticket_url: `https://newm.movidesk.com/Ticket/Edit/${ticketId}`,
                }, null, 2),
              },
            ],
          };
        } else {
          throw new Error('Falha ao criar nota no Movidesk');
        }
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
  console.error('📋 Ferramentas com aprovação humana configuradas');
  console.error('⚠️  NUNCA cria notas sem aprovação explícita!');
}

main().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
