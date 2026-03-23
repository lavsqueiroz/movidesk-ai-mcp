# 📁 Arquivos Utilizados no Sistema v2.0

## ✅ ARQUIVOS ATIVOS

### **Servidor MCP**
- `src/mcp-server/mcp-queue-server.ts` - Servidor MCP principal com ferramentas de aprovação
- `src/mcp-server/server-http.ts` - Servidor HTTP (webhook + rotas de teste)
- `src/mcp-server/server-http-entry.ts` - Entry point do servidor HTTP

### **Serviços**
- `src/services/MovideskClient.ts` - Cliente para API do Movidesk
- `src/services/QueueManager.ts` - Gerenciador de fila SQLite (webhook)

### **Prompts**
- `prompts/N1_SUPPORT_AGENT.md` - Prompt do agente N1 (ativo)
- `prompts/N1_VALIDATOR_AGENT.md` - Prompt antigo (não usado mais)
- `prompts/N2_PO_AGENT.md` - Para uso futuro (não implementado ainda)
- `prompts/N3_DEV_AGENT.md` - Para uso futuro (não implementado ainda)

### **Configuração**
- `render.yaml` - Deploy no Render
- `mcp-config.json` - Configuração MCP Claude Desktop
- `package.json` - Dependências
- `.env` - Variáveis de ambiente (local)

### **Documentação**
- `README.md` - Documentação principal
- `docs/FLUXO-APROVACAO-HUMANA.md` - Fluxo com aprovação
- `docs/DEPLOY-RENDER.md` - Deploy
- `docs/PROXIMOS-PASSOS.md` - Roadmap

---

## 🗑️ ARQUIVOS REMOVIDOS (LEGADO)

### **Serviços Antigos**
- ~~`src/services/ClaudeClient.ts`~~ → Movido para `.archive/`
  - **Motivo**: Sistema agora usa MCP direto no Claude Desktop, não API REST
  
- ~~`src/services/SuperDocClient.ts`~~ → Movido para `.archive/`
  - **Motivo**: SuperDoc será acessado via MCP quando conectado, não via HTTP
  
- ~~`src/services/TicketProcessor.ts`~~ → Movido para `.archive/`
  - **Motivo**: Sistema agora usa aprovação humana via MCP, não processamento automático

---

## 📝 EXPLICAÇÃO DAS MUDANÇAS

### **Por que remover ClaudeClient.ts?**
O sistema v1.0 tentava chamar a API REST do Claude para processar tickets automaticamente. 

**Problema**: Claude API REST não suporta MCP servers.

**Solução v2.0**: Claude Desktop com MCP → Aprovação humana para cada ticket.

### **Por que remover TicketProcessor.ts?**
Processava tickets automaticamente sem intervenção humana.

**Problema**: Não havia aprovação antes de criar notas.

**Solução v2.0**: Ferramentas MCP com aprovação obrigatória (analyze → mostrar → pedir confirmação → criar).

### **Por que remover SuperDocClient.ts?**
Tentava acessar SuperDoc via HTTP direto.

**Solução v2.0**: SuperDoc será acessado via MCP quando a Lavínia conectar ele no Claude Desktop.

---

## 🔄 FLUXO ATUAL (v2.0)

```
1. Webhook Movidesk → server-http.ts → QueueManager (SQLite)
2. Claude Desktop conecta MCP → mcp-queue-server.ts
3. list_new_tickets → MovideskClient.listTickets()
4. analyze_ticket_n1 → Carrega prompt N1 → MOSTRA análise
5. AGUARDA aprovação humana
6. create_note_approved → MovideskClient.createInternalNote()
```

**Sem código automático. Sem chamadas à Claude API REST. Tudo via MCP com aprovação.**
