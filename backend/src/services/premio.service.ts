import db from '../database/connection';

export function calcularPremio(
  metragem: number,
  metragemCorte: number,
  valorPremio: number,
): number {
  const faixas = Math.floor(metragem / metragemCorte);
  return faixas * valorPremio;
}

export async function calcularPremioEstimado(input: {
  campanha_id: string;
  produto_id: string;
  metragem: number;
}): Promise<number> {
  const regra = await db('campanha_premios')
    .where({ campanha_id: input.campanha_id, produto_id: input.produto_id })
    .first();

  if (!regra) return 0;

  return calcularPremio(input.metragem, Number(regra.metragem_corte), Number(regra.valor_premio));
}
