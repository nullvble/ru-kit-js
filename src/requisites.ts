import { type ValidationResult, checkDigits, fail, ok, weightedSum } from './validation.js';

// ── ИНН ──────────────────────────────────────────────────────────────────────

const INN10_WEIGHTS = [2, 4, 10, 3, 5, 9, 4, 6, 8];
const INN11_WEIGHTS = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
const INN12_WEIGHTS = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8];

/** Контрольная цифра ИНН по весам. */
export const innCheckDigit = (digits: string, weights: readonly number[]): number => (weightedSum(digits, weights) % 11) % 10;

export interface InnDetails {
  /** `legal` — организация (10 цифр), `individual` — физлицо или ИП (12 цифр). */
  kind: 'legal' | 'individual';
  /** Код налогового органа, присвоившего ИНН (первые 4 цифры). */
  taxOfficeCode: string;
}

/**
 * Проверяет ИНН организации (10 цифр) или физического лица / ИП (12 цифр) по контрольным цифрам.
 *
 * @example
 * ```ts
 * validateInn('7707083893');
 * // { valid: true, value: '7707083893', details: { kind: 'legal', taxOfficeCode: '7707' } }
 *
 * validateInn('7707083890');
 * // { valid: false, error: 'invalid_checksum', message: 'Неверное контрольное число ИНН' }
 * ```
 */
export function validateInn(input: string | number): ValidationResult<InnDetails> {
  const checked = checkDigits(input, 'ИНН', [10, 12]);
  if (!('digits' in checked)) return checked;
  const { digits } = checked;
  if (/^0{10}(00)?$/.test(digits)) return fail('invalid_format', 'ИНН не может состоять из одних нулей');

  const valid =
    digits.length === 10
      ? innCheckDigit(digits, INN10_WEIGHTS) === Number(digits[9])
      : innCheckDigit(digits, INN11_WEIGHTS) === Number(digits[10]) && innCheckDigit(digits, INN12_WEIGHTS) === Number(digits[11]);
  if (!valid) return fail('invalid_checksum', 'Неверное контрольное число ИНН');

  return ok(digits, { kind: digits.length === 10 ? 'legal' : 'individual', taxOfficeCode: digits.slice(0, 4) });
}

/** Короткая форма {@link validateInn}: `true`, если ИНН корректен. */
export const isValidInn = (input: string | number): boolean => validateInn(input).valid;

// ── ОГРН и ОГРНИП ────────────────────────────────────────────────────────────

// Числа до 10^14 представимы в double точно, поэтому BigInt не нужен.
export const ogrnCheckDigit = (digits: string): number => (Number(digits.slice(0, 12)) % 11) % 10;
export const ogrnipCheckDigit = (digits: string): number => (Number(digits.slice(0, 14)) % 13) % 10;

export interface OgrnDetails {
  /** Год регистрации записи (по 2–3 цифрам). */
  year: number;
  /** Код субъекта РФ (4–5 цифры). */
  regionCode: string;
}

// ОГРН присваивается с 2002 года, поэтому две цифры года всегда означают 20XX.
const yearOf = (digits: string): number => 2000 + Number(digits.slice(1, 3));

/**
 * Проверяет ОГРН организации (13 цифр).
 *
 * @example
 * ```ts
 * validateOgrn('1027700132195').valid; // true
 * ```
 */
export function validateOgrn(input: string | number): ValidationResult<OgrnDetails> {
  const checked = checkDigits(input, 'ОГРН', [13]);
  if (!('digits' in checked)) return checked;
  const { digits } = checked;
  if (ogrnCheckDigit(digits) !== Number(digits[12])) return fail('invalid_checksum', 'Неверное контрольное число ОГРН');
  return ok(digits, { year: yearOf(digits), regionCode: digits.slice(3, 5) });
}

export const isValidOgrn = (input: string | number): boolean => validateOgrn(input).valid;

/** Проверяет ОГРНИП индивидуального предпринимателя (15 цифр, начинается с 3). */
export function validateOgrnip(input: string | number): ValidationResult<OgrnDetails> {
  const checked = checkDigits(input, 'ОГРНИП', [15]);
  if (!('digits' in checked)) return checked;
  const { digits } = checked;
  if (digits[0] !== '3') return fail('invalid_format', 'ОГРНИП должен начинаться с цифры 3');
  if (ogrnipCheckDigit(digits) !== Number(digits[14])) return fail('invalid_checksum', 'Неверное контрольное число ОГРНИП');
  return ok(digits, { year: yearOf(digits), regionCode: digits.slice(3, 5) });
}

export const isValidOgrnip = (input: string | number): boolean => validateOgrnip(input).valid;

// ── СНИЛС ────────────────────────────────────────────────────────────────────

/** Контрольное число СНИЛС для первых 9 цифр. */
export function snilsChecksum(digits: string): number {
  const sum = weightedSum(digits, [9, 8, 7, 6, 5, 4, 3, 2, 1]);
  const mod = sum % 101;
  return mod === 100 ? 0 : mod;
}

/**
 * Проверяет СНИЛС (11 цифр, допускаются форматы `112-233-445 95` и `11223344595`).
 * Для номеров не больше 001-001-998 контрольное число по правилам ПФР не проверяется.
 */
export function validateSnils(input: string | number): ValidationResult<{ formatted: string }> {
  const checked = checkDigits(input, 'СНИЛС', [11]);
  if (!('digits' in checked)) return checked;
  const { digits } = checked;
  const number = Number(digits.slice(0, 9));
  if (number > 1_001_998 && snilsChecksum(digits) !== Number(digits.slice(9))) {
    return fail('invalid_checksum', 'Неверное контрольное число СНИЛС');
  }
  return ok(digits, { formatted: formatSnils(digits) });
}

export const isValidSnils = (input: string | number): boolean => validateSnils(input).valid;

/** Форматирует СНИЛС как `112-233-445 95`. Не проверяет контрольное число. */
export function formatSnils(digits: string): string {
  const d = digits.replace(/\D/g, '');
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 9)} ${d.slice(9, 11)}`;
}

// ── КПП ──────────────────────────────────────────────────────────────────────

/**
 * Проверяет формат КПП: 4 цифры кода налогового органа, 2 символа причины постановки
 * на учёт (цифры или заглавные латинские буквы) и 3 цифры порядкового номера.
 * Контрольного числа у КПП нет.
 */
export function validateKpp(input: string | number): ValidationResult<{ taxOfficeCode: string; reasonCode: string }> {
  const value = String(input).replace(/\s/g, '').toUpperCase();
  if (!value) return fail('empty', 'Укажите КПП');
  if (value.length !== 9) return fail('invalid_length', 'КПП должен содержать 9 символов');
  if (!/^\d{4}[\dA-Z]{2}\d{3}$/.test(value)) return fail('invalid_format', 'Неверный формат КПП');
  return ok(value, { taxOfficeCode: value.slice(0, 4), reasonCode: value.slice(4, 6) });
}

export const isValidKpp = (input: string | number): boolean => validateKpp(input).valid;

// ── БИК и банковские счета ───────────────────────────────────────────────────

/** Проверяет формат БИК: 9 цифр, первая — 0. Контрольного числа у БИК нет. */
export function validateBik(input: string | number): ValidationResult {
  const checked = checkDigits(input, 'БИК', [9]);
  if (!('digits' in checked)) return checked;
  if (checked.digits[0] !== '0') return fail('invalid_format', 'БИК российского банка начинается с 0');
  return ok(checked.digits, {});
}

export const isValidBik = (input: string | number): boolean => validateBik(input).valid;

const ACCOUNT_WEIGHTS = Array.from({ length: 23 }, (_, i) => [7, 1, 3][i % 3]!);

function accountKeyValid(key: string): boolean {
  return weightedSum(key, ACCOUNT_WEIGHTS) % 10 === 0;
}

function validateAccountWith(
  input: string | number,
  bik: string | number,
  name: string,
  prefix: (bikDigits: string) => string,
): ValidationResult {
  const bikResult = validateBik(bik);
  if (!bikResult.valid) return fail(bikResult.error, `Сначала укажите корректный БИК: ${bikResult.message.toLowerCase()}`);
  const checked = checkDigits(input, name, [20]);
  if (!('digits' in checked)) return checked;
  if (!accountKeyValid(prefix(bikResult.value) + checked.digits)) {
    return fail('invalid_checksum', `${name} не соответствует БИК — проверьте оба реквизита`);
  }
  return ok(checked.digits, {});
}

/**
 * Проверяет расчётный (лицевой) счёт вместе с БИК банка: контрольный ключ считается
 * по 3 последним цифрам БИК и 20 цифрам счёта.
 *
 * @example
 * ```ts
 * validateBankAccount('40702810938000000001', '044525225');
 * ```
 */
export function validateBankAccount(account: string | number, bik: string | number): ValidationResult {
  return validateAccountWith(account, bik, 'Расчётный счёт', (b) => b.slice(6, 9));
}

export const isValidBankAccount = (account: string | number, bik: string | number): boolean =>
  validateBankAccount(account, bik).valid;

/**
 * Проверяет корреспондентский счёт банка вместе с его БИК: контрольный ключ («0» + 5–6 цифры БИК + счёт),
 * а для корсчетов кредитных организаций (`301…`) — ещё и совпадение последних трёх цифр счёта и БИК.
 * Единые казначейские счета (`40102…`) последние цифры БИК не содержат.
 */
export function validateCorrespondentAccount(account: string | number, bik: string | number): ValidationResult {
  const result = validateAccountWith(account, bik, 'Корреспондентский счёт', (b) => `0${b.slice(4, 6)}`);
  if (result.valid && result.value.startsWith('301') && result.value.slice(17) !== String(bik).replace(/\D/g, '').slice(6)) {
    return fail('invalid_format', 'Корреспондентский счёт должен заканчиваться тремя последними цифрами БИК');
  }
  return result;
}

export const isValidCorrespondentAccount = (account: string | number, bik: string | number): boolean =>
  validateCorrespondentAccount(account, bik).valid;

/** Вычисляет контрольную цифру (9-я позиция) счёта для данного префикса ключа. */
export function accountCheckDigit(keyPrefix: string, account: string): number {
  const key = keyPrefix + account.slice(0, 8) + '0' + account.slice(9);
  const sum = weightedSum(key, ACCOUNT_WEIGHTS);
  // Вес позиции контрольной цифры в ключе: индекс keyPrefix.length + 8.
  const weight = ACCOUNT_WEIGHTS[keyPrefix.length + 8]!;
  for (let d = 0; d <= 9; d++) if ((sum + d * weight) % 10 === 0) return d;
  throw new Error('unreachable');
}
