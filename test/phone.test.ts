import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatPhone, isValidPhone, maskPhone, normalizePhone, parsePhone } from '../src/index.js';

describe('Телефоны', () => {
  it('понимает разные способы записи', () => {
    for (const input of ['8 (916) 123-45-67', '+7 916 123 45 67', '79161234567', '9161234567', '+7(916)123-45-67', 89161234567]) {
      assert.equal(normalizePhone(input), '+79161234567', String(input));
    }
  });

  it('определяет страну и тип номера', () => {
    assert.deepEqual(parsePhone('8 (916) 123-45-67'), { e164: '+79161234567', national: '9161234567', areaCode: '916', country: 'RU', mobile: true });
    assert.equal(parsePhone('+7 495 123-45-67')?.mobile, false);
    assert.deepEqual(
      [parsePhone('+7 701 123 45 67')?.country, parsePhone('+7 701 123 45 67')?.mobile],
      ['KZ', true],
    );
    assert.deepEqual([parsePhone('+7 727 123 45 67')?.country, parsePhone('+7 727 123 45 67')?.mobile], ['KZ', false]);
  });

  it('отклоняет не-российские и некорректные номера', () => {
    for (const input of ['', '12345', '+8 916 123 45 67', '+380 44 123 45 67', '8 916 123 45 678', 'звоните 8 916 123 45 67', '+9161234567', '1161234567']) {
      assert.ok(!isValidPhone(input), input);
    }
  });

  it('форматирует и маскирует', () => {
    assert.equal(formatPhone('89161234567'), '+7 (916) 123-45-67');
    assert.equal(formatPhone('89161234567', 'national'), '8 (916) 123-45-67');
    assert.equal(formatPhone('89161234567', 'compact'), '+7 916 123-45-67');
    assert.equal(formatPhone('89161234567', 'e164'), '+79161234567');
    assert.equal(formatPhone('бред'), null);
    assert.equal(maskPhone('89161234567'), '+7 (916) ***-**-67');
  });
});
