# 1️⃣ Build using Node (Next.js needs full worker_threads support)
FROM node:20-slim AS builder
WORKDIR /app

COPY package.json bun.lock ./
RUN npm install

COPY . .
RUN npm run build


# 2️⃣ Install runtime deps with Bun
FROM oven/bun:1.1.38-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

# Copy build artifacts from Node build
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Install only production deps with Bun
RUN bun install --production --frozen-lockfile

EXPOSE 3000
CMD ["bun", "run", "start"]
