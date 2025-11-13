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
3) Нужно создать и написать несколько строк в .env файл (у нас он строго называется .env). В нем хранится токен и путь к базе данных. Токен скрыт и хранится у админа.
```shell
BOT_TOKEN=ваш_токен_без_кавычек
DB_PATH=./data/homework.db
```
На случай если проверяющему хакатона нужен быстрый доступ (После проверки хакатона мы удалим):
BOT_TOKEN=f9LHodD0cOL4d-chCegXa2_uuYUueSEfV77C4c4-akihmSY11ccc09SoCoEYECogf4jWINOFaRyI_LNGSMe4
4) Далее работаем с Docker, прописываем команду docker init (Docker должен быть запущен) (ЭТО НУЖНО ТОЛЬКО ЕСЛИ ВЫ ХОТИТЕ СОБРАТЬ ОБРАЗ ЗАНОВО, В РЕПОЗИТОРИИ ОН УЖЕ ЕСТЬ)
5) Выбираем стрелочками и enter Node
6) На вопрос о версии либо уточняем, либо нажимаем enter
7) Далее выбираем npm
8) Команда для запуска npm start
9) Прописываем порт, например 8808
10) Перед сборкой контейнера надо заменить содержимое файлов Dockerfile и compose.yaml

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
11) Собираем контейнер командой docker compose up --build 
12) Запускаем бота через Docker, всё должно заработать!

Если нужно запустить бота без Docker, то просто вводим npm start или npm run dev (если надо изменять код)

# Авторы: Константин Белозерцев (ДВФУ) и Ширинский Платон (НИУ ВШЭ).
