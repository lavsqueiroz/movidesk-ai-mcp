# ✅ CHECKLIST DETALHADO - FASE 3

> **Fase**: Deploy em Produção  
> **Objetivo**: Colocar no servidor da empresa  
> **Prazo**: 1 dia  
> **Status**: ⬜ AGUARDANDO FASES 1 e 2

---

## 📋 PRÉ-REQUISITOS

### FASES 1 e 2 concluídas
- [ ] Código 100% funcional localmente
- [ ] Testes com Movidesk real passando
- [ ] Notas internas validadas por analistas
- [ ] Sem bugs conhecidos

### Aprovações
- [ ] **Solicitação ao servidor aprovada**
- [ ] **Budget aprovado** (se houver custo)
- [ ] **Time alinhado** sobre o deploy

---

## 🎯 PASSO 1: Preparar Código para Produção

### 1.1 Revisar configurações
- [ ] `.env.example` atualizado
- [ ] `.gitignore` não commita secrets
- [ ] `package.json` com versão correta

### 1.2 Variáveis de ambiente produção

**Criar `.env.production`**:
```bash
# Movidesk
MOVIDESK_TOKEN=token_producao_aqui
MOVIDESK_URL=https://newm.movidesk.com

# SuperDoc (servidor)
SUPERDOC_URL=http://localhost:9001
# OU se em container separado:
SUPERDOC_URL=http://superdoc:9001

# Servidor
PORT=9002
NODE_ENV=production

# Logs
LOG_LEVEL=info
```

- [ ] .env.production criado
- [ ] Valores de produção configurados

### 1.3 Testar build
```bash
# Build TypeScript
npm run build

# Testar build localmente
node dist/mcp-server/server-http-entry.js
```

- [ ] Build sem erros
- [ ] Servidor inicia com build

---

## 🎯 PASSO 2: Documentação Final

### 2.1 README.md completo
- [ ] Descrição do projeto
- [ ] Como rodar localmente
- [ ] Como fazer deploy
- [ ] Variáveis de ambiente explicadas
- [ ] Troubleshooting

### 2.2 Criar DEPLOY.md
```markdown
# Guia de Deploy

## Pré-requisitos
- Docker instalado
- Acesso SSH ao servidor
- Token Movidesk de produção

## Passos
1. SSH no servidor
2. Clonar repositório
3. Configurar .env
4. docker-compose up -d
5. Verificar logs
6. Atualizar webhook Movidesk

## Rollback
...
```

- [ ] DEPLOY.md criado

### 2.3 Documentar arquitetura
- [ ] Diagrama atualizado
- [ ] Fluxos documentados
- [ ] Dependências listadas

---

## 🎯 PASSO 3: Solicitar Acesso ao Servidor

### 3.1 Preparar solicitação

**Template de solicitação**:
```
Assunto: Solicitação de Deploy - Movidesk AI MCP

Projeto: Análise Inteligente de Tickets Movidesk

Recursos necessários:
- Servidor: [nome do servidor]
- Porta: 9002
- Docker: Sim
- Disco: ~500MB
- RAM: ~512MB
- CPU: Mínimo

Dependências:
- SuperDoc já rodando (porta 9001)
- Acesso à internet (webhook Movidesk)

Tempo de deployment: ~30 minutos

Justificativa:
- Automação de análise de tickets
- Redução de tempo dos analistas
- Melhoria na qualidade do atendimento

Testes realizados:
✅ Desenvolvimento local completo
✅ Testes com Movidesk real (ngrok)
✅ Validação com analistas

Riscos:
- Baixo: código isolado em container
- Não afeta SuperDoc em produção
- Rollback rápido (< 5 min)

Contato:
[Seu nome e email]
```

- [ ] Solicitação enviada
- [ ] Aprovação recebida
- [ ] Data de deploy agendada

---

## 🎯 PASSO 4: Deploy no Servidor

### 4.1 Acessar servidor
```bash
ssh usuario@servidor.empresa.com
```

- [ ] Acesso SSH funcionando

### 4.2 Preparar ambiente
```bash
# Ir para pasta de projetos
cd /opt/apps  # ou /home/apps

# Verificar Docker
docker --version
docker-compose --version

# Verificar SuperDoc rodando
docker ps | grep superdoc
```

- [ ] Docker instalado
- [ ] SuperDoc rodando

### 4.3 Clonar repositório
```bash
# Clonar
git clone https://github.com/lavsqueiroz/movidesk-ai-mcp.git
cd movidesk-ai-mcp

# Checkout versão estável
git checkout tags/v1.0.0  # ou branch: git checkout main
```

- [ ] Código clonado

### 4.4 Configurar ambiente
```bash
# Copiar .env.example
cp .env.example .env

# Editar com dados de produção
vim .env
# OU
nano .env
```

**Configurar**:
- [ ] MOVIDESK_TOKEN (produção)
- [ ] SUPERDOC_URL
- [ ] PORT=9002
- [ ] NODE_ENV=production

### 4.5 Build e start
```bash
# Build
docker-compose build

# Iniciar em background
docker-compose up -d

# Ver logs
docker-compose logs -f
```

**Aguardar**: "✅ Servidor HTTP iniciado"

- [ ] Container rodando
- [ ] Logs sem erros

### 4.6 Verificar health
```bash
# No servidor
curl http://localhost:9002/health

# Se tiver IP público:
curl http://IP_SERVIDOR:9002/health
```

**Esperado**: `{"status": "ok"}`

- [ ] Health check OK

---

## 🎯 PASSO 5: Configurar Firewall

### 5.1 Liberar porta (se necessário)
```bash
# Ubuntu/Debian
sudo ufw allow 9002/tcp

# OU via configuração do servidor
# (depende da infraestrutura)
```

- [ ] Porta 9002 liberada

### 5.2 Testar acesso externo
```bash
# Do seu PC
curl http://IP_SERVIDOR:9002/health
```

- [ ] Acessível externamente

---

## 🎯 PASSO 6: Atualizar Webhook Movidesk

### 6.1 Obter URL pública

**Opções**:
- IP direto: `http://200.150.10.50:9002`
- Domínio: `http://server.empresa.com:9002`
- HTTPS (recomendado): `https://server.empresa.com:9002`

- [ ] URL pública definida: `_______________________`

### 6.2 Atualizar gatilho no Movidesk

**Ir em**: Configurações → Automação → Gatilhos

**Editar gatilho**:
- Nome: IA - Análise de Ticket (PRODUÇÃO)
- URL: `https://server.empresa.com:9002/webhook/ticket-created`

- [ ] Webhook atualizado
- [ ] Gatilho de teste desabilitado

### 6.3 Atualizar campo customizado

**Campo "Analisar com IA"**:
- URL: `https://server.empresa.com:9002/webhook/analyze-button`

- [ ] Campo atualizado

---

## 🎯 PASSO 7: Testes em Produção

### 7.1 Criar ticket de teste

**Ticket**:
```
Título: [TESTE PRODUÇÃO] Validação deploy
Descrição: Teste de integração em produção
```

- [ ] Ticket criado
- [ ] Webhook recebido (ver logs)
- [ ] Nota interna adicionada
- [ ] Análise correta

### 7.2 Testar botão
- [ ] Abrir ticket
- [ ] Clicar "Analisar com IA"
- [ ] Nova análise executada

### 7.3 Monitorar logs
```bash
# No servidor
cd /opt/apps/movidesk-ai-mcp
docker-compose logs -f --tail=100
```

- [ ] Logs sem erros
- [ ] Performance OK

---

## 🎯 PASSO 8: Monitoramento

### 8.1 Configurar logs persistentes
- [ ] Logs salvos em volume Docker
- [ ] Rotação de logs configurada

### 8.2 Health checks
```bash
# Criar script de monitoramento
cat > /opt/scripts/check-movidesk-ai.sh << 'EOF'
#!/bin/bash
if ! curl -sf http://localhost:9002/health > /dev/null; then
  echo "[$(date)] Movidesk AI está DOWN!" >> /var/log/alerts.log
  # Enviar alerta (email, Slack, etc)
fi
EOF

chmod +x /opt/scripts/check-movidesk-ai.sh

# Adicionar ao cron (a cada 5 min)
crontab -e
*/5 * * * * /opt/scripts/check-movidesk-ai.sh
```

- [ ] Health check agendado

### 8.3 Alertas
- [ ] Configurar alertas de erro
- [ ] Definir quem recebe alertas

---

## 🎯 PASSO 9: Documentação Operacional

### 9.1 Criar runbook

**Criar `docs/RUNBOOK.md`**:
```markdown
# Runbook - Movidesk AI MCP

## Como reiniciar
SSH: ssh usuario@servidor
Comando: cd /opt/apps/movidesk-ai-mcp && docker-compose restart

## Ver logs
Comando: docker-compose logs -f

## Rollback
1. git checkout [versão anterior]
2. docker-compose down
3. docker-compose up -d

## Contatos
Responsável: [Nome]
Email: [email]
Slack: [canal]
```

- [ ] Runbook criado

### 9.2 Treinar time
- [ ] Apresentação sobre o sistema
- [ ] Demo ao vivo
- [ ] Q&A com analistas
- [ ] Distribuir documentação

---

## 🎯 PASSO 10: Go Live

### 10.1 Comunicar go-live

**Email para o time**:
```
Assunto: ✅ Sistema IA de Análise de Tickets - ATIVO

O sistema de análise inteligente de tickets está ativo!

O que mudou:
- Tickets novos recebem análise automática (nota interna)
- Botão "Analisar com IA" disponível em todos os tickets

Como usar:
1. Abra qualquer ticket
2. Veja a nota "🤖 ANÁLISE AUTOMATIZADA"
3. Valide sugestões antes de aplicar

Dúvidas: [canal Slack / email]
```

- [ ] Time comunicado

### 10.2 Monitorar primeiros dias
- [ ] Verificar logs diariamente
- [ ] Coletar feedback dos analistas
- [ ] Ajustar conforme necessário

### 10.3 Métricas de sucesso

**Acompanhar**:
- Quantos tickets analisados/dia
- Taxa de acerto da classificação
- Tempo economizado dos analistas
- Satisfação do time

- [ ] Dashboard de métricas criado

---

## ✅ CRITÉRIOS DE CONCLUSÃO DA FASE 3

### Deploy
- [ ] Rodando em produção 24/7
- [ ] Webhook Movidesk em produção
- [ ] Logs e monitoramento ativos

### Operação
- [ ] Time treinado
- [ ] Runbook documentado
- [ ] Alertas configurados

### Sucesso
- [ ] Tickets sendo analisados automaticamente
- [ ] Analistas usando e validando
- [ ] Sem incidentes graves

---

## 🚨 PLANO DE ROLLBACK

### Se algo der errado:

**Rollback rápido (< 5 min)**:
```bash
# No servidor
cd /opt/apps/movidesk-ai-mcp
docker-compose down

# Desabilitar webhook no Movidesk
# (via interface web)
```

**Rollback completo**:
```bash
# Voltar versão anterior
git checkout [versão_anterior]
docker-compose up -d

# OU remover completamente
docker-compose down
cd ..
rm -rf movidesk-ai-mcp
```

---

**STATUS FINAL**: 🎉 PROJETO CONCLUÍDO!