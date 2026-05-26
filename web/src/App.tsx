import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './contexts/ToastContext';
import { useAuthStore } from './store/authStore';
import { lazy, Suspense, Component, type ReactNode, type ErrorInfo } from 'react';
import { PageLoader } from './components/ui/Spinner';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[ErrorBoundary]', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 text-center p-6">
          <p className="text-wf-text-primary font-semibold">Algo deu errado ao carregar esta página.</p>
          <button className="text-sm text-wf-red underline" onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}>
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import { VendedorLayout } from './components/layout/VendedorLayout';

// Public pages
const Login = lazy(() => import('./pages/Login'));
const Cadastro = lazy(() => import('./pages/Cadastro'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Distribuidores = lazy(() => import('./pages/Distribuidores'));
const DistribuidorDetalhe = lazy(() => import('./pages/DistribuidorDetalhe'));
const Vendedores = lazy(() => import('./pages/Vendedores'));
const VendedorDetalhe = lazy(() => import('./pages/VendedorDetalhe'));
const Campanhas = lazy(() => import('./pages/Campanhas'));
const CampanhaDetalhe = lazy(() => import('./pages/CampanhaDetalhe'));
const Produtos = lazy(() => import('./pages/Produtos'));
const Vendas = lazy(() => import('./pages/Vendas'));
const VendaDetalhe = lazy(() => import('./pages/VendaDetalhe'));
const Financeiro = lazy(() => import('./pages/Financeiro'));
const Notificacoes = lazy(() => import('./pages/Notificacoes'));

// Vendedor pages
const VendedorHome = lazy(() => import('./pages/vendedor/Home'));
const VendedorCampanhas = lazy(() => import('./pages/vendedor/Campanhas'));
const VendedorCampanhaDetalhe = lazy(() => import('./pages/vendedor/CampanhaDetalhe'));
const VendaNova = lazy(() => import('./pages/vendedor/VendaNova'));
const VendedorVendas = lazy(() => import('./pages/vendedor/Vendas'));
const VendedorVendaDetalhe = lazy(() => import('./pages/vendedor/VendaDetalhe'));
const VendedorFinanceiro = lazy(() => import('./pages/vendedor/Financeiro'));
const VendedorPerfil = lazy(() => import('./pages/vendedor/Perfil'));
const VendedorNotificacoes = lazy(() => import('./pages/vendedor/Notificacoes'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function AdminRoute() {
  const { token, role } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (role !== 'admin') return <Navigate to="/login" replace />;
  return <Outlet />;
}

function VendedorRoute() {
  const { token, role } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (role !== 'vendedor') return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RootRedirect() {
  const { token, role } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (role === 'vendedor') return <Navigate to="/vendedor/home" replace />;
  return <Navigate to="/admin/dashboard" replace />;
}

const suspenseFallback = (
  <div className="min-h-screen bg-white flex items-center justify-center">
    <PageLoader />
  </div>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <ErrorBoundary>
          <Suspense fallback={suspenseFallback}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Cadastro />} />
              <Route path="/" element={<RootRedirect />} />

              {/* Admin routes — each page manages its own Layout (Sidebar + Header) */}
              <Route element={<AdminRoute />}>
                <Route path="/admin/dashboard" element={<Dashboard />} />
                <Route path="/admin/distribuidores" element={<Distribuidores />} />
                <Route path="/admin/distribuidores/:id" element={<DistribuidorDetalhe />} />
                <Route path="/admin/usuarios" element={<Vendedores />} />
                <Route path="/admin/usuarios/:id" element={<VendedorDetalhe />} />
                <Route path="/admin/campanhas" element={<Campanhas />} />
                <Route path="/admin/campanhas/:id" element={<CampanhaDetalhe />} />
                <Route path="/admin/produtos" element={<Produtos />} />
                <Route path="/admin/vendas" element={<Vendas />} />
                <Route path="/admin/vendas/:id" element={<VendaDetalhe />} />
                <Route path="/admin/financeiro" element={<Financeiro />} />
                <Route path="/admin/notificacoes" element={<Notificacoes />} />
              </Route>

              {/* Vendedor routes — wrapped by VendedorLayout (header + bottom nav) */}
              <Route element={<VendedorRoute />}>
                <Route element={<VendedorLayout />}>
                  <Route path="/vendedor/home" element={<VendedorHome />} />
                  <Route path="/vendedor/campanhas" element={<VendedorCampanhas />} />
                  <Route path="/vendedor/campanhas/:id" element={<VendedorCampanhaDetalhe />} />
                  <Route path="/vendedor/venda/nova" element={<VendaNova />} />
                  <Route path="/vendedor/vendas" element={<VendedorVendas />} />
                  <Route path="/vendedor/vendas/:id" element={<VendedorVendaDetalhe />} />
                  <Route path="/vendedor/financeiro" element={<VendedorFinanceiro />} />
                  <Route path="/vendedor/perfil" element={<VendedorPerfil />} />
                  <Route path="/vendedor/notificacoes" element={<VendedorNotificacoes />} />
                </Route>
              </Route>

              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
