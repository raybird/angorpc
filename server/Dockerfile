FROM node:22-slim

WORKDIR /app

# 安裝 bcrypt 的編譯環境與 openssl (Prisma 用)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# 複製 shared 的 schemas 定義 (因為後端有引用)
COPY shared/ /app/shared/

# 複製後端的 package.json 與 prisma schema
COPY server/package*.json /app/server/
COPY server/prisma/ /app/server/prisma/

WORKDIR /app/server
RUN npm ci
RUN ln -s /app/server/node_modules /app/node_modules

# 複製後端其餘程式碼
COPY server/ /app/server/

# 產生 Prisma Client
RUN npx prisma generate

EXPOSE 3000

# 啟動時先做 db push, seed, 再跑服務
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx prisma db seed && npx tsx src/server.ts"]
