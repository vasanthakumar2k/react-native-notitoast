import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Platform,
  StatusBar,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';
import { ToastItem } from './ToastItem';
import { setToastHandler } from './toast';
import type { ToastConfig, ToastData, ToastOptions } from './types';

export interface ToastProviderProps extends ToastConfig {
  children?: ReactNode;
}

export function ToastProvider({ children, ...config }: ToastProviderProps) {
  const [queue, setQueue] = useState<ToastData[]>([]);
  const counter = useRef(0);
  const systemScheme = useColorScheme();

  useEffect(() => {
    setToastHandler({
      show: (options: ToastOptions) => {
        const id = options.id ?? `toast-${++counter.current}`;
        setQueue((q) => {
          const existing = q.find((t) => t.id === id);
          if (existing) {
            return q.map((t) =>
              t.id === id
                ? { ...t, ...options, id, rev: t.rev + 1, dismissing: false }
                : t
            );
          }
          return [...q, { ...options, id, rev: 0 }];
        });
        return id;
      },
      hide: (id?: string) => {
        setQueue((q) => {
          const target = id ?? q[0]?.id;
          return q.flatMap((t, i) =>
            t.id !== target ? [t] : i === 0 ? [{ ...t, dismissing: true }] : []
          );
        });
      },
      hideAll: () => {
        setQueue((q) => (q[0] ? [{ ...q[0], dismissing: true }] : []));
      },
    });
    return () => setToastHandler(null);
  }, []);

  const current = queue[0];

  const handleExited = useCallback((id: string) => {
    setQueue((q) => q.filter((t) => t.id !== id));
  }, []);

  const scheme =
    config.theme === 'light' || config.theme === 'dark'
      ? config.theme
      : systemScheme === 'dark'
        ? 'dark'
        : 'light';

  const topOffset =
    config.topOffset ??
    (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 54);
  const bottomOffset = config.bottomOffset ?? 40;

  return (
    <View style={styles.root}>
      {children}
      {current ? (
        <ToastItem
          key={current.id}
          toast={current}
          config={config}
          scheme={scheme}
          topOffset={topOffset}
          bottomOffset={bottomOffset}
          onExited={() => handleExited(current.id)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
