#!/usr/bin/env node
/**
 * Проверка статического сайта без внешних зависимостей.
 * Запускается локально и в GitHub Actions на этапе build.
 */

import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = ['index.html', 'style.css', 'script.js', 'favicon.svg'];
const errors = [];
let checks = 0;

function check(condition, message) {
  checks += 1;
  if (!condition) {
    errors.push(message);
  }
}

for (const file of requiredFiles) {
  try {
    await access(path.join(root, file), constants.R_OK);
    check(true, '');
  } catch {
    check(false, `Не найден обязательный файл: ${file}`);
  }
}

if (errors.length > 0) {
  console.error('Проверка структуры не пройдена:');
  errors.forEach((message) => console.error(`  ✗ ${message}`));
  process.exit(1);
}

const html = await readFile(path.join(root, 'index.html'), 'utf8');

/* Базовые метаданные страницы */
check(/<html[^>]*\blang="[^"]+"/i.test(html), 'У тега <html> не указан атрибут lang');
check(/<title>[^<]+<\/title>/i.test(html), 'Отсутствует или пуст тег <title>');
check(
  /<meta[^>]+name="description"[^>]+content="[^"]+"/i.test(html),
  'Отсутствует meta description'
);
check(/<meta[^>]+name="viewport"/i.test(html), 'Отсутствует meta viewport');
check(/<main\b/i.test(html), 'Отсутствует тег <main>');

/* Подключение стилей и скриптов */
check(/<link[^>]+rel="stylesheet"[^>]+href="style\.css"/i.test(html), 'style.css не подключён в index.html');
check(/<script[^>]+src="script\.js"/i.test(html), 'script.js не подключён в index.html');

/* Информационные разделы */
const sections = html.match(/<section\b[^>]*>/g) ?? [];
check(sections.length >= 3, `Ожидалось минимум 3 секции, найдено: ${sections.length}`);
sections.forEach((tag, index) => {
  check(
    /\baria-labelledby="[^"]+"/.test(tag),
    `Секция №${index + 1} не связана с заголовком через aria-labelledby`
  );
});

/* Кнопки должны иметь явный тип */
const buttons = html.match(/<button\b[^>]*>/g) ?? [];
buttons.forEach((tag, index) => {
  check(
    /\btype="(button|submit|reset)"/.test(tag),
    `У кнопки №${index + 1} не указан атрибут type`
  );
});

/* Уникальность идентификаторов */
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
check(duplicateIds.length === 0, `Повторяющиеся id: ${[...new Set(duplicateIds)].join(', ')}`);

/* Локальные ссылки и ресурсы должны существовать */
const localPaths = new Set();
for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
  const value = match[1].trim();
  if (
    value === '' ||
    value.startsWith('#') ||
    value.startsWith('/') ||
    /^(https?:|mailto:|tel:|data:|javascript:)/i.test(value)
  ) {
    continue;
  }
  localPaths.add(value.split(/[?#]/)[0]);
}

for (const relativePath of localPaths) {
  try {
    await access(path.join(root, relativePath), constants.R_OK);
    check(true, '');
  } catch {
    check(false, `Не найден локальный ресурс: ${relativePath}`);
  }
}

/* Отчёт */
console.log('Проверка статического сайта');
console.log(`  ✓ обязательные файлы: ${requiredFiles.join(', ')}`);
console.log(`  ✓ секций с заголовками: ${sections.length}`);
console.log(`  ✓ кнопок с явным type: ${buttons.length}`);
console.log(`  ✓ уникальных id: ${ids.length}`);
console.log(`  ✓ локальных ресурсов: ${localPaths.size}`);

if (errors.length > 0) {
  console.error(`\nНайдено ошибок: ${errors.length}`);
  errors.forEach((message) => console.error(`  ✗ ${message}`));
  process.exit(1);
}

console.log(`\nУспешно: ${checks} проверок, ошибок нет.`);
