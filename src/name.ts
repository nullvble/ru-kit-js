export interface FullName {
  lastName?: string;
  firstName?: string;
  middleName?: string;
}

export type NameGender = 'male' | 'female';

const MALE_PATRONYMIC = /(вич|ич)$/i;
const FEMALE_PATRONYMIC = /(вна|чна)$/i;
const TURKIC_PATRONYMIC = /^(оглы|улы|уулу|кызы|гызы)$/i;

const isPatronymic = (word: string | undefined): boolean =>
  !!word && (MALE_PATRONYMIC.test(word) || FEMALE_PATRONYMIC.test(word) || /\s(оглы|улы|уулу|кызы|гызы)$/i.test(word));

/** «иВАНОВ-петров» → «Иванов-Петров». */
export function capitalizeName(word: string): string {
  return word.toLowerCase().replace(/(^|[-\s'])(\p{L})/gu, (_, sep: string, letter: string) => sep + letter.toUpperCase());
}

/**
 * Разбирает ФИО на части. Понимает порядок «Фамилия Имя Отчество» и «Имя Отчество Фамилия»
 * (по отчеству), тюркские отчества («Гасан оглы») и нормализует регистр.
 *
 * @example
 * ```ts
 * parseFullName('иванов иван иванович');
 * // { lastName: 'Иванов', firstName: 'Иван', middleName: 'Иванович' }
 * parseFullName('Анна Сергеевна Каренина');
 * // { lastName: 'Каренина', firstName: 'Анна', middleName: 'Сергеевна' }
 * ```
 */
export function parseFullName(input: string): FullName {
  const words = input.trim().split(/\s+/).filter(Boolean).map(capitalizeName);
  // «Гасан оглы» — одно отчество из двух слов.
  if (words.length > 1 && TURKIC_PATRONYMIC.test(words.at(-1)!)) {
    words.splice(-2, 2, `${words.at(-2)} ${words.at(-1)!.toLowerCase()}`);
  }
  let lastName: string | undefined;
  let firstName: string | undefined;
  let middleName: string | undefined;
  const [a, b, c] = words;
  if (words.length >= 3) {
    if (!isPatronymic(c) && isPatronymic(b)) [firstName, middleName, lastName] = [a, b, c];
    else [lastName, firstName, middleName] = [a, b, words.slice(2).join(' ')];
  } else if (words.length === 2) {
    if (isPatronymic(b)) [firstName, middleName] = [a, b];
    else [lastName, firstName] = [a, b];
  } else {
    lastName = a;
  }
  // Ключи всегда в порядке «фамилия, имя, отчество»; отсутствующих частей в объекте нет.
  return { ...(lastName && { lastName }), ...(firstName && { firstName }), ...(middleName && { middleName }) };
}

/**
 * Пол по отчеству, а если его нет — по окончанию фамилии. `undefined`, если определить нельзя
 * (например, «Ким», «Шевчук», «Дюма»).
 */
export function detectGender(name: string | FullName): NameGender | undefined {
  const { middleName, lastName } = typeof name === 'string' ? parseFullName(name) : name;
  if (middleName) {
    if (/(вич|ич|оглы|улы|уулу)$/i.test(middleName)) return 'male';
    if (/(вна|чна|кызы|гызы)$/i.test(middleName)) return 'female';
  }
  if (lastName) {
    if (/(ова|ева|ёва|ина|ына|ская|цкая|ая)$/i.test(lastName)) return 'female';
    if (/(ов|ев|ёв|ин|ын|ский|цкий|ой|ый)$/i.test(lastName)) return 'male';
  }
  return undefined;
}

/**
 * Фамилия с инициалами.
 *
 * @example
 * ```ts
 * formatInitials('Иванов Иван Иванович'); // 'Иванов И. И.'
 * formatInitials('Иванов Иван Иванович', { order: 'initials-first' }); // 'И. И. Иванов'
 * formatInitials('Мамедов Али Гасан оглы'); // 'Мамедов А. Г.'
 * ```
 */
export function formatInitials(
  name: string | FullName,
  { order = 'last-first', nbsp = false }: { order?: 'last-first' | 'initials-first'; nbsp?: boolean } = {},
): string {
  const { lastName, firstName, middleName } = typeof name === 'string' ? parseFullName(name) : name;
  const space = nbsp ? ' ' : ' ';
  const initials = [firstName, middleName]
    .filter((part): part is string => !!part)
    .map((part) => `${part[0]!.toUpperCase()}.`)
    .join(space);
  if (!lastName) return initials;
  if (!initials) return lastName;
  return order === 'last-first' ? `${lastName}${space}${initials}` : `${initials}${space}${lastName}`;
}
