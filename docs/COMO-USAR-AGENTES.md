# 🎭 Como Usar os Agentes

## 🚀 Início Rápido

Quando conectar no Claude Desktop, **SEMPRE comece assim**:

```
Se contextualize com o MCP Movidesk no papel agente admin
```

---

## 🎭 Agentes Disponíveis

### **👔 Agente Admin** (Orquestrador)
**Você se conecta com ele!**

**Ativa**ção:**
```
Se contextualize com o MCP Movidesk no papel agente admin
```

**Função:**
- Orquestra todos os outros agentes
- Gerencia fluxo de trabalho
- Pede aprovação para criar notas

**Não faz:**
- Análises técnicas (delega para Agente Suporte)

---

### **🔧 Agente Suporte** (Especialista Técnico)
**Chamado automaticamente pelo Admin**

**Função:**
- Analisa tickets com N1, N2, N3
- Gera orientação para analista
- Gera resposta para cliente

**Prompt:**
- Segue `N1_SUPPORT_AGENT.md`
- Usa checklist do time de suporte

---

### **📊 Agente Auditor** (Controle de Qualidade)
**Status:** 🚧 Em desenvolvimento (Fase 3)

**Função futura:**
- Revisar análises feitas
- Garantir qualidade
- Gerar relatórios

---

## 💬 Exemplos de Uso

### **Exemplo 1: Processar Tickets Novos**

```
Você: Se contextualize com o MCP Movidesk no papel agente admin

Admin: ✅ Contextualizado como Agente Admin!
       
       Sou o orquestrador do sistema Movidesk AI MCP.
       
       Agentes disponíveis:
       - 🔧 Agente Suporte (análise N1/N2/N3)
       - 📊 Agente Auditor (em desenvolvimento)
       
       Como posso ajudar?

Você: Processar tickets novos

Admin: [lista tickets]
       
       Encontrei 3 tickets aguardando análise:
       1. #14703 - App fechando sozinho
       2. #14704 - Erro de login
       3. #14705 - Sincronização lenta
       
       🔄 Vou delegar para o Agente Suporte analisar cada um.
       
       ---
       
       🔧 **AGENTE SUPORTE** analisando ticket #14703...
       
       [mostra análise completa N1]
       
       ---
       
       ⚠️ Lavínia, posso criar esta nota no ticket #14703? (sim/não)

Você: sim

Admin: ✅ Nota criada com sucesso!
       
       🔄 Próximo: #14704 - Erro de login
       
       🔧 **AGENTE SUPORTE** analisando...
```

---

### **Exemplo 2: Analisar Ticket Específico**

```
Você: Quero que o agente suporte analise o ticket 14703

Admin: 🔄 Delegando para o Agente Suporte...
       
       🔧 **AGENTE SUPORTE** analisando ticket #14703...
       
       [mostra análise completa]
       
       ⚠️ Posso criar esta nota? (sim/não)
```

---

### **Exemplo 3: Recusar Criação de Nota**

```
Você: Processar tickets novos

Admin: [analisa ticket #14703]
       
       ⚠️ Posso criar esta nota no ticket #14703? (sim/não)

Você: não, deixa eu revisar primeiro

Admin: Ok! Vou aguardar. Me avise quando quiser criar.
       
       Quer que eu analise o próximo (#14704) ou prefere revisar este antes?

Você: analise o próximo

Admin: 🔧 **AGENTE SUPORTE** analisando #14704...
```

---

## 🎯 Comandos Úteis

### **Para o Admin:**

```
"Processar tickets novos"
"Listar tickets aguardando"
"Analisar ticket [ID]"
"Criar nota no ticket [ID]" (após aprovação)
```

### **Chamar Agente Específico:**

```
"Quero que o agente suporte analise [ID]"
"Agente auditor, revise as últimas 10 análises" (futuro)
```

---

## ⚠️ Regras Importantes

### **1. SEMPRE começar contextualizando**
```
Se contextualize com o MCP Movidesk no papel agente admin
```

### **2. Cada ticket = 1 aprovação**
- Você precisa aprovar CADA nota individualmente
- "sim" para ticket #1 NÃO vale para ticket #2

### **3. Aprovação clara**
✅ Palavras que aprovam:
- "sim"
- "pode"
- "aprovo"
- "ok"
- "cria"

❌ Palavras que NÃO aprovam:
- "não"
- "espera"
- "deixa eu ver"
- "vou revisar"

---

## 🔄 Fluxo Completo

```
1. Você: "Se contextualize com o MCP Movidesk no papel agente admin"
2. Admin confirma contextualização
3. Você: "Processar tickets novos"
4. Admin lista tickets
5. Admin delega para Agente Suporte
6. Agente Suporte analisa ticket #1
7. Admin mostra análise
8. Admin pergunta: "Posso criar nota?"
9. Você: "sim"
10. Admin cria nota
11. Admin passa para próximo ticket
12. Repete passos 5-11 para cada ticket
```

---

## 📚 Documentação dos Agentes

- [👔 AGENT_ADMIN.md](../prompts/AGENT_ADMIN.md) - Orquestrador
- [🔧 AGENT_SUPORTE.md](../prompts/AGENT_SUPORTE.md) - Análise técnica
- [📊 AGENT_AUDITOR.md](../prompts/AGENT_AUDITOR.md) - Auditoria (futuro)
- [📋 N1_SUPPORT_AGENT.md](../prompts/N1_SUPPORT_AGENT.md) - Checklist N1

---

**Pronto para começar! 🚀**
