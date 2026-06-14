# Etapa 1: Instalación de dependencias
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
# Copiamos package-lock.json en lugar de pnpm-lock.yaml
COPY package.json package-lock.json ./ 
RUN npm ci

# Etapa 2: Construcción del proyecto
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Etapa 3: Imagen de producción
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
# Configuramos el puerto 3033 para Next.js
ENV PORT 3033

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs
EXPOSE 3033
# Next.js detectará automáticamente la variable ENV PORT
CMD ["npm", "start"]