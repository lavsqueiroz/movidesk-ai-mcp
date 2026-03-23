# 🤖 Movidesk AI MCP v2.0 - Sistema com Aprovação Humana

**Sistema de análise inteligente de tickets do Movidesk com aprovação humana obrigatória.**

---

## 🎯 Como Funciona

### **Fluxo Principal**

1. 📥 Tickets novos chegam no Movidesk
2. 👩‍💼 Você conecta MCP no Claude Desktop
3. 💬 Pergunta: "Processar tickets novos"
4. 🤖 Claude lista tickets aguardando
5. 🔍 Claude analisa cada ticket com N1
6. 📝 Claude **MOSTRA** análise completa
7. ❓ Claude **PERGUNTA**: "Posso criar esta nota?"
8. ✅ Você **APROVA** ("sim")
9. 📝 Claude cria nota no Movidesk
10. 🔄 Repete para próximo ticket

### **Regra de Ouro**

**NUNCA cria notas sem aprovação explícita!**

---

## ⚡ Setup Rápido

```bash
# 1. Clonar
git clone https://github.com/lavsqueiroz/movidesk-ai-mcp.git
cd movidesk-ai-mcp

# 2. Instalar
npm install

# 3. Configurar .env
MOVIDESK_TOKEN=seu-token-aqui

# 4. Compilar
npm run build
```

---

## 🔌 Conectar no Claude Desktop

### **1. Editar Configuração**

Claude Desktop → Settings → Developer → Edit Config

### **2. Adicionar MCP**

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

### **3. Reiniciar Claude Desktop**

---

## 💬 Como Usar

### **Exemplo Real**

```
Você: Processar tickets novos

Claude: Encontrei 5 tickets aguardando análise:
        1. #14703 - App fechando sozinho
        2. #14704 - Erro de login
        ...
        
        Analisando ticket #14703...
        
        ## 📋 ORIENTAÇÃO PARA O ANALISTA N1
        
        ### Contexto
        App apresenta crashes durante cadastro de proposta.
        
        ### Checklist
        - [ ] Verificar Firebase Crashlytics
        - [ ] Checar versão do app
        ...
        
        ## 💬 RESPOSTA PARA O CLIENTE
        
        Olá,
        
        Recebemos seu relato sobre o fechamento do app...
        Para prosseguir, precisamos:
        1. Qual a versão do app?
        2. Android ou iOS?
        ...
        
        Posso criar esta nota no ticket #14703? (sim/não)

Você: sim

Claude: ✅ Nota criada com sucesso!
        
        Próximo: #14704 - Erro de login
        [analisa...]
```

---

## 🛠️ Ferramentas MCP

### **list_new_tickets**
Lista tickets aguardando análise

### **analyze_ticket_n1**
Analisa ticket com agente N1 (apenas mostra, não cria nota)

### **create_note_approved**
Cria nota (SOMENTE após aprovação)

---

## 📚 Documentação

- [🤝 Fluxo com Aprovação Humana](./docs/FLUXO-APROVACAO-HUMANA.md)
- [📖 Prompt do Agente N1](./prompts/N1_SUPPORT_AGENT.md)
- [⚙️ Deploy no Render](./docs/DEPLOY-RENDER.md)

---

## 📊 Status

- ✅ Sistema de Fila (SQLite)
- ✅ MCP Server com Aprovação Humana
- ✅ Integração Movidesk (listar tickets + criar notas)
- ✅ Prompt N1 Especializado
- ✅ Deploy no Render
- ⬜ Integração SuperDoc (próxima versão)
- ⬜ Prompts N2 e N3 (próxima versão)

---

**Desenvolvido com ❤️ por Lavínia + Claude**
