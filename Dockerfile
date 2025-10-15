FROM oven/bun:latest AS builder

WORKDIR /app

COPY package.json bun.lock tsconfig.json ./

RUN bun install 

COPY . .

FROM oven/bun:latest

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/*.json ./
COPY --from=builder /app/*.lock ./
COPY --from=builder /app/static ./static

EXPOSE 3000

CMD ["bun", "run", "start"]
