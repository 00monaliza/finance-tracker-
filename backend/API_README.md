# Finance Tracker API - PostgreSQL Integration

## Что было сделано

### Backend (FastAPI + PostgreSQL)

1. **База данных:**
   - Docker Compose файл для PostgreSQL
   - SQLAlchemy модели: User, BankAccount, Transaction
   - Поддержка категорий расходов и доходов

2. **API эндпоинты:**
   - `/api/auth/send-code` - отправка SMS кода (mock)
   - `/api/auth/verify` - верификация кода и создание пользователя
   - `/api/accounts` - CRUD операции для счетов
   - `/api/transactions` - CRUD операции для транзакций
   - `/api/transactions/stats/summary` - статистика по категориям

3. **Файлы:**
   - `docker-compose.yml` - PostgreSQL контейнер
   - `.env.example` - шаблон переменных окружения
   - `src/database.py` - подключение к БД
   - `src/db_models.py` - SQLAlchemy модели
   - `src/api/main.py` - FastAPI приложение
   - `src/api/schemas.py` - Pydantic схемы
   - `src/api/routers/` - роутеры для accounts, transactions, auth
   - `run_api.py` - скрипт запуска API

### Frontend (React Native)

1. **API клиент:**
   - `lib/config.ts` - конфигурация API
   - `lib/api.ts` - функции для всех API вызовов
   - `lib/storage.ts` - работа с AsyncStorage для user_id

2. **Зависимости:**
   - Добавлен `@react-native-async-storage/async-storage`

## Установка и запуск

### 1. Запуск PostgreSQL

```bash
cd laboratory
docker-compose up -d
```

### 2. Настройка окружения

```bash
cd laboratory
cp .env.example .env
# Отредактируйте .env при необходимости
```

### 3. Установка Python зависимостей

```bash
cd laboratory
pip install -r requirements.txt
```

### 4. Запуск API сервера

```bash
cd laboratory
python run_api.py
```

API будет доступен на `http://localhost:8000`
Документация: `http://localhost:8000/docs`

### 5. Обновление React Native приложения

```bash
cd finance-tracker
npm install
```

**Важно:** Обновите `lib/config.ts` - замените `localhost` на IP адрес вашего Mac для физического устройства или симулятора.

## Статус интеграции

✅ **Выполнено:**
1. ✅ `store/accounts-context.tsx` обновлен для работы с API
2. ✅ `store/transactions-context.tsx` обновлен для работы с API
3. ✅ Экраны авторизации обновлены для сохранения user_id после верификации
4. ✅ Добавлена обработка ошибок и состояний загрузки
5. ✅ `app/index.tsx` проверяет аутентификацию при запуске

## Тестирование

После запуска API и установки зависимостей React Native:

1. Запустите приложение в симуляторе
2. Введите номер телефона (например, +7 (999) 123-45-67)
3. Проверьте консоль API сервера - там будет выведен код для верификации
4. Введите код в приложение
5. После успешной верификации вы будете перенаправлены в основное приложение
6. Все данные будут загружаться из PostgreSQL через API

## Структура БД

- `users` - пользователи (id, phone, created_at)
- `bank_accounts` - счета (id, user_id, name, bank_name, balance, currency, last_four)
- `transactions` - транзакции (id, user_id, type, category, amount, currency, description, date)

## Аутентификация

Сейчас используется простой заголовок `X-User-Id`. После верификации кода сохраняется user_id в AsyncStorage и передается в заголовках всех запросов.

В будущем можно добавить JWT токены для более безопасной аутентификации.

## Статус интеграции

✅ **Выполнено:**
1. ✅ `store/accounts-context.tsx` обновлен для работы с API
2. ✅ `store/transactions-context.tsx` обновлен для работы с API  
3. ✅ Экраны авторизации обновлены для сохранения user_id после верификации
4. ✅ Добавлена обработка ошибок и состояний загрузки
5. ✅ `app/index.tsx` проверяет аутентификацию при запуске

## Тестирование

После запуска API и установки зависимостей React Native:

1. Запустите приложение в симуляторе
2. Введите номер телефона (например, +7 (999) 123-45-67)
3. Проверьте консоль API сервера - там будет выведен код для верификации (формат: `[MOCK SMS] Code for +7XXXXXXXXXX: XXXX`)
4. Введите код в приложение
5. После успешной верификации вы будете перенаправлены в основное приложение
6. Все данные будут загружаться из PostgreSQL через API

## Примечания

- Для разработки используется fallback user_id=1 если заголовок X-User-Id не передан
- SMS коды хранятся в памяти (в production используйте Redis)
- Коды выводятся в консоль API сервера для тестирования
