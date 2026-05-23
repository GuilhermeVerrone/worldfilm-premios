import { createContext, useContext, useState, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface TabsContextValue {
  active: string;
  setActive: (v: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

interface TabsProps {
  defaultValue: string;
  children: ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, children, className }: TabsProps) {
  const [active, setActive] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={cn('flex flex-col gap-0', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex gap-0 border-b border-wf-border mb-4', className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useContext(TabsContext)!;
  const isActive = ctx.active === value;
  return (
    <button
      onClick={() => ctx.setActive(value)}
      className={cn(
        'px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-colors -mb-px',
        isActive
          ? 'border-wf-red text-wf-red'
          : 'border-transparent text-wf-text-muted hover:text-wf-text-secondary hover:border-wf-border',
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const ctx = useContext(TabsContext)!;
  if (ctx.active !== value) return null;
  return <div className={className}>{children}</div>;
}
