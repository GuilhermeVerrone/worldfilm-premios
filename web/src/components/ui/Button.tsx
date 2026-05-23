import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold transition-all focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed rounded-lg',
          {
            'bg-wf-red text-white hover:bg-wf-red-dark shadow-sm':
              variant === 'primary',
            'bg-gray-100 text-gray-700 hover:bg-gray-200':
              variant === 'secondary',
            'text-gray-600 hover:bg-gray-100':
              variant === 'ghost',
            'bg-red-50 text-red-700 hover:bg-red-100':
              variant === 'danger',
            'border border-wf-border text-gray-700 hover:border-gray-400':
              variant === 'outline',
          },
          {
            'px-3 text-xs h-8': size === 'sm',
            'px-4 text-sm h-10': size === 'md',
            'px-6 text-sm h-12': size === 'lg',
          },
          className,
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
export { Button };
