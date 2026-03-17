# 🚀 GUIA DE INSTALAÇÃO - Movidesk AI MCP

> **Guia passo a passo** para rodar o projeto pela primeira vez

---

## ✅ PRÉ-REQUISITOS

Antes de começar, você precisa ter instalado:

- ✅ **Node.js 22+** - [Download aqui](https://nodejs.org/)
- ✅ **Git** - [Download aqui](https://git-scm.com/)
- ✅ **Docker Desktop** (opcional, mas recomendado) - [Download aqui](https://www.docker.com/products/docker-desktop/)

### Verificar se está instalado:

```bash
node --version  # Deve mostrar v22.x.x ou superior
npm --version   # Deve mostrar 10.x.x ou superior
git --version   # Deve mostrar git version 2.x.x
```

---

## 📥 PASSO 1: CLONAR O REPOSITÓRIO

```bash
# Clonar
git clone https://github.com/lavsqueiroz/movidesk-ai-mcp.git

# Entrar na pasta
cd movidesk-ai-mcp
```

---

## 🔧 PASSO 2: CONFIGURAR VARIÁVEIS DE AMBIENTE

### 2.1 - Criar arquivo .env

```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

### 2.2 - Editar o arquivo .env

Abra o arquivo `.env` no seu editor favorito e configure:

```env
# Token da API do Movidesk (obrigatório)
MOVIDESK_TOKEN=seu-token-aqui

# URL do Movidesk (geralmente não precisa mudar)
MOVIDESK_URL=https://newm.movidesk.com

# URL do SuperDoc (se souber onde está rodando)
SUPERDOC_URL=http://servidor-superdoc:9001
```

**⚠️ IMPORTANTE:**
- Substitua `seu-token-aqui` pelo seu token real do Movidesk
- NUNCA commite o arquivo `.env` no Git!

---

## 📦 PASSO 3: INSTALAR DEPENDÊNCIAS

```bash
npm install
```

**Tempo estimado:** 1-2 minutos

**O que acontece:**
- Baixa todas as bibliotecas necessárias
- Cria a pasta `node_modules`

---

## 🏃 PASSO 4: RODAR O SERVIDOR

### Opção A: Modo Desenvolvimento (com hot reload)

```bash
npm run dev
```

### Opção B: Com Docker

```bash
docker-compose up
```

**Você deve ver:**
```
🚀 Iniciando Movidesk AI MCP Server...
📍 Porta: 9002
📍 Host: 0.0.0.0

✅ 3 tools carregadas com sucesso

══════════════════════════════════════════════════════════
  🚀 MOVIDESK AI MCP SERVER
══════════════════════════════════════════════════════════

  📍 Endereço: http://0.0.0.0:9002
  🛠️  Tools: 3 registradas

  🔓 Rotas PÚBLICAS:
     GET  /health              - Health check
     GET  /info                - Server info
     GET  /tools               - Lista de tools
     POST /webhook/ticket-created - Webhook Movidesk

══════════════════════════════════════════════════════════

✅ Servidor HTTP iniciado com sucesso!
```

---

## ✅ PASSO 5: TESTAR SE FUNCIONOU

Abra um **novo terminal** (deixe o servidor rodando no outro) e execute:

```bash
# Health check
curl http://localhost:9002/health

# Deve retornar:
# {"status":"ok","service":"movidesk-ai-mcp","timestamp":"...","uptime":...}
```

**Ou abra no navegador:**
- http://localhost:9002/health
- http://localhost:9002/info
- http://localhost:9002/tools

---

## 🐛 TROUBLESHOOTING

### Erro: "Cannot find module"
**Solução:**
```bash
rm -rf node_modules
npm install
```

### Erro: "Port 9002 is already in use"
**Solução:** Mudar a porta no `.env`:
```env
MCP_HTTP_PORT=9003
```

### Erro: "MOVIDESK_TOKEN is not defined"
**Solução:** Verificar se o `.env` existe e está preenchido

### Servidor não inicia
**Solução:**
1. Verificar se Node.js 22+ está instalado
2. Apagar `node_modules` e rodar `npm install` novamente
3. Verificar logs de erro no terminal

---

## 📝 PRÓXIMOS PASSOS

Após o servidor estar rodando:

1. ✅ Testar endpoints básicos
2. 🔄 Implementar integração com SuperDoc
3. 🧪 Testar tools N1, N2, N3
4. 🌐 Configurar webhook do Movidesk (com ngrok)

**Ver:** [PROXIMOS-PASSOS.md](./docs/PROXIMOS-PASSOS.md)

---

## 📚 COMANDOS ÚTEIS

```bash
# Rodar em modo desenvolvimento
npm run dev

# Rodar com Docker
docker-compose up

# Ver logs do Docker
docker-compose logs -f

# Parar servidor Docker
docker-compose down

# Verificar TypeScript
npm run typecheck

# Rebuild TypeScript
npm run build
```

---

**Última atualização:** 17/03/2026
