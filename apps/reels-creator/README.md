ffmpeg -i input.mp4 -map 0:a -f segment -segment*time 15 output_221021*%03d.aac

ffmpeg -i ./source/sound/third.mp4 -vn -acodec copy ./source/sound/third.aac

# reels-creator

## Instagram Business API: Insights, Comments, Direct Messages

### Возможности

- Аналитика аккаунта и постов (охват, вовлечённость, графики)
- Управление комментариями (ответы, фильтрация, модерация)
- Direct Messages: чат-центр для операторов
- Роли пользователей: admin, analyst, operator (заготовка)

### Быстрый старт

1. Авторизуйтесь и перейдите в раздел Account
2. Используйте табы: Insights, Comments, Messages для работы с Instagram
3. Все данные — mock, для реальной интеграции требуется подключение к Instagram Business API

### Тесты

- Запуск: `npm test` или `yarn test`
- Покрытие: ключевые endpoints и компоненты (см. **tests**)

### Документация API

- Заготовка Swagger/OpenAPI: см. `docs/` (если потребуется)

---

Для подробной документации и production-интеграции — см. `instagram-dev.md` и комментарии в коде.


