# 使用官方Node.js 18 LTS映像
FROM node:18-alpine

# 安裝 curl 進行健康檢查
RUN apk add --no-cache curl

# 設置工作目錄
WORKDIR /app

# 創建非root用戶
RUN addgroup -g 1001 -S nodejs
RUN adduser -S orange -u 1001

# 複製package文件
COPY package*.json ./

# 刪除任何現有的 node_modules 並重新安裝依賴
# 這確保 native modules 為 Linux 正確構建
RUN rm -rf node_modules && \
    npm ci --only=production && \
    npm rebuild && \
    npm cache clean --force

# 複製應用代碼（排除 node_modules）
COPY . ./

# 創建數據目錄並設置權限
RUN mkdir -p data && chown -R orange:nodejs /app

# 切換到非root用戶
USER orange

# 暴露端口
EXPOSE 3000

# 設置環境變數
ENV PORT=3000
ENV NODE_ENV=production

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/stock/price || exit 1

# 啟動應用
CMD ["npm", "start"] 