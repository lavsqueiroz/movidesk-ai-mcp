#!/usr/bin/env node
/**
 * Script de teste para simular análise de ticket
 * Testa o fluxo completo N1 → N2 → N3
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

async function testTicketAnalysis() {
  console.log('\n════════════════════════════════════════════════════');
  console.log('🧪 TESTE DE ANÁLISE DE TICKET');
  console.log('════════════════════════════════════════════════════\n');

  try {
    // Carregar ticket de exemplo
    const ticketPath = path.join(__dirname, 'sample-ticket.json');
    const ticketData = JSON.parse(fs.readFileSync(ticketPath, 'utf-8'));

    console.log(`${colors.blue}📥 Ticket carregado:${colors.reset}`);
    console.log(`   ID: ${ticketData.id}`);
    console.log(`   Assunto: ${ticketData.subject}`);
    console.log(`   Urgência: ${ticketData.urgency}\n`);

    // URL do servidor local
    const baseUrl = 'http://localhost:9002';

    // ═══════════════════════════════════════════════════════
    // TESTE 1: Health Check
    // ═══════════════════════════════════════════════════════
    console.log(`${colors.yellow}━━━ TESTE 1: Health Check ━━━${colors.reset}`);
    
    const healthResponse = await fetch(`${baseUrl}/health`);
    const health = await healthResponse.json();
    
    if (health.status === 'ok') {
      console.log(`${colors.green}✅ Servidor OK${colors.reset}\n`);
    } else {
      throw new Error('Servidor não está OK');
    }

    // ═══════════════════════════════════════════════════════
    // TESTE 2: Listar Tools
    // ═══════════════════════════════════════════════════════
    console.log(`${colors.yellow}━━━ TESTE 2: Tools Disponíveis ━━━${colors.reset}`);
    
    const toolsResponse = await fetch(`${baseUrl}/tools`);
    const toolsData = await toolsResponse.json();
    
    console.log(`${colors.green}✅ ${toolsData.tools.length} tools carregadas:${colors.reset}`);
    toolsData.tools.forEach(tool => {
      console.log(`   • ${tool.name}`);
    });
    console.log('');

    // ═══════════════════════════════════════════════════════
    // TESTE 3: Simular Webhook
    // ═══════════════════════════════════════════════════════
    console.log(`${colors.yellow}━━━ TESTE 3: Simular Webhook ━━━${colors.reset}`);
    
    const webhookPayload = {
      ticket_id: ticketData.id,
      titulo: ticketData.subject,
      descricao: ticketData.description,
      usuario: ticketData.customFields.usuario,
      cenario: ticketData.customFields.cenario,
      dispositivo: ticketData.customFields.dispositivo,
    };

    console.log(`${colors.blue}📤 Enviando webhook...${colors.reset}`);
    
    const webhookResponse = await fetch(`${baseUrl}/webhook/ticket-created`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
    });

    const webhookResult = await webhookResponse.json();
    
    console.log(`${colors.green}✅ Webhook recebido!${colors.reset}`);
    console.log(JSON.stringify(webhookResult, null, 2));
    console.log('');

    // ═══════════════════════════════════════════════════════
    // RESUMO
    // ═══════════════════════════════════════════════════════
    console.log('\n════════════════════════════════════════════════════');
    console.log(`${colors.green}✅ TODOS OS TESTES PASSARAM!${colors.reset}`);
    console.log('════════════════════════════════════════════════════\n');

    console.log('📝 PRÓXIMOS PASSOS:');
    console.log('   1. Implementar lógica de processamento completo');
    console.log('   2. Integrar com SuperDoc para buscar documentação');
    console.log('   3. Criar notas internas no Movidesk');
    console.log('   4. Testar com tickets reais via ngrok\n');

  } catch (error) {
    console.error(`\n${colors.red}❌ ERRO NO TESTE:${colors.reset}`, error.message);
    console.error(error);
    process.exit(1);
  }
}

// Executar
testTicketAnalysis();
