/** Три формы слова: для 1, для 2–4 и для 5–20 — `['товар', 'товара', 'товаров']`. */
export type PluralForms = readonly [one: string, few: string, many: string];

/**
 * Выбирает форму слова для числа по правилам русского языка.
 * Дробные числа требуют формы родительного падежа единственного числа («1,5 рубля»).
 *
 * @example
 * ```ts
 * plural(1, ['товар', 'товара', 'товаров']); // 'товар'
 * plural(3, ['товар', 'товара', 'товаров']); // 'товара'
 * plural(11, ['товар', 'товара', 'товаров']); // 'товаров'
 * plural(1.5, ['рубль', 'рубля', 'рублей']); // 'рубля'
 * ```
 */
export function plural(count: number | bigint, forms: PluralForms): string {
  if (typeof count === 'number' && !Number.isInteger(count)) return forms[1];
  const mod100 = typeof count === 'bigint' ? Number((count < 0n ? -count : count) % 100n) : Math.abs(count) % 100;
  const mod10 = mod100 % 10;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

/**
 * Число вместе со словом в нужной форме.
 *
 * @example
 * ```ts
 * formatCount(21, ['комментарий', 'комментария', 'комментариев']); // '21 комментарий'
 * formatCount(1500, ['файл', 'файла', 'файлов'], { locale: true }); // '1 500 файлов'
 * ```
 */
export function formatCount(count: number | bigint, forms: PluralForms, { locale = false }: { locale?: boolean } = {}): string {
  const number = locale ? count.toLocaleString('ru-RU') : String(count).replace('.', ',');
  return `${number} ${plural(count, forms)}`;
}
