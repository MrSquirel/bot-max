# Этот бот был сделан в рамках хакатона от VK Education и MAX. Команда 238. Бот @t238_hakaton_bot

## Бот нужен для добавления и просмотра домашнего задания на платформе MAX.

### Подразумевается, что бот будет использоваться в групповом чате несколькими участниками, однако в личных сообщениях он тоже работает

Предварительно нужно установить IDE (У нас это VS Code), Docker и node.js.

Для того чтобы запустить бота локально нужно:
1) Склонировать репозиторий командой git clone https://github.com/MrSquirel/bot-max.git
2) Установить библиотеки командами:
```shell
npm i @maxhub/max-bot-api
npm i dotenv
npm i nodemon
npm add -d typescript
npm install sqlite3 sqlite
```
3) Далее работаем с Docker, прописываем команду docker init (Docker должен быть запущен) (ЭТО НУЖНО ТОЛЬКО ЕСЛИ ВЫ ХОТИТЕ СОБРАТЬ ОБРАЗ ЗАНОВО, В РЕПОЗИТОРИИ ОН УЖЕ ЕСТЬ)
4) Выбираем стрелочками и enter Node
5) На вопрос о версии либо уточняем, либо нажимаем enter
6) Далее выбираем npm
7) Команда для запуска npm start
8) Прописываем порт, например 8808
9) Перед сборкой контейнера надо заменить содержимое файлов Dockerfile и compose.yaml

Dockerfile
```Dockerfile
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
```
compose.yaml
```YAML
version: '3.8'

services:
  homework-bot:
    build: .
    container_name: homework-bot
    restart: unless-stopped
    env_file:
      - .env
    volumes:
      - bot-data:/app/data
volumes:
  bot-data:
```

16) Собираем контейнер командой docker compose up --build 
17) Запускаем бота через Docker, всё должно заработать!

Если нужно запустить бота без Docker, то просто вводим npm start или npm run dev (если надо изменять код)

# Авторы: Константин Белозерцев (ДВФУ) и Ширинский Платон (НИУ ВШЭ).
