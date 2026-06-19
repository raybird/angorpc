FROM node:22 AS builder

WORKDIR /app

# 複製根目錄配置與 shared schemas
COPY package*.json ./
COPY angular.json ./
COPY tsconfig.json ./
COPY shared/ ./shared/

# 安裝依賴
RUN npm ci

# 複製並建置 shared-lib
COPY projects/shared-lib/ ./projects/shared-lib/
RUN npx ng build shared-lib

# 複製並建置 storefront
COPY projects/storefront/ ./projects/storefront/
RUN npx ng build storefront

# 運行階段
FROM node:22-slim

WORKDIR /app

# 複製 build 的結果與依賴
COPY --from=builder /app/dist/storefront /app/dist/storefront
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4200

ENV PORT=4200
ENV API_URL=http://backend:3000/api/rpc

CMD ["node", "dist/storefront/server/server.mjs"]
