import { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';
import api from '../../services/api';

const tabs = [
  {
    to: '/vendedor/home',
    label: 'Início',
    icon: (active: boolean) => (
      <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth={active ? 2.25 : 1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/vendedor/campanhas',
    label: 'Campanhas',
    icon: (active: boolean) => (
      <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth={active ? 2.25 : 1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
  },
  {
    to: '/vendedor/financeiro',
    label: 'Carteira',
    icon: (active: boolean) => (
      <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth={active ? 2.25 : 1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    to: '/vendedor/perfil',
    label: 'Perfil',
    icon: (active: boolean) => (
      <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth={active ? 2.25 : 1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export function VendedorLayout() {
  const navigate = useNavigate();
  const { vendedor, refreshToken, logout } = useAuthStore();
  const [naoLidas, setNaoLidas] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchCount() {
      try {
        const { data } = await api.get('/notificacoes/nao-lidas/count');
        setNaoLidas(data.count ?? 0);
      } catch {
        /* silent */
      }
    }
    fetchCount();
    const timer = setInterval(fetchCount, 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  async function handleLogout() {
    try {
      if (refreshToken) {
        await api.post('/auth/vendedor/logout', { refreshToken });
      }
    } catch {
      /* silent */
    }
    logout();
    navigate('/login', { replace: true });
  }

  const initials = vendedor?.nome
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() ?? '';

  return (
    <div className="min-h-screen bg-wf-bg text-wf-text-primary flex flex-col">

      {/* ── Fixed header ── */}
      <header className="fixed top-0 left-0 right-0 z-30 h-14 bg-[#0f0f0f] flex items-center justify-between px-4">
        {/* Logo */}
        <img
          src="/logo.png"
          alt="World Film"
          className="h-8 w-auto object-contain"
        />

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Notifications */}
          <button
            className="relative p-2 text-white/50 hover:text-white transition-colors"
            onClick={() => navigate('/vendedor/notificacoes')}
            aria-label="Notificações"
          >
            <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {naoLidas > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-wf-red text-white text-[9px] font-black flex items-center justify-center leading-none rounded-full px-1">
                {naoLidas > 9 ? '9+' : naoLidas}
              </span>
            )}
          </button>

          {/* User avatar + dropdown menu */}
          {vendedor?.nome && (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-1.5 pl-1 pr-2 py-1.5 rounded-full hover:bg-white/10 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-wf-red flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {initials}
                </div>
                <svg
                  className={cn('w-3 h-3 text-white/40 shrink-0 transition-transform duration-200', menuOpen && 'rotate-180')}
                  fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-wf-border shadow-xl rounded-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-wf-border/60 bg-gray-50">
                    <p className="text-[10px] text-wf-text-muted uppercase tracking-wider">Logado como</p>
                    <p className="text-[13px] font-semibold text-wf-text-primary mt-0.5 truncate">{vendedor.nome}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-[12px] font-semibold text-wf-red hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sair da conta
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 mt-14 mb-16">
        <div className="w-full max-w-lg mx-auto">
          <Outlet />
        </div>
      </main>

      {/* ── Bottom navigation ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 bg-white"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -1px 0 rgba(0,0,0,0.06)',
        }}
      >
        <div className="h-16 flex items-stretch max-w-lg mx-auto">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/vendedor/home'}
              className={({ isActive }) =>
                cn(
                  'flex-1 flex flex-col items-center justify-center gap-1 transition-colors relative',
                  isActive ? 'text-wf-red' : 'text-gray-400',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-wf-red rounded-b-full" />
                  )}
                  <span className={cn('transition-transform duration-150', isActive && 'scale-110')}>
                    {tab.icon(isActive)}
                  </span>
                  <span className={cn('text-[10px]', isActive ? 'font-medium' : 'font-normal')}>
                    {tab.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
