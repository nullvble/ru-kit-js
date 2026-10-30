/** Результат разбора российского (и казахстанского — у них общий код +7) номера телефона. */
export interface ParsedPhone {
  /** Номер в международном формате E.164: `+79161234567`. */
  e164: string;
  /** 10 цифр без кода страны: `9161234567`. */
  national: string;
  /** Код оператора или города (первые 3 цифры национального номера). */
  areaCode: string;
  /** Россия или Казахстан: номера +7 6xx и +7 7xx принадлежат Казахстану. */
  country: 'RU' | 'KZ';
  /** Мобильный номер (по коду). */
  mobile: boolean;
}

const KZ_MOBILE = /^(70[0-8]|747|771|77[5-8])/;

/**
 * Разбирает номер в любом привычном написании: `8 (916) 123-45-67`, `+7 916 1234567`,
 * `79161234567`, `9161234567`. Возвращает `null`, если это не номер с кодом +7.
 *
 * @example
 * ```ts
 * parsePhone('8 (916) 123-45-67');
 * // { e164: '+79161234567', national: '9161234567', areaCode: '916', country: 'RU', mobile: true }
 * ```
 */
export function parsePhone(input: string | number): ParsedPhone | null {
  const raw = String(input).trim();
  if (/[^\d\s()+\-.]/.test(raw)) return null;
  const digits = raw.replace(/\D/g, '');

  let national: string;
  if (digits.length === 11 && (digits[0] === '7' || (digits[0] === '8' && !raw.startsWith('+')))) national = digits.slice(1);
  else if (digits.length === 10 && !raw.startsWith('+')) national = digits;
  else return null;
  if (national[0] === '0' || national[0] === '1' || national[0] === '2') return null;

  const country = national[0] === '6' || national[0] === '7' ? 'KZ' : 'RU';
  return {
    e164: `+7${national}`,
    national,
    areaCode: national.slice(0, 3),
    country,
    mobile: country === 'RU' ? national[0] === '9' : KZ_MOBILE.test(national),
  };
}

export const isValidPhone = (input: string | number): boolean => parsePhone(input) !== null;

/** Приводит номер к виду `+79161234567` (для хранения в БД и отправки SMS) или `null`. */
export const normalizePhone = (input: string | number): string | null => parsePhone(input)?.e164 ?? null;

export type PhoneFormat = 'international' | 'national' | 'e164' | 'compact';

/**
 * Форматирует номер для показа.
 *
 * | Формат | Результат |
 * |---|---|
 * | `international` (по умолчанию) | `+7 (916) 123-45-67` |
 * | `national` | `8 (916) 123-45-67` |
 * | `compact` | `+7 916 123-45-67` |
 * | `e164` | `+79161234567` |
 *
 * @returns `null`, если номер не удалось разобрать.
 */
export function formatPhone(input: string | number, format: PhoneFormat = 'international'): string | null {
  const phone = parsePhone(input);
  if (!phone) return null;
  const n = phone.national;
  const rest = `${n.slice(3, 6)}-${n.slice(6, 8)}-${n.slice(8, 10)}`;
  switch (format) {
    case 'e164':
      return phone.e164;
    case 'national':
      return `8 (${phone.areaCode}) ${rest}`;
    case 'compact':
      return `+7 ${phone.areaCode} ${rest}`;
    default:
      return `+7 (${phone.areaCode}) ${rest}`;
  }
}

/** Маскирует номер для логов и интерфейса: `+7 (916) ***-**-67`. */
export function maskPhone(input: string | number): string | null {
  const phone = parsePhone(input);
  return phone ? `+7 (${phone.areaCode}) ***-**-${phone.national.slice(8)}` : null;
}
