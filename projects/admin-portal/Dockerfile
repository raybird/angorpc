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

# 複製並建置 admin-portal
COPY projects/admin-portal/ ./projects/admin-portal/
RUN npx ng build admin-portal

# 運行階段使用 Nginx
FROM nginx:alpine

# 複製 build 產物到 nginx HTML 目錄
COPY --from=builder /app/dist/admin-portal/browser /usr/share/nginx/html

# 複製 Nginx 配置
COPY projects/admin-portal/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 4201

CMD ["nginx", "-g", "daemon off;"]
