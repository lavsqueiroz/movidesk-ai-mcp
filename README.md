# 🤖 Movidesk AI MCP - Análise com Aprovação Humana

**Sistema de análise inteligente de tickets do Movidesk usando Claude + SuperDoc com aprovação humana obrigatória.**

---

## 🎯 Como Funciona

**FLUXO COM APROVAÇÃO HUMANA:**

1. Você conecta MCP no Claude Desktop
2. Lista tickets novos do Movidesk
3. Claude analisa cada ticket com N1
4. Claude MOSTRA resultado completo
5. Claude PERGUNTA: "Posso criar esta nota?"
6. Você aprova ou rejeita
7. Só então Claude cria nota interna

**⚠️ Claude NUNCA cria notas sem aprovação explícita!**

---

## ⚙️ Setup Rápido

```bash
# 1. Clonar
git clone https://github.com/lavsqueiroz/movidesk-ai-mcp.git
cd movidesk-ai-mcp

# 2. Instalar
npm install

# 3. Configurar .env
MOVIDESK_TOKEN=seu-token
MOVIDESK_URL=https://newm.movidesk.com
SUPERDOC_URL=http://21.0.0.122:9001

# 4. Compilar
npm run build

# 5. Configurar MCP no Claude Desktop
# Ver: docs/GUIA-USO-APROVACAO.md
```

---

## 📚 Documentação

- [📖 Guia de Uso](./docs/GUIA-USO-APROVACAO.md) **← COMECE AQUI!**
- [🎯 Prompt N1](./prompts/N1_SUPPORT_AGENT.md)
- [🚀 Deploy Render](./docs/DEPLOY-RENDER.md)

---

## 🔧 Ferramentas MCP

- `list_new_tickets` - Lista tickets aguardando
- `analyze_ticket_n1` - Analisa (só mostra, não cria)
- `create_note_approved` - Cria nota (após aprovação)

---

## 💬 Exemplo

```
Você: "Tem tickets novos?"
Claude: 5 tickets aguardando análise

Você: "Analisa o 14703"
Claude: [análise] "Posso criar nota? (sim/não)"

Você: "sim"
Claude: ✅ Nota criada!
```

---

## 📊 Status

- ✅ Deploy Render
- ✅ Integração Movidesk
- ✅ Sistema de fila
- ✅ MCP com aprovação
- ✅ Prompt N1 refinado
- ⬜ SuperDoc (próximo)

---

**Desenvolvido com ❤️ para análise eficiente**
