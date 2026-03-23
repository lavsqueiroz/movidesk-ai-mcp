/**
 * Script de teste da API do Movidesk
 * Rode: node test.js
 */

import axios from 'axios';

const TOKEN = process.env.MOVIDESK_TOKEN;

if (!TOKEN) {
  console.error('❌ MOVIDESK_TOKEN não definido!');
  console.error('   Rode: set MOVIDESK_TOKEN=seu_token && node test.js');
  process.exit(1);
}

const client = axios.create({
  baseURL: 'https://api.movidesk.com/public/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

async function testar() {
  console.log('========================================');
  console.log(' Movidesk API - Testes');
  console.log('========================================\n');

  // TESTE 1: Status configs
  console.log('--- TESTE 1: Buscar status ---');
  try {
    const res = await client.get('/ticketStatus', { params: { token: TOKEN } });
    const statuses = Array.isArray(res.data) ? res.data : [res.data];
    console.log(`✅ ${statuses.length} status encontrados:`);
    statuses.forEach(s => console.log(`   - ${JSON.stringify(s)}`));
  } catch (err) {
    console.error('❌ Erro:', err.response?.status, err.response?.data || err.message);
  }

  console.log('');

  // TESTE 2: Listar tickets sem filtro
  console.log('--- TESTE 2: Listar tickets (sem filtro, top 3) ---');
  try {
    const res = await client.get('/tickets', {
      params: {
        token: TOKEN,
        $select: 'id,protocol,subject,status,createdDate',
        $top: 3,
      },
    });
    const tickets = Array.isArray(res.data) ? res.data : [res.data];
    console.log(`✅ ${tickets.length} tickets encontrados:`);
    tickets.forEach(t => console.log(`   - [${t.id}] ${t.subject} | Status: ${t.status}`));
  } catch (err) {
    console.error('❌ Erro:', err.response?.status, err.response?.data || err.message);
  }

  console.log('');

  // TESTE 3: Listar tickets com filtro de status
  console.log('--- TESTE 3: Listar tickets com status "Novo" (top 3) ---');
  try {
    const res = await client.get('/tickets', {
      params: {
        token: TOKEN,
        $select: 'id,protocol,subject,status,createdDate',
        $top: 3,
        $filter: `status eq 'Novo'`,
      },
    });
    const tickets = Array.isArray(res.data) ? res.data : [res.data];
    console.log(`✅ ${tickets.length} tickets encontrados:`);
    tickets.forEach(t => console.log(`   - [${t.id}] ${t.subject} | Status: ${t.status}`));
  } catch (err) {
    console.error('❌ Erro:', err.response?.status, err.response?.data || err.message);
  }

  console.log('\n========================================');
  console.log(' Testes concluídos!');
  console.log('========================================');
}

testar();
