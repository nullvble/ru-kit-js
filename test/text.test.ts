import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  amountInWords,
  capitalizeName,
  detectGender,
  formatCount,
  formatInitials,
  numberToWords,
  parseFullName,
  plural,
  slugify,
  transliterate,
} from '../src/index.js';

describe('plural', () => {
  const forms = ['товар', 'товара', 'товаров'] as const;
  const cases: [number, string][] = [
    [0, 'товаров'], [1, 'товар'], [2, 'товара'], [4, 'товара'], [5, 'товаров'], [11, 'товаров'], [12, 'товаров'],
    [14, 'товаров'], [21, 'товар'], [22, 'товара'], [101, 'товар'], [111, 'товаров'], [112, 'товаров'], [1001, 'товар'], [-1, 'товар'], [-3, 'товара'],
  ];
  for (const [n, expected] of cases) it(`${n} ${expected}`, () => assert.equal(plural(n, forms), expected));

  it('дробные числа — форма родительного падежа единственного числа', () => {
    assert.equal(plural(1.5, ['рубль', 'рубля', 'рублей']), 'рубля');
    assert.equal(formatCount(2.5, ['литр', 'литра', 'литров']), '2,5 литра');
  });

  it('bigint и форматирование с разделителями', () => {
    assert.equal(plural(10n ** 20n + 1n, forms), 'товар');
    assert.equal(formatCount(1500, ['файл', 'файла', 'файлов'], { locale: true }), '1 500 файлов');
  });
});

describe('numberToWords', () => {
  const cases: [number | bigint | string, string][] = [
    [0, 'ноль'], [1, 'один'], [11, 'одиннадцать'], [19, 'девятнадцать'], [20, 'двадцать'], [21, 'двадцать один'],
    [100, 'сто'], [101, 'сто один'], [999, 'девятьсот девяносто девять'], [1000, 'одна тысяча'], [2000, 'две тысячи'],
    [5000, 'пять тысяч'], [11_000, 'одиннадцать тысяч'], [21_000, 'двадцать одна тысяча'], [2021, 'две тысячи двадцать один'],
    [1_000_000, 'один миллион'], [2_001_002, 'два миллиона одна тысяча два'], [1_000_000_000, 'один миллиард'],
    [-15, 'минус пятнадцать'], [10n ** 18n, 'один квинтиллион'], ['123 456', 'сто двадцать три тысячи четыреста пятьдесят шесть'],
  ];
  for (const [n, expected] of cases) it(`${n} → ${expected}`, () => assert.equal(numberToWords(n), expected));

  it('учитывает род', () => {
    assert.equal(numberToWords(1, { gender: 'feminine' }), 'одна');
    assert.equal(numberToWords(2, { gender: 'feminine' }), 'две');
    assert.equal(numberToWords(1, { gender: 'neuter' }), 'одно');
    assert.equal(numberToWords(22, { gender: 'neuter' }), 'двадцать два');
  });

  it('отклоняет некорректный ввод', () => {
    assert.throws(() => numberToWords(1.5), RangeError);
    assert.throws(() => numberToWords('abc'), RangeError);
    assert.throws(() => numberToWords(10n ** 21n), RangeError);
  });
});

describe('amountInWords', () => {
  it('рубли и копейки цифрами — как в документах', () => {
    assert.equal(amountInWords(1234.5), 'Одна тысяча двести тридцать четыре рубля 50 копеек');
    assert.equal(amountInWords(1), 'Один рубль 00 копеек');
    assert.equal(amountInWords(111.21), 'Сто одиннадцать рублей 21 копейка');
    assert.equal(amountInWords(0), 'Ноль рублей 00 копеек');
  });

  it('копейки словами и без копеек', () => {
    assert.equal(amountInWords('2 001 001,01', { minor: 'words' }), 'Два миллиона одна тысяча один рубль одна копейка');
    assert.equal(amountInWords(5.02, { minor: 'words' }), 'Пять рублей две копейки');
    assert.equal(amountInWords(21, { minor: 'none' }), 'Двадцать один рубль');
  });

  it('не теряет точность на плавающей точке и округляет до копеек', () => {
    assert.equal(amountInWords(0.1 + 0.2), 'Ноль рублей 30 копеек');
    assert.equal(amountInWords('1.005'), 'Один рубль 01 копейка');
    assert.equal(amountInWords('9.999'), 'Десять рублей 00 копеек');
    assert.equal(amountInWords('12345678901234.56', { minor: 'none' }), 'Двенадцать триллионов триста сорок пять миллиардов шестьсот семьдесят восемь миллионов девятьсот одна тысяча двести тридцать четыре рубля');
  });

  it('другие валюты и параметры', () => {
    assert.equal(amountInWords(21, { currency: 'USD', minor: 'none' }), 'Двадцать один доллар');
    assert.equal(amountInWords(2.01, { currency: 'EUR' }), 'Два евро 01 цент');
    assert.equal(amountInWords(-5, { capitalize: false }), 'минус пять рублей 00 копеек');
    const tenge = { major: ['тенге', 'тенге', 'тенге'], majorGender: 'masculine', minor: ['тиын', 'тиына', 'тиынов'], minorGender: 'masculine' } as const;
    assert.equal(amountInWords(3.03, { currency: tenge }), 'Три тенге 03 тиына');
  });

  it('отклоняет нечисловой ввод', () => {
    assert.throws(() => amountInWords('12 руб'), RangeError);
    assert.throws(() => amountInWords(Infinity), RangeError);
  });
});

describe('transliterate', () => {
  it('простая схема', () => {
    assert.equal(transliterate('Юлия Щербакова'), 'Yuliya Shcherbakova');
    assert.equal(transliterate('Привет, World! 123'), 'Privet, World! 123');
    assert.equal(transliterate('Хабаровск, Цюрих, подъезд'), 'Khabarovsk, Tsyurikh, podezd');
  });

  it('паспортная схема (ICAO)', () => {
    assert.equal(transliterate('Юлия Щербакова', { scheme: 'passport' }), 'Iuliia Shcherbakova');
    assert.equal(transliterate('Андрей Соловьёв', { scheme: 'passport' }), 'Andrei Solovev');
    assert.equal(transliterate('Подъячев', { scheme: 'passport' }), 'Podieiachev');
  });

  it('ГОСТ 7.79-2000 (система Б) с правилом для «ц»', () => {
    assert.equal(transliterate('Цирк', { scheme: 'gost' }), 'Cirk');
    assert.equal(transliterate('Царь', { scheme: 'gost' }), 'Czar`');
    assert.equal(transliterate('щёлочь', { scheme: 'gost' }), 'shhyoloch`');
    assert.equal(transliterate('объём', { scheme: 'gost' }), 'ob``yom');
  });

  it('сохраняет регистр слов', () => {
    assert.equal(transliterate('ЩУКА'), 'SHCHUKA');
    assert.equal(transliterate('Я и ЮЛЯ'), 'Ya i YULYA');
  });
});

describe('slugify', () => {
  it('строит URL-совместимую строку', () => {
    assert.equal(slugify('Ёлки-палки: 10 рецептов на Новый год!'), 'elki-palki-10-retseptov-na-novyy-god');
    assert.equal(slugify('  Café — déjà vu  '), 'cafe-deja-vu');
    assert.equal(slugify('Отчёт за 2025 год', { separator: '_' }), 'otchet_za_2025_god');
  });

  it('обрезает по границе слова', () => {
    assert.equal(slugify('Очень длинный заголовок статьи', { maxLength: 15 }), 'ochen-dlinnyy');
    assert.equal(slugify('Суперкалифрагилистический', { maxLength: 10 }), 'superkalif');
  });
});

describe('ФИО', () => {
  it('разбирает разный порядок и нормализует регистр', () => {
    assert.deepEqual(parseFullName('иванов иван иванович'), { lastName: 'Иванов', firstName: 'Иван', middleName: 'Иванович' });
    assert.deepEqual(parseFullName('Анна Сергеевна Каренина'), { lastName: 'Каренина', firstName: 'Анна', middleName: 'Сергеевна' });
    assert.deepEqual(parseFullName('Карпович Иван Петрович'), { lastName: 'Карпович', firstName: 'Иван', middleName: 'Петрович' });
    assert.deepEqual(parseFullName('Мамедов Али Гасан оглы'), { lastName: 'Мамедов', firstName: 'Али', middleName: 'Гасан оглы' });
    assert.deepEqual(parseFullName('Иван Петрович'), { firstName: 'Иван', middleName: 'Петрович' });
    assert.deepEqual(parseFullName('Петров Иван'), { lastName: 'Петров', firstName: 'Иван' });
    assert.deepEqual(parseFullName(''), {});
    assert.equal(capitalizeName('римский-КОРСАКОВ'), 'Римский-Корсаков');
  });

  it('определяет пол', () => {
    assert.equal(detectGender('Иванов Иван Иванович'), 'male');
    assert.equal(detectGender('Петрова Анна Ильинична'), 'female');
    assert.equal(detectGender('Ильина Мария'), 'female');
    assert.equal(detectGender('Достоевский Фёдор'), 'male');
    assert.equal(detectGender('Алиева Лейла Гасан кызы'), 'female');
    assert.equal(detectGender('Ким Анна'), undefined);
  });

  it('формирует инициалы', () => {
    assert.equal(formatInitials('Иванов Иван Иванович'), 'Иванов И. И.');
    assert.equal(formatInitials('Иванов Иван Иванович', { order: 'initials-first' }), 'И. И. Иванов');
    assert.equal(formatInitials('Мамедов Али Гасан оглы'), 'Мамедов А. Г.');
    assert.equal(formatInitials('Петров Иван', { nbsp: true }), 'Петров И.');
    assert.equal(formatInitials({ firstName: 'Анна' }), 'А.');
  });
});
