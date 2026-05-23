import { cn } from '../../lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gray';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  danger:  'bg-red-100 text-red-800',
  info:    'bg-blue-100 text-blue-800',
  gray:    'bg-gray-100 text-gray-600',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function statusToBadge(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    aprovado: 'success',
    ativa: 'success',
    pago: 'success',
    pendente: 'warning',
    solicitado: 'warning',
    em_processamento: 'info',
    bloqueado: 'info',
    disponivel: 'success',
    reprovado: 'danger',
    inativo: 'danger',
    rascunho: 'gray',
    encerrada: 'gray',
    arquivada: 'gray',
  };
  return map[status] ?? 'default';
}
