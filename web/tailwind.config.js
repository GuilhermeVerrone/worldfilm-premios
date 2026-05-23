/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        body: ['"Open Sans"', 'sans-serif'],
      },
      colors: {
        // World Film brand colors
        wf: {
          red: '#cc0000',
          'red-dark': '#990000',
          'red-subtle': '#fff1f1',
          // Backgrounds
          bg: '#f8f9fb',
          surface: '#ffffff',
          border: '#e5e7eb',
          'border-subtle': '#f3f4f6',
          // Text with real contrast (WCAG AA)
          'text-primary': '#111827',
          'text-secondary': '#374151',
          'text-muted': '#4b5563',
          'text-disabled': '#9ca3af',
          // States
          error: '#cc0000',
          success: '#16a34a',
          warning: '#d97706',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        none: '0px',
        sm: '2px',
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
        full: '9999px',
        pill: '9999px',
      },
    },
  },
  plugins: [],
};
