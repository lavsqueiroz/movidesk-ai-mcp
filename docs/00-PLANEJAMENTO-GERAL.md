# 📋 PLANEJAMENTO GERAL - Movidesk AI MCP

> **Status**: 🟡 PLANEJAMENTO  
> **Criado em**: 17/03/2026  
> **Prazo**: Esta semana (desenvolvimento local completo)

---

## 🎯 OBJETIVO DO PROJETO

Criar um **MCP Server** que integra Movidesk + SuperDoc para análise automática de tickets em 3 níveis:

### **N1 - Validação de Informações**
- ✅ Verifica se ticket tem: usuário, cenário, dispositivo, etc
- ❌ Se faltar → Cria nota interna listando o que falta
- ✅ Se completo → Avança para N2

### **N2 - Classificação Técnica (via SuperDoc)**
- 🔍 Consulta SuperDoc MCP (documentação técnica)
- 🏷️ Classifica como:
  - 🐛 **Defeito** → Avança para N3
  - 🚀 **Evolutiva** → Gera resumo para P.O.

### **N3 - Sugestão de Correção**
- 💡 IA sugere possível solução/correção
- 📝 Tudo vira **nota interna** para analista avaliar

---

## 🏗️ ARQUITETURA

```
Movidesk (Ticket criado)
      ↓
Webhook dispara
      ↓
[Movidesk AI MCP Server]
├─ Recebe webhook
├─ Consulta SuperDoc MCP
├─ Executa N1, N2, N3
└─ Envia nota interna ao Movidesk
```

---

## 📅 FASES DO PROJETO

### ✅ **FASE 0: Planejamento** (CONCLUÍDA)
- [x] Criar repositório GitHub
- [x] Documentar planejamento completo
- [x] Criar checklists de controle
- [x] Definir estrutura de arquivos

### 🟡 **FASE 1: Desenvolvimento Local** (EM ANDAMENTO)
**Objetivo**: Código funcionando 100% localmente

**Pré-requisitos**:
- [ ] Docker Desktop instalado ✅ (JÁ TEM)
- [ ] SuperDoc clonado localmente
- [ ] SuperDoc rodando em Docker local

**Checklist**:
- [ ] Clonar SuperDoc do servidor
- [ ] Rodar SuperDoc localmente (porta 9001)
- [ ] Criar estrutura MCP do Movidesk AI
- [ ] Implementar tools MCP (N1, N2, N3)
- [ ] Testar integração SuperDoc ↔ Movidesk AI
- [ ] Criar lógica de análise
- [ ] Testes com dados mockados

**Entregas**:
- ✅ Código TypeScript completo
- ✅ Docker funcionando localmente
- ✅ Integração com SuperDoc validada

---

### ⬜ **FASE 2: Integração Movidesk** (PRÓXIMA)
**Objetivo**: Testar com Movidesk REAL usando ngrok

**Pré-requisitos**:
- [ ] Token API Movidesk obtido ⚠️ **PEDIR AGORA!**
- [ ] Permissões validadas (leitura + escrita)
- [ ] ngrok instalado

**Checklist**:
- [ ] Configurar ngrok
- [ ] Criar webhook teste no Movidesk
- [ ] Testar recebimento de webhook
- [ ] Implementar envio de nota interna
- [ ] Validar nota aparece no ticket
- [ ] Testar fluxo completo N1→N2→N3
- [ ] Criar campo customizado "Analisar com IA"

**Entregas**:
- ✅ Webhook funcionando
- ✅ Nota interna aparecendo
- ✅ Testes com tickets reais

---

### ⬜ **FASE 3: Deploy Produção** (FINAL)
**Objetivo**: Colocar no servidor da empresa

**Pré-requisitos**:
- [ ] Código 100% testado e funcionando
- [ ] Solicitação formal ao servidor aprovada

**Checklist**:
- [ ] Deploy no servidor
- [ ] Configurar URL pública
- [ ] Atualizar webhook Movidesk (URL real)
- [ ] Testes em produção
- [ ] Monitoramento de logs
- [ ] Documentação de troubleshooting
- [ ] Treinar time

**Entregas**:
- ✅ Sistema rodando 24/7
- ✅ Webhook em produção
- ✅ Time treinado

---

## ⚠️ DECISÕES IMPORTANTES

### **Desenvolvimento Local PRIMEIRO**
✅ **Por quê?**
- Testar sem pressão
- Não ocupar servidor com código bugado
- Iterar rapidamente
- Só pedir servidor quando tiver CERTEZA que funciona

### **Uso de ngrok para testes**
✅ **Por quê?**
- Permite testar webhook sem servidor
- URL temporária mas funcional
- Gratuito para desenvolvimento

### **Docker obrigatório**
✅ **Por quê?**
- SuperDoc já usa Docker
- Isolamento de ambiente
- Facilita deploy
- Evita conflitos

---

## 🚨 PONTOS DE ATENÇÃO

### **1. SuperDoc Local**
⚠️ Você vai clonar SuperDoc para rodar localmente
- Isso NÃO afeta o servidor em produção
- São 2 instâncias separadas
- Servidor continua rodando normalmente

### **2. Token Movidesk**
⚠️ **PEDIR AGORA MESMO!**
- Pode levar 1-2 dias para aprovar
- Necessário para FASE 2
- Melhor ter antes de precisar

**O que pedir:**
- ✅ Token API Movidesk
- ✅ Permissão de LEITURA de tickets
- ✅ Permissão de ESCRITA (adicionar ações/notas internas)
- ✅ Permissão para criar campos customizados

### **3. Porta Docker**
⚠️ SuperDoc usa porta 9001
- Movidesk AI vai usar porta 9002
- Não há conflito

---

## 📞 PRÓXIMOS PASSOS IMEDIATOS

### **AGORA (hoje):**
1. ✅ Repositório criado
2. ✅ Planejamento documentado
3. ⏳ **PEDIR TOKEN MOVIDESK** (pode demorar dias!)
4. ⏳ Clonar SuperDoc localmente

### **Amanhã:**
1. Rodar SuperDoc local
2. Criar estrutura básica Movidesk AI MCP
3. Testar comunicação entre os dois

### **Resto da semana:**
1. Implementar lógica N1, N2, N3
2. Testes locais
3. Se token chegar: testar com Movidesk

---

## 📚 ONDE ESTÁ A DOCUMENTAÇÃO

- **Este arquivo**: Planejamento geral
- **01-CHECKLIST-FASE-1.md**: Checklist detalhado FASE 1
- **02-CHECKLIST-FASE-2.md**: Checklist detalhado FASE 2
- **03-CHECKLIST-FASE-3.md**: Checklist detalhado FASE 3
- **ARQUITETURA.md**: Diagrama técnico completo
- **FAQ.md**: Dúvidas frequentes

---

**Última atualização**: 17/03/2026 - Planejamento inicial