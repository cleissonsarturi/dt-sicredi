import { calcularBackoffMs } from './backoff.js';

describe('calcularBackoffMs', () => {
  it('cresce exponencialmente a partir de 10s', () => {
    expect([1, 2, 3, 4].map(calcularBackoffMs)).toEqual([
      10_000, 20_000, 40_000, 80_000,
    ]);
  });

  it('é limitado a 5 minutos', () => {
    expect(calcularBackoffMs(20)).toBe(300_000);
  });
});
