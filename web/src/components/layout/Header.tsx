import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface HeaderProps {
  title: string;
  breadcrumbs?: { label: string; to?: string }[];
  onMenuClick: () => void;
}

export function Header({ title, breadcrumbs, onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const { admin } = useAuthStore();

  const initials = admin?.nome
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase() ?? 'A';

  return (
    <header className="h-16 bg-white border-b border-wf-border/60 px-4 lg:px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-1 text-wf-text-secondary hover:text-wf-text-primary hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Abrir menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="min-w-0">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="hidden sm:flex items-center gap-1.5 mb-0.5">
              {breadcrumbs.map((b, i) => (
                <span key={i} className="flex items-center gap-1.5 text-xs text-wf-text-muted">
                  {i > 0 && <span className="text-wf-border">/</span>}
                  {b.to ? (
                    <button
                      onClick={() => navigate(b.to!)}
                      className="hover:text-wf-text-secondary transition-colors"
                    >
                      {b.label}
                    </button>
                  ) : (
                    <span className="text-wf-text-secondary font-medium">{b.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          <h1 className="text-base font-semibold text-wf-text-primary truncate">{title}</h1>
        </div>
      </div>

      {/* Right: user info */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden sm:block text-right">
          <p className="text-sm font-medium text-wf-text-secondary leading-tight">{admin?.nome ?? 'Admin'}</p>
          <p className="text-xs text-wf-text-muted">Administrador</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-wf-red flex items-center justify-center text-white text-[11px] font-bold shrink-0">
          {initials}
        </div>
      </div>
    </header>
  );
}
