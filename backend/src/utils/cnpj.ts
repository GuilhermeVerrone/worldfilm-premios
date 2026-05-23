export function validateCNPJ(cnpj: string): boolean {
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;

  const calc = (n: number): number => {
    const weights = n === 1
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < weights.length; i++) sum += parseInt(d[i]) * weights[i];
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };

  return calc(1) === parseInt(d[12]) && calc(2) === parseInt(d[13]);
}

export function formatCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}
