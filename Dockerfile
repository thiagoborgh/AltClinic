# Dockerfile — AltClinic Backend (Fly.io / Node.js 20)

FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++ sqlite-dev
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache sqlite-libs dumb-init
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY admin ./admin
RUN mkdir -p /app/uploads && chmod 777 /app/uploads
ENV NODE_ENV=production
ENV PORT=8080
ENV TZ=America/Sao_Paulo
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
