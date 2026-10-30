// Проверяет, что собранный пакет корректно загружается и через import, и через require.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

type Lib = typeof import('ru-kit-js');

const esm: Lib = await import('ru-kit-js');
const cjs: Lib = createRequire(import.meta.url)('ru-kit-js');

for (const [kind, lib] of [['ESM', esm], ['CJS', cjs]] as const) {
  assert.ok(lib.isValidInn('7707083893'), `${kind}: isValidInn`);
  assert.equal(lib.amountInWords(1234.5), 'Одна тысяча двести тридцать четыре рубля 50 копеек', `${kind}: amountInWords`);
  assert.equal(lib.formatPhone('89161234567'), '+7 (916) 123-45-67', `${kind}: formatPhone`);
  assert.equal(Object.keys(lib).length, Object.keys(esm).length, `${kind}: exports`);
}
console.log(`ok: ${Object.keys(esm).length} exports via ESM and CJS`);
