# NeuroSync (monorepo)

В корне только **общие** dev-зависимости (Prettier). Пакеты **backend**, **admin** и **mobile** ставят зависимости **сами в своих каталогах** — отдельные `package-lock.json`, без npm `workspaces`, чтобы не раздувать общий `node_modules` в корне.

## Зависимости

После клона:

```bash
npm run install:all
```

Или по отдельности: `npm install` в корне, затем `npm install` в `backend/`, `admin/`, `mobile/`.

Перед повторной установкой при смене схемы закройте dev-серверы (Node/Expo) и при необходимости удалите старые `node_modules` вручную (на Windows иногда блокируется `.node` в `@next/swc`).

## Мобильное приложение

См. [mobile/README.md](mobile/README.md): `cd mobile`, `npm install`, `npx expo start`.
