# 🚀 Como Usar o Sistema de Fila

## 📋 VISÃO GERAL

O sistema funciona assim:

1. **Webhook** do Movidesk → Tickets vão para **FILA** (SQLite)
2. Time trabalha **normalmente** no Movidesk
3. **A cada 2 horas** você conecta MCP no Claude Desktop
4. Pergunta: *"Tem tickets na fila?"*
5. Claude processa **todos em lote** consultando SuperDoc
6. Notas são criadas automaticamente no Movidesk

---

## ⚙️ CONFIGURAÇÃO INICIAL

### 1. Instalar Dependências

```bash
cd C:\Users\Administrador\movidesk-ai-mcp
git pull
npm install
```

### 2. Compilar TypeScript

```bash
npm run build
```

### 3. Iniciar Webhook Server

```bash
# Terminal 1 - Deixar rodando sempre
npm run dev
```

Isso mantém o webhook ativo para receber tickets do Movidesk.

---

## 🔌 CONECTAR MCP NO CLAUDE DESKTOP

### 1. Abrir Configuração do Claude Desktop

No Claude Desktop, vá em:
- **Settings** → **Developer** → **Edit Config**

### 2. Adicionar Configuração

Cole isso no arquivo de configuração:

```json
{
  "mcpServers": {
    "movidesk-queue": {
      "command": "node",
      "args": [
        "C:\\Users\\Administrador\\movidesk-ai-mcp\\dist\\mcp-server\\mcp-queue-server.js"
      ]
    }
  }
}
```

**⚠️ IMPORTANTE:** Ajuste o caminho se seu projeto está em outro lugar!

### 3. Reiniciar Claude Desktop

Feche e abra o Claude Desktop novamente.

### 4. Verificar Conexão

No Claude Desktop, você deve ver o MCP **movidesk-queue** conectado.

---

## 💬 COMO USAR NO DIA A DIA

### Cenário 1: Ver quantos tickets tem na fila

**Você pergunta:**
```
Tem tickets na fila do Movidesk?
```

**Claude responde:**
```json
{
  "pending": 15,
  "completed": 42,
  "failed": 2
}

📦 Existem 15 tickets aguardando processamento!
```

---

### Cenário 2: Ver lista de tickets pendentes

**Você pergunta:**
```
Me mostra a lista de tickets pendentes
```

**Claude responde:**
```
Tickets na fila:
1. [Queue #123] Ticket #456 - Erro ao fazer login
2. [Queue #124] Ticket #457 - Ponto comercial não preenche
...
```

---

### Cenário 3: Processar TODOS os tickets

**Você pergunta:**
```
Processar fila do Movidesk
```

**Claude faz:**
1. ✅ Lê todos os tickets pendentes
2. ✅ Para cada ticket:
   - Consulta SuperDoc (via MCP que já está conectado!)
   - Analisa como P.O. (N2)
   - Analisa como Dev (N3) se for defeito
   - Cria nota interna no Movidesk
3. ✅ Marca ticket como processado

**Claude responde:**
```
✅ Processados: 15 tickets
   - 12 com sucesso
   - 3 falharam

Detalhes:
- Ticket #456: DEFEITO → Nota criada
- Ticket #457: MELHORIA → Nota criada
...
```

---

### Cenário 4: Processar apenas 1 ticket específico

**Você pergunta:**
```
Processa só o ticket da fila #123
```

**Claude faz:**
Processa aquele ticket específico e mostra o resultado.

---

## 🎯 FLUXO RECOMENDADO

### Segunda a Sexta, a cada 2 horas:

1. **9h, 11h, 14h, 16h:**
   - Abrir Claude Desktop
   - Perguntar: *"Processar fila Movidesk"*
   - Aguardar conclusão
   - Fechar Claude Desktop

2. **Resultado:**
   - Todos os tickets que chegaram nas últimas 2h foram analisados
   - Notas criadas automaticamente no Movidesk
   - Time vê as análises e pode trabalhar nelas

---

## 🛠️ FERRAMENTAS MCP DISPONÍVEIS

Quando conectado, Claude tem acesso a:

### `check_queue`
Verifica estat\u00edsticas da fila
```
Você: Quantos tickets tem?
Claude: [usa check_queue] → 15 pendentes
```

### `get_pending_tickets`
Lista tickets pendentes
```
Você: Que tickets est\u00e3o na fila?
Claude: [usa get_pending_tickets] → lista
```

### `process_ticket`
Processa 1 ticket espec\u00edfico
```
Você: Processa fila #123
Claude: [usa process_ticket] → analisa + cria nota
```

### `process_all_pending`
Processa TODOS os tickets
```
Você: Processar fila
Claude: [usa process_all_pending] → processa todos
```

---

## ✅ CHECKLIST DIÁRIO

- [ ] Webhook server rodando? (`npm run dev`)
- [ ] Claude Desktop aberto?
- [ ] MCP conectado? (ver no ícone do plugin)
- [ ] Perguntar: "Processar fila Movidesk"
- [ ] Aguardar conclusão
- [ ] Verificar notas criadas no Movidesk

---

## 🐛 TROUBLESHOOTING

### Problema: MCP não conecta

**Solução:**
1. Verificar caminho no config está correto
2. Rodar `npm run build` de novo
3. Reiniciar Claude Desktop

### Problema: Fila não processa

**Solução:**
1. Verificar se webhook server está rodando
2. Ver logs do terminal
3. Verificar `.env` tem ANTHROPIC_API_KEY

### Problema: SuperDoc não é consultado

**Solução:**
1. Verificar se SuperDoc MCP está conectado no Claude
2. SuperDoc deve estar em http://21.0.0.122:9001

---

## 📊 MONITORAMENTO

### Ver estatísticas da fila via HTTP:

```bash
# Ver status
curl http://localhost:9002/queue/stats

# Ver pendentes
curl http://localhost:9002/queue/pending
```

---

**Pronto! Sistema 100% funcional! 🎉**
