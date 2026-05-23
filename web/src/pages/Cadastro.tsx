import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { authService } from '../services/auth.service';
import api from '../services/api';
import { cn } from '../lib/utils';

// ── Masks ─────────────────────────────────────────────────────────────────────

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

function maskWhatsApp(v: string): string {
  const d = v.replace(/^\+55\s*/, '').replace(/\D/g, '').slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `+55 (${d}`;
  if (d.length <= 7) return `+55 (${d.slice(0, 2)}) ${d.slice(2)}`;
  return `+55 (${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// ── Validators ────────────────────────────────────────────────────────────────

function validateCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (len: number) => {
    let s = 0;
    for (let i = 0; i < len; i++) s += parseInt(d[i]) * (len + 1 - i);
    const r = (s * 10) % 11;
    return r >= 10 ? 0 : r;
  };
  return calc(9) === parseInt(d[9]) && calc(10) === parseInt(d[10]);
}

function validateCNPJ(cnpj: string): boolean {
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const calc = (w: number[]) => {
    let s = 0;
    for (let i = 0; i < w.length; i++) s += parseInt(d[i]) * w[i];
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(w1) === parseInt(d[12]) && calc(w2) === parseInt(d[13]);
}

// ── Zod schemas ───────────────────────────────────────────────────────────────

const schema1 = z.object({
  nome: z.string().min(1, 'Nome obrigatório').refine(
    (v) => v.trim().split(/\s+/).filter(Boolean).length >= 3,
    'Informe o nome completo (mínimo 3 palavras)',
  ),
  cpf: z.string().refine(validateCPF, 'CPF inválido'),
  cnpj: z.string().optional().refine(
    (v) => !v || v.replace(/\D/g, '').length === 0 || validateCNPJ(v),
    'CNPJ inválido',
  ),
  whatsapp: z.string().refine(
    (v) => v.replace(/^\+55\s*/, '').replace(/\D/g, '').length === 11,
    'Informe o WhatsApp com DDD (ex: 11 99999-9999)',
  ),
});

const schema2 = z
  .object({
    senha: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/\d/, 'Deve conter ao menos 1 número')
      .regex(/[A-Z]/, 'Deve conter ao menos 1 letra maiúscula'),
    confirmaSenha: z.string().min(1, 'Confirme a senha'),
    email: z.union([z.string().email('E-mail inválido'), z.literal('')]).optional(),
  })
  .refine((d) => d.senha === d.confirmaSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmaSenha'],
  });

const schema3 = z.object({
  distribuidor_id: z.string().min(1, 'Selecione um distribuidor'),
  chave_pix: z.string().min(1, 'Chave PIX obrigatória'),
  aceitou: z.boolean().refine((v) => v, 'Aceite os termos de uso para continuar'),
});

function flattenErrors(err: z.ZodError): Record<string, string> {
  return Object.fromEntries(err.errors.map((e) => [e.path[0] as string, e.message]));
}

// ── Left panel ────────────────────────────────────────────────────────────────

function LeftPanel() {
  return (
    <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden flex-shrink-0">
      <img
        src="/car.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-black/60" />

      <div className="relative z-10 flex flex-col justify-between p-12 w-full">
        <div>
          <img
            src="/logo.png"
            alt="World Film"
            className="h-12 w-auto object-contain"
          />
        </div>

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

// ── Component ─────────────────────────────────────────────────────────────────

interface Distribuidor {
  id: string;
  razao_social: string;
}

const STEP_LABELS = ['Dados pessoais', 'Acesso', 'Vinculação'];

export default function Cadastro() {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  const [senha, setSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [email, setEmail] = useState('');

  const [distribuidores, setDistribuidores] = useState<Distribuidor[]>([]);
  const [busca, setBusca] = useState('');
  const [distribuidorId, setDistribuidorId] = useState('');
  const [chavePix, setChavePix] = useState('');
  const [aceitou, setAceitou] = useState(false);

  useEffect(() => {
    api
      .get<Distribuidor[]>('/distribuidores/lista-publica')
      .then((r) => setDistribuidores(r.data))
      .catch(() => {});
  }, []);

  const distribuidoresFiltrados = useMemo(
    () =>
      distribuidores.filter((d) =>
        d.razao_social.toLowerCase().includes(busca.toLowerCase()),
      ),
    [distribuidores, busca],
  );

  const distribuidorSelecionado = distribuidores.find((d) => d.id === distribuidorId);

  function clearError(field: string) {
    setErrors((e) => {
      const n = { ...e };
      delete n[field];
      return n;
    });
  }

  function blurField(field: string, schema: z.ZodTypeAny, value: unknown) {
    const r = schema.safeParse(value);
    if (!r.success) {
      setErrors((e) => ({ ...e, [field]: r.error.errors[0].message }));
    } else {
      clearError(field);
    }
  }

  function nextStep() {
    let result: z.SafeParseReturnType<unknown, unknown>;
    if (step === 1) {
      result = schema1.safeParse({ nome, cpf, cnpj: cnpj || undefined, whatsapp });
    } else {
      result = schema2.safeParse({ senha, confirmaSenha, email: email || undefined });
    }
    if (!result.success) {
      setErrors(flattenErrors(result.error as z.ZodError));
      return;
    }
    setErrors({});
    setStep((s) => s + 1);
  }

  async function handleSubmit() {
    const result = schema3.safeParse({ distribuidor_id: distribuidorId, chave_pix: chavePix, aceitou });
    if (!result.success) {
      setErrors(flattenErrors(result.error));
      return;
    }
    setSubmitting(true);
    try {
      await authService.vendedorRegister({
        nome,
        cpf: cpf.replace(/\D/g, ''),
        cnpj: cnpj.replace(/\D/g, '') || undefined,
        whatsapp: whatsapp.replace(/^\+55\s*/, '').replace(/\D/g, ''),
        senha,
        email: email || undefined,
        distribuidor_id: distribuidorId,
        chave_pix: chavePix,
      });
      setDone(true);
    } catch (err: any) {
      setErrors({ submit: err?.response?.data?.message ?? 'Erro ao enviar cadastro' });
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex bg-white">
        <LeftPanel />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-wf-red mx-auto mb-6 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-wf-text-primary uppercase tracking-wide mb-3">
              Cadastro enviado!
            </h1>
            <p className="text-wf-text-muted text-sm mb-8">
              Aguarde a aprovação da World Film. Você será notificado assim que seu
              cadastro for analisado.
            </p>
            <Link
              to="/login"
              className="inline-block bg-wf-red hover:bg-wf-red-dark text-white font-bold uppercase tracking-widest px-6 py-3 text-sm transition-colors"
            >
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    );
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
      <div className="flex-1 flex items-start justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-sm py-8">

          {/* Header */}
          <div className="mb-7">
            <p className="text-[10px] font-bold tracking-widest uppercase text-wf-text-muted mb-2">
              Criar conta — Passo {step} de 3
            </p>
            <h2 className="text-3xl font-black text-wf-text-primary uppercase tracking-wide">
              {STEP_LABELS[step - 1]}
            </h2>
            <div className="mt-3 w-6 h-0.5 bg-wf-red" />
          </div>

          {/* Progress */}
          <div className="flex gap-1.5 mb-7">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn('h-0.5 flex-1 transition-colors', s <= step ? 'bg-wf-red' : 'bg-wf-border')}
              />
            ))}
          </div>

          {/* Form fields */}
          <div className="space-y-4">

            {/* Step 1 */}
            {step === 1 && (
              <>
                <Input
                  label="Nome completo *"
                  placeholder="João da Silva Santos"
                  value={nome}
                  onChange={(e) => { setNome(e.target.value); clearError('nome'); }}
                  onBlur={() => blurField('nome', schema1.shape.nome, nome)}
                  error={errors.nome}
                  autoFocus
                />
                <Input
                  label="CPF *"
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => { setCpf(maskCPF(e.target.value)); clearError('cpf'); }}
                  onBlur={() => blurField('cpf', schema1.shape.cpf, cpf)}
                  error={errors.cpf}
                />
                <Input
                  label="CNPJ (opcional)"
                  type="text"
                  inputMode="numeric"
                  placeholder="00.000.000/0000-00"
                  value={cnpj}
                  onChange={(e) => { setCnpj(maskCNPJ(e.target.value)); clearError('cnpj'); }}
                  onBlur={() => { if (cnpj) blurField('cnpj', schema1.shape.cnpj, cnpj); }}
                  error={errors.cnpj}
                />
                <Input
                  label="WhatsApp *"
                  type="text"
                  inputMode="numeric"
                  placeholder="+55 (11) 99999-9999"
                  value={whatsapp}
                  onChange={(e) => { setWhatsapp(maskWhatsApp(e.target.value)); clearError('whatsapp'); }}
                  onBlur={() => blurField('whatsapp', schema1.shape.whatsapp, whatsapp)}
                  error={errors.whatsapp}
                />
              </>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <>
                <Input
                  label="Senha *"
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => { setSenha(e.target.value); clearError('senha'); }}
                  onBlur={() => blurField('senha', schema2.shape.senha, senha)}
                  error={errors.senha}
                  autoFocus
                />
                <p className="text-xs text-wf-text-muted -mt-2">
                  Mínimo 8 caracteres, com ao menos 1 número e 1 letra maiúscula
                </p>
                <Input
                  label="Confirmar senha *"
                  type="password"
                  placeholder="••••••••"
                  value={confirmaSenha}
                  onChange={(e) => { setConfirmaSenha(e.target.value); clearError('confirmaSenha'); }}
                  onBlur={() => {
                    if (confirmaSenha && senha !== confirmaSenha) {
                      setErrors((e) => ({ ...e, confirmaSenha: 'As senhas não coincidem' }));
                    } else {
                      clearError('confirmaSenha');
                    }
                  }}
                  error={errors.confirmaSenha}
                />
                <Input
                  label="E-mail (opcional)"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                  onBlur={() => { if (email) blurField('email', z.string().email('E-mail inválido'), email); }}
                  error={errors.email}
                />
              </>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-wf-text-muted block mb-1.5">
                    Distribuidor *
                  </label>
                  {distribuidorSelecionado ? (
                    <div className="flex items-center justify-between bg-wf-red/5 border border-wf-red px-3 py-2.5">
                      <span className="text-sm text-wf-text-primary font-medium">{distribuidorSelecionado.razao_social}</span>
                      <button
                        type="button"
                        onClick={() => { setDistribuidorId(''); setBusca(''); clearError('distribuidor_id'); }}
                        className="text-xs text-wf-text-muted hover:text-wf-text-primary ml-2 uppercase tracking-wider"
                      >
                        Trocar
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Buscar distribuidor..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="w-full bg-white border border-wf-border px-3 py-2.5 text-sm text-wf-text-primary placeholder-wf-text-muted focus:outline-none focus:border-wf-red transition-colors"
                      />
                      {distribuidoresFiltrados.length > 0 && (
                        <ul className="mt-1 max-h-40 overflow-y-auto bg-white border border-wf-border divide-y divide-wf-border shadow-md">
                          {distribuidoresFiltrados.map((d) => (
                            <li key={d.id}>
                              <button
                                type="button"
                                onClick={() => { setDistribuidorId(d.id); clearError('distribuidor_id'); }}
                                className="w-full text-left px-3 py-2.5 text-sm text-wf-text-primary hover:bg-gray-50 transition-colors"
                              >
                                {d.razao_social}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {busca && distribuidoresFiltrados.length === 0 && (
                        <p className="mt-1 text-xs text-wf-text-muted px-1">Nenhum distribuidor encontrado</p>
                      )}
                    </>
                  )}
                  {errors.distribuidor_id && (
                    <span className="text-xs text-wf-red mt-1 block">{errors.distribuidor_id}</span>
                  )}
                </div>

                <Input
                  label="Chave PIX *"
                  placeholder="CPF, e-mail, telefone ou chave aleatória"
                  value={chavePix}
                  onChange={(e) => { setChavePix(e.target.value); clearError('chave_pix'); }}
                  onBlur={() => blurField('chave_pix', schema3.shape.chave_pix, chavePix)}
                  error={errors.chave_pix}
                />

                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aceitou}
                      onChange={(e) => { setAceitou(e.target.checked); clearError('aceitou'); }}
                      className="mt-0.5 h-4 w-4 accent-wf-red"
                    />
                    <span className="text-sm text-wf-text-secondary">
                      Concordo com os{' '}
                      <span className="text-wf-red font-semibold">termos de uso</span>
                      {' '}e a política de premiação da World Film
                    </span>
                  </label>
                  {errors.aceitou && (
                    <span className="text-xs text-wf-red mt-1 block">{errors.aceitou}</span>
                  )}
                </div>

                {errors.submit && (
                  <div className="border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    {errors.submit}
                  </div>
                )}
              </>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-2">
              {step > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => { setStep((s) => s - 1); setErrors({}); }}
                >
                  Voltar
                </Button>
              )}
              {step < 3 ? (
                <Button type="button" className="flex-1" onClick={nextStep}>
                  Próximo
                </Button>
              ) : (
                <Button type="button" className="flex-1" loading={submitting} onClick={handleSubmit}>
                  Enviar cadastro
                </Button>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-wf-text-muted mt-6">
            Já tem conta?{' '}
            <Link to="/login" className="text-wf-red hover:text-wf-red-dark font-semibold transition-colors">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
