export type NotificacaoTipo = 'push' | 'in_app';

export interface Notificacao {
  id: string;
  vendedor_id?: string;
  titulo: string;
  corpo: string;
  tipo: NotificacaoTipo;
  lida: boolean;
  created_at: string;
}
