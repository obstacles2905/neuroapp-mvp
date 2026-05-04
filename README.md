# NeuroSync (monorepo)

Один репозиторий: **backend** (NestJS), **admin** (Next.js), **mobile** (Expo), плюс **docs** и общая инфраструктура.

Зависимости подключаются через **npm workspaces** из корня — один общий `package-lock.json`.

## Зависимости

После клона:

```bash
npm install
```

(алиас: `npm run install:all`.)

Перед переустановкой при смене lockfile закройте dev-серверы (Node/Expo) и при необходимости удалите старые `node_modules` вручную (на Windows иногда блокируется `.node` в `@next/swc`).

## Скрипты

| Команда | Назначение |
|--------|------------|
| `npm run dev:backend` | Nest в watch |
| `npm run dev:admin` | Next на порту 3001 |
| `npm run dev:mobile` | Expo |
| `npm run lint` | lint во всех пакетах, где есть скрипт |
| `npm run format` | Prettier по репозиторию |

## Мобильное приложение

См. [mobile/README.md](mobile/README.md): из корня `npm run dev:mobile`, либо `cd mobile` и `npx expo start`.
