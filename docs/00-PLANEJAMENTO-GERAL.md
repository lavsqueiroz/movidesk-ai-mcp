# 📋 PLANEJAMENTO GERAL - Movidesk AI MCP

> **Status**: 🟡 PLANEJAMENTO  
> **Criado em**: 17/03/2026  
> **Responsável**: Lavínia Queiroz (@lavsqueiroz)  
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

**IMPORTANTE**: IA **NÃO** responde ao cliente! Apenas cria notas internas para o analista decidir.

---

## 📅 FASES DO PROJETO

### ✅ **FASE 0: Planejamento** (CONCLUÍDA)
- [x] Criar repositório GitHub
- [x] Documentar planejamento completo
- [x] Criar checklists de controle

### 🟡 **FASE 1: Desenvolvimento Local** (1-2 semanas)
- Ver checklist detalhado em: `docs/01-CHECKLIST-FASE-1.md`

### ⬜ **FASE 2: Integração Movidesk** (3-5 dias)
- Ver checklist detalhado em: `docs/02-CHECKLIST-FASE-2.md`

### ⬜ **FASE 3: Deploy Produção** (1 dia)
- Aguardando conclusão das fases anteriores

---

## 🚨 PRÓXIMOS PASSOS IMEDIATOS

1. ✅ Criar repositório GitHub
2. ✅ Documentar planejamento
3. [ ] **PEDIR TOKEN API MOVIDESK** ⚠️
4. [ ] Clonar SuperDoc localmente
5. [ ] Rodar SuperDoc em Docker local

---

**Última atualização**: 17/03/2026 - Planejamento inicial criado
