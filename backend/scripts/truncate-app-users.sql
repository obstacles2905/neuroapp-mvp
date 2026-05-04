-- Сброс всех записей приложенческих пользователей и связанного прогресса.
-- user_lesson_progress ссылается на app_users; CASCADE очищает обе таблицы.
-- admin_users и контент (lessons и т.д.) не затрагиваются.

BEGIN;

TRUNCATE TABLE app_users RESTART IDENTITY CASCADE;

COMMIT;
