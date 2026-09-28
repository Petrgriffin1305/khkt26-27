/**
 * Design tokens — Modern Minimalist theme.
 * Per PROJECT_CONTEXT: background #F2F2F7, accent #FF6B4A, cards white / 16pt radius.
 */
export const colors = {
  background: '#F2F2F7',
  card: '#FFFFFF',
  accent: '#FF6B4A',
  accentPressed: '#E85A3C',
  accentSoft: '#FFF0EC',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  textTertiary: '#C7C7CC',
  border: '#E5E5EA',
  borderFocused: '#FF6B4A',
  success: '#34C759',
  danger: '#FF3B30',
  overlay: 'rgba(0, 0, 0, 0.4)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  card: 16,
  pill: 999,
  button: 14,
} as const;

export const typography = {
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: colors.text,
  },
  bodySecondary: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.textSecondary,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  button: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
};
