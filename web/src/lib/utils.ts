import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type GrupoVenda = {
  key: string;
  campanha_id: string;
  campanha_nome: string;
  data: string;
  itens: any[];
  premio_total: number;
  status_unico: string | null;
};

export function groupVendas(vendas: any[]): GrupoVenda[] {
  const map = new Map<string, GrupoVenda>();

  for (const v of vendas) {
    const dia = new Date(v.created_at).toLocaleDateString('pt-BR');
    const key = `${v.campanha_id}__${dia}`;

    if (!map.has(key)) {
      map.set(key, {
        key,
        campanha_id: v.campanha_id,
        campanha_nome: v.campanha_nome,
        data: v.created_at,
        itens: [],
        premio_total: 0,
        status_unico: v.status,
      });
    }

    const grupo = map.get(key)!;
    if (grupo.status_unico !== v.status) grupo.status_unico = null;
    grupo.premio_total += Number(v.premio_estimado ?? 0);

    // Aggregate by product: sum metragem and prize instead of creating duplicates
    const itemExistente = grupo.itens.find((i) => i.produto_nome === v.produto_nome);
    if (itemExistente) {
      itemExistente.metragem = Number(itemExistente.metragem) + Number(v.metragem);
      itemExistente.premio_estimado = Number(itemExistente.premio_estimado) + Number(v.premio_estimado ?? 0);
    } else {
      grupo.itens.push({ ...v });
    }
  }

  return Array.from(map.values());
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maskCNPJ(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function maskCPF(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}
