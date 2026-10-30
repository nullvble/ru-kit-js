/**
 * Системы транслитерации:
 * - `simple` — читаемая латиница для URL, имён файлов и логинов (`щука` → `shchuka`, `й` → `y`);
 * - `passport` — как в загранпаспорте РФ (рекомендации ICAO Doc 9303: `ю` → `iu`, `ъ` → `ie`);
 * - `gost` — ГОСТ 7.79-2000, система Б (`щ` → `shh`, `ц` → `c`/`cz`, `ы` → ``y` ``) — для библиографии.
 */
export type TranslitScheme = 'simple' | 'passport' | 'gost';

const BASE: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', з: 'z', и: 'i', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', ч: 'ch', ш: 'sh', ж: 'zh',
};

const SCHEMES: Record<TranslitScheme, Record<string, string>> = {
  simple: { ...BASE, ё: 'e', й: 'y', х: 'kh', ц: 'ts', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' },
  passport: { ...BASE, ё: 'e', й: 'i', х: 'kh', ц: 'ts', щ: 'shch', ъ: 'ie', ы: 'y', ь: '', э: 'e', ю: 'iu', я: 'ia' },
  gost: { ...BASE, ё: 'yo', й: 'j', х: 'x', ц: 'cz', щ: 'shh', ъ: '``', ы: "y`", ь: '`', э: "e`", ю: 'yu', я: 'ya' },
};

const isUpper = (ch: string | undefined): boolean => !!ch && ch !== ch.toLowerCase() && ch === ch.toUpperCase();

/**
 * Переводит кириллицу в латиницу. Прочие символы сохраняются. Регистр учитывается:
 * `Щука` → `Shchuka`, `ЩУКА` → `SHCHUKA`.
 *
 * @example
 * ```ts
 * transliterate('Юлия Щербакова'); // 'Yuliya Shcherbakova'
 * transliterate('Юлия Щербакова', { scheme: 'passport' }); // 'Iuliia Shcherbakova'
 * transliterate('Цирк', { scheme: 'gost' }); // 'Cirk'
 * ```
 */
export function transliterate(text: string, { scheme = 'simple' }: { scheme?: TranslitScheme } = {}): string {
  const table = SCHEMES[scheme];
  const chars = [...text];
  let out = '';
  chars.forEach((ch, i) => {
    const lower = ch.toLowerCase();
    let latin = table[lower];
    if (latin === undefined) {
      out += ch;
      return;
    }
    // ГОСТ: «ц» пишется как «c» перед i, e, y, j и как «cz» в остальных случаях.
    if (scheme === 'gost' && lower === 'ц') {
      const next = table[chars[i + 1]?.toLowerCase() ?? ''] ?? chars[i + 1]?.toLowerCase() ?? '';
      latin = /^[ieyj]/.test(next) ? 'c' : 'cz';
    }
    if (isUpper(ch) && latin) {
      // Слово целиком заглавными — переводим заглавными, иначе только первую букву.
      const wholeWordUpper = isUpper(chars[i + 1]) || (isUpper(chars[i - 1]) && !/[a-zа-яё]/i.test(chars[i + 1] ?? ''));
      latin = wholeWordUpper ? latin.toUpperCase() : latin[0]!.toUpperCase() + latin.slice(1);
    }
    out += latin;
  });
  return out;
}

/**
 * Строка для URL: транслитерация, нижний регистр, только `a-z`, `0-9` и разделитель.
 *
 * @example
 * ```ts
 * slugify('Ёлки-палки: 10 рецептов на Новый год!'); // 'elki-palki-10-retseptov-na-novyy-god'
 * slugify('Очень длинный заголовок статьи', { maxLength: 15 }); // 'ochen-dlinnyy'
 * ```
 */
export function slugify(text: string, { separator = '-', maxLength }: { separator?: string; maxLength?: number } = {}): string {
  let slug = transliterate(text.toLowerCase())
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, separator)
    .split(separator)
    .filter(Boolean)
    .join(separator);
  if (maxLength !== undefined && slug.length > maxLength) {
    const cut = slug.slice(0, maxLength + 1);
    const boundary = cut.lastIndexOf(separator);
    slug = boundary > 0 ? cut.slice(0, boundary) : slug.slice(0, maxLength);
  }
  return slug;
}
