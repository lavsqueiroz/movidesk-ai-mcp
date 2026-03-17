# ═══════════════════════════════════════════════════════════════
# MOVIDESK AI MCP - DOCKERFILE
# ═══════════════════════════════════════════════════════════════

FROM node:22-alpine

# Metadata
LABEL maintainer="Lavínia Queiroz"
LABEL description="MCP Server para análise de tickets Movidesk"

# Diretório de trabalho
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm install --production

# Copiar código fonte
COPY . .

# Build TypeScript (se necessário)
RUN npm run build || echo "Build step skipped"

# Expor porta
EXPOSE 9002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:9002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicialização
CMD ["npm", "start"]