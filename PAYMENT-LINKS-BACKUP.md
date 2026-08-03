# Бэкап: оригинальные ссылки оплаты тарифов (GetCourse)

Сохранено перед временной заменой кнопок «Купить» на редирект в Telegram
(https://t.me/m/ffTikRn4NGNi). Всё описанное ниже НЕ удалено из index.html —
модалки оплаты и функции openPayment/closePayment остались в файле как есть,
просто кнопки в тарифах временно не вызывают их. Чтобы вернуть оплату через
GetCourse — верните атрибуты кнопок к исходному виду (см. ниже).

## Было (оригинальные кнопки в блоке #pricing)

```html
<!-- Старт -->
<button onclick="openPayment('start')" class="btn btn-outline btn-block">Купить</button>

<!-- Развитие -->
<button onclick="openPayment('growth')" class="btn btn-primary btn-block">Купить</button>

<!-- Прорыв -->
<button onclick="openPayment('breakthrough')" class="btn btn-outline btn-block">Купить</button>
```

## Соответствие тариф → GetCourse-виджет

| Тариф     | type            | Modal id             | GetCourse widget id |
|-----------|-----------------|-----------------------|----------------------|
| Старт     | `start`         | `pm-start`            | `1629607`            |
| Развитие  | `growth`        | `pm-growth`           | `1629608`            |
| Прорыв    | `breakthrough`  | `pm-breakthrough`     | `1629611`            |

Скрипты виджетов (в теле index.html, ближе к концу, id модалок `pm-start` /
`pm-growth` / `pm-breakthrough`):

```html
<script src="https://yahontovaschool.getcourse.ru/pl/lite/widget/script?id=1629607"></script>
<script src="https://yahontovaschool.getcourse.ru/pl/lite/widget/script?id=1629608"></script>
<script src="https://yahontovaschool.getcourse.ru/pl/lite/widget/script?id=1629611"></script>
```

## Как вернуть оплату через GetCourse обратно

В index.html найти 3 кнопки «Купить» в блоке `#pricing` (сейчас — ссылки на
`https://t.me/m/ffTikRn4NGNi`) и заменить их обратно на исходный HTML из
раздела «Было» выше. Сами модалки (`#pm-start`, `#pm-growth`,
`#pm-breakthrough`) и функции `openPayment()`/`closePayment()` в скрипте
менять не нужно — они не тронуты.
