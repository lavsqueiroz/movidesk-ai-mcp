/**
 * Movidesk API Client
 * 
 * Cliente para integração com API do Movidesk
 * Permite criar notas internas e listar tickets
 */

import axios, { AxiosInstance } from 'axios';

interface MovideskTicket {
  id: string;
  protocol?: string;
  subject?: string;
  category?: string;
  urgency?: string;
  status?: string;
  createdDate?: string;
  owner?: any;
  clients?: any[];
  actions?: any[];
}

interface CreateNoteParams {
  ticketId: string;
  description: string;
  isInternal: boolean;
}

interface ListTicketsParams {
  limit?: number;
  status?: string;
}

export class MovideskClient {
  private httpClient: AxiosInstance;
  private token: string;
  private baseUrl: string;

  constructor() {
    this.token = process.env.MOVIDESK_TOKEN || '';
    this.baseUrl = process.env.MOVIDESK_URL || 'https://newm.movidesk.com';

    if (!this.token) {
      throw new Error('MOVIDESK_TOKEN não configurado no .env');
    }

    this.httpClient = axios.create({
      baseURL: 'https://api.movidesk.com/public/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Busca configurações de status do Movidesk
   */
  async getStatusConfigs(): Promise<any[]> {
    try {
      console.error('🔍 Buscando configurações de status...');

      const response = await this.httpClient.get('/ticketStatus', {
        params: {
          token: this.token,
        },
      });

      const statuses = Array.isArray(response.data) ? response.data : [response.data];
      console.error(`✅ ${statuses.length} status retornados`);
      return statuses;
    } catch (error: any) {
      console.error('❌ Erro ao buscar status:', error.message);
      if (error.response) {
        console.error('   Status HTTP:', error.response.status);
        console.error('   Data:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Lista tickets do Movidesk
   * IMPORTANTE: $select é OBRIGATÓRIO na API do Movidesk!
   */
  async listTickets(params: ListTicketsParams = {}): Promise<MovideskTicket[]> {
    try {
      const { limit = 10, status } = params;

      console.error(`📋 Buscando ${limit} tickets do Movidesk...`);

      const response = await this.httpClient.get('/tickets', {
        params: {
          token: this.token,
          $select: 'id,protocol,subject,status,createdDate',
          $top: limit,
          ...(status && { $filter: `status eq '${status}'` }),
        },
      });

      const tickets = Array.isArray(response.data) ? response.data : [response.data];
      console.error(`✅ ${tickets.length} tickets retornados`);

      return tickets;
    } catch (error: any) {
      console.error('❌ Erro ao listar tickets:', error.message);
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Data:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Busca ticket por ID
   */
  async getTicket(ticketId: string): Promise<MovideskTicket | null> {
    try {
      const response = await this.httpClient.get('/tickets', {
        params: {
          token: this.token,
          id: ticketId,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error(`❌ Erro ao buscar ticket ${ticketId}:`, error.message);
      return null;
    }
  }

  /**
   * Cria nota interna no ticket
   */
  async createInternalNote(params: CreateNoteParams): Promise<boolean> {
    try {
      console.error(`📝 Criando nota interna no ticket ${params.ticketId}`);

      const action = {
        id: 0,
        type: 2,
        description: params.description,
        isInternal: params.isInternal,
      };

      await this.httpClient.patch(
        `/tickets`,
        {
          id: params.ticketId,
          actions: [action],
        },
        {
          params: { token: this.token, id: params.ticketId },
        }
      );

      console.error(`✅ Nota criada com sucesso no ticket ${params.ticketId}`);
      return true;
    } catch (error: any) {
      console.error('❌ Erro ao criar nota:', error.message);
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Data:', JSON.stringify(error.response.data));
      }
      return false;
    }
  }

  formatN1Note(missingFields: string[]): string {
    return `🤖 **ANÁLISE AUTOMÁTICA - N1 (Validação)**\n\n❌ **TICKET INCOMPLETO**\n\nFaltam as seguintes informações obrigatórias:\n${missingFields.map(f => `• ${f}`).join('\n')}\n\n⚠️ **AÇÃO NECESSÁRIA**:\nPor favor, solicite ao solicitante que forneça as informações acima antes de prosseguir com a análise.\n\n---\n_Esta é uma nota automática gerada pelo sistema de análise de tickets._`;
  }

  formatN2Note(classification: {
    type: 'defeito' | 'evolutiva' | 'indeterminado';
    confidence: number;
    evidence: string[];
  }): string {
    const emoji = classification.type === 'defeito' ? '🐛' : '✨';
    const typeLabel = classification.type === 'defeito' ? 'DEFEITO' : 'EVOLUTIVA';
    return `🤖 **ANÁLISE AUTOMÁTICA - N2 (Classificação)**\n\n${emoji} **Classificado como: ${typeLabel}**\nConfiança: ${(classification.confidence * 100).toFixed(0)}%\n\n📋 **Evidências:**\n${classification.evidence.map(e => `• ${e}`).join('\n')}\n\n---\n_Esta é uma nota automática gerada pelo sistema de análise de tickets._`;
  }

  formatN3Note(suggestion: {
    possibleCause: string;
    steps: string[];
    priority: string;
  }): string {
    return `🤖 **ANÁLISE AUTOMÁTICA - N3 (Sugestão de Correção)**\n\n🔍 **Causa Provável:**\n${suggestion.possibleCause}\n\n🛠️ **Passos Sugeridos:**\n${suggestion.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n⚡ **Prioridade Sugerida:** ${suggestion.priority}\n\n---\n_Esta é uma nota automática gerada pelo sistema de análise de tickets._`;
  }
}

// Singleton instance
let instance: MovideskClient | null = null;

export function getMovideskClient(): MovideskClient {
  if (!instance) {
    instance = new MovideskClient();
  }
  return instance;
}
