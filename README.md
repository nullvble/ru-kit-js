# ru-kit-js

[![npm](https://img.shields.io/npm/v/ru-kit-js.svg)](https://www.npmjs.com/package/ru-kit-js)
[![CI](https://github.com/nullvble/ru-kit-js/actions/workflows/ci.yml/badge.svg)](https://github.com/nullvble/ru-kit-js/actions/workflows/ci.yml)
[![types](https://img.shields.io/npm/types/ru-kit-js.svg)](https://www.npmjs.com/package/ru-kit-js)
[![license](https://img.shields.io/npm/l/ru-kit-js.svg)](./LICENSE)

Утилиты для российской специфики в одном пакете с типами TypeScript:
проверка реквизитов (ИНН, ОГРН, СНИЛС, БИК, счета) и генераторы тестовых значений,
склонение слов после чисел, сумма прописью, телефоны, транслитерация и ФИО.

*Russian-specific utilities: tax ID / bank details validation, pluralization, amount in words, phones, transliteration.*

- **TypeScript**, без зависимостей, ESM и CommonJS, Node.js 20+ и браузеры, tree-shaking
- **Понятные ошибки на русском** — сообщение можно сразу показать в форме
- **Проверено** на реальных реквизитах и тысячах сгенерированных значений

📖 **[Документация](https://nullvble.github.io/ru-kit-js/)**

## Установка

```bash
npm install ru-kit-js
```

## Реквизиты

```ts
import { validateInn, isValidSnils, validateBankAccount } from 'ru-kit-js';

validateInn('7707083893');
// { valid: true, value: '7707083893', details: { kind: 'legal', taxOfficeCode: '7707' } }

validateInn('7707083894');
// { valid: false, error: 'invalid_checksum', message: 'Неверное контрольное число ИНН' }

isValidSnils('112-233-445 95'); // true — разделители допускаются
validateBankAccount('40702810...', '044525225'); // счёт проверяется вместе с БИК
```

| Реквизит | Проверка | Генератор |
|---|---|---|
| ИНН организации (10) и физлица / ИП (12) | `validateInn`, `isValidInn` | `generateInn({ kind })` |
| ОГРН (13) | `validateOgrn`, `isValidOgrn` | `generateOgrn()` |
| ОГРНИП (15) | `validateOgrnip`, `isValidOgrnip` | `generateOgrnip()` |
| СНИЛС (11) | `validateSnils`, `isValidSnils`, `formatSnils` | `generateSnils()` |
| КПП (9) | `validateKpp`, `isValidKpp` | `generateKpp()` |
| БИК (9) | `validateBik`, `isValidBik` | `generateBik()` |
| Расчётный счёт + БИК | `validateBankAccount`, `isValidBankAccount` | `generateBankAccount(bik)` |
| Корсчёт + БИК | `validateCorrespondentAccount`, `isValidCorrespondentAccount` | — |

Функции `validate*` возвращают нормализованное значение и детали (тип ИНН, год и регион ОГРН…)
или код ошибки (`empty`, `invalid_characters`, `invalid_length`, `invalid_format`, `invalid_checksum`)
с сообщением на русском. Функции `isValid*` — короткая форма, возвращают `boolean`.

Генераторы создают значения с правильными контрольными суммами для тестов, сидов и демо-стендов.
Передайте `random` с зерном, чтобы данные были воспроизводимыми.

## Числа и деньги

```ts
import { plural, formatCount, numberToWords, amountInWords } from 'ru-kit-js';

plural(3, ['товар', 'товара', 'товаров']);           // 'товара'
formatCount(21, ['отзыв', 'отзыва', 'отзывов']);      // '21 отзыв'

numberToWords(2021);                                  // 'две тысячи двадцать один'
numberToWords(2, { gender: 'feminine' });             // 'две'

amountInWords(1234.5);
// 'Одна тысяча двести тридцать четыре рубля 50 копеек'
amountInWords('2 001 001,01', { minor: 'words' });
// 'Два миллиона одна тысяча один рубль одна копейка'
amountInWords(100, { currency: 'USD', minor: 'none' }); // 'Сто долларов'
```

## Телефоны

```ts
import { parsePhone, normalizePhone, formatPhone, maskPhone } from 'ru-kit-js';

normalizePhone('8 (916) 123-45-67');        // '+79161234567' — для хранения
formatPhone('89161234567');                 // '+7 (916) 123-45-67'
formatPhone('89161234567', 'national');     // '8 (916) 123-45-67'
maskPhone('+79161234567');                  // '+7 (916) ***-**-67'
parsePhone('+7 701 123 45 67');
// { e164: '+77011234567', national: '7011234567', areaCode: '701', country: 'KZ', mobile: true }
```

## Транслитерация

```ts
import { transliterate, slugify } from 'ru-kit-js';

transliterate('Юлия Щербакова');                         // 'Yuliya Shcherbakova'
transliterate('Юлия Щербакова', { scheme: 'passport' }); // 'Iuliia Shcherbakova' — как в загранпаспорте
transliterate('Цирк', { scheme: 'gost' });               // 'Cirk' — ГОСТ 7.79-2000, система Б
slugify('Ёлки-палки: 10 рецептов на Новый год!');        // 'elki-palki-10-retseptov-na-novyy-god'
```

## ФИО

```ts
import { parseFullName, formatInitials, detectGender } from 'ru-kit-js';

parseFullName('анна сергеевна каренина');
// { lastName: 'Каренина', firstName: 'Анна', middleName: 'Сергеевна' }
formatInitials('Иванов Иван Иванович');                    // 'Иванов И. И.'
formatInitials('Иванов Иван Иванович', { order: 'initials-first' }); // 'И. И. Иванов'
detectGender('Петрова Анна Ильинична');                    // 'female'
```

## Разработка

```bash
npm install
npm test            # тесты
npm run typecheck   # проверка типов
npm run build       # сборка в dist/ (ESM + CJS + .d.ts)
npm run docs        # документация в docs/api
```

Публикация: поднимите версию (`npm version minor`), запушьте и запустите workflow **Release**
во вкладке Actions (нужен секрет `NPM_TOKEN`) — тег создастся автоматически.

## Лицензия

[MIT](./LICENSE)
