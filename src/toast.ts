import type { ToastOptions, ToastType } from './types';

interface Handler {
  show: (options: ToastOptions) => string;
  hide: (id?: string) => void;
  hideAll: () => void;
}

let handler: Handler | null = null;

/** @internal */
export function setToastHandler(next: Handler | null) {
  handler = next;
}

function show(options: ToastOptions): string {
  if (!handler) {
    console.warn(
      '[react-native-notitoast] <ToastProvider> is not mounted. Wrap your app root with it.'
    );
    return '';
  }
  return handler.show(options);
}

type ShortcutOptions = Omit<ToastOptions, 'type' | 'title' | 'message'>;
type Shortcut = (
  title: string,
  message?: string,
  options?: ShortcutOptions
) => string;

const make =
  (type: ToastType): Shortcut =>
  (title, message, options) =>
    show({ ...options, type, title, message });

export const toast = Object.assign(show, {
  success: make('success'),
  error: make('error'),
  warning: make('warning'),
  info: make('info'),
  hide: (id?: string) => handler?.hide(id),
  hideAll: () => handler?.hideAll(),
});

export type Toast = typeof toast;

export function useToast(): Toast {
  return toast;
}
