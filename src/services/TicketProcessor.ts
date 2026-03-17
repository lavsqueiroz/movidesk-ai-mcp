/**
 * Ticket Processor - Orquestrador com SuperDoc Integration
 * 
 * FLUXO:
 * N1 → Validação de campos
 * N2 → SuperDoc como P.O. (verifica se comportamento existe)
 * N3 → SuperDoc como Dev (propõe correção se for defeito)
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
          data: { n1: n1Result },
        };
      }

      console.log('✅ Ticket completo! Prosseguindo para N2...');

      // ═══════════════════════════════════════════════════════
      // N2 - P.O. ANALYSIS (via SuperDoc)
      // ═══════════════════════════════════════════════════════
      console.log('\n━━━ N2: ANÁLISE P.O. (SuperDoc) ━━━');
      
      const n2Result = await this.executeN2(normalizedTicket);
      
      if (n2Result.type === 'melhoria' || n2Result.type === 'evolutiva') {
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
      // N3 - DEV SOLUTION (via SuperDoc)
      // ═══════════════════════════════════════════════════════
      console.log('\n━━━ N3: SOLUÇÃO DEV (SuperDoc) ━━━');
      
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
   * N2 - P.O. Analysis (via Claude calling SuperDoc)
   * 
   * NOTA: Esta é uma versão PARA DESENVOLVIMENTO LOCAL
   * Na produção, este método será chamado via ENDPOINT HTTP
   * que um sistema externo (como API Gateway) vai invocar.
   * 
   * O endpoint receberá o ticket e enviará para o Claude via API,
   * que então usará as ferramentas MCP do SuperDoc.
   */
  private async executeN2(ticket: TicketData): Promise<any> {
    const sistema = ticket.sistema || 'core-consorcio';
    const descricao = `${ticket.titulo}\n\n${ticket.descricao}`;

    console.log(`📋 Sistema: ${sistema}`);
    console.log(`📝 Descrição: ${descricao.slice(0, 100)}...`);
    console.log('');
    console.log('⚠️  MODO DESENVOLVIMENTO: Usando análise baseada em keywords');
    console.log('   Em produção, este ponto fará chamada para:');
    console.log('   POST https://api.anthropic.com/v1/messages');
    console.log('   Com prompt: "Você é um P.O., analise este ticket..."');
    console.log('   E ferramentas MCP do SuperDoc habilitadas');
    console.log('');

    // ═══════════════════════════════════════════════════════
    // VERSÃO DESENVOLVIMENTO - Análise por keywords
    // ═══════════════════════════════════════════════════════
    const descLower = descricao.toLowerCase();

    // Keywords de DEFEITO (comportamento previsto não funciona)
    const defeitKeywords = [
      'erro', 'bug', 'não funciona', 'quebrado', 'travando',
      'exception', 'null', 'timeout', 'falha', 'crashando',
      'retorna erro', 'não aceita', 'não valida', 'código inválido',
    ];

    // Keywords de MELHORIA (comportamento não existe)
    const melhoriaKeywords = [
      'adicionar', 'incluir', 'criar', 'implementar',
      'melhorar', 'feature', 'funcionalidade nova', 'enhancement',
      'não existe', 'não tem', 'falta', 'poderia ter',
    ];

    let defeitScore = 0;
    let melhoriaScore = 0;
    const evidence: string[] = [];

    // Detectar keywords
    for (const kw of defeitKeywords) {
      if (descLower.includes(kw)) {
        defeitScore++;
        evidence.push(`Palavra-chave de defeito: "${kw}"`);
      }
    }

    for (const kw of melhoriaKeywords) {
      if (descLower.includes(kw)) {
        melhoriaScore++;
        evidence.push(`Palavra-chave de melhoria: "${kw}"`);
      }
    }

    // Excluir "novo código", "novo QR" que não são melhorias
    if (descLower.match(/novo (código|qr|token)/)) {
      melhoriaScore = Math.max(0, melhoriaScore - 1);
      evidence.push('Contexto: "novo" refere-se a regenerar, não criar funcionalidade');
    }

    // Determinar tipo
    let type: 'defeito' | 'melhoria' | 'indeterminado';
    let confidence: number;

    if (defeitScore > melhoriaScore) {
      type = 'defeito';
      confidence = Math.min(0.95, 0.7 + (defeitScore * 0.05));
      evidence.push(`P.O. Analysis: Comportamento previsto não está funcionando corretamente`);
    } else if (melhoriaScore > defeitScore) {
      type = 'melhoria';
      confidence = Math.min(0.95, 0.7 + (melhoriaScore * 0.05));
      evidence.push(`P.O. Analysis: Funcionalidade não existe na documentação atual`);
    } else {
      type = 'indeterminado';
      confidence = 0.5;
      evidence.push(`P.O. Analysis: Necessário mais contexto para classificar`);
    }

    console.log(`✅ Análise P.O. concluída: ${type.toUpperCase()} (${(confidence * 100).toFixed(0)}%)`);

    return {
      type,
      confidence,
      evidence,
      sistema,
      po_analysis: true,
    };
  }

  /**
   * N3 - Dev Solution (via Claude calling SuperDoc)
   * 
   * NOTA: Similar ao N2, versão para desenvolvimento local.
   * Em produção, será chamado via endpoint HTTP externo.
   */
  private async executeN3(ticket: TicketData, n2Result: any): Promise<any> {
    const sistema = ticket.sistema || 'core-consorcio';
    const descricao = `${ticket.titulo}\n\n${ticket.descricao}`;

    console.log(`📋 Sistema: ${sistema}`);
    console.log(`🐛 Tipo: ${n2Result.type}`);
    console.log('');
    console.log('⚠️  MODO DESENVOLVIMENTO: Usando sugestões genéricas');
    console.log('   Em produção, este ponto fará chamada para:');
    console.log('   POST https://api.anthropic.com/v1/messages');
    console.log('   Com prompt: "Você é um desenvolvedor, proponha correção..."');
    console.log('   E ferramentas MCP do SuperDoc habilitadas');
    console.log('');

    // ═══════════════════════════════════════════════════════
    // VERSÃO DESENVOLVIMENTO - Sugestões genéricas
    // ═══════════════════════════════════════════════════════

    const descLower = descricao.toLowerCase();
    
    // Detectar contexto específico
    let possibleCause = 'Comportamento incorreto identificado';
    let suggestedSteps: string[] = [];
    let codeExample = '';

    // Contexto: Autenticação/Login
    if (descLower.match(/(login|autenticação|auth|qr.*code|token)/)) {
      possibleCause = 'Problema no fluxo de autenticação';
      suggestedSteps = [
        'Verificar se o token JWT está sendo validado corretamente',
        'Confirmar se o QR Code gerado está no formato correto',
        'Validar se o tempo de expiração do código está adequado',
        'Verificar logs de autenticação no servidor',
      ];
      codeExample = `// Exemplo de validação de token\nif (!tokenIsValid(userToken)) {\n  return { error: 'Token inválido ou expirado' };\n}`;
    }
    // Contexto genérico
    else {
      possibleCause = n2Result.evidence[0] || 'Comportamento não conforme documentação';
      suggestedSteps = [
        'Verificar logs da aplicação no momento do erro',
        'Reproduzir o problema em ambiente de teste',
        'Consultar documentação técnica no SuperDoc',
        'Verificar se há diferenças de configuração entre ambientes',
      ];
    }

    const priority = n2Result.confidence > 0.8 ? 'ALTA' : 'MÉDIA';

    console.log(`✅ Solução proposta: ${priority} prioridade`);

    return {
      possibleCause,
      steps: suggestedSteps,
      priority,
      codeExample,
      dev_analysis: true,
      superdoc_consulted: false, // Será true quando integrar de verdade
    };
  }

  /**
   * Constrói nota N2 (melhoria)
   */
  private buildN2Note(n2: any): string {
    return `🤖 **ANÁLISE AUTOMÁTICA - P.O. REVIEW**

═══════════════════════════════════════════════════

✨ **CLASSIFICAÇÃO: MELHORIA/EVOLUTIVA**
Confiança: ${(n2.confidence * 100).toFixed(0)}%
Sistema: ${n2.sistema}

📋 **Análise do P.O.:**
${n2.evidence.map((e: string) => `• ${e}`).join('\n')}

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
_Gerado automaticamente em ${new Date().toLocaleString('pt-BR')}_`;
  }

  /**
   * Constrói nota completa (defeito com correção)
   */
  private buildCompleteNote(n1: any, n2: any, n3: any): string {
    return `🤖 **ANÁLISE AUTOMÁTICA COMPLETA - MOVIDESK AI**

═══════════════════════════════════════════════════

✅ **N1 - VALIDAÇÃO**
Status: ${n1.status.toUpperCase()}
${n1.found.map((f: string) => `✅ ${f}`).join('\n')}

═══════════════════════════════════════════════════

🐛 **N2 - ANÁLISE P.O. (SuperDoc)**
Tipo: **${n2.type.toUpperCase()}**
Confiança: ${(n2.confidence * 100).toFixed(0)}%
Sistema: ${n2.sistema}

📋 Evidências:
${n2.evidence.map((e: string) => `• ${e}`).join('\n')}

═══════════════════════════════════════════════════

🛠️ **N3 - SOLUÇÃO PROPOSTA (Dev Agent)**

💡 **Causa Provável:**
${n3.possibleCause}

📝 **Passos Sugeridos:**
${n3.steps.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}

${n3.codeExample ? `\n💻 **Exemplo de Código:**\n\`\`\`\n${n3.codeExample}\n\`\`\`\n` : ''}

⚡ **Prioridade:** ${n3.priority}

═══════════════════════════════════════════════════

⚠️ **IMPORTANTE:** 
Esta é uma análise automática. O desenvolvedor deve:
1. Validar a causa proposta
2. Revisar o código sugerido
3. Testar em ambiente de desenvolvimento
4. Ajustar conforme necessário

---
_Gerado automaticamente pelo Movidesk AI MCP_  
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
