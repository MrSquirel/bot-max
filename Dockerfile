FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

RUN mkdir -p /app/data

RUN addgroup -g 1001 -S nodejs
RUN adduser -S botuser -u 1001

RUN chown -R botuser:nodejs /app
USER botuser

CMD ["node", "index.js"]
