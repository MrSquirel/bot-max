FROM node:18-alpine

WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install --production

# Копируем ВСЕ файлы включая папку src
COPY . .

# Создаем директорию для данных
RUN mkdir -p /app/data

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S botuser -u 1001

# Меняем владельца файлов
RUN chown -R botuser:nodejs /app
USER botuser

# Запускаем бота с правильным путем
CMD ["node", "index.js"]
