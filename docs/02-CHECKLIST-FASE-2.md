# ✅ CHECKLIST DETALHADO - FASE 2

> **Fase**: Integração com Movidesk Real  
> **Objetivo**: Testar webhooks e API Movidesk  
> **Prazo**: 3-5 dias  
> **Status**: ⬜ AGUARDANDO FASE 1

---

## 📋 PRÉ-REQUISITOS

### FASE 1 concluída
- [ ] SuperDoc rodando localmente
- [ ] Movidesk AI rodando localmente
- [ ] Tools MCP funcionando
- [ ] Testes mockados passando

### Acessos necessários
- [ ] **Token API Movidesk** ⚠️ CRÍTICO - pedir AGORA!
- [ ] **Permissões Movidesk**: leitura + escrita de tickets
- [ ] **Acesso admin Movidesk**: para configurar webhooks

---

## 🎯 PASSO 1: Obter Token Movidesk

### 1.1 Solicitar token
**Para quem pedir**: [ANOTAR AQUI RESPONSÁVEL]

**O que pedir**:
```
Preciso de token API do Movidesk com as seguintes permissões:

✅ Leitura de tickets
✅ Escrita em tickets (adicionar ações/notas internas)
✅ Criação de campos customizados

Motivo: Desenvolvimento de integração IA para análise automática de tickets
```

- [ ] Solicitação enviada
- [ ] Token recebido
- [ ] Token testado (chamada básica funciona)

### 1.2 Configurar token no projeto
```bash
# Editar .env
MOVIDESK_TOKEN=seu_token_aqui
MOVIDESK_URL=https://newm.movidesk.com
```

- [ ] Token configurado no .env

---

## 🎯 PASSO 2: Implementar Cliente Movidesk

### 2.1 Criar MovideskClient.ts
- [ ] Criar `src/services/MovideskClient.ts`
- [ ] Implementar autenticação
- [ ] Implementar métodos básicos

**Métodos necessários**:
```typescript
class MovideskClient {
  // Buscar ticket por ID
  async getTicket(ticketId: string)
  
  // Adicionar nota interna
  async addInternalNote(ticketId: string, content: string)
  
  // Atualizar campos customizados
  async updateCustomFields(ticketId: string, fields: object)
}
```

- [ ] MovideskClient implementado

### 2.2 Testar cliente
```typescript
// Teste 1: Buscar ticket
const ticket = await movideskClient.getTicket('123');

// Teste 2: Adicionar nota
await movideskClient.addInternalNote('123', 'Teste de nota interna');
```

- [ ] getTicket funcionando
- [ ] addInternalNote funcionando
- [ ] Nota aparece no Movidesk

---

## 🎯 PASSO 3: Implementar Handler de Webhook

### 3.1 Criar endpoint webhook
- [ ] Criar rota `POST /webhook/ticket-created`
- [ ] Validar payload do Movidesk
- [ ] Logar dados recebidos

**Estrutura esperada**:
```json
{
  "Id": 123,
  "Subject": "Título do ticket",
  "Description": "Descrição",
  "Actions": [...]
}
```

### 3.2 Processar webhook
```typescript
// Fluxo:
// 1. Recebe webhook
// 2. Extrai dados do ticket
// 3. Chama análise N1 → N2 → N3
// 4. Gera nota interna formatada
// 5. Envia nota ao Movidesk
```

- [ ] Handler de webhook implementado
- [ ] Processamento N1→N2→N3 integrado

---

## 🎯 PASSO 4: Configurar ngrok

### 4.1 Instalar ngrok
```bash
# Via Homebrew (Mac)
brew install ngrok

# Ou baixar de: https://ngrok.com/download
```

- [ ] ngrok instalado

### 4.2 Rodar ngrok
```bash
# Terminal 1: Rodar Movidesk AI
docker-compose up

# Terminal 2: Rodar ngrok
ngrok http 9002
```

**Anotar URL gerada**:
```
Forwarding: https://abc123.ngrok.io -> localhost:9002
```

- [ ] ngrok rodando
- [ ] URL pública anotada: `_________________________`

### 4.3 Testar ngrok
```bash
# Em outro terminal:
curl https://abc123.ngrok.io/health
```

- [ ] ngrok funcionando
- [ ] Endpoint acessível publicamente

---

## 🎯 PASSO 5: Configurar Webhook no Movidesk

### 5.1 Acessar Movidesk
- [ ] Login: https://newm.movidesk.com
- [ ] Ir em: Configurações → Automação → Gatilhos

### 5.2 Criar gatilho TESTE

**Configuração**:
```
Nome: [TESTE] IA - Análise de Ticket
Tipo: Ticket

Condições:
  - Quando: Ticket for criado
  - E: Status = Novo
  
Ações:
  - Acionar Webhook
  - URL: https://abc123.ngrok.io/webhook/ticket-created
```

- [ ] Gatilho criado
- [ ] Configuração salva

### 5.3 Criar ticket de teste

**Ticket INCOMPLETO (para testar N1)**:
```
Título: [TESTE] Erro ao fazer login
Descrição: Não consigo acessar
Cliente: Teste IA
```

- [ ] Ticket criado
- [ ] Webhook disparou (ver logs ngrok)
- [ ] Nota interna adicionada
- [ ] Nota lista campos faltantes

**Ticket COMPLETO (para testar N2/N3)**:
```
Título: [TESTE] Erro ao fazer login
Descrição: 
Usuário: teste@email.com
Cenário: Tela de login trava após clicar em "Entrar"
Dispositivo: Chrome 120, Windows 11
Versão do app: 2.1.5
```

- [ ] Ticket criado
- [ ] N1 passou (completo)
- [ ] N2 classificou (defeito ou evolutiva)
- [ ] N3 sugeriu correção (se defeito)
- [ ] Nota interna formatada corretamente

---

## 🎯 PASSO 6: Template de Nota Interna

### 6.1 Validar template

**Formato esperado**:
```markdown
🤖 ANÁLISE AUTOMATIZADA - [Data/Hora]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 N1 - VALIDAÇÃO DE INFORMAÇÕES
Status: ✅ Completo / ❌ Incompleto

Informações Recebidas:
✓ Usuário: teste@email.com
✓ Cenário: Tela de login trava...
✓ Dispositivo: Chrome 120, Windows 11

Ação Necessária: Nenhuma / Solicitar [campos]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 N2 - CLASSIFICAÇÃO TÉCNICA
Tipo: 🐛 DEFEITO / 🚀 EVOLUTIVA

Análise SuperDoc:
- Documentação consultada: [docs]
- Contexto técnico: [resumo]

Classificação: DEFEITO
Motivo: [explicação]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 N3 - SUGESTÃO DE CORREÇÃO

Possível Causa:
- [análise]

Sugestão de Correção:
1. [passo 1]
2. [passo 2]

Prioridade Sugerida: MÉDIA
Complexidade: BAIXA

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ Esta é uma análise automática.
Valide antes de aplicar qualquer ação.
```

- [ ] Template implementado
- [ ] Formato validado com analistas
- [ ] Ajustes solicitados aplicados

---

## 🎯 PASSO 7: Campo Customizado (Botão)

### 7.1 Criar campo no Movidesk

**Configuração**:
```
Ir em: Configurações → Customização → Campos personalizados

Tipo: Ação/Botão
Nome: Analisar com IA
Descrição: Executa análise N1→N2→N3 sob demanda

Ação: Acionar Webhook
URL: https://abc123.ngrok.io/webhook/analyze-button
```

- [ ] Campo criado
- [ ] Botão aparece na tela de ticket

### 7.2 Implementar endpoint do botão
- [ ] Criar rota `POST /webhook/analyze-button`
- [ ] Processar igual ao ticket-created
- [ ] Testar clicando no botão

- [ ] Botão funciona
- [ ] Análise executada sob demanda

---

## 🎯 PASSO 8: Testes Completos

### 8.1 Cenários de teste

**Teste 1: Ticket incompleto**
- [ ] Criar ticket sem campos obrigatórios
- [ ] N1 detecta campos faltantes
- [ ] Nota interna lista o que falta

**Teste 2: Ticket completo - Defeito**
- [ ] Criar ticket completo (bug)
- [ ] N1 valida OK
- [ ] N2 classifica como DEFEITO
- [ ] N3 sugere correção
- [ ] Nota interna completa

**Teste 3: Ticket completo - Evolutiva**
- [ ] Criar ticket completo (feature)
- [ ] N1 valida OK
- [ ] N2 classifica como EVOLUTIVA
- [ ] Nota gera resumo para P.O.

**Teste 4: Botão manual**
- [ ] Abrir ticket existente
- [ ] Clicar "Analisar com IA"
- [ ] Nova análise executada
- [ ] Nova nota adicionada

### 8.2 Testes de erro

**Teste 5: SuperDoc offline**
- [ ] Derrubar SuperDoc
- [ ] Criar ticket
- [ ] Sistema trata erro gracefully
- [ ] Nota informa erro temporário

**Teste 6: Webhook duplicado**
- [ ] Movidesk envia webhook 2x
- [ ] Sistema não processa duplicado
- [ ] Ou: processa mas avisa

---

## ✅ CRITÉRIOS DE CONCLUSÃO DA FASE 2

### Funcional
- [ ] Webhook recebendo tickets do Movidesk
- [ ] Análise N1→N2→N3 executando
- [ ] Nota interna sendo adicionada
- [ ] Campo customizado funcionando
- [ ] Testes com tickets reais passando

### Qualidade
- [ ] Análises fazem sentido
- [ ] Notas estão claras e úteis
- [ ] Analistas validaram formato

### Documentação
- [ ] README atualizado com instruções ngrok
- [ ] Troubleshooting documentado

---

## 🚨 PROBLEMAS COMUNS

### Webhook não chega
- Verificar URL ngrok no Movidesk
- Ver logs ngrok (terminal)
- Verificar firewall

### Nota não aparece
- Verificar permissões token
- Ver logs do Movidesk AI
- Testar addInternalNote diretamente

### SuperDoc não responde
- Verificar se está rodando
- Verificar URL em .env
- Testar chamada direta ao SuperDoc

---

**Próxima fase**: FASE 3 - Deploy em Produção