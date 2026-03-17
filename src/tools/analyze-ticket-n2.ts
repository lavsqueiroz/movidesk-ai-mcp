/**
 * N2 - CLASSIFICAÇÃO TÉCNICA
 * Classifica ticket como Defeito ou Evolutiva consultando SuperDoc
 */

import { getSuperDocClient } from '../services/SuperDocClient.js';

export const tool = {
  name: 'movidesk_analyze_n2',
  description: 'Classifica ticket como Defeito ou Evolutiva via consulta ao SuperDoc',
  inputSchema: {
    type: 'object',
    properties: {
      ticket_data: {
        type: 'object',
        description: 'Dados do ticket validado (passou pelo N1)',
        properties: {
          descricao: { type: 'string' },
          titulo: { type: 'string' },
        },
      },
    },
    required: ['ticket_data'],
  },
  handler: async (params: any) => {
    const { ticket_data } = params;

    try {
      console.log('\n═════════════════════════════════════');
      console.log('🔍 N2 - CLASSIFICAÇÃO TÉCNICA');
      console.log('═════════════════════════════════════');

      // Obter cliente SuperDoc
      const superDocClient = getSuperDocClient();

      // Montar descrição completa para análise
      const fullDescription = `
        ${ticket_data.titulo || ''}
        ${ticket_data.descricao || ''}
      `.trim();

      console.log(`📝 Analisando: "${fullDescription.slice(0, 100)}..."`);

      // Classificar tipo (defeito vs evolutiva)
      const classification = await superDocClient.classifyIssueType(fullDescription);

      console.log(`\n✅ Classificação: ${classification.type.toUpperCase()}`);
      console.log(`   Confiança: ${(classification.confidence * 100).toFixed(0)}%`);
      console.log(`   Evidências: ${classification.evidence.length}`);

      // Buscar documentação relacionada
      const relatedDocs = await superDocClient.searchDocumentation({
        query: fullDescription.slice(0, 100),
        max_results: 3,
      });

      console.log(`   Docs encontrados: ${relatedDocs.length}`);
      console.log('═════════════════════════════════════\n');

      return {
        type: classification.type,
        confidence: classification.confidence,
        evidence: classification.evidence,
        related_documentation: relatedDocs.map((d) => d.file_path),
        shouldProceedToN3: classification.type === 'defeito',
        recommendation:
          classification.type === 'defeito'
            ? 'Prosseguir para N3 (sugestão de correção)'
            : 'Encaminhar para Product Owner (evolutiva)',
      };
    } catch (error: any) {
      console.error('❌ Erro no N2:', error.message);
      return {
        error: error.message,
        type: 'indeterminado',
        confidence: 0,
        shouldProceedToN3: false,
      };
    }
  },
};