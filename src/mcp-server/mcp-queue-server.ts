#!/usr/bin/env node
/**
 * MCP Queue Server - FLUXO COM APROVAÇÃO HUMANA OBRIGATÓRIA
 *
 * REGRAS CRÍTICAS:
 * 1. NUNCA criar notas sem aprovação explícita do usuário
 * 2. SEMPRE mostrar análise completa ANTES de pedir aprovação
 * 3. AGUARDAR confirmação ("sim", "pode", "aprovo") antes de executar create_note_approved
 * 4. A nota criada é SEMPRE interna (nunca pública)
 *
 * ESCOPO N1:
 * - Status: Novo
 * - Status: Em atendimento
 * - Status: Aguardando com justificativas: Retorno do cliente, Retorno do newcon, Priorização
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

const server = new Server(
  { name: 'movidesk-queue', version: '2.1.0' },
  { capabilities: { tools: {} } }
);

// Justificativas do N1 no status Aguardando
const N1_AGUARDANDO_JUSTIFICATIVAS = [
  'Retorno do cliente',
  'Retorno do newcon',
  'Priorização',
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_status_configs',
        description: 'Busca todos os status de tickets configurados no Movidesk, incluindo se exigem justificativa ou não.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'list_n1_tickets',
        description: 'Lista tickets sob responsabilidade do agente N1: status Novo, Em atendimento, e Aguardando com justificativas Retorno do cliente / Retorno do newcon / Priorização.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Número máximo de tickets por status (padrão: 10, máximo: 50)',
              default: 10,
            },
          },
        },
      },
      {
        name: 'analyze_ticket_n1',
        description: 'Analisa UM ticket usando o agente N1. Retorna contexto completo do ticket + prompt N1. Você deve gerar a análise e MOSTRAR ao usuário antes de pedir aprovação para criar a nota.',
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
        description: 'Cria nota INTERNA no ticket. CRÍTICO: Use SOMENTE após aprovação explícita do usuário ("sim", "pode", "aprovo", "ok"). A nota é sempre interna e nunca visível ao cliente.',
        inputSchema: {
          type: 'object',
          properties: {
            ticket_id: {
              type: 'string',
              description: 'ID do ticket',
            },
            note_content: {
              type: 'string',
              description: 'Conteúdo da nota interna (orientação para analista + resposta para copiar e colar para o cliente)',
            },
          },
          required: ['ticket_id', 'note_content'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {

      case 'get_status_configs': {
        const statuses = await movideskClient.getStatusConfigs();
        return {
          content: [{ type: 'text', text: JSON.stringify(statuses, null, 2) }],
        };
      }

      case 'list_n1_tickets': {
        const limit = Math.min((args as any).limit || 10, 50);

        const [novos, emAtendimento, aguardando] = await Promise.all([
          movideskClient.listTickets({ limit, status: 'Novo' }),
          movideskClient.listTickets({ limit, status: 'Em atendimento' }),
          movideskClient.listTicketsByJustificativas({ limit, justificativas: N1_AGUARDANDO_JUSTIFICATIVAS }),
        ]);

        const todos = [
          ...novos.map(t => ({ ...t, _grupo: 'Novo' })),
          ...emAtendimento.map(t => ({ ...t, _grupo: 'Em atendimento' })),
          ...aguardando.map(t => ({ ...t, _grupo: 'Aguardando' })),
        ];

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              total: todos.length,
              resumo: {
                novo: novos.length,
                em_atendimento: emAtendimento.length,
                aguardando_n1: aguardando.length,
              },
              tickets: todos.map(t => ({
                id: t.id,
                subject: t.subject,
                status: t.status,
                justificativa: (t as any).justificativa || null,
                grupo: (t as any)._grupo,
                createdDate: t.createdDate,
              })),
            }, null, 2),
          }],
        };
      }

      case 'analyze_ticket_n1': {
        const ticketId = (args as any).ticket_id;
        if (!ticketId) throw new Error('ticket_id é obrigatório');

        const ticket = await movideskClient.getTicket(ticketId);
        if (!ticket) throw new Error(`Ticket ${ticketId} não encontrado`);

        const promptPath = path.join(__dirname, '../../prompts/N1_SUPPORT_AGENT.md');
        const promptN1 = fs.readFileSync(promptPath, 'utf-8');

        const descricao = ticket.actions && ticket.actions.length > 0
          ? ticket.actions[0].description
          : 'Sem descrição disponível';

        const justificativa = (ticket as any).justificativa || 'N/A';

        return {
          content: [{
            type: 'text',
            text: `# TICKET ${ticketId} - Análise N1\n\n## 📋 Informações do Ticket\n\n- **ID**: ${ticket.id}\n- **Assunto**: ${ticket.subject}\n- **Status**: ${ticket.status}\n- **Justificativa**: ${justificativa}\n- **Criado em**: ${ticket.createdDate}\n\n## 📝 Descrição\n\n${descricao}\n\n---\n\n## 🤖 Instruções para Análise\n\nAgora você deve:\n\n1. **Analisar o ticket** seguindo as instruções do prompt N1 abaixo\n2. **Gerar DOIS outputs**:\n   - 📋 Orientação completa para o analista N1\n   - 💬 Resposta pronta para copiar e colar para o cliente\n3. **MOSTRAR** o resultado completo ao usuário\n4. **PERGUNTAR**: "Posso criar esta nota interna no ticket ${ticketId}? (sim/não)"\n5. **AGUARDAR** resposta do usuário\n6. **SE aprovado**: Chamar create_note_approved com o conteúdo\n\n> ⚠️ A nota é SEMPRE interna — nunca pública. O cliente não verá a nota, apenas o analista.\n\n---\n\n${promptN1}\n`,
          }],
        };
      }

      case 'create_note_approved': {
        const ticketId = (args as any).ticket_id;
        const noteContent = (args as any).note_content;
        if (!ticketId || !noteContent) throw new Error('ticket_id e note_content são obrigatórios');

        const success = await movideskClient.createInternalNote({
          ticketId,
          description: noteContent,
          isInternal: true,
        });

        if (success) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: `✅ Nota interna criada com sucesso no ticket ${ticketId}`,
                ticket_url: `https://newm.movidesk.com/Ticket/Edit/${ticketId}`,
              }, null, 2),
            }],
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
      content: [{
        type: 'text',
        text: JSON.stringify({ status: 'error', message: error.message }, null, 2),
      }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('✅ Movidesk MCP v2.1 - N1 com escopo de status definido');
}

main().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
