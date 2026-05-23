import { Button } from './Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const delta = 2;
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    pages.push(i);
  }

  return (
    <div className={`flex items-center gap-1 ${className ?? ''}`}>
      <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
        &laquo;
      </Button>
      {pages[0] > 1 && (
        <>
          <Button variant="ghost" size="sm" onClick={() => onPageChange(1)}>1</Button>
          {pages[0] > 2 && <span className="text-wf-text-muted px-1 text-xs">…</span>}
        </>
      )}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={
            p === page
              ? 'min-w-[32px] h-8 text-[10px] font-bold uppercase tracking-widest bg-wf-red text-white rounded'
              : 'min-w-[32px] h-8 text-[10px] font-medium text-wf-text-muted hover:text-wf-text-primary hover:bg-gray-50 transition-colors'
          }
        >
          {p}
        </button>
      ))}
      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="text-wf-text-muted px-1 text-xs">…</span>}
          <Button variant="ghost" size="sm" onClick={() => onPageChange(totalPages)}>{totalPages}</Button>
        </>
      )}
      <Button variant="ghost" size="sm" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>
        &raquo;
      </Button>
    </div>
  );
}
