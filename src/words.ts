import { type PluralForms, plural } from './plural.js';

/** Грамматический род: от него зависит «один/одна/одно», «два/две». */
export type Gender = 'masculine' | 'feminine' | 'neuter';

const HUNDREDS = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
const TENS = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
const TEENS = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
const UNITS = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
const ONE: Record<Gender, string> = { masculine: 'один', feminine: 'одна', neuter: 'одно' };
const TWO: Record<Gender, string> = { masculine: 'два', feminine: 'две', neuter: 'два' };

const SCALES: { forms: PluralForms; gender: Gender }[] = [
  { forms: ['', '', ''], gender: 'masculine' }, // единицы — род задаёт вызывающий
  { forms: ['тысяча', 'тысячи', 'тысяч'], gender: 'feminine' },
  { forms: ['миллион', 'миллиона', 'миллионов'], gender: 'masculine' },
  { forms: ['миллиард', 'миллиарда', 'миллиардов'], gender: 'masculine' },
  { forms: ['триллион', 'триллиона', 'триллионов'], gender: 'masculine' },
  { forms: ['квадриллион', 'квадриллиона', 'квадриллионов'], gender: 'masculine' },
  { forms: ['квинтиллион', 'квинтиллиона', 'квинтиллионов'], gender: 'masculine' },
];

function triadToWords(n: number, gender: Gender): string[] {
  const words = [HUNDREDS[Math.floor(n / 100)]!];
  const rest = n % 100;
  if (rest >= 10 && rest < 20) words.push(TEENS[rest - 10]!);
  else {
    words.push(TENS[Math.floor(rest / 10)]!);
    const unit = rest % 10;
    words.push(unit === 1 ? ONE[gender] : unit === 2 ? TWO[gender] : UNITS[unit]!);
  }
  return words.filter(Boolean);
}

/**
 * Целое число прописью. Поддерживает числа до 10²¹ (передавайте `bigint` или строку для чисел
 * больше `Number.MAX_SAFE_INTEGER`).
 *
 * @param gender Род считаемого существительного: «одна тысяча», «одно окно», «два рубля».
 *
 * @example
 * ```ts
 * numberToWords(2021); // 'две тысячи двадцать один'
 * numberToWords(2, { gender: 'feminine' }); // 'две'
 * numberToWords(-15); // 'минус пятнадцать'
 * ```
 */
export function numberToWords(value: number | bigint | string, { gender = 'masculine' }: { gender?: Gender } = {}): string {
  let n = toBigInt(value);
  if (n === 0n) return 'ноль';
  const negative = n < 0n;
  if (negative) n = -n;
  if (n >= 10n ** 21n) throw new RangeError('Число слишком большое: поддерживаются значения до 10^21');

  const parts: string[] = [];
  for (let scale = 0; n > 0n; scale++, n /= 1000n) {
    const triad = Number(n % 1000n);
    if (triad === 0) continue;
    const { forms, gender: scaleGender } = SCALES[scale]!;
    const words = triadToWords(triad, scale === 0 ? gender : scaleGender);
    if (scale > 0) words.push(plural(triad, forms));
    parts.unshift(words.join(' '));
  }
  return (negative ? 'минус ' : '') + parts.join(' ');
}

function toBigInt(value: number | bigint | string): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) throw new RangeError('Ожидается целое число в пределах Number.MAX_SAFE_INTEGER; используйте bigint или строку');
    return BigInt(value);
  }
  const trimmed = value.trim().replace(/\s/g, '');
  if (!/^-?\d+$/.test(trimmed)) throw new RangeError(`Не целое число: «${value}»`);
  return BigInt(trimmed);
}

// ── Сумма прописью ───────────────────────────────────────────────────────────

export interface Currency {
  major: PluralForms;
  majorGender: Gender;
  minor: PluralForms;
  minorGender: Gender;
}

/** Встроенные валюты. Можно передать и собственное описание {@link Currency}. */
export const CURRENCIES = {
  RUB: { major: ['рубль', 'рубля', 'рублей'], majorGender: 'masculine', minor: ['копейка', 'копейки', 'копеек'], minorGender: 'feminine' },
  USD: { major: ['доллар', 'доллара', 'долларов'], majorGender: 'masculine', minor: ['цент', 'цента', 'центов'], minorGender: 'masculine' },
  EUR: { major: ['евро', 'евро', 'евро'], majorGender: 'masculine', minor: ['цент', 'цента', 'центов'], minorGender: 'masculine' },
  CNY: { major: ['юань', 'юаня', 'юаней'], majorGender: 'masculine', minor: ['фэнь', 'фэня', 'фэней'], minorGender: 'masculine' },
} as const satisfies Record<string, Currency>;

export interface AmountInWordsOptions {
  /** Валюта: `RUB` (по умолчанию), `USD`, `EUR`, `CNY` или своё описание. */
  currency?: keyof typeof CURRENCIES | Currency;
  /** Как писать копейки: цифрами (`50 копеек`, по умолчанию — так принято в документах), словами или не писать. */
  minor?: 'digits' | 'words' | 'none';
  /** Начинать с заглавной буквы. По умолчанию `true`. */
  capitalize?: boolean;
}

/**
 * Денежная сумма прописью — для счетов, актов, договоров и платёжных поручений.
 * Принимает число или строку (`'1234.50'`, `'1 234,50'`); дробная часть округляется до копеек.
 *
 * @example
 * ```ts
 * amountInWords(1234.5);
 * // 'Одна тысяча двести тридцать четыре рубля 50 копеек'
 *
 * amountInWords('2 001 001,01', { minor: 'words' });
 * // 'Два миллиона одна тысяча один рубль одна копейка'
 *
 * amountInWords(21, { currency: 'USD', minor: 'none' });
 * // 'Двадцать один доллар'
 * ```
 */
export function amountInWords(amount: number | string, { currency = 'RUB', minor = 'digits', capitalize = true }: AmountInWordsOptions = {}): string {
  const spec: Currency = typeof currency === 'string' ? CURRENCIES[currency] : currency;
  const totalMinor = parseMoney(amount);
  const negative = totalMinor < 0n;
  const abs = negative ? -totalMinor : totalMinor;
  const major = abs / 100n;
  const cents = Number(abs % 100n);

  let text = `${numberToWords(major, { gender: spec.majorGender })} ${plural(major, spec.major)}`;
  if (minor === 'digits') text += ` ${String(cents).padStart(2, '0')} ${plural(cents, spec.minor)}`;
  else if (minor === 'words') text += ` ${numberToWords(cents, { gender: spec.minorGender })} ${plural(cents, spec.minor)}`;
  if (negative) text = `минус ${text}`;
  return capitalize ? text[0]!.toUpperCase() + text.slice(1) : text;
}

/** Сумма в минимальных единицах (копейках) без ошибок округления плавающей точки. */
function parseMoney(amount: number | string): bigint {
  let str: string;
  if (typeof amount === 'number') {
    if (!Number.isFinite(amount)) throw new RangeError('Сумма должна быть конечным числом');
    str = amount.toFixed(2);
  } else {
    str = amount.trim().replace(/[\s ]/g, '').replace(',', '.');
  }
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(str);
  if (!match) throw new RangeError(`Не удалось разобрать сумму: «${amount}»`);
  const [, sign, int, frac = ''] = match;
  let minor = BigInt(int!) * 100n + BigInt((frac + '00').slice(0, 2));
  if (Number(frac[2] ?? '0') >= 5) minor += 1n; // округление до копейки
  return sign ? -minor : minor;
}
