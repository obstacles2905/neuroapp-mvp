# Neuro — мобильное приложение (Expo)

Кросс-платформа: **iOS** и **Android**. Стек: **Expo 54 + Expo Router + TypeScript**.

Порядок работ и границы MVP: [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md).

## Требования

- Node 20+ (LTS)
- iOS: Xcode / симулятор (на macOS) или Expo Go
- Android: Android Studio / эмулятор или устройство

## Запуск

Из корня репозитория `neuro-app` (после клона):

```bash
npm install
cd mobile
cp .env.example .env
npx expo start
```

На Windows вместо `cp` используй `copy .env.example .env`. Либо из корня: `npm run dev:mobile` (после настройки `mobile/.env`).

- В `EXPO_PUBLIC_API_URL` укажи URL Nest-бэка (`../backend`). Для **Android-эмулятора** `localhost` не указывает на твой ПК: используй `http://10.0.2.2:3000` (или `adb reverse` / LAN IP).
- `EXPO_PUBLIC_DEV_BYPASS_AUTH=true` — пропустить экран входа (только dev).

## Скрипты

| Команда | Назначение |
|--------|------------|
| `npm run start` | Dev-сервер Metro |
| `npm run android` / `npm run ios` | Запуск на платформе |
| `npm run lint` | ESLint (expo) |

## Структура (фаза 0)

- `app/` — маршруты: `index` (редирект), `(auth)/login`, `(app)/(tabs)` (Главная, Учёба, Сейчас, Джем, Профиль), `modal`
- `contexts/AuthContext.tsx` — сессия (токен в `expo-secure-store`, профиль с API)
- `lib/api/` — базовый `fetch` + `Authorization` + обработка 401

## Бэкенд

В монорепозитории: `../backend`. Контракт API уточняется по мере внедрения auth для app-пользователей.
