# 🤖 Movidesk AI MCP

> **MCP Server** para análise inteligente de tickets do Movidesk integrado com SuperDoc

[![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)](https://github.com/lavsqueiroz/movidesk-ai-mcp)

---

## 📝 Sobre

Sistema de análise automática de tickets do Movidesk em 3 níveis:

- **N1**: Valida se ticket tem usuário, cenário, dispositivo
- **N2**: Classifica como Defeito ou Evolutiva (via SuperDoc)
- **N3**: Sugere correção técnica (apenas defeitos)

**Resultado**: Nota interna no ticket para analista avaliar

---

## 🚀 Quick Start

### 1. Clonar repositório

```bash
git clone https://github.com/lavsqueiroz/movidesk-ai-mcp.git
cd movidesk-ai-mcp
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Editar .env com suas credenciais
```

**Variáveis necessárias:**
```env
MOVIDESK_TOKEN=seu-token-aqui
MOVIDESK_URL=https://newm.movidesk.com
SUPERDOC_URL=http://servidor-superdoc:9001
```

### 3. Instalar dependências

```bash
npm install
```

### 4. Rodar localmente

```bash
# Modo desenvolvimento (com hot reload)
npm run dev

# OU com Docker
docker-compose up
```

### 5. Testar

```bash
# Health check
curl http://localhost:9002/health

# Ver tools disponíveis
curl http://localhost:9002/tools
```

---

## 📖 Documentação

- [📋 Planejamento Geral](./docs/00-PLANEJAMENTO-GERAL.md)
- [✅ Próximos Passos](./docs/PROXIMOS-PASSOS.md)
- [🛠️ Checklist FASE 1](./docs/01-CHECKLIST-FASE-1.md) *(em breve)*

---

## 📅 Status do Projeto

### ✅ FASE 0: Planejamento (CONCLUÍDA)
- [x] Repositório criado
- [x] Estrutura base implementada
- [x] Docker configurado

### 🟡 FASE 1: Desenvolvimento Local (EM ANDAMENTO)
- [x] Servidor HTTP criado
- [x] Tool Registry implementado
- [x] Tools N1, N2, N3 criadas (estrutura)
- [ ] Integração com SuperDoc
- [ ] Lógica de análise completa
- [ ] Testes locais

### ⬜ FASE 2: Integração Movidesk
- [ ] ngrok configurado
- [ ] Webhook funcionando
- [ ] Notas internas sendo criadas

### ⬜ FASE 3: Produção
- [ ] Deploy no servidor
- [ ] Sistema rodando 24/7

---

## 🛠️ Stack Tecnológica

- **TypeScript** - Linguagem
- **Express** - Servidor HTTP  
- **Docker** - Containerização
- **@modelcontextprotocol/sdk** - MCP Protocol

---

## 📝 Próximos Passos

1. [ ] Implementar integração com SuperDoc MCP
2. [ ] Completar lógica das tools N1, N2, N3
3. [ ] Adicionar cliente Movidesk API
4. [ ] Implementar processamento de webhooks
5. [ ] Testes com dados mockados

---

## 📧 Contato

**Responsável**: Lavínia Queiroz  
**GitHub**: [@lavsqueiroz](https://github.com/lavsqueiroz)

---

**Última atualização**: 17/03/2026