import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        toast,
        success: (m) => toast(m, 'success'),
        error: (m) => toast(m, 'error'),
        warning: (m) => toast(m, 'warning'),
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 shadow-md text-sm min-w-[280px] max-w-[420px] cursor-pointer transition-all border-l-4 bg-white ${
            t.type === 'success'
              ? 'border-green-500 text-green-800'
              : t.type === 'error'
              ? 'border-wf-red text-red-700'
              : t.type === 'warning'
              ? 'border-yellow-500 text-yellow-800'
              : 'border-wf-border text-wf-text-secondary'
          }`}
          onClick={() => onClose(t.id)}
        >
          <span className="flex-1">{t.message}</span>
          <button className="opacity-40 hover:opacity-80 text-lg leading-none">&times;</button>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
