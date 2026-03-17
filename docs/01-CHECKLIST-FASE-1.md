# ✅ CHECKLIST DETALHADO - FASE 1

> **Fase**: Desenvolvimento Local  
> **Objetivo**: Código funcionando 100% localmente  
> **Prazo**: 1-2 semanas  
> **Status**: 🟡 EM ANDAMENTO

---

## 📋 PRÉ-REQUISITOS

### Ambiente
- [ ] **Docker Desktop instalado** ✅ CONCLUÍDO
- [ ] **Git instalado** (provavelmente já tem)
- [ ] **VS Code ou editor** (provavelmente já tem)
- [ ] **Node.js 22+** (para desenvolvimento, Docker já tem)

### Acessos
- [ ] **Acesso ao repositório do SuperDoc** (onde está?)
- [ ] **Permissão para clonar SuperDoc**

---

## 🎯 PASSO 1: Clonar e Rodar SuperDoc Localmente

### 1.1 Descobrir onde está o SuperDoc
- [ ] Perguntar ao time: qual URL do repositório?
- [ ] Anotar URL aqui: `___________________________`

### 1.2 Clonar SuperDoc
```bash
# No terminal
cd ~/Documents  # ou pasta de projetos
git clone [URL_DO_SUPERDOC]
cd superdoc
```

- [ ] SuperDoc clonado com sucesso

### 1.3 Configurar SuperDoc local
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar .env (pode usar VS Code)
code .env
```

**Configurações mínimas**:
- [ ] `AUTH_ENABLED=false` (para desenvolvimento local)
- [ ] `MCP_HTTP_PORT=9001`
- [ ] Outras configs conforme necessário

### 1.4 Rodar SuperDoc em Docker
```bash
# Construir e rodar
docker-compose up

# OU em background:
docker-compose up -d
```

**Validação**:
- [ ] Terminal mostra: "✅ Servidor HTTP iniciado"
- [ ] Acessar: http://localhost:9001/health
- [ ] Resposta JSON: `{"status": "ok"}`

### 1.5 Testar SuperDoc
```bash
# Listar tools disponíveis
curl http://localhost:9001/tools
```

- [ ] Lista de tools retornada (sd_read_file, sd_search_content, etc)

---

## 🎯 PASSO 2: Criar Estrutura do Movidesk AI MCP

### 2.1 Clonar este repositório
```bash
cd ~/Documents  # mesma pasta dos projetos
git clone https://github.com/lavsqueiroz/movidesk-ai-mcp.git
cd movidesk-ai-mcp
```

- [ ] Repositório clonado

### 2.2 Criar estrutura de pastas
```bash
mkdir -p src/mcp-server
mkdir -p src/tools
mkdir -p src/services
mkdir -p src/config
```

- [ ] Pastas criadas

### 2.3 Criar arquivos base

**Arquivos que vou criar para você**:
- [ ] `package.json`
- [ ] `tsconfig.json`
- [ ] `.env.example`
- [ ] `Dockerfile`
- [ ] `docker-compose.yml`
- [ ] `src/mcp-server/server-http.ts`
- [ ] `src/mcp-server/server-http-entry.ts`
- [ ] `src/tools/index.ts`
- [ ] `src/tools/ToolRegistry.ts`

---

## 🎯 PASSO 3: Implementar Tools MCP

### 3.1 Tool: analyze-ticket-n1 (Validação)
- [ ] Criar `src/tools/analyze-ticket-n1.ts`
- [ ] Implementar lógica de validação de campos
- [ ] Testar com dados mockados

**Lógica**:
```typescript
// Verifica se ticket tem:
- usuário
- cenário
- dispositivo
- outros campos obrigatórios

// Retorna:
{
  status: 'completo' | 'incompleto',
  missing_fields: string[],
  analysis: string
}
```

### 3.2 Tool: analyze-ticket-n2 (Classificação)
- [ ] Criar `src/tools/analyze-ticket-n2.ts`
- [ ] Implementar chamada ao SuperDoc MCP
- [ ] Implementar lógica de classificação
- [ ] Testar com dados mockados

**Lógica**:
```typescript
// 1. Consulta SuperDoc para buscar docs relacionadas
// 2. Analisa contexto
// 3. Classifica como:
//    - DEFEITO (bug existente)
//    - EVOLUTIVA (nova feature)

// Retorna:
{
  classification: 'defeito' | 'evolutiva',
  confidence: number,
  reasoning: string,
  docs_consulted: string[]
}
```

### 3.3 Tool: analyze-ticket-n3 (Sugestão)
- [ ] Criar `src/tools/analyze-ticket-n3.ts`
- [ ] Implementar sugestão de correção
- [ ] Testar com dados mockados

**Lógica**:
```typescript
// Apenas para DEFEITOS
// Sugere possível correção baseada em:
// - Documentação técnica
// - Padrões conhecidos
// - Histórico (futuro)

// Retorna:
{
  suggestion: string,
  complexity: 'baixa' | 'média' | 'alta',
  estimated_effort: string
}
```

### 3.4 Registrar tools no ToolRegistry
- [ ] Atualizar `src/tools/index.ts`
- [ ] Testar carregamento de tools

---

## 🎯 PASSO 4: Integração com SuperDoc

### 4.1 Criar cliente SuperDoc
- [ ] Criar `src/services/SuperDocClient.ts`
- [ ] Implementar conexão MCP
- [ ] Testar chamadas básicas

**Teste**:
```typescript
// Testar chamada:
const result = await superdocClient.callTool({
  name: 'sd_search_content',
  arguments: {
    repo_name: 'core-consorcio',
    pattern: 'teste',
    role: 'admin'
  }
});
```

- [ ] Chamada ao SuperDoc funcionando

### 4.2 Integrar nas tools N2 e N3
- [ ] Tool N2 usa SuperDocClient
- [ ] Tool N3 usa SuperDocClient
- [ ] Testes de integração

---

## 🎯 PASSO 5: Servidor HTTP MCP

### 5.1 Implementar servidor
- [ ] `src/mcp-server/server-http.ts` completo
- [ ] `src/mcp-server/server-http-entry.ts` completo
- [ ] Rotas configuradas

### 5.2 Testar servidor local
```bash
# Rodar
npm install
npm run dev
```

**Validação**:
- [ ] Servidor inicia sem erros
- [ ] http://localhost:9002/health funciona
- [ ] http://localhost:9002/tools lista as 3 tools

---

## 🎯 PASSO 6: Docker do Movidesk AI

### 6.1 Configurar Docker
- [ ] `Dockerfile` criado
- [ ] `docker-compose.yml` criado
- [ ] `.env.example` criado

### 6.2 Testar Docker
```bash
# Criar .env
cp .env.example .env

# Editar .env
code .env

# Configurar:
# SUPERDOC_URL=http://host.docker.internal:9001
# PORT=9002

# Rodar
docker-compose up
```

**Validação**:
- [ ] Container sobe sem erros
- [ ] http://localhost:9002/health funciona
- [ ] Logs mostram conexão com SuperDoc

---

## 🎯 PASSO 7: Testes Integrados

### 7.1 Teste completo do fluxo

**Simular ticket mockado**:
```json
{
  "id": "123",
  "subject": "Erro ao fazer login",
  "description": "Não consigo acessar o sistema",
  "client": "João Silva"
}
```

**Testar**:
- [ ] N1: Identifica campos faltantes (cenário, dispositivo)
- [ ] Mock completo: N1 passa
- [ ] N2: Classifica corretamente
- [ ] N3: Gera sugestão (se defeito)

### 7.2 Teste de erro
- [ ] O que acontece se SuperDoc cair?
- [ ] O que acontece se tool falhar?
- [ ] Logs de erro estão claros?

---

## ✅ CRITÉRIOS DE CONCLUSÃO DA FASE 1

### Funcional
- [ ] SuperDoc rodando localmente (porta 9001)
- [ ] Movidesk AI rodando localmente (porta 9002)
- [ ] 3 tools MCP implementadas (N1, N2, N3)
- [ ] Integração SuperDoc ↔ Movidesk AI funcionando
- [ ] Testes com dados mockados passando

### Documentação
- [ ] README.md com instruções de setup
- [ ] Código comentado
- [ ] .env.example configurado

### Git
- [ ] Código commitado no GitHub
- [ ] Branches organizadas
- [ ] .gitignore configurado (não commitar .env!)

---

## 🚨 PROBLEMAS COMUNS

### Docker não conecta ao SuperDoc
**Solução**: Usar `host.docker.internal` em vez de `localhost`

### Porta já em uso
**Solução**: Mudar porta no docker-compose.yml

### Tools não carregam
**Solução**: Verificar ToolRegistry.ts e erros de compilação

---

**Próxima fase**: FASE 2 - Integração com Movidesk Real