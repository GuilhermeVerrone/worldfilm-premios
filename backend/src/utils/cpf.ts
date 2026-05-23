export function validateCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;

  const digit = (slice: string, factor: number): number => {
    let sum = 0;
    for (let i = 0; i < slice.length; i++) sum += parseInt(slice[i]) * (factor - i);
    const r = (sum * 10) % 11;
    return r >= 10 ? 0 : r;
  };

  return digit(d.slice(0, 9), 10) === parseInt(d[9]) && digit(d.slice(0, 10), 11) === parseInt(d[10]);
}

export function formatCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}
