import { calcularPremio } from './premio.service';

describe('calcularPremio', () => {
  test('45m ÷ 30m × R$15 = R$15 (1 faixa)', () => {
    expect(calcularPremio(45, 30, 15)).toBe(15);
  });

  test('60m ÷ 30m × R$15 = R$30 (2 faixas)', () => {
    expect(calcularPremio(60, 30, 15)).toBe(30);
  });

  test('29m ÷ 30m × R$15 = R$0 (0 faixas — não atinge o corte)', () => {
    expect(calcularPremio(29, 30, 15)).toBe(0);
  });

  test('90m ÷ 30m × R$20 = R$60 (3 faixas)', () => {
    expect(calcularPremio(90, 30, 20)).toBe(60);
  });

  test('0m = R$0', () => {
    expect(calcularPremio(0, 30, 15)).toBe(0);
  });

  test('metragem exata no corte (30m) = 1 faixa', () => {
    expect(calcularPremio(30, 30, 15)).toBe(15);
  });
});
