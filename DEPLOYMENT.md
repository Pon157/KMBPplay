# 🚀 Инструкция по развертыванию платформы «КМБП Играет» на сервере

Полное руководство по установке зависимостей, настройке окружения `.env`, запуску сервера Node.js, автоматическому подключению к PostgreSQL, работе Telegram Бота через SOCKS5/HTTP прокси и реальной Email-авторизации (SMTP + Капча).

---

## 📋 1. Системные требования

* **ОС:** Ubuntu 20.04 / 22.04 LTS, Debian 11/12 или CentOS/AlmaLinux
* **Node.js:** v20.x или v22.x LTS
* **Менеджер процессов:** PM2 (`npm install -g pm2`)
* **СУБД:** PostgreSQL 14+ (локальная СУБД или внешняя база)

---

## 📥 2. Загрузка и установка зависимостей

Перейдите в директорию вашего проекта на сервере:

```bash
cd /var/www/kmbp-app

# 1. Установка всех пакетов (включая nodemailer, dotenv, https-proxy-agent, socks-proxy-agent)
npm install

# 2. Установка PM2 глобально для фонового автозапуска
npm install -g pm2
```

---

## ⚙️ 3. Настройка файла окружения `.env`

Создайте файл `.env` в корневой директории проекта (`/var/www/kmbp-app/.env`):

```bash
cp .env.example .env
nano .env
```

Заполните значения всех переменных:

```env
# -----------------------------------------------------------------
# 1. ОСНОВНЫЕ НАСТРОЙКИ СЕРВЕРА
# -----------------------------------------------------------------
PORT=3000
NODE_ENV=production
APP_URL=http://Ваш_IP_или_Домен:3000

# -----------------------------------------------------------------
# 2. ПОДКЛЮЧЕНИЕ К POSTGRESQL (СУБД)
# Format: postgresql://USER:PASSWORD@HOST:PORT/DB_NAME
# -----------------------------------------------------------------
DATABASE_URL=postgresql://kmbp_user:MyStrongPass123@localhost:5432/kmbp_db

# -----------------------------------------------------------------
# 3. НАСТРОЙКА TELEGRAM БОТА АВТОРИЗАЦИИ
# Токен от @BotFather и юзернейм бота
# -----------------------------------------------------------------
TELEGRAM_BOT_TOKEN=789101112:ABCdefGhIJKlmNoPQRsTUVwxyZ_123456
TELEGRAM_BOT_USERNAME=kmbp_auth_bot

# -----------------------------------------------------------------
# 4. ПРОКСИ ДЛЯ TELEGRAM БОТА (SOCKS5 / HTTP)
# -----------------------------------------------------------------
TELEGRAM_PROXY_HOST=185.88.99.86
TELEGRAM_PROXY_PORT=8000
TELEGRAM_PROXY_AUTH=n6CZUF:Py0CSG

# -----------------------------------------------------------------
# 5. НАСТРОЙКА SMTP СЕРВЕРА ДЛЯ ОТПРАВКИ КОДОВ НА ПОЧТУ
# Пример для Mail.ru / Yandex / Gmail или собственного SMTP
# -----------------------------------------------------------------
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=YourEmailAppPassword
SMTP_FROM="КМБП Играет <noreply@yourdomain.com>"

# -----------------------------------------------------------------
# 6. ОБЛАЧНОЕ S3 ХРАНИЛИЩЕ (Опционально)
# -----------------------------------------------------------------
S3_ENDPOINT=https://s3.yandexcloud.net
S3_REGION=ru-central1
S3_BUCKET_NAME=kmbp-media-storage
S3_ACCESS_KEY_ID=your_access_key
S3_SECRET_ACCESS_KEY=your_secret_key

# -----------------------------------------------------------------
# 7. AI GEMINI API KEY (Опционально)
# -----------------------------------------------------------------
GEMINI_API_KEY=your_gemini_api_key_here
```

> ⚡ **Важно:** Файл `.env` загружается **автоматически** с помощью `dotenv` при старте приложения (`node dist/server.cjs`). Экспортировать переменные вручную в систему больше не требуется!

---

## 🤖 4. Настройка Telegram Бота у @BotFather

1. Откройте **Telegram** и перейдите к [@BotFather](https://t.me/BotFather).
2. Отправьте команду `/newbot` и укажите название (например, `КМБП Авторизация`) и юзернейм бота (например, `kmbp_auth_bot`).
3. Скопируйте полученный **HTTP API Token** в `.env` (`TELEGRAM_BOT_TOKEN`).
4. Настройте меню команд у бота в @BotFather (`/setcommands`):
   ```text
   start - Главное меню и авторизация на сайте
   code - Ввести код авторизации с сайта
   status - Статус вашего аккаунта Telegram
   help - Справка и помощь
   ```

---

## 🗄️ 5. Инициализация PostgreSQL

Убедитесь, что база данных создана на вашем сервере PostgreSQL:

```sql
-- В консоли psql:
CREATE DATABASE kmbp_db;
CREATE USER kmbp_user WITH PASSWORD 'MyStrongPass123';
GRANT ALL PRIVILEGES ON DATABASE kmbp_db TO kmbp_user;
```

> **Автоматическое создание таблиц:** При запуске сервера платформа проверяет подключение по `DATABASE_URL` и **автоматически создает все необходимые таблицы** (`kmbp_users`, `kmbp_login_logs`, `kmbp_communities`, `kmbp_chat_messages`, `kmbp_game_lobbies`, `kmbp_ip_bans`, `kmbp_wall_signatures`, `kmbp_system_config`). Никаких дополнительных команд выполнять не нужно!

---

## 🏗️ 6. Сборка и Запуск Проекта

### Сборка приложения:
```bash
npm run build
```
*(Эта команда скомпилирует клиентский React и соберет backend в единый CJS-бандл `dist/server.cjs`)*

### Запуск через PM2:
```bash
# Запуск сервера
pm2 start dist/server.cjs --name "kmbp-app"

# Сохранение процессов для автозапуска при перезагрузке сервера
pm2 save
pm2 startup
```

---

## 🧪 7. Проверка Работоспособности и Тесты

### 1. Проверка работы сервера и базы данных:
```bash
curl http://localhost:3000/api/health
# Ответ: {"status":"ok","dbConnected":true}

curl http://localhost:3000/api/db/status
# Ответ выведет текущее состояние БД и количество созданных таблиц
```

### 2. Проверка статуса Telegram Бота:
```bash
curl http://localhost:3000/api/telegram/bot-status
```
Пример успешного ответа:
```json
{
  "configured": true,
  "isRunning": true,
  "botUsername": "kmbp_auth_bot",
  "botName": "КМБП Авторизация",
  "proxyActive": true,
  "proxyConfig": "185.88.99.86:8000",
  "lastError": null
}
```

### 3. Проверка отправки писем через SMTP и Капчи:
```bash
# Проверить статус SMTP настройки
curl http://localhost:3000/api/auth/smtp-status

# Протестировать подключение к SMTP серверу
curl -X POST http://localhost:3000/api/auth/test-smtp

# Получить математическую капчу (генерирует SVG)
curl http://localhost:3000/api/auth/captcha
```

### 4. Просмотр логов сервера в реальном времени:
```bash
pm2 logs kmbp-app
```

В логах вы увидите:
```text
КМБП Играет Server listening on http://0.0.0.0:3000
[PostgreSQL Database] Tables verified/created successfully!
[TelegramBot] Testing bot connection with getMe...
[TelegramBot] Bot initialized successfully as @kmbp_auth_bot (КМБП Авторизация)
```

---

## 🔄 8. Обновление приложения в будущем

При пуше обновлений:

```bash
git pull
npm install
npm run build
pm2 restart kmbp-app
```

---

## 🛡️ Все готово!
Платформа **КМБП Играет** развернута, автоматически создает таблицы в PostgreSQL, держит активного Telegram-бота через прокси и отправляет реальные 6-значные коды авторизации через SMTP с проверкой математической капчи!
