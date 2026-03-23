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
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Lista tickets do Movidesk
   */
  async listTickets(params: ListTicketsParams = {}): Promise<MovideskTicket[]> {
    try {
      const { limit = 10, status } = params;

      console.log(`📋 Buscando ${limit} tickets do Movidesk...`);

      const response = await this.httpClient.get('/api/v1/tickets', {
        params: {
          token: this.token,
          $top: limit,
          $select: 'id,protocol,subject,status,createdDate',
          ...(status && { $filter: `status eq '${status}'` }),
        },
      });

      const tickets = Array.isArray(response.data) ? response.data : [response.data];
      console.log(`✅ ${tickets.length} tickets retornados`);

      return tickets;
    } catch (error: any) {
      console.error('❌ Erro ao listar tickets:', error.message);
      throw error;
    }
  }

  /**
   * Busca ticket por ID
   */
  async getTicket(ticketId: string): Promise<MovideskTicket | null> {
    try {
      const response = await this.httpClient.get(`/api/v1/tickets`, {
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
      console.log(`📝 Criando nota interna no ticket ${params.ticketId}`);

      const noteData = {
        type: 1, // Tipo: Nota
        description: params.description,
        isInternal: params.isInternal,
        createdBy: {
          id: 'AI_ASSISTANT',
          businessName: 'Assistente AI',
        },
      };

      await this.httpClient.post(
        `/api/v1/tickets/${params.ticketId}/actions`,
        noteData,
        {
          params: { token: this.token },
        }
      );

      console.log(`✅ Nota criada com sucesso no ticket ${params.ticketId}`);
      return true;
    } catch (error: any) {
      console.error('❌ Erro ao criar nota:', error.message);
      return false;
    }
  }

  /**
   * Formata nota de análise N1 (campos faltando)
   */
  formatN1Note(missingFields: string[]): string {
    return `🤖 **ANÁLISE AUTOMÁTICA - N1 (Validação)**

❌ **TICKET INCOMPLETO**

Faltam as seguintes informações obrigatórias:
${missingFields.map(f => `• ${f}`).join('\n')}

⚠️ **AÇÃO NECESSÁRIA**:
Por favor, solicite ao solicitante que forneça as informações acima antes de prosseguir com a análise.

---
_Esta é uma nota automática gerada pelo sistema de análise de tickets._`;
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
    
    return `🤖 **ANÁLISE AUTOMÁTICA - N2 (Classificação)**

${emoji} **Classificado como: ${typeLabel}**
Confiança: ${(classification.confidence * 100).toFixed(0)}%

📋 **Evidências:**
${classification.evidence.map(e => `• ${e}`).join('\n')}

${classification.type === 'evolutiva' ? `
⚠️ **PRÓXIMO PASSO**:
Como se trata de uma evolutiva, é necessário:
1. Validar com Product Owner
2. Estimar esforço
3. Criar item no backlog
` : `
🔧 **PRÓXIMO PASSO**:
Como se trata de um defeito, prosseguir para análise N3 (sugestão de correção).
`}

---
_Esta é uma nota automática gerada pelo sistema de análise de tickets._`;
  }

  /**
   * Formata nota de análise N3 (sugestão de correção)
   */
  formatN3Note(suggestion: {
    possibleCause: string;
    steps: string[];
    priority: string;
  }): string {
    return `🤖 **ANÁLISE AUTOMÁTICA - N3 (Sugestão de Correção)**

🔍 **Causa Provável:**
${suggestion.possibleCause}

🛠️ **Passos Sugeridos:**
${suggestion.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

⚡ **Prioridade Sugerida:** ${suggestion.priority}

⚠️ **IMPORTANTE**:
Esta é uma sugestão automática. O analista deve validar e adaptar conforme necessário.

---
_Esta é uma nota automática gerada pelo sistema de análise de tickets._`;
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
