import { accountCheckDigit, innCheckDigit, ogrnCheckDigit, ogrnipCheckDigit, snilsChecksum } from './requisites.js';

/**
 * Генераторы корректных по контрольным суммам реквизитов — для тестов, сидов БД и демо-стендов.
 * Сгенерированные номера случайны и не обязаны принадлежать реальным лицам, но могут случайно
 * совпасть с существующими: не используйте их в боевых документах.
 *
 * Все генераторы принимают `random` — функцию, возвращающую число в `[0, 1)`, чтобы получать
 * воспроизводимые данные (например, с ГПСЧ с зерном).
 */
export interface GenerateOptions {
  random?: () => number;
}

const randomDigits = (count: number, random: () => number): string =>
  Array.from({ length: count }, () => Math.floor(random() * 10)).join('');

/** Двузначный код региона 01–89 — чтобы номера выглядели правдоподобно. */
const regionCode = (random: () => number): string => String(1 + Math.floor(random() * 89)).padStart(2, '0');

/** Генерирует ИНН организации (`legal`, 10 цифр) или физлица (`individual`, 12 цифр). */
export function generateInn({ kind = 'legal', random = Math.random }: GenerateOptions & { kind?: 'legal' | 'individual' } = {}): string {
  if (kind === 'legal') {
    const base = regionCode(random) + randomDigits(7, random);
    return base + innCheckDigit(base, [2, 4, 10, 3, 5, 9, 4, 6, 8]);
  }
  const base = regionCode(random) + randomDigits(8, random);
  const d11 = innCheckDigit(base, [7, 2, 4, 10, 3, 5, 9, 4, 6, 8]);
  const d12 = innCheckDigit(base + d11, [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]);
  return `${base}${d11}${d12}`;
}

/** Генерирует ОГРН организации (13 цифр). */
export function generateOgrn({ random = Math.random }: GenerateOptions = {}): string {
  const year = String(2 + Math.floor(random() * 24)).padStart(2, '0'); // 2002–2025
  const base = '1' + year + regionCode(random) + randomDigits(7, random);
  return base + ogrnCheckDigit(base);
}

/** Генерирует ОГРНИП индивидуального предпринимателя (15 цифр). */
export function generateOgrnip({ random = Math.random }: GenerateOptions = {}): string {
  const year = String(4 + Math.floor(random() * 22)).padStart(2, '0'); // 2004–2025
  const base = '3' + year + regionCode(random) + randomDigits(9, random);
  return base + ogrnipCheckDigit(base);
}

/** Генерирует СНИЛС (11 цифр без разделителей). */
export function generateSnils({ random = Math.random }: GenerateOptions = {}): string {
  let base: string;
  do base = randomDigits(9, random);
  while (Number(base) <= 1_001_998);
  return base + String(snilsChecksum(base)).padStart(2, '0');
}

/** Генерирует КПП (причина постановки на учёт по умолчанию — 01, основное место). */
export function generateKpp({ random = Math.random, reasonCode = '01' }: GenerateOptions & { reasonCode?: string } = {}): string {
  return regionCode(random) + randomDigits(2, random) + reasonCode + randomDigits(3, random);
}

/** Генерирует БИК (формат 04XXXXXXX). */
export function generateBik({ random = Math.random }: GenerateOptions = {}): string {
  return '04' + regionCode(random) + randomDigits(5, random);
}

/**
 * Генерирует расчётный счёт, корректный для данного БИК.
 * @param prefix Балансовый счёт и валюта — первые 8 цифр (по умолчанию `40702810` — счёт организации в рублях).
 */
export function generateBankAccount(bik: string, { random = Math.random, prefix = '40702810' }: GenerateOptions & { prefix?: string } = {}): string {
  const draft = prefix + '0' + randomDigits(11, random);
  const check = accountCheckDigit(bik.slice(6, 9), draft);
  return draft.slice(0, 8) + check + draft.slice(9);
}
