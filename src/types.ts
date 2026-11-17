import type {
  DimensionValue,
  ImageSourcePropType,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top' | 'bottom';
export type ToastTheme = 'light' | 'dark' | 'system';
export type ToastVariant = 'default' | 'tinted' | 'filled';
export type ToastImagePosition = 'left' | 'right';

/**
 * Look & behaviour options. Every one of these can be set globally on
 * <ToastProvider> and overridden per toast.
 */
export interface ToastAppearance {
  position?: ToastPosition;
  /** Milliseconds before auto-hide. 0 = stays until dismissed. */
  duration?: number;
  /** Thin countdown bar at the bottom. Default: false. */
  showProgress?: boolean;

  /** Show the success/error/warning/info icon. Default: true. */
  showIcon?: boolean;
  /** Small type badge on the corner of a left image / app icon. Default: true. */
  showTypeBadge?: boolean;
  /** Colored stripe on the left edge. Default: shown automatically when there is no left icon. */
  showAccentBar?: boolean;
  /** Where `image` goes. Default: 'right'. */
  imagePosition?: ToastImagePosition;
  /** App icon shown on the left (like a basic Android toast). Leave unset to hide. */
  appIcon?: ImageSourcePropType;

  /** 'default' = plain card, 'tinted' = soft type color, 'filled' = solid type color. */
  variant?: ToastVariant;
  backgroundColor?: string;
  borderColor?: string;
  titleColor?: string;
  messageColor?: string;

  /** Max lines for the title. Default 1. 0 = unlimited. */
  titleLines?: number;
  /** Max lines for the message. Default 3. 0 = unlimited. */
  messageLines?: number;

  width?: DimensionValue;
  /** Default 560 so it looks right on tablets. */
  maxWidth?: DimensionValue;
  minHeight?: DimensionValue;
  height?: DimensionValue;
  /** Default 18. */
  borderRadius?: number;
  /** Left icon / app icon size. Default 40. */
  iconSize?: number;
  /** Right image size. Default 44. */
  imageSize?: number;

  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  messageStyle?: StyleProp<TextStyle>;
}

export interface ToastOptions extends ToastAppearance {
  /** Pass an existing id to update a toast in place (e.g. "Uploading…" → "Uploaded"). */
  id?: string;
  type?: ToastType;
  title?: string;
  message?: string;
  /** Picture shown left or right (see imagePosition). */
  image?: ImageSourcePropType;
  /** Custom left icon (avatar, logo). Replaces the type icon for this toast. */
  icon?: ImageSourcePropType;
  /** Override the type color for this toast only. */
  accentColor?: string;
  onPress?: () => void;
  onHide?: () => void;
}

export interface ToastConfig extends ToastAppearance {
  /** Distance from the top edge. Tip: pass useSafeAreaInsets().top + 8. */
  topOffset?: number;
  bottomOffset?: number;
  theme?: ToastTheme;
  /** Small header line like a system notification: "MY APP · now". */
  appName?: string;
  timeLabel?: string;
  /** Type colors. */
  colors?: Partial<Record<ToastType, string>>;
  /** Default duration per type, e.g. { error: 6000 }. */
  durations?: Partial<Record<ToastType, number>>;
}

/** @internal */
export interface ToastData extends ToastOptions {
  id: string;
  rev: number;
  dismissing?: boolean;
}
