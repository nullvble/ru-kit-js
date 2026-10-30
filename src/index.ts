// Реквизиты
export {
  type InnDetails,
  type OgrnDetails,
  validateInn,
  isValidInn,
  validateOgrn,
  isValidOgrn,
  validateOgrnip,
  isValidOgrnip,
  validateSnils,
  isValidSnils,
  formatSnils,
  validateKpp,
  isValidKpp,
  validateBik,
  isValidBik,
  validateBankAccount,
  isValidBankAccount,
  validateCorrespondentAccount,
  isValidCorrespondentAccount,
} from './requisites.js';
export type { ValidationResult, ValidResult, InvalidResult, ValidationErrorCode } from './validation.js';

// Генераторы тестовых реквизитов
export {
  type GenerateOptions,
  generateInn,
  generateOgrn,
  generateOgrnip,
  generateSnils,
  generateKpp,
  generateBik,
  generateBankAccount,
} from './generate.js';

// Тексты
export { type PluralForms, plural, formatCount } from './plural.js';
export { type Gender, type Currency, type AmountInWordsOptions, CURRENCIES, numberToWords, amountInWords } from './words.js';
export { type TranslitScheme, transliterate, slugify } from './translit.js';
export { type FullName, type NameGender, parseFullName, detectGender, formatInitials, capitalizeName } from './name.js';

// Телефоны
export { type ParsedPhone, type PhoneFormat, parsePhone, isValidPhone, normalizePhone, formatPhone, maskPhone } from './phone.js';
