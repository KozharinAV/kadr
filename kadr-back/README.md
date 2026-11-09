# API

Серверная часть сервиса «Кадр»: учётные записи и роли, загрузка видео, очередь обработки, выдача готового ролика и превью.

Один проект запускается двумя процессами. `src/main.ts` принимает HTTP-запросы. `src/worker.ts` забирает задачи из очереди и обрабатывает видео через FFmpeg.

Разрешения: `video.read`, `video.upload`, `video.delete`, `video.retry`, `user.manage`. Набор прав роли записывается при старте.

Схема базы применяется миграциями при старте API. Повторный запуск миграций: `npm run migration:run`.

Запуск всего сервиса описан в [ЗАПУСК.md](../ЗАПУСК.md).

Отдельно, когда PostgreSQL, Redis и хранилище уже запущены:

```bash
copy .env.example .env
npm run start:dev
npm run start:worker:dev
```

Переменные окружения перечислены в `.env.example`. Первая учётная запись администратора берётся из `ADMIN_EMAIL` и `ADMIN_PASSWORD`.

```bash
npm test
npm run lint
```
