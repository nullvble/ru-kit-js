/** Код ошибки проверки — удобен для ветвления в коде и локализации. */
export type ValidationErrorCode = 'empty' | 'invalid_characters' | 'invalid_length' | 'invalid_format' | 'invalid_checksum';

/** Успешная проверка: `value` — нормализованное значение (только значимые символы). */
export interface ValidResult<Extra = object> {
  valid: true;
  value: string;
  details: Extra;
}

/** Неуспешная проверка: код ошибки и сообщение на русском, готовое для показа пользователю. */
export interface InvalidResult {
  valid: false;
  error: ValidationErrorCode;
  message: string;
}

export type ValidationResult<Extra = object> = ValidResult<Extra> | InvalidResult;

export const ok = <Extra>(value: string, details: Extra): ValidResult<Extra> => ({ valid: true, value, details });

export const fail = (error: ValidationErrorCode, message: string): InvalidResult => ({ valid: false, error, message });

/**
 * Убирает пробелы, дефисы и прочие разделители, которыми обычно форматируют реквизиты.
 * Возвращает `null`, если остались символы, кроме цифр.
 */
export function digitsOnly(input: string | number): string | null {
  const cleaned = String(input).replace(/[\s\-–—_.()]/g, '');
  return /^\d*$/.test(cleaned) ? cleaned : null;
}

/** Сумма произведений цифр на веса. */
export function weightedSum(digits: string, weights: readonly number[]): number {
  let sum = 0;
  for (let i = 0; i < weights.length; i++) sum += Number(digits[i]) * weights[i]!;
  return sum;
}

/** Общая предварительная проверка: не пусто, только цифры, допустимая длина. */
export function checkDigits(
  input: string | number,
  name: string,
  lengths: readonly number[],
): { digits: string } | InvalidResult {
  const digits = digitsOnly(input);
  if (digits === null) return fail('invalid_characters', `${name} может содержать только цифры`);
  if (digits.length === 0) return fail('empty', `Укажите ${name}`);
  if (!lengths.includes(digits.length)) {
    const expected = lengths.length === 1 ? `${lengths[0]}` : `${lengths.slice(0, -1).join(', ')} или ${lengths.at(-1)}`;
    return fail('invalid_length', `${name} должен содержать ${expected} цифр`);
  }
  return { digits };
}
