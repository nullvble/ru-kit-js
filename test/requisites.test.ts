import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  formatSnils,
  generateBankAccount,
  generateBik,
  generateInn,
  generateKpp,
  generateOgrn,
  generateOgrnip,
  generateSnils,
  isValidBankAccount,
  isValidBik,
  isValidCorrespondentAccount,
  isValidInn,
  isValidKpp,
  isValidOgrn,
  isValidOgrnip,
  isValidSnils,
  validateBankAccount,
  validateInn,
  validateOgrnip,
  validateSnils,
} from '../src/index.js';

// Детерминированный ГПСЧ (mulberry32) для воспроизводимых тестов.
function rng(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Публичные реквизиты ПАО Сбербанк и ООО «Яндекс» из ЕГРЮЛ.
const SBER = { inn: '7707083893', ogrn: '1027700132195', kpp: '773601001', bik: '044525225', corr: '30101810400000000225' };
const YANDEX = { inn: '7736207543', ogrn: '1027700229193' };

describe('ИНН', () => {
  it('принимает реальные ИНН организаций', () => {
    assert.deepEqual(validateInn(SBER.inn), { valid: true, value: SBER.inn, details: { kind: 'legal', taxOfficeCode: '7707' } });
    assert.ok(isValidInn(YANDEX.inn));
    assert.ok(isValidInn(7707083893));
  });

  it('проверяет обе контрольные цифры 12-значного ИНН', () => {
    const inn = generateInn({ kind: 'individual', random: rng(1) });
    assert.deepEqual(validateInn(inn), { valid: true, value: inn, details: { kind: 'individual', taxOfficeCode: inn.slice(0, 4) } });
    const broken11 = inn.slice(0, 10) + ((Number(inn[10]) + 1) % 10) + inn[11];
    const broken12 = inn.slice(0, 11) + ((Number(inn[11]) + 1) % 10);
    assert.ok(!isValidInn(broken11));
    assert.ok(!isValidInn(broken12));
  });

  it('нормализует разделители и сообщает понятные ошибки', () => {
    assert.deepEqual(validateInn(' 7707-083 893 '), validateInn(SBER.inn));
    assert.deepEqual(validateInn(''), { valid: false, error: 'empty', message: 'Укажите ИНН' });
    assert.deepEqual(validateInn('77070838'), { valid: false, error: 'invalid_length', message: 'ИНН должен содержать 10 или 12 цифр' });
    assert.equal((validateInn('77070838A3') as { error: string }).error, 'invalid_characters');
    assert.equal((validateInn('7707083894') as { error: string }).error, 'invalid_checksum');
    assert.equal((validateInn('0000000000') as { error: string }).error, 'invalid_format');
  });
});

describe('ОГРН и ОГРНИП', () => {
  it('принимает реальные ОГРН и извлекает год и регион', () => {
    assert.ok(isValidOgrn(SBER.ogrn));
    assert.ok(isValidOgrn(YANDEX.ogrn));
    assert.ok(!isValidOgrn('1027700132194'));
    assert.ok(!isValidOgrn(SBER.inn));
  });

  it('проверяет ОГРНИП', () => {
    const ogrnip = generateOgrnip({ random: rng(2) });
    const result = validateOgrnip(ogrnip);
    assert.ok(result.valid);
    assert.equal(result.details.regionCode, ogrnip.slice(3, 5));
    assert.ok(!isValidOgrnip(ogrnip.slice(0, 14) + ((Number(ogrnip[14]) + 1) % 10)));
    assert.equal((validateOgrnip('1' + ogrnip.slice(1)) as { error: string }).error, 'invalid_format');
  });
});

describe('СНИЛС', () => {
  it('проверяет контрольное число и форматирует', () => {
    assert.deepEqual(validateSnils('112-233-445 95'), { valid: true, value: '11223344595', details: { formatted: '112-233-445 95' } });
    assert.ok(!isValidSnils('112-233-445 96'));
    assert.equal(formatSnils('11223344595'), '112-233-445 95');
  });

  it('обрабатывает особые случаи контрольного числа (сумма 100 и 101 → 00)', () => {
    // 001-001-999: сумма весов = 0·9+0·8+1·7+0·6+0·5+1·4+9·3+9·2+9·1 = 65
    assert.ok(isValidSnils('00100199965'));
    // Подбираем номера с суммой 100 и 101: контрольное число 00.
    const withSum = (target: number): string => {
      for (let n = 1_002_000; ; n++) {
        const d = String(n).padStart(9, '0');
        const sum = [...d].reduce((s, c, i) => s + Number(c) * (9 - i), 0);
        if (sum === target) return d;
      }
    };
    assert.ok(isValidSnils(withSum(100) + '00'));
    assert.ok(isValidSnils(withSum(101) + '00'));
    assert.ok(isValidSnils(withSum(150) + '49')); // 150 % 101 = 49
  });

  it('не проверяет контрольное число у старых номеров до 001-001-998', () => {
    assert.ok(isValidSnils('00100199812'));
  });
});

describe('КПП и БИК', () => {
  it('проверяет формат КПП, включая буквенный код причины', () => {
    assert.ok(isValidKpp(SBER.kpp));
    assert.ok(isValidKpp('7736AB001'));
    assert.ok(isValidKpp('7736ab001'));
    assert.ok(!isValidKpp('7736АБ001')); // кириллица не допускается
    assert.ok(!isValidKpp('77360100'));
  });

  it('проверяет формат БИК', () => {
    assert.ok(isValidBik(SBER.bik));
    assert.ok(!isValidBik('144525225'));
    assert.ok(!isValidBik('04452522'));
  });
});

describe('Банковские счета', () => {
  it('принимает реальный корреспондентский счёт и отклоняет чужой БИК', () => {
    assert.ok(isValidCorrespondentAccount(SBER.corr, SBER.bik));
    // У БИК Альфа-Банка те же 5–6 цифры, поэтому ключ совпадает — ловим по последним трём цифрам.
    assert.ok(!isValidCorrespondentAccount(SBER.corr, '044525593'));
    assert.ok(!isValidCorrespondentAccount(SBER.corr, '044030653'));
  });

  it('обнаруживает любую ошибку в одной цифре расчётного счёта', () => {
    const account = generateBankAccount(SBER.bik, { random: rng(3) });
    assert.ok(isValidBankAccount(account, SBER.bik));
    for (let i = 0; i < 20; i++) {
      for (let delta = 1; delta <= 9; delta++) {
        const broken = account.slice(0, i) + ((Number(account[i]) + delta) % 10) + account.slice(i + 1);
        assert.ok(!isValidBankAccount(broken, SBER.bik), `не поймана ошибка в позиции ${i}`);
      }
    }
  });

  it('сообщает о некорректном БИК', () => {
    const result = validateBankAccount('40702810938000000001', '12345');
    assert.ok(!result.valid);
    assert.match(result.message, /БИК/);
  });
});

describe('Генераторы', () => {
  const random = rng(42);
  const cases: [string, () => string, (v: string) => boolean][] = [
    ['ИНН организации', () => generateInn({ random }), isValidInn],
    ['ИНН физлица', () => generateInn({ kind: 'individual', random }), (v) => isValidInn(v) && v.length === 12],
    ['ОГРН', () => generateOgrn({ random }), isValidOgrn],
    ['ОГРНИП', () => generateOgrnip({ random }), isValidOgrnip],
    ['СНИЛС', () => generateSnils({ random }), isValidSnils],
    ['КПП', () => generateKpp({ random }), isValidKpp],
    ['БИК', () => generateBik({ random }), isValidBik],
  ];

  for (const [name, generate, validate] of cases) {
    it(`${name}: 1000 сгенерированных значений проходят проверку`, () => {
      for (let i = 0; i < 1000; i++) {
        const value = generate();
        assert.ok(validate(value), `${name} ${value}`);
      }
    });
  }

  it('расчётный счёт соответствует БИК', () => {
    for (let i = 0; i < 300; i++) {
      const bik = generateBik({ random });
      assert.ok(isValidBankAccount(generateBankAccount(bik, { random }), bik));
    }
  });

  it('воспроизводимы с одинаковым зерном', () => {
    assert.equal(generateInn({ random: rng(7) }), generateInn({ random: rng(7) }));
  });
});
