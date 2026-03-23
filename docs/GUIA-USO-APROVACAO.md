# Guia de Uso - Fluxo com Aprovação Humana

## Visão Geral

Sistema com **aprovação humana obrigatória**. Claude NUNCA cria notas sem confirmação explícita!

## Fluxo Completo

1. Você: "Listar tickets novos"
2. Claude: Lista tickets aguardando
3. Você: "Analisar ticket 14703"
4. Claude: Analisa + MOSTRA resultado
5. Claude: "Posso criar esta nota? (sim/não)"
6. Você: "sim" (APROVAÇÃO OBRIGATÓRIA)
7. Claude: Cria nota no Movidesk

## Configuração

### 1. Compilar
```bash
cd C:\Users\Administrador\movidesk-ai-mcp
npm run build
```

### 2. Config MCP no Claude Desktop

Settings → Developer → Edit Config:
```json
{
  "mcpServers": {
    "movidesk-queue": {
      "command": "node",
      "args": [
        "C:\\Users\\Administrador\\movidesk-ai-mcp\\dist\\mcp-server\\mcp-queue-server.js"
      ]
    }
  }
}
```

### 3. Reiniciar Claude Desktop

## Como Usar

### Listar Tickets
- "Tem tickets novos?"
- "Quais tickets aguardam análise?"

### Analisar
- "Analisa o ticket 14703"
- "Faz análise N1 do 14704"

### Aprovar
- "sim" / "pode criar" / "ok"

### Rejeitar
- "não" / "espera" / "quero ajustar"

## Regras de Segurança

- Claude NUNCA cria nota sem aprovação
- Notas sempre internas (cliente não recebe)
- Você tem controle total
