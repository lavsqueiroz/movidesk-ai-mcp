# 📁 Estrutura do Projeto v2.0

## ✅ ARQUIVOS ATIVOS (em uso)

### **Código Principal**

```
src/
├── mcp-server/
│   ├── mcp-queue-server.ts       ✅ MCP Server com aprovação humana (PRINCIPAL)
│   ├── server-http.ts             ✅ Servidor HTTP (Render + webhook)
│   └── server-http-entry.ts       ✅ Entry point do HTTP server
│
├── services/
│   ├── MovideskClient.ts          ✅ Cliente API Movidesk (listar + criar notas)
│   └── QueueManager.ts            ✅ Gerenciador de fila SQLite
```

### **Prompts**

```
prompts/
├── N1_SUPPORT_AGENT.md            ✅ Prompt do agente N1 (ativo e refinado)
├── N2_PO_AGENT.md                 ⚠️  Prompt N2 (pronto, mas não integrado ainda)
└── N3_DEV_AGENT.md                ⚠️  Prompt N3 (pronto, mas não integrado ainda)
```

### **Documentação**

```
docs/
├── FLUXO-APROVACAO-HUMANA.md      ✅ Fluxo detalhado com aprovação
├── PROXIMOS-PASSOS.md             ✅ Roadmap do projeto
└── DEPLOY-RENDER.md               ✅ Guia de deploy no Render
```

### **Configuração**

```
.
├── package.json                   ✅ Dependências e scripts
├── tsconfig.json                  ✅ Config TypeScript
├── render.yaml                    ✅ Config deploy Render
└── .env                           ✅ Variáveis de ambiente (local)
```

---

## ⚠️ ARQUIVOS LEGADOS (não remover ainda, podem ser úteis depois)

```
src/services/
├── ClaudeClient.ts                ⚠️  LEGADO: Cliente Claude API REST
│                                      (não usado - agora via MCP Desktop)
├── SuperDocClient.ts              ⚠️  LEGADO: Cliente SuperDoc HTTP
│                                      (será integrado via MCP depois)
└── TicketProcessor.ts             ⚠️  LEGADO: Processador automático
                                       (não usado - agora fluxo manual assistido)
```

**Por que não deletar ainda:**
- Podem ser referência futura
- SuperDoc pode precisar de cliente HTTP depois
- TicketProcessor tem lógica N1/N2/N3 que pode ser útil

---

## 🗂️ ARQUIVOS POR FUNÇÃO

### **1. MCP Server (Claude Desktop)**

**Arquivo principal:**
- `src/mcp-server/mcp-queue-server.ts`

**Ferramentas expostas:**
- `list_new_tickets` - Lista tickets novos
- `analyze_ticket_n1` - Analisa com N1
- `create_note_approved` - Cria nota (após aprovação)

---

### **2. HTTP Server (Render)**

**Arquivo principal:**
- `src/mcp-server/server-http.ts`
- `src/mcp-server/server-http-entry.ts`

**Rotas:**
- `GET /health` - Health check
- `GET /movidesk/tickets` - Listar tickets
- `POST /movidesk/tickets/:id/note` - Criar nota (TESTE)
- `POST /webhook/ticket-created` - Webhook Movidesk
- `GET /queue/stats` - Estatísticas da fila

---

### **3. Serviços**

**MovideskClient.ts:**
- `listTickets()` - Lista tickets via API
- `getTicket()` - Busca 1 ticket
- `createInternalNote()` - Cria nota interna

**QueueManager.ts:**
- `addToQueue()` - Adiciona ticket na fila
- `getPendingTickets()` - Lista pendentes
- `markAsProcessed()` - Marca como processado

---

### **4. Prompts**

**N1_SUPPORT_AGENT.md:**
- Checklist do time de suporte
- Gera orientação para analista
- Gera resposta para cliente

**N2_PO_AGENT.md:** (futuro)
- Classifica defeito vs evolutiva
- Consulta SuperDoc obrigatoriamente

**N3_DEV_AGENT.md:** (futuro)
- Sugere correção com código real
- Busca exemplos no SuperDoc

---

## 🔄 FLUXO DE DADOS

```
┌─────────────────┐
│  Movidesk API   │
└────────┬────────┘
         │
         ├─ GET /tickets (listar)
         ├─ GET /tickets/:id (buscar)
         └─ PATCH /tickets (criar nota)
         │
┌────────▼────────┐
│  HTTP Server    │  (Render)
│  :9002          │
└────────┬────────┘
         │
         ├─ /health
         ├─ /movidesk/tickets
         └─ /webhook/ticket-created → Queue (SQLite)
         │
┌────────▼────────┐
│  MCP Server     │  (Claude Desktop)
│  stdio          │
└────────┬────────┘
         │
         ├─ list_new_tickets
         ├─ analyze_ticket_n1
         └─ create_note_approved
         │
┌────────▼────────┐
│  Claude Desktop │
│  + Lavínia      │
└─────────────────┘
```

---

## 🧹 LIMPEZA RECOMENDADA (futuro)

Quando sistema estiver 100% estável:

1. Deletar `ClaudeClient.ts` (não será mais usado)
2. Deletar `TicketProcessor.ts` (não será mais usado)
3. Manter `SuperDocClient.ts` como referência

---

**Última atualização:** v2.0 - Sistema com Aprovação Humana
