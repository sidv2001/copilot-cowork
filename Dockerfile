# ─── Stage 1: Install dependencies ───────────────────────────────────────────
FROM oven/bun:1 AS deps

WORKDIR /app/frontend

# Copy only the files needed for dependency installation
COPY frontend/package.json frontend/bun.lock* ./
RUN bun install --frozen-lockfile || bun install

# ─── Stage 2: Build the Next.js app (standalone mode) ────────────────────────
FROM oven/bun:1 AS builder

WORKDIR /app/frontend

# Copy installed dependencies from deps stage
COPY --from=deps /app/frontend/node_modules ./node_modules

# Copy the frontend source code
COPY frontend/ ./

# Build with standalone output for Docker
ENV NEXT_OUTPUT_MODE=standalone
RUN bun run build

# ─── Stage 3: Production runner ──────────────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the standalone server and static assets from the builder
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./.next/static
COPY --from=builder /app/frontend/public ./public

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
