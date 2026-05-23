import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className, id, ...props }, ref) => {
  const uid = useId();
  const inputId = id ?? uid;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[11px] font-semibold text-wf-text-secondary uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'bg-white border border-wf-border rounded-lg px-3 py-2.5 text-sm text-wf-text-primary placeholder:text-wf-text-disabled outline-none focus:border-wf-red focus:ring-2 focus:ring-wf-red/10 transition-all',
          error && 'border-red-400 focus:border-red-500 focus:ring-red-500/10',
          className,
        )}
        {...props}
      />
      {error && <span className="text-[11px] text-red-600 font-medium">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, className, children, id, ...props }, ref) => {
  const uid = useId();
  const selectId = id ?? uid;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-[11px] font-semibold text-wf-text-secondary uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          'bg-white border border-wf-border rounded-lg px-3 py-2.5 text-sm text-wf-text-primary outline-none focus:border-wf-red focus:ring-2 focus:ring-wf-red/10 transition-all',
          error && 'border-red-400 focus:border-red-500',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-[11px] text-red-600 font-medium">{error}</span>}
    </div>
  );
});

Select.displayName = 'Select';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, className, id, ...props }, ref) => {
  const uid = useId();
  const textareaId = id ?? uid;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="text-[11px] font-semibold text-wf-text-secondary uppercase tracking-wider">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={cn(
          'bg-white border border-wf-border rounded-lg px-3 py-2.5 text-sm text-wf-text-primary placeholder:text-wf-text-disabled outline-none focus:border-wf-red focus:ring-2 focus:ring-wf-red/10 transition-all resize-none',
          error && 'border-red-400 focus:border-red-500',
          className,
        )}
        {...props}
      />
      {error && <span className="text-[11px] text-red-600 font-medium">{error}</span>}
    </div>
  );
});

Textarea.displayName = 'Textarea';
