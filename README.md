# Этот бот был сделан в рамках хакатона от VK Education и MAX. Команда 238. Бот @t238_hakaton_bot

## Бот нужен для добавления и просмотра домашнего задания на платформе MAX.

### Подразумевается, что бот будет использоваться в групповом чате несколькими участниками, однако в личных сообщениях он тоже работает

Предварительно нужно установить IDE (У нас это VS Code), Docker и node.js.

Для того чтобы запустить бота локально нужно:
1) Склонировать репозиторий командой git clone https://github.com/MrSquirel/bot-max.git
2) Установить библиотеки командами:
3) npm i @maxhub/max-bot-api
4) npm i dotenv
5) npm i nodemon
6) npm add -d typescript
7) npm install sqlite3 sqlite
8) Далее работаем с Docker, прописываем команду docker init (Docker должен быть запущен) (ЭТО НУЖНО ТОЛЬКО ЕСЛИ ВЫ ХОТИТЕ СОБРАТЬ ОБРАЗ ЗАНОВО, В РЕПОЗИТОРИИ ОН УЖЕ ЕСТЬ)
9) Выбираем стрелочками и enter Node
10) На вопрос о версии либо уточняем, либо нажимаем enter
11) Далее выбираем npm
12) Команда для запуска npm start
13) Прописываем порт, например 8808
14) Перед сборкой контейнера надо заменить содержимое файлов Dockerfile и compose.yaml

Dockerfile
```FROM node:18-alpine

WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install --production

# Копируем ВСЕ файлы из корня
COPY . .

# Создаем директорию для данных
RUN mkdir -p /app/data

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S botuser -u 1001

# Меняем владельца файлов
RUN chown -R botuser:nodejs /app
USER botuser

# Запускаем бота из корневой папки
CMD ["node", "index.js"]
```
compose.yaml
```version: '3.8'

services:
  homework-bot:
    build: .
    container_name: homework-bot
    restart: unless-stopped
    env_file:
      - .env
    volumes:
      - bot-data:/app/data
    # Если нужно использовать внешнюю БД вместо SQLite:
    # environment:
    #   - DB_TYPE=postgres
    #   - DB_HOST=postgres
    #   - DB_PORT=5432
    #   - DB_NAME=homework_bot
    #   - DB_USER=botuser
    #   - DB_PASSWORD=yourpassword
    # depends_on:
    #   - postgres

  # Раскомментируйте для использования PostgreSQL вместо SQLite:
  # postgres:
  #   image: postgres:15-alpine
  #   container_name: homework-postgres
  #   restart: unless-stopped
  #   environment:
  #     POSTGRES_DB: homework_bot
  #     POSTGRES_USER: botuser
  #     POSTGRES_PASSWORD: yourpassword
  #   volumes:
  #     - postgres-data:/var/lib/postgresql/data
  #   ports:
  #     - "5432:5432"

volumes:
  bot-data:
  # postgres-data:
```

16) Собираем контейнер командой docker compose up --build 
17) Запускаем бота через Docker, всё должно заработать!

Если нужно запустить бота без Docker, то просто вводим npm start или npm run dev (если надо изменять код)

# Авторы: Константин Белозерцев (ДВФУ) и Ширинский Платон (НИУ ВШЭ).
