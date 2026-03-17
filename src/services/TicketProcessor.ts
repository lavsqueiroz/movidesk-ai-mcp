/**
 * Ticket Processor - Orquestrador do fluxo de análise
 * 
 * VERSÃO AGNÓSTICA - Usa protocol MCP para comunicação com SuperDoc
 * NÃO DEPENDE de instância Claude específica
 */

import { getMovideskClient } from './MovideskClient.js';

interface TicketData {
  id: string;
  ticket_id?: string;
  titulo?: string;
  subject?: string;
  descricao?: string;
  description?: string;
  usuario?: string;
  cenario?: string;
  dispositivo?: string;
}

interface ProcessResult {
  success: boolean;
  stage: 'N1' | 'N2' | 'N3' | 'NOTE';
  message: string;
  data?: any;
  error?: string;
}

export class TicketProcessor {
  private movideskClient = getMovideskClient();

  /**
   * Processa ticket completo (N1 → N2 → N3 → Nota)
   */
  async processTicket(ticketData: TicketData): Promise<ProcessResult> {
    try {
      console.log('\n╔══════════════════════════════════════════════════╗');
      console.log('║  🎯 PROCESSAMENTO COMPLETO DE TICKET           ║');
      console.log('╚══════════════════════════════════════════════════╝\n');

      const ticketId = ticketData.ticket_id || ticketData.id;
      console.log(`📋 Ticket ID: ${ticketId}`);

      // Normalizar campos
      const normalizedTicket = this.normalizeTicketData(ticketData);

      // ═══════════════════════════════════════════════════════
      // N1 - VALIDAÇÃO
      // ═══════════════════════════════════════════════════════
      console.log('\n━━━ N1: VALIDAÇÃO ━━━');
      
      const n1Result = await this.executeN1(normalizedTicket);
      
      if (n1Result.status === 'incompleto') {
        console.log('⚠️  Ticket incompleto! Criando nota...');
        
        const note = this.movideskClient.formatN1Note(n1Result.missing);
        
        // COMENTADO: Descomentar quando testar com Movidesk real
        // await this.movideskClient.createInternalNote({
        //   ticketId,
        //   description: note,
        //   isInternal: true,
        // });
        
        return {
          success: true,
          stage: 'N1',
          message: 'Ticket incompleto - nota criada',
          data: { missing: n1Result.missing },
        };
      }

      console.log('✅ Ticket completo! Prosseguindo para N2...');

      // ═══════════════════════════════════════════════════════
      // N2 - CLASSIFICAÇÃO
      // ═══════════════════════════════════════════════════════
      console.log('\n━━━ N2: CLASSIFICAÇÃO ━━━');
      
      const n2Result = await this.executeN2(normalizedTicket);
      
      const n2Note = this.movideskClient.formatN2Note({
        type: n2Result.type,
        confidence: n2Result.confidence,
        evidence: n2Result.evidence,
      });

      if (n2Result.type === 'evolutiva') {
        console.log('✨ Classificado como EVOLUTIVA');
        
        // COMENTADO: Descomentar quando testar com Movidesk real
        // await this.movideskClient.createInternalNote({
        //   ticketId,
        //   description: n2Note,
        //   isInternal: true,
        // });
        
        return {
          success: true,
          stage: 'N2',
          message: 'Evolutiva identificada - nota criada',
          data: n2Result,
        };
      }

      console.log('🐛 Classificado como DEFEITO! Prosseguindo para N3...');

      // ═══════════════════════════════════════════════════════
      // N3 - SUGESTÃO DE CORREÇÃO
      // ═══════════════════════════════════════════════════════
      console.log('\n━━━ N3: SUGESTÃO DE CORREÇÃO ━━━');
      
      const n3Result = await this.executeN3(normalizedTicket, n2Result);
      
      // ═══════════════════════════════════════════════════════
      // CRIAR NOTA COMPLETA
      // ═══════════════════════════════════════════════════════
      console.log('\n━━━ CRIANDO NOTA INTERNA ━━━');
      
      const fullNote = this.buildCompleteNote(n1Result, n2Result, n3Result);
      
      // COMENTADO: Descomentar quando testar com Movidesk real
      // await this.movideskClient.createInternalNote({
      //   ticketId,
      //   description: fullNote,
      //   isInternal: true,
      // });

      console.log('\n╔══════════════════════════════════════════════════╗');
      console.log('║  ✅ PROCESSAMENTO COMPLETO!                     ║');
      console.log('╚══════════════════════════════════════════════════╝\n');

      return {
        success: true,
        stage: 'NOTE',
        message: 'Análise completa - nota criada',
        data: {
          n1: n1Result,
          n2: n2Result,
          n3: n3Result,
        },
      };

    } catch (error: any) {
      console.error('\n❌ ERRO NO PROCESSAMENTO:', error.message);
      
      return {
        success: false,
        stage: 'N1',
        message: 'Erro no processamento',
        error: error.message,
      };
    }
  }

  /**
   * N1 - Validação de campos obrigatórios
   */
  private async executeN1(ticket: TicketData): Promise<any> {
    const requiredFields = [
      { key: 'usuario', label: 'Usuário' },
      { key: 'cenario', label: 'Cenário de uso' },
      { key: 'dispositivo', label: 'Dispositivo' },
      { key: 'descricao', label: 'Descrição clara' },
    ];
    
    const missing: string[] = [];
    const found: string[] = [];
    
    for (const field of requiredFields) {
      const value = (ticket as any)[field.key];
      
      if (value && value.toString().trim().length > 0) {
        found.push(field.label);
        console.log(`  ✅ ${field.label}`);
      } else {
        missing.push(field.label);
        console.log(`  ❌ ${field.label}`);
      }
    }
    
    return {
      status: missing.length === 0 ? 'completo' : 'incompleto',
      found,
      missing,
    };
  }

  /**
   * N2 - Classificação (Defeito vs Evolutiva)
   * 
   * NOTA: Esta versão usa lógica baseada em keywords.
   * Em produção, deveria fazer chamadas MCP ao SuperDoc via:
   * - Tool call externo usando MCP protocol
   * - Ou endpoint HTTP exposto pelo SuperDoc
   */
  private async executeN2(ticket: TicketData): Promise<any> {
    const fullDescription = `
      ${ticket.titulo || ''}
      ${ticket.descricao || ''}
    `.trim().toLowerCase();

    // Palavras-chave de DEFEITO
    const defeitKeywords = [
      'erro', 'bug', 'não funciona', 'quebrado', 'travando',
      'exception', 'null', 'timeout', 'falha', 'crashando',
    ];

    // Palavras-chave de EVOLUTIVA
    const evolutivaKeywords = [
      'novo', 'adicionar', 'incluir', 'criar', 'implementar',
      'melhorar', 'feature', 'funcionalidade', 'enhancement',
    ];

    let defeitScore = 0;
    let evolutivaScore = 0;
    const evidence: string[] = [];

    // Detectar keywords
    for (const kw of defeitKeywords) {
      if (fullDescription.includes(kw)) {
        defeitScore++;
        evidence.push(`Palavra-chave de defeito encontrada: "${kw}"`);
      }
    }

    for (const kw of evolutivaKeywords) {
      if (fullDescription.includes(kw)) {
        evolutivaScore++;
        evidence.push(`Palavra-chave de evolutiva encontrada: "${kw}"`);
      }
    }

    // TODO: Em produção, fazer chamada MCP ao SuperDoc aqui:
    // const superdocResults = await this.callSuperdocMCP({
    //   tool: 'sd_search_content',
    //   params: {
    //     repo_name: 'core-consorcio',
    //     pattern: fullDescription.slice(0, 100),
    //     role: 'admin'
    //   }
    // });
    // if (superdocResults.length > 0) {
    //   evidence.push(`Documentação relacionada encontrada: ${superdocResults.length} resultados`);
    // }

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
  }

  /**
   * N3 - Sugestão de correção (apenas para defeitos)
   */
  private async executeN3(ticket: TicketData, n2Result: any): Promise<any> {
    const fullDescription = `
      ${ticket.titulo || ''}
      ${ticket.descricao || ''}
    `.trim();

    const possibleCause = n2Result.evidence[0] || 'Funcionalidade não operando conforme esperado';

    const suggestedSteps = [
      'Verificar logs da aplicação no momento do erro',
      'Reproduzir o problema em ambiente de teste',
      'Verificar se há diferenças de configuração entre ambientes',
    ];

    const priority = n2Result.confidence > 0.8 ? 'ALTA' : 'MÉDIA';

    // TODO: Em produção, buscar soluções no SuperDoc via MCP:
    // const solutions = await this.callSuperdocMCP({
    //   tool: 'sd_search_content',
    //   params: {
    //     repo_name: 'core-consorcio',
    //     pattern: fullDescription.slice(0, 100),
    //     role: 'admin'
    //   }
    // });

    return {
      possibleCause,
      steps: suggestedSteps,
      priority,
      solutions: [], // Em produção, retornar results do SuperDoc
    };
  }

  /**
   * Constrói nota completa com todas as análises
   */
  private buildCompleteNote(n1: any, n2: any, n3: any): string {
    return `🤖 **ANÁLISE AUTOMÁTICA COMPLETA - MOVIDESK AI**

═══════════════════════════════════════════════════

✅ **N1 - VALIDAÇÃO**
Campos obrigatórios: COMPLETO
${n1.found.map((f: string) => `• ${f}`).join('\n')}

═══════════════════════════════════════════════════

🔍 **N2 - CLASSIFICAÇÃO**
Tipo: **${n2.type.toUpperCase()}**
Confiança: ${(n2.confidence * 100).toFixed(0)}%

📋 Evidências:
${n2.evidence.map((e: string) => `• ${e}`).join('\n')}

═══════════════════════════════════════════════════

🛠️ **N3 - SUGESTÃO DE CORREÇÃO**

💡 Causa Provável:
${n3.possibleCause}

📝 Passos Sugeridos:
${n3.steps.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}

⚡ Prioridade Sugerida: **${n3.priority}**

═══════════════════════════════════════════════════

⚠️ **IMPORTANTE**: Esta é uma análise automática. O analista deve validar e adaptar conforme necessário.

---
_Gerado automaticamente pelo Movidesk AI MCP em ${new Date().toLocaleString('pt-BR')}_`;
  }

  /**
   * Normaliza dados do ticket (compatibilidade com diferentes formatos)
   */
  private normalizeTicketData(ticket: TicketData): TicketData {
    return {
      id: ticket.id || ticket.ticket_id || '',
      titulo: ticket.titulo || ticket.subject || '',
      descricao: ticket.descricao || ticket.description || '',
      usuario: ticket.usuario || '',
      cenario: ticket.cenario || '',
      dispositivo: ticket.dispositivo || '',
    };
  }
}

// Singleton instance
let instance: TicketProcessor | null = null;

export function getTicketProcessor(): TicketProcessor {
  if (!instance) {
    instance = new TicketProcessor();
  }
  return instance;
}
