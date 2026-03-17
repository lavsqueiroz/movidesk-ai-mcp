/**
 * N3 - SUGESTÃO DE CORREÇÃO
 * Sugere correção técnica (apenas para defeitos)
 */

import { getSuperDocClient } from '../services/SuperDocClient.js';

export const tool = {
  name: 'movidesk_analyze_n3',
  description: 'Sugere correção técnica para defeitos identificados',
  inputSchema: {
    type: 'object',
    properties: {
      ticket_data: {
        type: 'object',
        description: 'Dados do ticket',
      },
      n2_result: {
        type: 'object',
        description: 'Resultado da análise N2',
      },
    },
    required: ['ticket_data', 'n2_result'],
  },
  handler: async (params: any) => {
    const { ticket_data, n2_result } = params;

    try {
      console.log('\n═════════════════════════════════════');
      console.log('🛠️  N3 - SUGESTÃO DE CORREÇÃO');
      console.log('═════════════════════════════════════');

      // Verificar se é defeito
      if (n2_result.type !== 'defeito') {
        console.log('⚠️  N3 só se aplica a defeitos. Tipo: ' + n2_result.type);
        return {
          error: 'N3 only applies to defects',
          type: n2_result.type,
        };
      }

      // Obter cliente SuperDoc
      const superDocClient = getSuperDocClient();

      // Montar descrição do problema
      const issueDescription = `
        ${ticket_data.titulo || ''}
        ${ticket_data.descricao || ''}
      `.trim();

      console.log(`🔍 Buscando soluções para: "${issueDescription.slice(0, 100)}..."`);

      // Buscar soluções conhecidas
      const solutions = await superDocClient.findSolutions(issueDescription);

      console.log(`✅ Encontradas ${solutions.length} referências`);

      // Gerar sugestão baseada nas evidências do N2
      const evidence = n2_result.evidence || [];
      const possibleCause = evidence[0] || 'Funcionalidade não operando conforme esperado';

      // Sugestões genéricas de debug
      const suggestedSteps = [
        'Verificar logs da aplicação no momento do erro',
        'Reproduzir o problema em ambiente de teste',
        'Verificar se há diferenças de configuração entre ambientes',
        ...(solutions.length > 0 ? ['Consultar documentação encontrada pelo SuperDoc'] : []),
      ];

      // Determinar prioridade baseada na confiança
      const priority = n2_result.confidence > 0.8 ? 'ALTA' : 'MÉDIA';

      console.log(`⚡ Prioridade: ${priority}`);
      console.log('═════════════════════════════════════\n');

      return {
        possible_cause: possibleCause,
        suggested_steps: suggestedSteps,
        priority,
        complexity: 'MÉDIA',
        related_solutions: solutions,
        superdoc_references: solutions.length,
      };
    } catch (error: any) {
      console.error('❌ Erro no N3:', error.message);
      return {
        error: error.message,
        possible_cause: 'Não foi possível determinar',
        suggested_steps: ['Analisar manualmente'],
      };
    }
  },
};