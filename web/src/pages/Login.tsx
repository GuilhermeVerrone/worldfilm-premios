import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/auth.service';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../contexts/ToastContext';

function maskCPF(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function maskIdentifier(value: string): string {
  if (/[@a-zA-Z]/.test(value)) return value;
  return maskCPF(value);
}

type StatusError = {
  tipo: 'pendente' | 'reprovado' | 'bloqueado';
  motivo?: string;
};

const STATUS_MESSAGES: Record<StatusError['tipo'], string> = {
  pendente: 'Seu cadastro está aguardando aprovação da World Film.',
  reprovado: 'Seu cadastro foi reprovado.',
  bloqueado: 'Sua conta está bloqueada. Entre em contato com a World Film.',
};

function LeftPanel() {
  return (
    <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden flex-shrink-0">
      {/* Car photo */}
      <img
        src="/car.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-black/60" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between p-12 w-full">
        {/* Logo */}
        <div>
          <img
            src="/logo.png"
            alt="World Film"
            className="h-12 w-auto object-contain"
          />
        </div>

        {/* Headline */}
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-white/60 mb-4">
            Portal de Prêmios
          </p>
          <h1 className="text-4xl font-black uppercase tracking-widest text-white leading-tight">
            Películas<br />
            <span className="text-wf-red">Automotivas</span><br />
            &amp; Arquitetura
          </h1>
          <div className="mt-8 w-8 h-0.5 bg-wf-red" />
        </div>

        {/* Footer */}
        <div className="border-t border-white/20 pt-6">
          <p className="text-white/60 text-xs leading-relaxed max-w-xs">
            Presente no mercado brasileiro desde 1999, a World Film fornece
            excelência em películas de controle solar.
          </p>
          <p className="text-white/30 text-[10px] mt-6 uppercase tracking-widest">
            © {new Date().getFullYear()} World Film
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { setUnifiedAuth } = useAuthStore();
  const { error: toastError } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusError, setStatusError] = useState<StatusError | null>(null);

  const [showRecover, setShowRecover] = useState(false);
  const [recoverCpf, setRecoverCpf] = useState('');
  const [recoverLoading, setRecoverLoading] = useState(false);
  const [recoverSent, setRecoverSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatusError(null);
    setLoading(true);
    try {
      const data = await authService.unifiedLogin({ identifier: identifier.replace(/\s/g, ''), senha });
      setUnifiedAuth(data.role, data.user, data.token, data.refreshToken);
      if (data.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/vendedor/home');
      }
    } catch (err: any) {
      if (err?.response?.status === 403) {
        const tipo = err.response.data?.status as StatusError['tipo'];
        if (tipo === 'pendente' || tipo === 'reprovado' || tipo === 'bloqueado') {
          setStatusError({ tipo, motivo: err.response.data?.motivo });
          return;
        }
      }
      toastError(err?.response?.data?.message ?? 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  }

  async function handleRecover(e: FormEvent) {
    e.preventDefault();
    setRecoverLoading(true);
    try {
      await authService.vendedorRecover(recoverCpf.replace(/\D/g, ''));
      setRecoverSent(true);
    } catch (err: any) {
      toastError(err?.response?.data?.message ?? 'Erro ao solicitar recuperação');
    } finally {
      setRecoverLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Mobile header with black background */}
      <header className="lg:hidden bg-[#0A0A0A] h-16 flex items-center px-6 shrink-0 z-20">
        <img
          src="/logo.png"
          alt="World Film"
          className="h-8 w-auto object-contain"
        />
      </header>

      <LeftPanel />

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">

          {!showRecover ? (
            <>
              <div className="mb-8">
                <p className="text-[10px] font-bold tracking-widest uppercase text-wf-text-muted mb-2">
                  Acesso ao portal
                </p>
                <h2 className="text-3xl font-black text-wf-text-primary uppercase tracking-wide">
                  Entrar
                </h2>
                <div className="mt-3 w-6 h-0.5 bg-wf-red" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="E-mail ou CPF"
                  type="text"
                  inputMode="email"
                  placeholder="seu@email.com"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(maskIdentifier(e.target.value));
                    setStatusError(null);
                  }}
                  required
                  autoFocus
                  autoComplete="username"
                />

                <Input
                  label="Senha"
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  autoComplete="current-password"
                />

                {statusError && (
                  <div className="border border-wf-red/20 bg-wf-red/5 px-4 py-3 text-sm text-wf-red">
                    <p>{STATUS_MESSAGES[statusError.tipo]}</p>
                    {statusError.tipo === 'reprovado' && statusError.motivo && (
                      <p className="mt-1 text-xs font-semibold">Motivo: {statusError.motivo}</p>
                    )}
                  </div>
                )}

                <Button type="submit" size="lg" className="w-full mt-2" loading={loading}>
                  Entrar
                </Button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => { setShowRecover(true); setRecoverSent(false); setRecoverCpf(''); }}
                    className="text-xs text-wf-text-muted hover:text-wf-text-secondary transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                  <Link
                    to="/cadastro"
                    className="text-xs text-wf-red hover:text-wf-red-dark transition-colors font-semibold"
                  >
                    Cadastrar-se →
                  </Link>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="mb-8">
                <p className="text-[10px] font-bold tracking-widest uppercase text-wf-text-muted mb-2">
                  Recuperação de acesso
                </p>
                <h2 className="text-3xl font-black text-wf-text-primary uppercase tracking-wide">
                  Recuperar senha
                </h2>
                <div className="mt-3 w-6 h-0.5 bg-wf-red" />
              </div>

              {recoverSent ? (
                <div className="space-y-4">
                  <div className="border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    Instruções enviadas. Verifique seu WhatsApp ou e-mail cadastrado.
                  </div>
                  <Button variant="ghost" className="w-full" onClick={() => setShowRecover(false)}>
                    ← Voltar para o login
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-wf-text-muted text-sm mb-6">
                    Informe seu CPF e enviaremos as instruções de recuperação.
                  </p>
                  <form onSubmit={handleRecover} className="space-y-4">
                    <Input
                      label="CPF"
                      type="text"
                      inputMode="numeric"
                      placeholder="000.000.000-00"
                      value={recoverCpf}
                      onChange={(e) => setRecoverCpf(maskCPF(e.target.value))}
                      required
                      autoFocus
                    />
                    <Button type="submit" size="lg" className="w-full" loading={recoverLoading}>
                      Enviar instruções
                    </Button>
                    <Button type="button" variant="ghost" className="w-full" onClick={() => setShowRecover(false)}>
                      ← Voltar
                    </Button>
                  </form>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
