/**
 * Movidesk API Client
 */

import axios, { AxiosInstance } from 'axios';

interface MovideskTicket {
  id: string;
  protocol?: string;
  subject?: string;
  category?: string;
  urgency?: string;
  status?: string;
  justificativa?: string;
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

interface ListByJustificativaParams {
  limit?: number;
  justificativas: string[];
}

export class MovideskClient {
  private httpClient: AxiosInstance;
  private token: string;

  constructor() {
    this.token = process.env.MOVIDESK_TOKEN || '';

    if (!this.token) {
      throw new Error('MOVIDESK_TOKEN não configurado no .env');
    }

    this.httpClient = axios.create({
      baseURL: 'https://api.movidesk.com/public/v1',
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Busca configurações de status do Movidesk
   */
  async getStatusConfigs(): Promise<any[]> {
    try {
      console.error('🔍 Buscando configurações de status...');
      const response = await this.httpClient.get('/ticketStatus', {
        params: { token: this.token },
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
   * Lista tickets por status
   */
  async listTickets(params: ListTicketsParams = {}): Promise<MovideskTicket[]> {
    try {
      const { limit = 10, status } = params;
      console.error(`📋 Buscando tickets - status: ${status}...`);

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
      throw error;
    }
  }

  /**
   * Lista tickets Aguardando filtrados por justificativas do N1
   */
  async listTicketsByJustificativas(params: ListByJustificativaParams): Promise<MovideskTicket[]> {
    try {
      const { limit = 10, justificativas } = params;
      console.error(`📋 Buscando tickets Aguardando com justificativas N1...`);

      const response = await this.httpClient.get('/tickets', {
        params: {
          token: this.token,
          $select: 'id,protocol,subject,status,justificativa,createdDate',
          $top: 100,
          $filter: `status eq 'Aguardando'`,
        },
      });

      const todos = Array.isArray(response.data) ? response.data : [response.data];
      const filtrados = todos
        .filter((t: any) => justificativas.includes(t.justificativa || ''))
        .slice(0, limit);

      console.error(`✅ ${filtrados.length} tickets Aguardando N1 encontrados`);
      return filtrados;
    } catch (error: any) {
      console.error('❌ Erro ao listar tickets por justificativa:', error.message);
      throw error;
    }
  }

  /**
   * Busca ticket por ID
   */
  async getTicket(ticketId: string): Promise<MovideskTicket | null> {
    try {
      const response = await this.httpClient.get('/tickets', {
        params: { token: this.token, id: ticketId },
      });
      return response.data;
    } catch (error: any) {
      console.error(`❌ Erro ao buscar ticket ${ticketId}:`, error.message);
      return null;
    }
  }

  /**
   * Cria nota INTERNA no ticket
   */
  async createInternalNote(params: CreateNoteParams): Promise<boolean> {
    try {
      console.error(`📝 Criando nota interna no ticket ${params.ticketId}`);

      const action = {
        id: 0,
        type: 2, // 2 = Nota interna
        description: params.description,
        isInternal: true,
      };

      await this.httpClient.patch(
        `/tickets`,
        { id: params.ticketId, actions: [action] },
        { params: { token: this.token, id: params.ticketId } }
      );

      console.error(`✅ Nota interna criada com sucesso no ticket ${params.ticketId}`);
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

  /**
   * Formata nota N1 para campos faltantes
   */
  formatN1Note(missingFields: string[]): string {
    return `🤖 **ANÁLISE AUTOMÁTICA - N1 (Validação)**\n\n❌ **TICKET INCOMPLETO**\n\nFaltam as seguintes informações obrigatórias:\n${missingFields.map(f => `• ${f}`).join('\n')}\n\n⚠️ **AÇÃO NECESSÁRIA**:\nPor favor, solicite ao solicitante que forneça as informações acima antes de prosseguir com a análise.\n\n---\n_Esta é uma nota automática gerada pelo sistema de análise de tickets._`;
  }
}

let instance: MovideskClient | null = null;

export function getMovideskClient(): MovideskClient {
  if (!instance) {
    instance = new MovideskClient();
  }
  return instance;
}
