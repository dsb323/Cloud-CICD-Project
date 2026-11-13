# Cloud-CICD-Project

Учебный проект по практической работе № 7 «Автоматизация CI/CD для облачных веб-приложений».

Статический сайт-портфолио IT-специалиста с автоматической проверкой и публикацией
на GitHub Pages через GitHub Actions.

**Опубликованный сайт:** `https://<username>.github.io/Cloud-CICD-Project/`
(ссылка появится после выполнения шагов из раздела «Публикация»).

## Возможности сайта

- адаптивная вёрстка для компьютеров, планшетов и телефонов;
- светлая и тёмная темы с сохранением выбора в `localStorage`;
- четыре информационных раздела: «Обо мне», «Навыки», «Проекты», «Контакты»;
- фильтрация проектов по категориям;
- валидация формы обратной связи на JavaScript;
- подсветка активного раздела в меню и кнопка возврата наверх;
- семантическая разметка, `aria`-атрибуты и поддержка `prefers-reduced-motion`.

## Структура проекта

```
Cloud-CICD-Project/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD: проверки + публикация на GitHub Pages
├── docs/
│   ├── pipeline.svg            # схема CI/CD Pipeline
│   ├── preview-desktop.png     # локальный скриншот сайта
│   ├── preview-dark.png
│   ├── preview-mobile.png
│   └── preview-contacts.png
├── scripts/
│   └── check-site.mjs          # проверка структуры и ссылок без зависимостей
├── index.html                  # разметка и контент
├── style.css                   # оформление, темы, адаптивность
├── script.js                   # интерактивность
├── favicon.svg
├── .htmlvalidate.json          # конфигурация html-validate
├── .gitignore
├── README.md
└── REPORT.md                   # отчёт с ответами на вопросы
```

## Локальный запуск

Достаточно открыть `index.html` в браузере. Для проверки в условиях, близких
к GitHub Pages, запустите локальный сервер:

```bash
python3 -m http.server 8080
# затем откройте http://localhost:8080
```

## Локальные проверки

Требуется Node.js 24 (LTS).

```bash
node scripts/check-site.mjs
node --check script.js
npx --yes html-validate@11.21.1 index.html
```

Все три команды используются в CI и должны завершаться с кодом `0`.

## Как работает CI/CD

Workflow `.github/workflows/deploy.yml` запускается при каждом push в `main`
и вручную (`workflow_dispatch`).

1. **build** — получает код, проверяет структуру и ссылки, синтаксис JavaScript
   и валидность HTML, собирает каталог `_site` и загружает его как артефакт.
2. **deploy** — запускается только после успешного `build` и публикует артефакт
   на GitHub Pages.

Если любая проверка падает, job `deploy` не выполняется, а на сайте остаётся
предыдущая рабочая версия.

## Публикация

1. Создайте **публичный** репозиторий `Cloud-CICD-Project` на GitHub.
2. Отправьте проект в репозиторий:

   ```bash
   git init
   git add .
   git commit -m "feat: add portfolio site and CI/CD pipeline"
   git branch -M main
   git remote add origin https://github.com/<username>/Cloud-CICD-Project.git
   git push -u origin main
   ```

3. В репозитории откройте **Settings → Pages**.
4. В блоке **Build and deployment** выберите источник **GitHub Actions**.
5. Перейдите во вкладку **Actions** и дождитесь зелёной галочки у workflow
   «CI/CD — проверка и публикация сайта».
6. Откройте сайт по адресу `https://<username>.github.io/Cloud-CICD-Project/`.

> Если репозиторий создан с README, перед первым push выполните
> `git pull --rebase origin main` или создайте пустой репозиторий без файлов.

## Проверка автоматизации

Измените, например, заголовок в `index.html`, затем выполните:

```bash
git add index.html
git commit -m "content: update hero title"
git push
```

Через несколько секунд на вкладке **Actions** появится новый запуск. После
успешного `deploy` обновите сайт — изменения будут уже опубликованы.

## Настройка под себя

- замените имя, тексты и контакты в `index.html` (контакты сейчас — заглушки);
- добавьте свои проекты в блок `#projects-grid` с атрибутом `data-category`;
- изображения и другие файлы складывайте в `assets/` — workflow копирует эту
  папку в артефакт автоматически;
- при необходимости измените палитру в CSS-переменных `:root` и `[data-theme="dark"]`.

## Лицензия

Учебный проект. Код можно использовать как шаблон для собственных работ.
