/**
 * Ticket Processor - Orquestrador com Claude API + SuperDoc
 * 
 * FLUXO COM IA REAL:
 * N1 → Validação de campos (local)
 * N2 → Claude API como P.O. + SuperDoc MCP
 * N3 → Claude API como Dev + SuperDoc MCP
 */

import { getMovideskClient } from './MovideskClient.js';
import { getClaudeClient } from './ClaudeClient.js';

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
  sistema?: string;
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
  private claudeClient = getClaudeClient();

  /**
   * Processa ticket completo (N1 → N2 → N3 → Nota)
   */
  async processTicket(ticketData: TicketData): Promise<ProcessResult> {
    try {
      console.log('\n╔══════════════════════════════════════════════════╗');
      console.log('║  🎯 PROCESSAMENTO COM IA REAL                   ║');
      console.log('╚══════════════════════════════════════════════════╝\n');

      const ticketId = ticketData.ticket_id || ticketData.id;
      console.log(`📋 Ticket ID: ${ticketId}`);

      // Normalizar campos
      const normalizedTicket = this.normalizeTicketData(ticketData);

      // ═══════════════════════════════════════════════════════
      // N1 - VALIDAÇÃO (local, sem IA)
      // ═══════════════════════════════════════════════════════
      console.log('\n━━━ N1: VALIDAÇÃO ━━━');
      
      const n1Result = await this.claudeClient.validateTicket(normalizedTicket);
      
      if (n1Result.status === 'incompleto') {
        console.log('⚠️  Ticket incompleto! Criando nota...');
        
        const note = this.movideskClient.formatN1Note(n1Result.campos_faltantes);
        
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
          data: { n1: n1Result },
        };
      }

      console.log('✅ Ticket completo! Prosseguindo para N2...');

      // ═══════════════════════════════════════════════════════
      // N2 - ANÁLISE P.O. COM IA + SUPERDOC
      // ═══════════════════════════════════════════════════════
      console.log('\n━━━ N2: ANÁLISE P.O. (Claude API + SuperDoc) ━━━');
      
      const n2Result = await this.claudeClient.analyzeAsProductOwner(normalizedTicket);
      
      if (n2Result.classificacao === 'melhoria') {
        console.log('✨ Classificado como MELHORIA/EVOLUTIVA');
        
        const n2Note = this.buildN2Note(n2Result);
        
        // COMENTADO: Descomentar quando testar com Movidesk real
        // await this.movideskClient.createInternalNote({
        //   ticketId,
        //   description: n2Note,
        //   isInternal: true,
        // });
        
        return {
          success: true,
          stage: 'N2',
          message: 'Melhoria identificada - nota criada',
          data: {
            n1: n1Result,
            n2: n2Result,
          },
        };
      }

      console.log('🐛 Classificado como DEFEITO! Prosseguindo para N3...');

      // ═══════════════════════════════════════════════════════
      // N3 - SOLUÇÃO DEV COM IA + SUPERDOC
      // ═══════════════════════════════════════════════════════
      console.log('\n━━━ N3: SOLUÇÃO DEV (Claude API + SuperDoc) ━━━');
      
      const n3Result = await this.claudeClient.analyzeAsDeveloper(normalizedTicket, n2Result);
      
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
      console.log('║  ✅ PROCESSAMENTO COMPLETO COM IA!              ║');
      console.log('╚══════════════════════════════════════════════════╝\n');

      return {
        success: true,
        stage: 'NOTE',
        message: 'Análise completa com IA - nota criada',
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
   * Constrói nota N2 (melhoria)
   */
  private buildN2Note(n2: any): string {
    return `🤖 **ANÁLISE AUTOMÁTICA COM IA - P.O. REVIEW**

═══════════════════════════════════════════════════

✨ **CLASSIFICAÇÃO: MELHORIA/EVOLUTIVA**
Confiança: ${(n2.confianca * 100).toFixed(0)}%
Sistema: ${n2.sistema}

📋 **Análise do P.O. (via Claude + SuperDoc):**
${n2.evidencias.map((e: string) => `• ${e}`).join('\n')}

${n2.analise_completa ? `\n📝 **Análise Detalhada:**\n${n2.analise_completa}\n` : ''}

═══════════════════════════════════════════════════

📝 **PRÓXIMOS PASSOS:**
1. Validar com Product Owner
2. Estimar esforço de desenvolvimento
3. Priorizar no backlog
4. Criar especificação técnica

═══════════════════════════════════════════════════

⚠️ Esta funcionalidade não existe na documentação atual.
Requer análise de viabilidade e impacto antes de implementar.

---
_Gerado automaticamente via Claude API + SuperDoc MCP_  
_Data: ${new Date().toLocaleString('pt-BR')}_`;
  }

  /**
   * Constrói nota completa (defeito com correção)
   */
  private buildCompleteNote(n1: any, n2: any, n3: any): string {
    const causaRaiz = n3.causa_raiz || {};
    const solucao = n3.solucao_proposta || {};
    const codigo = n3.codigo_correcao || {};

    return `🤖 **ANÁLISE AUTOMÁTICA COMPLETA COM IA - MOVIDESK AI**

═══════════════════════════════════════════════════

✅ **N1 - VALIDAÇÃO**
Status: ${n1.status.toUpperCase()}
${n1.campos_encontrados.map((f: string) => `✅ ${f}`).join('\n')}

═══════════════════════════════════════════════════

🐛 **N2 - ANÁLISE P.O. (Claude API + SuperDoc)**
Tipo: **${n2.classificacao.toUpperCase()}**
Confiança: ${(n2.confianca * 100).toFixed(0)}%
Sistema: ${n2.sistema}

📋 Evidências:
${n2.evidencias.map((e: string) => `• ${e}`).join('\n')}

═══════════════════════════════════════════════════

🛠️ **N3 - SOLUÇÃO PROPOSTA (Claude API + SuperDoc)**

💡 **Causa Raiz:**
${causaRaiz.arquivo ? `📁 Arquivo: ${causaRaiz.arquivo}` : ''}
${causaRaiz.metodo ? `⚙️  Método: ${causaRaiz.metodo}` : ''}
${causaRaiz.linha_aproximada ? `📍 Linha: ~${causaRaiz.linha_aproximada}` : ''}
${causaRaiz.problema || n3.causa_raiz?.problema || 'Comportamento incorreto identificado'}

${solucao.descricao ? `\n💊 **Solução:**\n${solucao.descricao}\n` : ''}

${codigo.antes || codigo.depois ? `\n💻 **Código:**\n\`\`\`\n${codigo.antes ? `// ANTES:\n${codigo.antes}\n\n` : ''}${codigo.depois ? `// DEPOIS:\n${codigo.depois}` : ''}\n\`\`\`\n` : ''}

${n3.passos_implementacao && n3.passos_implementacao.length > 0 ? `\n📝 **Passos de Implementação:**\n${n3.passos_implementacao.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}\n` : ''}

⚡ **Prioridade:** ${n3.prioridade}
🔧 **Complexidade:** ${n3.complexidade}

${n3.solucao_completa ? `\n📋 **Análise Completa:**\n${n3.solucao_completa}\n` : ''}

═══════════════════════════════════════════════════

⚠️ **IMPORTANTE:** 
Esta análise foi gerada por IA consultando o código real no SuperDoc.
O desenvolvedor deve:
1. Validar a causa proposta
2. Revisar o código sugerido
3. Testar em ambiente de desenvolvimento
4. Ajustar conforme necessário

---
_Gerado automaticamente via Claude API + SuperDoc MCP_  
_Data: ${new Date().toLocaleString('pt-BR')}_`;
  }

  /**
   * Normaliza dados do ticket
   */
  private normalizeTicketData(ticket: TicketData): TicketData {
    return {
      id: ticket.id || ticket.ticket_id || '',
      titulo: ticket.titulo || ticket.subject || '',
      descricao: ticket.descricao || ticket.description || '',
      usuario: ticket.usuario || '',
      cenario: ticket.cenario || '',
      dispositivo: ticket.dispositivo || '',
      sistema: ticket.sistema || 'core-consorcio',
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
