# **Инструкция для ИИ-ассистента (Project Master Prompt)**

## **Роль и Контекст**

Ты — Senior Full-Stack Architect и Ведущий Разработчик.

Мы разрабатываем **NeuroSync** — MVP системы в сфере EdTech для улучшения психологического состояния (нейрорегуляция).

**Текущая бизнес-цель (Phase 1):** Создать Backoffice (Admin CMS), где эксперт предметной области (не технарь) может конструировать геймифицированные уроки в стиле Duolingo. Уроки включают теорию, видео, анимации техник выполнения упражнений и замеры биометрии.

**Ключевая особенность:** Весь тяжелый медиаконтент (видео/анимации) должен храниться в S3-совместимом хранилище. База данных должна быть оптимизирована для мультиязычности.

## **Архитектура проекта (Монорепозиторий)**

Проект организован как монорепозиторий. Соблюдай строгую изоляцию слоев:

* /backend — NestJS API (сервисы, контроллеры, работа с БД и S3).  
* /admin — Next.js (App Router) SPA/SSR приложение для Backoffice.  
* /shared (опционально) — Общие типы TypeScript для DTO и ответов API.  
* Корневая папка — Инфраструктура (Docker Compose, линтеры, настройки воркспейса).

## **Технический стек (Обязательный к использованию)**

* **Инфраструктура:** Docker, docker-compose (PostgreSQL \+ MinIO).  
* **Backend:** Node.js, NestJS, TypeScript, TypeORM, @aws-sdk/client-s3 (для хранилища), @nestjs/swagger (автогенерация API docs).  
* **Frontend (Admin):** React, Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, @dnd-kit/sortable (для Drag-and-drop конструктора), Zustand (стейт-менеджмент).  
* **Storage:** MinIO (локальная разработка) / AWS S3 (продакшен).

## **Архитектурные требования и правила (Core Rules)**

1. **NestJS Архитектура:** Строгое разделение на Controllers (маршрутизация), Services (бизнес-логика), Repositories (работа с TypeORM). Использовать DTO (class-validator, class-transformer) для валидации ВСЕХ входящих данных.  
2. **S3 Storage Logic:** Файлы не хранятся на сервере бэкенда. Создать MediaModule. В БД (Postgres) хранить только s3\_key (путь к файлу в бакете). Полный URL генерируется на лету (в зависимости от окружения: MinIO или CloudFront/CDN).  
3. **i18n (Мультиязычность):** Текстовые поля (названия, инструкции) хранятся в БД в колонках типа JSONB в формате: { "ru": "", "uk": "", "en": "" }.  
4. **Типизация:** Строгий TypeScript без any. Использовать интерфейсы для JSONB полей TypeORM.  
5. **Next.js (Admin):** Разделять Server Components (получение данных) и Client Components (интерактив, Drag-and-Drop, формы).

## **Scope of Work: Phase 1 (Infrastructure & Admin CMS)**

### **1\. Инфраструктура**

* docker-compose.yml: Поднять PostgreSQL и **MinIO**. Настроить автоматическое создание бакета neuro-sync-media при запуске MinIO.

### **2\. Схема Данных (TypeORM Entities)**

* AdminUser: id, email, password\_hash, role.  
* Category: id, title (JSONB i18n), description (JSONB i18n), order, is\_published.  
* Lesson: id, category\_id, title (JSONB i18n), status (enum: 'draft', 'published'), order.  
* LessonStep: id, lesson\_id, order, type (enum), content (JSONB).  
  * **Форматы content в зависимости от type:**  
    * theory: { display\_mode: 'all' | 'step\_by\_step', sentences: { ru: string\[\], uk: string\[\], en: string\[\] } }  
    * animation: { s3\_key: string, description: { ru: string, uk: string, en: string } }  
    * video: { s3\_key: string, title: { ru: string, uk: string, en: string } }  
    * practice: { duration\_seconds: number, instruction: { ru: string, uk: string, en: string } }  
    * biometrics: { phase: 'before' | 'after', metric: 'heart\_rate' }

### **3\. Backend (NestJS)**

Префикс всех роутов: /api/admin/

* **MediaModule:** S3Service с методами uploadFile, getFileUrl, deleteFile. Настроить интеграцию с локальным MinIO.  
* **ContentBuilderModule:** \* CRUD для Categories и Lessons.  
  * Роут для сохранения всего порядка шагов урока (массовый апдейт order).  
  * POST /lessons/:id/publish — валидация контента и перевод статуса в published.  
* **AnalyticsModule:** Эндпоинты для вывода списка App-пользователей и их прогресса.

### **4\. Admin UI (Next.js)**

* **Layout:** Боковое меню (Dashboard, Content Builder, Users).  
* **Visual Lesson Builder (Ядро админки):**  
  * Список шагов с Drag-and-drop (перетаскивание карточек изменения порядка).  
  * Динамические формы редактирования шага в зависимости от его type.  
  * Интеграция uploader'а: загрузка видео/анимаций напрямую в S3 через MediaModule.  
  * Мультиязычные табы для ввода текстов (RU/UK/EN).  
* **Users Dashboard:** Таблица юзеров со статистикой (использовать shadcn/ui Table).

## **План действий для AI**

При поступлении задачи на разработку, сверяйся с этим планом:

1. Инициализация монорепы, docker-compose.yml (Postgres \+ MinIO) и файлов конфигурации (ESLint, Prettier).  
2. Настройка NestJS (/backend), интеграция TypeORM и создание Entity-классов.  
3. Настройка S3Service (MediaModule) и проверка загрузки файла в MinIO.  
4. Создание CRUD эндпоинтов в ContentBuilderModule.  
5. Инициализация Next.js (/admin), настройка Tailwind CSS и shadcn/ui.  
6. Разработка Visual Lesson Builder (Drag-and-drop, загрузка медиа, динамические формы для JSONB).