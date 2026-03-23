/**
 * TESTE: Criar nota no ticket 14703
 * 
 * Este script testa a criação de nota automática no Movidesk
 */

const RENDER_URL = process.argv[2] || 'https://sua-url.onrender.com';
const TICKET_ID = '14703';

// Nota de teste com análise N1
const notaAnalise = `🤖 **ANÁLISE AUTOMÁTICA N1 - TESTE DO SISTEMA**

═══════════════════════════════════════════════════════════

## 📋 ORIENTAÇÃO PARA O ANALISTA N1

### Contexto do Problema
Este é um ticket de TESTE do sistema Movidesk AI MCP. 
Se você está vendo esta nota, significa que a integração está funcionando! ✅

### Checklist de Verificação
- [x] Sistema conseguiu conectar na API do Movidesk
- [x] Sistema conseguiu criar nota interna
- [x] Nota não foi enviada para o cliente (apenas interna)

### Próximos Passos
1. Validar que a nota apareceu corretamente no ticket
2. Confirmar que o cliente NÃO recebeu esta nota
3. Prosseguir com testes de análise real

═══════════════════════════════════════════════════════════

## 💬 RESPOSTA PARA O CLIENTE (NÃO ENVIADA)

_Esta é apenas uma nota interna de teste. Nenhuma resposta foi enviada ao cliente._

═══════════════════════════════════════════════════════════

✅ **TESTE REALIZADO COM SUCESSO EM ${new Date().toLocaleString('pt-BR')}**

_Sistema: Movidesk AI MCP v1.0_  
_Servidor: ${RENDER_URL}_
`;

async function testarCriarNota() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  🧪 TESTE: Criar Nota no Movidesk                        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  console.log(`📍 URL: ${RENDER_URL}`);
  console.log(`📋 Ticket: ${TICKET_ID}\n`);

  const url = `${RENDER_URL}/movidesk/tickets/${TICKET_ID}/note`;

  try {
    console.log('📤 Enviando requisição...\n');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: notaAnalise,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ SUCESSO!\n');
      console.log('Resposta:', JSON.stringify(data, null, 2));
      console.log('\n╔═══════════════════════════════════════════════════════════╗');
      console.log('║  ✅ NOTA CRIADA COM SUCESSO!                             ║');
      console.log('╚═══════════════════════════════════════════════════════════╝\n');
      console.log(`🔗 Verifique no Movidesk: https://newm.movidesk.com/Ticket/Edit/${TICKET_ID}\n`);
    } else {
      console.log('❌ ERRO!\n');
      console.log('Status:', response.status);
      console.log('Resposta:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ ERRO:', error.message);
  }
}

// Executar
testarCriarNota();
