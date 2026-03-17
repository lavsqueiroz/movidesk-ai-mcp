/**
 * SuperDoc MCP Client
 * 
 * Cliente para integração com SuperDoc via MCP Protocol
 * Permite buscar documentação técnica para análise de tickets
 */

import axios, { AxiosInstance } from 'axios';

interface SuperDocSearchParams {
  query: string;
  repo?: string;
  path?: string;
  max_results?: number;
}

interface SuperDocSearchResult {
  file_path: string;
  line_number: number;
  content: string;
  repo_name: string;
}

export class SuperDocClient {
  private httpClient: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.SUPERDOC_URL || 'http://localhost:9001';
    
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Busca documentação técnica no SuperDoc
   */
  async searchDocumentation(params: SuperDocSearchParams): Promise<SuperDocSearchResult[]> {
    try {
      console.log(`🔍 Buscando no SuperDoc: "${params.query}"`);
      
      // Chamar tool sd_search_content via HTTP
      const response = await this.httpClient.post('/tools/execute', {
        tool: 'sd_search_content',
        params: {
          repo_name: params.repo || 'core-consorcio',
          pattern: params.query,
          path: params.path,
          max_results: params.max_results || 10,
          role: 'admin',
          context_lines: 3,
        },
      });

      if (response.data && response.data.results) {
        console.log(`✅ SuperDoc retornou ${response.data.results.length} resultados`);
        return response.data.results;
      }

      return [];
    } catch (error: any) {
      console.error('❌ Erro ao buscar no SuperDoc:', error.message);
      return [];
    }
  }

  /**
   * Busca por termo específico relacionado a defeito/evolutiva
   */
  async classifyIssueType(description: string): Promise<{
    type: 'defeito' | 'evolutiva' | 'indeterminado';
    confidence: number;
    evidence: string[];
  }> {
    try {
      // Palavras-chave que indicam DEFEITO
      const defeitKeywords = [
        'erro', 'bug', 'não funciona', 'quebrado', 'travando',
        'exception', 'null reference', 'timeout', 'falha',
      ];

      // Palavras-chave que indicam EVOLUTIVA
      const evolutivaKeywords = [
        'novo', 'adicionar', 'incluir', 'criar', 'implementar',
        'melhorar', 'feature', 'funcionalidade nova',
      ];

      const descLower = description.toLowerCase();
      
      let defeitScore = 0;
      let evolutivaScore = 0;
      const evidence: string[] = [];

      // Verificar keywords
      for (const kw of defeitKeywords) {
        if (descLower.includes(kw)) {
          defeitScore++;
          evidence.push(`Palavra-chave de defeito encontrada: "${kw}"`);
        }
      }

      for (const kw of evolutivaKeywords) {
        if (descLower.includes(kw)) {
          evolutivaScore++;
          evidence.push(`Palavra-chave de evolutiva encontrada: "${kw}"`);
        }
      }

      // Buscar no SuperDoc documentação relacionada
      const searchResults = await this.searchDocumentation({
        query: description.slice(0, 100), // Primeiras 100 chars
        max_results: 5,
      });

      if (searchResults.length > 0) {
        evidence.push(`Documentação relacionada encontrada: ${searchResults.length} resultados`);
      }

      // Determinar tipo
      let type: 'defeito' | 'evolutiva' | 'indeterminado';
      let confidence: number;

      if (defeitScore > evolutivaScore) {
        type = 'defeito';
        confidence = Math.min(0.95, 0.6 + (defeitScore * 0.1));
      } else if (evolutivaScore > defeitScore) {
        type = 'evolutiva';
        confidence = Math.min(0.95, 0.6 + (evolutivaScore * 0.1));
      } else {
        type = 'indeterminado';
        confidence = 0.5;
      }

      return { type, confidence, evidence };
    } catch (error: any) {
      console.error('❌ Erro ao classificar tipo:', error.message);
      return {
        type: 'indeterminado',
        confidence: 0,
        evidence: [`Erro: ${error.message}`],
      };
    }
  }

  /**
   * Busca soluções conhecidas para defeitos
   */
  async findSolutions(issueDescription: string): Promise<string[]> {
    try {
      const results = await this.searchDocumentation({
        query: issueDescription,
        max_results: 5,
      });

      return results.map(r => 
        `${r.file_path}:${r.line_number} - ${r.content.slice(0, 200)}`
      );
    } catch (error: any) {
      console.error('❌ Erro ao buscar soluções:', error.message);
      return [];
    }
  }

  /**
   * Health check do SuperDoc
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

// Singleton instance
let instance: SuperDocClient | null = null;

export function getSuperDocClient(): SuperDocClient {
  if (!instance) {
    instance = new SuperDocClient();
  }
  return instance;
}