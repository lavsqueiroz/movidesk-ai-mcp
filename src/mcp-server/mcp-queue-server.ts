#!/usr/bin/env node
/**
 * MCP Queue Server - FLUXO COM APROVAÇÃO HUMANA OBRIGATÓRIA
 * 
 * REGRAS CRÍTICAS:
 * 1. NUNCA criar notas sem aprovação explícita do usuário
 * 2. SEMPRE mostrar análise completa ANTES de pedir aprovação
 * 3. AGUARDAR confirmação ("sim", "pode", "aprovo") antes de executar create_note_approved
 * 
 * FLUXO CORRETO:
 * Usuário: "Processar tickets novos"
 * → list_new_tickets (mostra lista)
 * → analyze_ticket_n1 (mostra análise completa)
 * → PERGUNTAR: "Posso criar esta nota?"
 * → AGUARDAR resposta
 * → SE aprovado: create_note_approved
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
    version: '2.0.0',
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
        name: 'get_status_configs',
        description: 'Busca todos os status de tickets configurados no Movidesk, incluindo se exigem justificativa ou não.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'list_new_tickets',
        description: 'Lista tickets novos/aguardando análise do Movidesk. Retorna ID, assunto, status e data de criação.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Número máximo de tickets para retornar (padrão: 10, máximo: 50)',
              default: 10,
            },
          },
        },
      },
      {
        name: 'analyze_ticket_n1',
        description: 'Analisa UM ticket usando o agente N1. RETORNA: contexto do ticket + prompt N1 carregado. Você deve então gerar a análise completa (orientação para analista + resposta para cliente) e MOSTRAR ao usuário. NÃO cria nota - apenas analisa.',
        inputSchema: {
          type: 'object',
          properties: {
            ticket_id: {
              type: 'string',
              description: 'ID do ticket do Movidesk',
            },
          },
          required: ['ticket_id'],
        },
      },
      {
        name: 'create_note_approved',
        description: 'Cria nota interna no ticket. CRÍTICO: Use SOMENTE após: (1) chamar analyze_ticket_n1, (2) gerar análise completa, (3) MOSTRAR ao usuário, (4) RECEBER aprovação explícita ("sim", "pode", "aprovo", "ok"). NUNCA use sem aprovação prévia.',
        inputSchema: {
          type: 'object',
          properties: {
            ticket_id: {
              type: 'string',
              description: 'ID do ticket',
            },
            note_content: {
              type: 'string',
              description: 'Conteúdo completo da nota (deve incluir orientação para analista E resposta para cliente)',
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

      case 'get_status_configs': {
        const statuses = await movideskClient.getStatusConfigs();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(statuses, null, 2),
            },
          ],
        };
      }

      case 'list_new_tickets': {
        const limit = Math.min((args as any).limit || 10, 50);
        
        const tickets = await movideskClient.listTickets({ 
          limit,
          status: 'Aguardando',
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                count: tickets.length,
                tickets: tickets.map(t => ({
                  id: t.id,
                  subject: t.subject,
                  status: t.status,
                  createdDate: t.createdDate,
                })),
              }, null, 2),
            },
          ],
        };
      }

      case 'analyze_ticket_n1': {
        const ticketId = (args as any).ticket_id;
        
        if (!ticketId) {
          throw new Error('ticket_id é obrigatório');
        }
        
        const ticket = await movideskClient.getTicket(ticketId);
        
        if (!ticket) {
          throw new Error(`Ticket ${ticketId} não encontrado`);
        }
        
        // Carregar prompt N1
        const promptPath = path.join(__dirname, '../../prompts/N1_SUPPORT_AGENT.md');
        const promptN1 = fs.readFileSync(promptPath, 'utf-8');
        
        // Extrair descrição (primeira action)
        const descricao = ticket.actions && ticket.actions.length > 0 
          ? ticket.actions[0].description 
          : 'Sem descrição disponível';
        
        return {
          content: [
            {
              type: 'text',
              text: `# TICKET ${ticketId} - Análise N1\n\n## 📋 Informações do Ticket\n\n- **ID**: ${ticket.id}\n- **Assunto**: ${ticket.subject}\n- **Status**: ${ticket.status}\n- **Criado em**: ${ticket.createdDate}\n\n## 📝 Descrição\n\n${descricao}\n\n---\n\n## 🤖 Instruções para Análise\n\nAgora você deve:\n\n1. **Ler o prompt N1** abaixo\n2. **Analisar o ticket** seguindo as instruções do prompt\n3. **Gerar DOIS outputs**:\n   - 📋 Orientação completa para o analista N1\n   - 💬 Resposta pronta para copiar e colar para o cliente\n4. **MOSTRAR** o resultado completo ao usuário\n5. **PERGUNTAR**: "Posso criar esta nota no ticket ${ticketId}? (sim/não)"\n6. **AGUARDAR** resposta do usuário\n7. **SE aprovado**: Chamar create_note_approved com o conteúdo\n\n---\n\n${promptN1}\n`,
            },
          ],
        };
      }

      case 'create_note_approved': {
        const ticketId = (args as any).ticket_id;
        const noteContent = (args as any).note_content;
        
        if (!ticketId || !noteContent) {
          throw new Error('ticket_id e note_content são obrigatórios');
        }
        
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('✅ Movidesk MCP v2.0 - Aprovação Humana Obrigatória');
}

main().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
