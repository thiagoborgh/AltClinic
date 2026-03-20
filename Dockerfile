# =============================================================================
# Stage 1: Dependencias da API Express
# =============================================================================
FROM node:20-alpine AS deps-api
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# =============================================================================
# Stage 2: Build do Next.js (web/)
# =============================================================================
FROM node:20-alpine AS build-web
WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci
COPY web/ .
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
RUN npm run build

# =============================================================================
# Stage 3: Imagem final
# =============================================================================
FROM node:20-alpine AS final
RUN apk add --no-cache dumb-init curl

WORKDIR /app

# Express
COPY --from=deps-api /app/node_modules ./node_modules
COPY src/ ./src/
COPY package.json ./

# Next.js
COPY --from=build-web /app/web/.next ./web/.next
COPY --from=build-web /app/web/node_modules ./web/node_modules
COPY --from=build-web /app/web/package.json ./web/package.json
COPY --from=build-web /app/web/public ./web/public

# Entrypoint
COPY entrypoint.sh .

EXPOSE 8080

ENTRYPOINT ["dumb-init", "--"]
CMD ["./entrypoint.sh"]
