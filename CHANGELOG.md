# Changelog

## 1.0.0

Первый релиз.

- Проверка реквизитов: ИНН, ОГРН, ОГРНИП, СНИЛС, КПП, БИК, расчётный и корреспондентский счёт.
- Генераторы тестовых реквизитов с корректными контрольными суммами.
- `plural`, `formatCount`, `numberToWords`, `amountInWords` (RUB, USD, EUR, CNY и свои валюты).
- Телефоны: `parsePhone`, `normalizePhone`, `formatPhone`, `maskPhone` (Россия и Казахстан).
- Транслитерация: простая, паспортная (ICAO), ГОСТ 7.79-2000; `slugify`.
- ФИО: `parseFullName`, `formatInitials`, `detectGender`, `capitalizeName`.
