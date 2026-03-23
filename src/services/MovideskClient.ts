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

    // URL correta: https://api.movidesk.com/public/v1
    this.httpClient = axios.create({
      baseURL: 'https://api.movidesk.com/public/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Lista tickets do Movidesk
   * IMPORTANTE: $select é OBRIGATÓRIO na API do Movidesk!
   */
  async listTickets(params: ListTicketsParams = {}): Promise<MovideskTicket[]> {
    try {
      const { limit = 10, status } = params;

      console.error(`📋 Buscando ${limit} tickets do Movidesk...`);

      // $select é OBRIGATÓRIO
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
   * IMPORTANTE: Usa PATCH no ticket, não POST em /actions
   */
  async createInternalNote(params: CreateNoteParams): Promise<boolean> {
    try {
      console.error(`📝 Criando nota interna no ticket ${params.ticketId}`);

      // Estrutura da action (nota)
      const action = {
        id: 0, // 0 = criar nova action
        type: 2, // 2 = Nota
        description: params.description,
        isInternal: params.isInternal,
      };

      // PATCH no ticket adicionando a action
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

  /**
   * Formata nota de análise N1 (campos faltando)
   */
  formatN1Note(missingFields: string[]): string {
    return `🤖 **ANÁLISE AUTOMÁTICA - N1 (Validação)**\n\n❌ **TICKET INCOMPLETO**\n\nFaltam as seguintes informações obrigatórias:\n${missingFields.map(f => `• ${f}`).join('\n')}\n\n⚠️ **AÇÃO NECESSÁRIA**:\nPor favor, solicite ao solicitante que forneça as informações acima antes de prosseguir com a análise.\n\n---\n_Esta é uma nota automática gerada pelo sistema de análise de tickets._`;
  }

  /**
   * Formata nota de análise N2 (classificação)
   */
  formatN2Note(classification: {
    type: 'defeito' | 'evolutiva' | 'indeterminado';
    confidence: number;
    evidence: string[];
  }): string {
    const emoji = classification.type === 'defeito' ? '🐛' : '✨';
    const typeLabel = classification.type === 'defeito' ? 'DEFEITO' : 'EVOLUTIVA';
    
    return `🤖 **ANÁLISE AUTOMÁTICA - N2 (Classificação)**\n\n${emoji} **Classificado como: ${typeLabel}**\nConfiança: ${(classification.confidence * 100).toFixed(0)}%\n\n📋 **Evidências:**\n${classification.evidence.map(e => `• ${e}`).join('\n')}\n\n${classification.type === 'evolutiva' ? `\n⚠️ **PRÓXIMO PASSO**:\nComo se trata de uma evolutiva, é necessário:\n1. Validar com Product Owner\n2. Estimar esforço\n3. Criar item no backlog\n` : `\n🔧 **PRÓXIMO PASSO**:\nComo se trata de um defeito, prosseguir para análise N3 (sugestão de correção).\n`}\n\n---\n_Esta é uma nota automática gerada pelo sistema de análise de tickets._`;
  }

  /**
   * Formata nota de análise N3 (sugestão de correção)
   */
  formatN3Note(suggestion: {
    possibleCause: string;
    steps: string[];
    priority: string;
  }): string {
    return `🤖 **ANÁLISE AUTOMÁTICA - N3 (Sugestão de Correção)**\n\n🔍 **Causa Provável:**\n${suggestion.possibleCause}\n\n🛠️ **Passos Sugeridos:**\n${suggestion.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n⚡ **Prioridade Sugerida:** ${suggestion.priority}\n\n⚠️ **IMPORTANTE**:\nEsta é uma sugestão automática. O analista deve validar e adaptar conforme necessário.\n\n---\n_Esta é uma nota automática gerada pelo sistema de análise de tickets._`;
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
