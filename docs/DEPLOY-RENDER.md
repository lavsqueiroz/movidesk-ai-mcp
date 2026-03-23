# 🚀 Deploy no Render

## 📋 Pré-requisitos

1. Conta no [Render](https://render.com)
2. Repositório GitHub conectado
3. Token do Movidesk

---

## 🔧 Passo a Passo

### 1. Conectar Repositório

1. Ir em https://dashboard.render.com
2. Clicar em **"New +"** → **"Web Service"**
3. Conectar repositório: `lavsqueiroz/movidesk-ai-mcp`
4. Render vai detectar o `render.yaml` automaticamente

### 2. Configurar Variáveis de Ambiente

No dashboard do Render, adicionar:

```
MOVIDESK_TOKEN=seu-token-aqui
```

**⚠️ IMPORTANTE:** As outras variáveis já estão no `render.yaml`!

### 3. Deploy

Clicar em **"Create Web Service"**

Render vai:
1. Clonar o repositório
2. Rodar `npm install`
3. Rodar `npm run build`
4. Iniciar com `npm start`

### 4. Pegar URL Pública

Após deploy, Render fornece uma URL como:
```
https://movidesk-ai-mcp.onrender.com
```

---

## ✅ Testar Conexão

### Health Check
```bash
curl https://movidesk-ai-mcp.onrender.com/health
```

Deve retornar:
```json
{
  "status": "ok",
  "service": "movidesk-ai-mcp",
  "queue": {
    "pending": 0,
    "completed": 0
  }
}
```

### Listar Tickets do Movidesk
```bash
curl https://movidesk-ai-mcp.onrender.com/movidesk/tickets
```

---

## 🔗 Configurar Webhook no Movidesk

1. Ir em Movidesk → Configurações → Webhooks
2. Criar novo webhook:
   - **URL**: `https://movidesk-ai-mcp.onrender.com/webhook/ticket-created`
   - **Evento**: Ticket Criado
   - **Método**: POST

---

## 📊 Monitoramento

### Ver Logs no Render
1. Dashboard → Seu serviço
2. Aba "Logs"

### Ver Fila
```bash
curl https://movidesk-ai-mcp.onrender.com/queue/stats
```

---

## 🐛 Troubleshooting

### Deploy falhou
- Ver logs no Render
- Verificar se `package.json` está correto
- Verificar se `render.yaml` está na raiz

### Webhook não recebe
- Verificar URL no Movidesk
- Ver logs do Render
- Testar manualmente com curl

---

**Pronto para deploy! 🎉**
