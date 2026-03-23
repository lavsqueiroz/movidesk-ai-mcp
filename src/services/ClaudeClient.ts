/**
 * Claude API Client - Integração com Anthropic API
 * 
 * Responsável por fazer chamadas à API do Claude para análises inteligentes
 * usando os prompts de agente (N1, N2, N3)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text?: string;
    [key: string]: any;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class ClaudeClient {
  private apiKey: string;
  private apiUrl = 'https://api.anthropic.com/v1/messages';
  private model = 'claude-sonnet-4-20250514';
  private superdocUrl: string;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || '';
    this.superdocUrl = process.env.SUPERDOC_URL || 'http://21.0.0.122:9001';

    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY não configurada no .env');
    }
  }

  /**
   * Carrega prompt de agente do arquivo
   */
  private loadPrompt(agentName: string): string {
    const promptPath = path.join(__dirname, '../../prompts', `${agentName}.md`);
    
    if (!fs.existsSync(promptPath)) {
      throw new Error(`Prompt não encontrado: ${promptPath}`);
    }

    return fs.readFileSync(promptPath, 'utf-8');
  }

  /**
   * N1 - Validação (não precisa Claude API, é lógica simples)
   * Mantido aqui por completude, mas pode ser executado localmente
   */
  async validateTicket(ticket: any): Promise<any> {
    // N1 não precisa de IA - é validação de campos
    // Retorna direto da lógica local
    const requiredFields = [
      { key: 'usuario', label: 'Usuário' },
      { key: 'cenario', label: 'Cenário de uso' },
      { key: 'dispositivo', label: 'Dispositivo' },
      { key: 'descricao', label: 'Descrição clara' },
    ];
    
    const missing: string[] = [];
    const found: string[] = [];
    
    for (const field of requiredFields) {
      const value = ticket[field.key];
      
      if (value && value.toString().trim().length > 0) {
        found.push(field.label);
      } else {
        missing.push(field.label);
      }
    }
    
    return {
      status: missing.length === 0 ? 'completo' : 'incompleto',
      campos_encontrados: found,
      campos_faltantes: missing,
      proxima_acao: missing.length === 0 ? 'prosseguir_para_n2' : 'solicitar_informacoes',
    };
  }

  /**
   * N2 - Análise P.O. com SuperDoc
   */
  async analyzeAsProductOwner(ticket: any): Promise<any> {
    console.log('\n🤖 Chamando Claude API como P.O...');

    const sistema = ticket.sistema || 'core-consorcio';
    const ticketText = `
TICKET:
Título: ${ticket.titulo}
Descrição: ${ticket.descricao}
Sistema: ${sistema}
Usuário: ${ticket.usuario}
Cenário: ${ticket.cenario}
Dispositivo: ${ticket.dispositivo}
    `.trim();

    // Carregar prompt do P.O.
    const systemPrompt = this.loadPrompt('N2_PO_AGENT');

    const messages: ClaudeMessage[] = [
      {
        role: 'user',
        content: `${systemPrompt}\n\n${ticketText}\n\nAnalise este ticket e classifique como DEFEITO ou MELHORIA consultando o SuperDoc.`,
      },
    ];

    try {
      const response = await this.callClaudeAPI(messages, {
        mcp_servers: [
          {
            type: 'url',
            url: `${this.superdocUrl}/sse`,
            name: 'superdoc-mcp',
          },
        ],
      });

      // Extrair resposta
      const analysisText = this.extractTextFromResponse(response);
      
      console.log('✅ Análise P.O. recebida!');
      console.log('📝 Resposta:', analysisText.slice(0, 200) + '...');

      // Tentar parsear JSON da resposta
      const parsed = this.parseAnalysisResponse(analysisText);

      return {
        classificacao: parsed.classificacao || 'indeterminado',
        confianca: parsed.confianca || 0.5,
        sistema,
        evidencias: parsed.evidencias || [analysisText.slice(0, 200)],
        analise_completa: analysisText,
        comportamento_previsto: parsed.classificacao === 'defeito',
        proxima_acao: parsed.classificacao === 'defeito' ? 'prosseguir_para_n3' : 'encaminhar_para_backlog',
      };
    } catch (error: any) {
      console.error('❌ Erro ao chamar Claude API:', error.message);
      throw error;
    }
  }

  /**
   * N3 - Solução Dev com SuperDoc
   */
  async analyzeAsDeveloper(ticket: any, n2Result: any): Promise<any> {
    console.log('\n🤖 Chamando Claude API como Dev...');

    const sistema = ticket.sistema || 'core-consorcio';
    const ticketText = `
TICKET:
Título: ${ticket.titulo}
Descrição: ${ticket.descricao}
Sistema: ${sistema}

RESULTADO N2:
Classificação: ${n2Result.classificacao}
Confiança: ${(n2Result.confianca * 100).toFixed(0)}%
Evidências: ${n2Result.evidencias.join('; ')}
    `.trim();

    // Carregar prompt do Dev
    const systemPrompt = this.loadPrompt('N3_DEV_AGENT');

    const messages: ClaudeMessage[] = [
      {
        role: 'user',
        content: `${systemPrompt}\n\n${ticketText}\n\nProponha uma correção técnica consultando o código real no SuperDoc.`,
      },
    ];

    try {
      const response = await this.callClaudeAPI(messages, {
        mcp_servers: [
          {
            type: 'url',
            url: `${this.superdocUrl}/sse`,
            name: 'superdoc-mcp',
          },
        ],
      });

      // Extrair resposta
      const solutionText = this.extractTextFromResponse(response);
      
      console.log('✅ Solução Dev recebida!');
      console.log('📝 Resposta:', solutionText.slice(0, 200) + '...');

      // Tentar parsear JSON da resposta
      const parsed = this.parseSolutionResponse(solutionText);

      return {
        causa_raiz: parsed.causa_raiz || {
          problema: 'Comportamento incorreto identificado',
        },
        solucao_proposta: parsed.solucao_proposta || {
          descricao: 'Análise técnica em andamento',
        },
        codigo_correcao: parsed.codigo_correcao || {},
        passos_implementacao: parsed.passos_implementacao || [],
        prioridade: parsed.prioridade || 'MÉDIA',
        complexidade: parsed.complexidade || 'MÉDIA',
        solucao_completa: solutionText,
      };
    } catch (error: any) {
      console.error('❌ Erro ao chamar Claude API:', error.message);
      throw error;
    }
  }

  /**
   * Chamada genérica à API do Claude
   */
  private async callClaudeAPI(
    messages: ClaudeMessage[],
    options: any = {}
  ): Promise<ClaudeResponse> {
    const payload = {
      model: this.model,
      max_tokens: 4096,
      messages,
      ...options,
    };

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Extrai texto da resposta do Claude
   */
  private extractTextFromResponse(response: ClaudeResponse): string {
    const textBlocks = response.content.filter((block) => block.type === 'text');
    return textBlocks.map((block) => block.text).join('\n');
  }

  /**
   * Tenta parsear resposta de análise (N2)
   */
  private parseAnalysisResponse(text: string): any {
    try {
      // Tentar encontrar JSON no texto
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Se não encontrar JSON, extrair informações do texto
      const isDefeito = text.toLowerCase().includes('defeito');
      const isMelhoria = text.toLowerCase().includes('melhoria');

      return {
        classificacao: isDefeito ? 'defeito' : isMelhoria ? 'melhoria' : 'indeterminado',
        confianca: 0.7,
        evidencias: [text.slice(0, 200)],
      };
    } catch (error) {
      console.warn('⚠️  Não foi possível parsear resposta como JSON');
      return {
        classificacao: 'indeterminado',
        confianca: 0.5,
        evidencias: [text.slice(0, 200)],
      };
    }
  }

  /**
   * Tenta parsear resposta de solução (N3)
   */
  private parseSolutionResponse(text: string): any {
    try {
      // Tentar encontrar JSON no texto
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {};
    } catch (error) {
      console.warn('⚠️  Não foi possível parsear resposta como JSON');
      return {};
    }
  }
}

// Singleton instance
let instance: ClaudeClient | null = null;

export function getClaudeClient(): ClaudeClient {
  if (!instance) {
    instance = new ClaudeClient();
  }
  return instance;
}
