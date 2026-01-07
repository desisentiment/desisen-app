/**
 * Design Tokens System
 * Consistent spacing, typography, and design values
 */

// Spacing system (multiples of 4px)
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
  xxxl: '48px',
} as const;

// Typography scale with clear hierarchy
export const typography = {
  h1: 'text-2xl md:text-3xl font-bold',
  h2: 'text-xl md:text-2xl font-semibold',
  h3: 'text-lg md:text-xl font-medium',
  h4: 'text-base md:text-lg font-medium',
  body: 'text-sm md:text-base',
  small: 'text-xs md:text-sm',
  caption: 'text-xs',
  button: 'text-sm md:text-base font-medium',
} as const;

// Color palette with semantic naming
export const colors = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  accent: 'hsl(var(--accent))',
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  destructive: 'hsl(var(--destructive))',
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  card: 'hsl(var(--card))',
  border: 'hsl(var(--border))',
  muted: 'hsl(var(--muted))',
} as const;

// Border radius values
export const radius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  full: '9999px',
} as const;

// Shadow values
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

// Animation values
export const transitions = {
  fast: 'all 0.15s ease-in-out',
  normal: 'all 0.25s ease-in-out',
  slow: 'all 0.35s ease-in-out',
} as const;

// Breakpoints (consistent with Tailwind)
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  xxl: '1536px',
} as const;

// Z-index values for consistent layering
export const zIndex = {
  modal: 50,
  dropdown: 40,
  header: 30,
  sidebar: 20,
  base: 10,
} as const;