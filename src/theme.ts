import type { ToastType } from './types';

export const typeColors: Record<ToastType, string> = {
  success: '#16A34A',
  error: '#DC2626',
  warning: '#F59E0B',
  info: '#2563EB',
};

export const typeGlyphs: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '!',
  info: 'i',
};

export const defaultDurations: Record<ToastType, number> = {
  success: 3500,
  error: 5000,
  warning: 4000,
  info: 3500,
};

export const palettes = {
  light: {
    card: '#FFFFFF',
    border: 'rgba(0,0,0,0.06)',
    title: '#111827',
    message: '#4B5563',
    header: '#9CA3AF',
    track: 'rgba(0,0,0,0.05)',
  },
  dark: {
    card: '#1F2023',
    border: 'rgba(255,255,255,0.08)',
    title: '#F9FAFB',
    message: '#D1D5DB',
    header: '#8B8F98',
    track: 'rgba(255,255,255,0.08)',
  },
};
