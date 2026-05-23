import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Skeleton } from '../../components/ui/Skeleton';
import { Badge, statusToBadge } from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';

function maskWhatsApp(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `+55 (${d}`;
  if (d.length <= 7) return `+55 (${d.slice(0, 2)}) ${d.slice(2)}`;
  return `+55 (${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function maskCPF(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function maskCNPJ(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

function initials(nome: string): string {
  return nome.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export default function VendedorPerfil() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();

  const { data: perfil, isLoading } = useQuery({
    queryKey: ['vendedor-perfil'],
    queryFn: () => api.get('/vendedor/perfil').then((r) => r.data),
  });

  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [chavePix, setChavePix] = useState('');

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');

  useEffect(() => {
    if (perfil) {
      setNome(perfil.nome ?? '');
      setWhatsapp(maskWhatsApp(perfil.whatsapp ?? ''));
      setChavePix(perfil.chave_pix ?? '');
    }
  }, [perfil]);

  const perfilMutation = useMutation({
    mutationFn: () =>
      api.put('/vendedor/perfil', { nome, whatsapp: whatsapp.replace(/\D/g, ''), chave_pix: chavePix }),
    onSuccess: () => {
      success('Perfil atualizado');
      qc.invalidateQueries({ queryKey: ['vendedor-perfil'] });
    },
    onError: (err: any) => toastError(err?.response?.data?.message ?? 'Erro ao salvar'),
  });

  const senhaMutation = useMutation({
    mutationFn: () => api.put('/vendedor/senha', { senhaAtual, novaSenha }),
    onSuccess: () => {
      success('Senha alterada com sucesso');
      setSenhaAtual(''); setNovaSenha(''); setConfirmaSenha('');
    },
    onError: (err: any) => toastError(err?.response?.data?.message ?? 'Erro ao alterar senha'),
  });

  function handleSenha() {
    if (novaSenha !== confirmaSenha) { toastError('As senhas não coincidem'); return; }
    if (novaSenha.length < 8) { toastError('Nova senha deve ter ao menos 8 caracteres'); return; }
    senhaMutation.mutate();
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  if (isLoading) {
    return (
      <div>
        <div className="bg-[#0A0A0A] px-5 pt-5 pb-10">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  const distribuidorNome = perfil?.distribuidor_nome ?? perfil?.distribuidor_id ?? '—';

  return (
    <div className="pb-8">

      {/* ── Profile hero ── */}
      <div className="bg-[#0A0A0A] px-5 pt-5 pb-10">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 bg-wf-red flex items-center justify-center shrink-0">
            <span className="text-white font-black text-xl">{initials(perfil?.nome ?? '?')}</span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-white font-black text-lg truncate">{perfil?.nome}</p>
            <p className="text-white/40 text-xs truncate mt-0.5">{distribuidorNome}</p>
            <div className="mt-2">
              <Badge variant={statusToBadge(perfil?.status ?? '')}>{perfil?.status}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 -mt-4 space-y-4">

        {/* ── Dados pessoais ── */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-4 py-3 border-b border-wf-border">
            <p className="text-[10px] font-black text-wf-text-muted uppercase tracking-widest">Dados pessoais</p>
          </div>
          <div className="p-4 space-y-3">
            <Field label="Nome" value={nome} onChange={setNome} />
            <Field
              label="WhatsApp"
              value={whatsapp}
              onChange={(v) => setWhatsapp(maskWhatsApp(v))}
              inputMode="numeric"
            />
            <Field label="Chave PIX" value={chavePix} onChange={setChavePix} />
            <ReadonlyField label="CPF" value={maskCPF(perfil?.cpf ?? '')} />
            {perfil?.cnpj && <ReadonlyField label="CNPJ" value={maskCNPJ(perfil.cnpj)} />}
            <ReadonlyField label="Distribuidor" value={distribuidorNome} />

            <button
              onClick={() => perfilMutation.mutate()}
              disabled={perfilMutation.isPending}
              className="w-full py-3 bg-wf-red hover:bg-wf-red-dark disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest transition-colors mt-1"
            >
              {perfilMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </div>

        {/* ── Alterar senha ── */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-4 py-3 border-b border-wf-border">
            <p className="text-[10px] font-black text-wf-text-muted uppercase tracking-widest">Alterar senha</p>
          </div>
          <div className="p-4 space-y-3">
            <Field label="Senha atual" value={senhaAtual} onChange={setSenhaAtual} type="password" />
            <Field label="Nova senha" value={novaSenha} onChange={setNovaSenha} type="password" />
            <Field label="Confirmar nova senha" value={confirmaSenha} onChange={setConfirmaSenha} type="password" />
            <button
              onClick={handleSenha}
              disabled={senhaMutation.isPending || !senhaAtual || !novaSenha || !confirmaSenha}
              className="w-full py-3 border border-wf-border hover:bg-gray-50 disabled:opacity-50 text-wf-text-primary text-xs font-black uppercase tracking-widest transition-colors mt-1"
            >
              {senhaMutation.isPending ? 'Alterando...' : 'Alterar senha'}
            </button>
          </div>
        </div>

        {/* ── Logout ── */}
        <button
          onClick={handleLogout}
          className="w-full py-3 bg-white border border-wf-red/30 hover:bg-wf-red hover:border-wf-red text-wf-red hover:text-white text-xs font-black uppercase tracking-widest transition-all"
        >
          Sair da conta
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', inputMode }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  return (
    <div>
      <label className="text-[10px] font-bold text-wf-text-muted uppercase tracking-widest block mb-1.5">
        {label}
      </label>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-wf-border px-3 py-2.5 text-sm text-wf-text-primary focus:outline-none focus:border-wf-red transition-colors"
      />
    </div>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-wf-text-muted uppercase tracking-widest block mb-1.5">
        {label}
      </label>
      <p className="text-sm text-wf-text-muted bg-gray-50 border border-wf-border px-3 py-2.5">
        {value}
      </p>
    </div>
  );
}
