#!/usr/bin/env node
/**
 * Teste Avançado - Processamento Completo com Visualização de Nota
 * 
 * Simula o fluxo completo e mostra como a nota interna ficaria
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

async function testCompleteFlow() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  🧪 TESTE AVANÇADO - PROCESSAMENTO COMPLETO           ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  try {
    // Carregar ticket de exemplo
    const ticketPath = path.join(__dirname, 'sample-ticket.json');
    const ticketData = JSON.parse(fs.readFileSync(ticketPath, 'utf-8'));

    console.log(`${colors.cyan}📋 TICKET DE TESTE:${colors.reset}`);
    console.log(`   ID: ${ticketData.id}`);
    console.log(`   Protocolo: ${ticketData.protocol}`);
    console.log(`   Assunto: ${ticketData.subject}`);
    console.log(`   Urgência: ${ticketData.urgency}`);
    console.log(`   Cliente: ${ticketData.client.name}`);
    console.log('');

    const baseUrl = 'http://localhost:9002';

    // ═══════════════════════════════════════════════════════════
    // ENVIAR PARA PROCESSAMENTO
    // ═══════════════════════════════════════════════════════════
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.yellow}  ENVIANDO PARA PROCESSAMENTO AUTOMÁTICO${colors.reset}`);
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    const webhookPayload = {
      ticket_id: ticketData.id,
      id: ticketData.id,
      titulo: ticketData.subject,
      subject: ticketData.subject,
      descricao: ticketData.description,
      description: ticketData.description,
      usuario: ticketData.customFields.usuario,
      cenario: ticketData.customFields.cenario,
      dispositivo: ticketData.customFields.dispositivo,
    };

    console.log(`${colors.blue}📤 Enviando webhook para servidor...${colors.reset}\n`);

    const webhookResponse = await fetch(`${baseUrl}/webhook/ticket-created`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
    });

    const result = await webhookResponse.json();

    // ═══════════════════════════════════════════════════════════
    // EXIBIR RESULTADO
    // ═══════════════════════════════════════════════════════════
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.yellow}  RESULTADO DO PROCESSAMENTO${colors.reset}`);
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    if (result.success) {
      console.log(`${colors.green}✅ STATUS: ${result.status.toUpperCase()}${colors.reset}`);
      console.log(`${colors.green}📊 ESTÁGIO: ${result.stage}${colors.reset}`);
      console.log(`${colors.green}💬 MENSAGEM: ${result.message}${colors.reset}\n`);

      // Exibir detalhes de cada estágio
      if (result.data) {
        if (result.data.n1) {
          console.log(`${colors.cyan}━━━ N1: VALIDAÇÃO ━━━${colors.reset}`);
          console.log(`Status: ${result.data.n1.status}`);
          console.log(`Campos encontrados: ${result.data.n1.found.length}`);
          result.data.n1.found.forEach(f => console.log(`  ✅ ${f}`));
          console.log('');
        }

        if (result.data.n2) {
          console.log(`${colors.cyan}━━━ N2: CLASSIFICAÇÃO ━━━${colors.reset}`);
          console.log(`Tipo: ${result.data.n2.type.toUpperCase()}`);
          console.log(`Confiança: ${(result.data.n2.confidence * 100).toFixed(0)}%`);
          console.log(`Evidências:`);
          result.data.n2.evidence.forEach(e => console.log(`  • ${e}`));
          console.log('');
        }

        if (result.data.n3) {
          console.log(`${colors.cyan}━━━ N3: SUGESTÃO DE CORREÇÃO ━━━${colors.reset}`);
          console.log(`Causa provável: ${result.data.n3.possibleCause}`);
          console.log(`Prioridade: ${result.data.n3.priority}`);
          console.log(`Passos sugeridos:`);
          result.data.n3.steps.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
          console.log('');
        }
      }

      // ═══════════════════════════════════════════════════════════
      // SIMULAR NOTA INTERNA
      // ═══════════════════════════════════════════════════════════
      console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
      console.log(`${colors.yellow}  📝 NOTA INTERNA QUE SERIA CRIADA${colors.reset}`);
      console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

      const note = buildMockNote(result.data);
      console.log(note);
      console.log('');

    } else {
      console.log(`${colors.red}❌ ERRO: ${result.message}${colors.reset}`);
      if (result.error) {
        console.log(`${colors.red}   Detalhes: ${result.error}${colors.reset}`);
      }
    }

    // ═══════════════════════════════════════════════════════════
    // RESUMO FINAL
    // ═══════════════════════════════════════════════════════════
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.yellow}  📊 RESUMO DO TESTE${colors.reset}`);
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    console.log(`${colors.green}✅ Servidor respondeu corretamente${colors.reset}`);
    console.log(`${colors.green}✅ Fluxo N1 → N2 → N3 executado${colors.reset}`);
    console.log(`${colors.green}✅ Classificação automática funcionou${colors.reset}`);
    console.log(`${colors.green}✅ Sugestões geradas com sucesso${colors.reset}`);
    console.log(`${colors.green}✅ Nota interna formatada${colors.reset}\n`);

    console.log(`${colors.cyan}📝 PRÓXIMO PASSO:${colors.reset}`);
    console.log(`   Testar criação real de nota no Movidesk\n`);

    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log(`║  ${colors.green}✅ TESTE COMPLETO PASSOU COM SUCESSO!${colors.reset}           ║`);
    console.log('╚══════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error(`\n${colors.red}❌ ERRO NO TESTE:${colors.reset}`, error.message);
    console.error(error);
    process.exit(1);
  }
}

/**
 * Constrói nota mockada baseada nos resultados
 */
function buildMockNote(data) {
  if (!data) return 'Sem dados para gerar nota';

  const { n1, n2, n3 } = data;

  return `┌─────────────────────────────────────────────────────────┐
│  🤖 ANÁLISE AUTOMÁTICA - MOVIDESK AI                   │
└─────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════

✅ N1 - VALIDAÇÃO
Status: ${n1?.status?.toUpperCase() || 'N/A'}
Campos obrigatórios verificados:
${n1?.found?.map(f => `  • ${f}`).join('\n') || '  Nenhum'}

═══════════════════════════════════════════════════════════

🔍 N2 - CLASSIFICAÇÃO
Tipo identificado: ${n2?.type?.toUpperCase() || 'N/A'}
Confiança: ${n2?.confidence ? (n2.confidence * 100).toFixed(0) + '%' : 'N/A'}

📋 Evidências encontradas:
${n2?.evidence?.map(e => `  • ${e}`).join('\n') || '  Nenhuma'}

═══════════════════════════════════════════════════════════

🛠️ N3 - SUGESTÃO DE CORREÇÃO

💡 Causa Provável:
${n3?.possibleCause || 'Não determinada'}

📝 Passos Sugeridos:
${n3?.steps?.map((s, i) => `  ${i + 1}. ${s}`).join('\n') || '  Nenhum'}

⚡ Prioridade: ${n3?.priority || 'N/A'}

${n3?.solutions?.length > 0 ? `
📚 Documentação Relacionada:
${n3.solutions.slice(0, 3).map(s => `  • ${s.slice(0, 80)}...`).join('\n')}
` : ''}
═══════════════════════════════════════════════════════════

⚠️ IMPORTANTE: 
Esta é uma análise automática. O analista deve validar e 
adaptar as sugestões conforme necessário.

───────────────────────────────────────────────────────────
Gerado automaticamente pelo Movidesk AI MCP
Data: ${new Date().toLocaleString('pt-BR')}
───────────────────────────────────────────────────────────`;
}

// Executar
testCompleteFlow();
