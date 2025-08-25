const { nextMonthlyDateFrom, clampDay } = require('../utils');

describe('clampDay', () => {
  test('clamps values above 28 to 28', () => {
    expect(clampDay(31)).toBe(28);
  });

  test('clamps values below 1 to 1', () => {
    expect(clampDay(0)).toBe(1);
  });

  test('accepts numeric strings', () => {
    expect(clampDay('31')).toBe(28);
  });

  test('handles decimal days', () => {
    expect(clampDay(5.5)).toBe(5.5);
  });
});

describe('nextMonthlyDateFrom', () => {
  const ref = '2024-05-10';

  test('returns same month when day is after the reference date', () => {
    expect(nextMonthlyDateFrom(11, ref)).toBe('2024-05-11');
  });

  test('returns same date when day equals the reference date', () => {
    expect(nextMonthlyDateFrom(10, ref)).toBe('2024-05-10');
  });

  test('advances to next month when day is before the reference date', () => {
    expect(nextMonthlyDateFrom(9, ref)).toBe('2024-06-09');
  });

  test('handles invalid day by clamping to 28', () => {
    expect(nextMonthlyDateFrom(31, ref)).toBe('2024-05-28');
  });

  test('accepts day as a numeric string', () => {
    expect(nextMonthlyDateFrom('11', ref)).toBe('2024-05-11');
  });

  test('floors decimal day values', () => {
    expect(nextMonthlyDateFrom(27.8, ref)).toBe('2024-05-27');
  });

  test('clamps negative day values', () => {
    expect(nextMonthlyDateFrom(-5, ref)).toBe('2024-05-01');
  });

  test('clamps null day values', () => {
    expect(nextMonthlyDateFrom(null, ref)).toBe('2024-05-01');
  });

  test('falls back to current date when fromISO is invalid', () => {
    jest.useFakeTimers().setSystemTime(new Date(ref));
    expect(nextMonthlyDateFrom(12, 'not-a-date')).toBe('2024-05-12');
    jest.useRealTimers();
  });
});
