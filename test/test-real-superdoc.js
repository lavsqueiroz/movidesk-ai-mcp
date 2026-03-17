#!/usr/bin/env node
/**
 * Teste REAL com dados do SuperDoc
 * Testa se o sistema está buscando corretamente no core-consorcio
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

async function testRealCase() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  🔬 TESTE REAL - BUSCA NO SUPERDOC                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Carregar ticket REAL sobre autenticação
    const ticketPath = path.join(__dirname, 'sample-ticket-auth.json');
    const ticketData = JSON.parse(fs.readFileSync(ticketPath, 'utf-8'));

    console.log(`${c.cyan}📋 TICKET REAL:${c.reset}`);
    console.log(`   ID: ${ticketData.id}`);
    console.log(`   Assunto: ${ticketData.subject}`);
    console.log(`   Problema: ${ticketData.description.slice(0, 100)}...`);
    console.log(`   Sistema: ${ticketData.customFields.versao_sistema}\n`);

    const baseUrl = 'http://localhost:9002';

    // ═══════════════════════════════════════════════════════════
    // PROCESSAR TICKET
    // ═══════════════════════════════════════════════════════════
    console.log(`${c.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
    console.log(`${c.yellow}  PROCESSANDO TICKET COM SUPERDOC${c.reset}`);
    console.log(`${c.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}\n`);

    const payload = {
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

    console.log(`${c.blue}📤 Enviando para análise...${c.reset}\n`);

    const response = await fetch(`${baseUrl}/webhook/ticket-created`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    // ═══════════════════════════════════════════════════════════
    // ANÁLISE DOS RESULTADOS
    // ═══════════════════════════════════════════════════════════
    console.log(`${c.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
    console.log(`${c.yellow}  📊 RESULTADOS DA ANÁLISE${c.reset}`);
    console.log(`${c.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}\n`);

    if (result.data && result.data.n2) {
      const n2 = result.data.n2;
      
      console.log(`${c.cyan}🔍 N2 - CLASSIFICAÇÃO:${c.reset}`);
      console.log(`   Tipo: ${n2.type.toUpperCase()}`);
      console.log(`   Confiança: ${(n2.confidence * 100).toFixed(0)}%\n`);
      
      console.log(`${c.cyan}📋 Evidências encontradas:${c.reset}`);
      n2.evidence.forEach((e, i) => {
        console.log(`   ${i + 1}. ${e}`);
      });
      
      console.log('');
      
      // VERIFICAR SE BUSCOU NO SUPERDOC
      if (n2.evidence && n2.evidence.length > 0) {
        const hasSuperdocEvidence = n2.evidence.some(e => 
          e.includes('Documentação') || 
          e.includes('encontrada') ||
          e.includes('resultados')
        );
        
        if (hasSuperdocEvidence) {
          console.log(`${c.green}✅ SUPERDOC FOI CONSULTADO!${c.reset}`);
        } else {
          console.log(`${c.yellow}⚠️  SuperDoc não retornou documentação${c.reset}`);
        }
      }
    }

    if (result.data && result.data.n3) {
      const n3 = result.data.n3;
      
      console.log(`\n${c.cyan}🛠️  N3 - SUGESTÕES:${c.reset}`);
      console.log(`   Causa: ${n3.possibleCause}\n`);
      
      console.log(`${c.cyan}📝 Passos sugeridos:${c.reset}`);
      n3.steps.forEach((s, i) => {
        console.log(`   ${i + 1}. ${s}`);
      });
      
      console.log('');
      
      // VERIFICAR SOLUÇÕES ENCONTRADAS
      if (n3.solutions && n3.solutions.length > 0) {
        console.log(`${c.green}✅ ${n3.solutions.length} REFERÊNCIAS ENCONTRADAS NO SUPERDOC!${c.reset}\n`);
        console.log(`${c.cyan}📚 Referências:${c.reset}`);
        n3.solutions.slice(0, 3).forEach((sol, i) => {
          console.log(`   ${i + 1}. ${sol.slice(0, 80)}...`);
        });
      } else {
        console.log(`${c.red}❌ Nenhuma solução encontrada no SuperDoc${c.reset}`);
        console.log(`${c.yellow}   Possível motivo: URL do SuperDoc não configurada ou erro de conexão${c.reset}`);
      }
    }

    // ═══════════════════════════════════════════════════════════
    // DIAGNÓSTICO
    // ═══════════════════════════════════════════════════════════
    console.log(`\n${c.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
    console.log(`${c.yellow}  🔬 DIAGNÓSTICO${c.reset}`);
    console.log(`${c.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}\n`);

    const n3Solutions = result.data?.n3?.solutions || [];
    
    if (n3Solutions.length > 0) {
      console.log(`${c.green}✅ INTEGRAÇÃO SUPERDOC: FUNCIONANDO${c.reset}`);
      console.log(`${c.green}✅ Encontrou ${n3Solutions.length} referências em core-consorcio${c.reset}`);
      console.log(`${c.green}✅ Sistema está buscando dados reais!${c.reset}\n`);
    } else {
      console.log(`${c.yellow}⚠️  INTEGRAÇÃO SUPERDOC: NÃO RETORNOU DADOS${c.reset}`);
      console.log(`${c.yellow}   Verifique SUPERDOC_URL no .env${c.reset}`);
      console.log(`${c.yellow}   Deve ser: http://IP-DO-SERVIDOR:9001${c.reset}\n`);
    }

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log(`║  ${n3Solutions.length > 0 ? c.green + '✅ TESTE PASSOU' : c.yellow + '⚠️  TESTE PARCIAL'}${c.reset}                                       ║`);
    console.log('╚════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error(`\n${c.red}❌ ERRO:${c.reset}`, error.message);
    process.exit(1);
  }
}

testRealCase();
