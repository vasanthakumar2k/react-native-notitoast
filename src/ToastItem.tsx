import { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  Easing,
  Image,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {
  ImageSourcePropType,
  PanResponderGestureState,
} from 'react-native';
import { defaultDurations, palettes, typeColors, typeGlyphs } from './theme';
import type { ToastAppearance, ToastConfig, ToastData } from './types';

type SwipeDirection = 'left' | 'right' | 'up' | 'down';

interface Props {
  toast: ToastData;
  config: ToastConfig;
  scheme: 'light' | 'dark';
  topOffset: number;
  bottomOffset: number;
  onExited: () => void;
}

/** Per-toast values win over provider values, but `undefined` never overrides. */
function mergeAppearance(
  base: ToastAppearance,
  over: ToastAppearance
): ToastAppearance {
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(over)) {
    if (value !== undefined) out[key] = value;
  }
  return out as ToastAppearance;
}

export function ToastItem({
  toast,
  config,
  scheme,
  topOffset,
  bottomOffset,
  onExited,
}: Props) {
  const o = mergeAppearance(config, toast);
  const type = toast.type ?? 'info';
  const isTop = (o.position ?? 'top') === 'top';
  const duration =
    toast.duration ??
    config.durations?.[type] ??
    config.duration ??
    defaultDurations[type];
  const showProgress = o.showProgress ?? false;
  const variant = o.variant ?? 'default';
  const filled = variant === 'filled';
  const accent = toast.accentColor ?? config.colors?.[type] ?? typeColors[type];
  const palette = palettes[scheme];
  const glyph = typeGlyphs[type];

  // Colors
  const onFilled = type === 'warning' ? '#111827' : '#FFFFFF';
  const cardBg = o.backgroundColor ?? (filled ? accent : palette.card);
  const borderColor = o.borderColor ?? (filled ? 'transparent' : palette.border);
  const titleColor = o.titleColor ?? (filled ? onFilled : palette.title);
  const messageColor = o.messageColor ?? (filled ? onFilled : palette.message);
  const badgeBg = filled ? onFilled : accent;
  const badgeGlyph = filled ? accent : '#FFFFFF';

  // Layout pieces
  const imagePosition = o.imagePosition ?? 'right';
  const showIcon = o.showIcon ?? true;
  const leftImage: ImageSourcePropType | undefined =
    (imagePosition === 'left' ? toast.image : undefined) ??
    toast.icon ??
    o.appIcon;
  const rightImage = imagePosition === 'right' ? toast.image : undefined;
  const showTypeIcon = !leftImage && showIcon;
  const showCornerBadge = !!leftImage && showIcon && (o.showTypeBadge ?? true);
  const hasLeft = !!leftImage || showTypeIcon;
  const showAccentBar = o.showAccentBar ?? (!hasLeft && !filled);

  // Sizes
  const radius = o.borderRadius ?? 18;
  const iconSize = o.iconSize ?? 40;
  const imageSize = o.imageSize ?? 44;
  const innerBadge = Math.round(iconSize * 0.55);
  const cornerBadge = Math.max(14, Math.round(iconSize * 0.42));
  const titleLines = o.titleLines ?? 1;
  const messageLines = o.messageLines ?? 3;

  const hiddenY = isTop ? -(topOffset + 200) : bottomOffset + 200;

  const translateY = useRef(new Animated.Value(hiddenY)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(1)).current;
  const exiting = useRef(false);
  const onExitedRef = useRef(onExited);
  onExitedRef.current = onExited;
  const onHideRef = useRef(toast.onHide);
  onHideRef.current = toast.onHide;

  const translateX = useRef(new Animated.Value(0)).current;
  const dragging = useRef(false);
  // Fade out while dragged sideways.
  const sideFade = useRef(
    translateX.interpolate({
      inputRange: [-Dimensions.get('window').width, 0, Dimensions.get('window').width],
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    })
  ).current;

  // Swipe directions. `swipeable: false` turns all of them off.
  const swipeable = o.swipeable ?? true;
  // Left/right are opt-in. Up (top) / down (bottom) is the default, used
  // only while neither left nor right is turned on.
  const left = swipeable && (o.swipeLeft ?? false);
  const right = swipeable && (o.swipeRight ?? false);
  const sideways = left || right;
  const swipe = {
    left,
    right,
    up: swipeable && (o.swipeUp ?? (isTop && !sideways)),
    down: swipeable && (o.swipeDown ?? (!isTop && !sideways)),
  };
  const swipeRef = useRef(swipe);
  swipeRef.current = swipe;

  const pauseTimer = () => progress.stopAnimation();

  const startTimer = () => {
    if (duration <= 0 || exiting.current || dragging.current) return;
    progress.stopAnimation((value) => {
      Animated.timing(progress, {
        toValue: 0,
        duration: value * duration,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) dismiss();
      });
    });
  };

  /** `direction` = swipe direction the toast leaves in; default slides back to its edge. */
  const dismiss = (direction?: SwipeDirection) => {
    if (exiting.current) return;
    exiting.current = true;
    progress.stopAnimation();
    const { width, height } = Dimensions.get('window');
    const horizontal = direction === 'left' || direction === 'right';
    const target =
      direction === 'left'
        ? -width
        : direction === 'right'
          ? width
          : direction === 'up'
            ? -height
            : direction === 'down'
              ? height
              : hiddenY;
    Animated.parallel([
      Animated.timing(horizontal ? translateX : translateY, {
        toValue: target,
        duration: direction ? 200 : 240,
        easing: direction ? Easing.out(Easing.quad) : Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHideRef.current?.();
      onExitedRef.current();
    });
  };

  // Latest-closure ref so the (once-created) PanResponder never goes stale.
  const actions = useRef({ dismiss, startTimer, pauseTimer });
  actions.current = { dismiss, startTimer, pauseTimer };

  // Axis locked when the drag starts, so a swipe moves on one axis only.
  const axis = useRef<'x' | 'y'>('y');

  const snapBack = () => {
    dragging.current = false;
    Animated.parallel([
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
    ]).start();
    actions.current.startTimer();
  };

  /** Allowed direction follows the finger; a blocked one only gives a little. */
  const follow = (d: number, negOk: boolean, posOk: boolean) =>
    d < 0 ? (negOk ? d : d * 0.15) : posOk ? d : d * 0.15;

  /** Claim the drag only on an axis that has an enabled direction. */
  const shouldClaim = (g: PanResponderGestureState) => {
    const s = swipeRef.current;
    const absX = Math.abs(g.dx);
    const absY = Math.abs(g.dy);
    if (absX > absY) return absX > 6 && (s.left || s.right);
    return absY > 6 && (s.up || s.down);
  };

  const pan = useRef(
    PanResponder.create({
      // Capture phase: take the drag before the inner Pressable can keep it,
      // otherwise sideways drags can get swallowed by the press handling.
      onMoveShouldSetPanResponderCapture: (_, g) => shouldClaim(g),
      onMoveShouldSetPanResponder: (_, g) => shouldClaim(g),
      onPanResponderGrant: (_, g) => {
        axis.current = Math.abs(g.dx) > Math.abs(g.dy) ? 'x' : 'y';
        dragging.current = true;
        actions.current.pauseTimer();
      },
      onPanResponderMove: (_, g) => {
        const s = swipeRef.current;
        if (axis.current === 'x') {
          translateX.setValue(follow(g.dx, s.left, s.right));
        } else {
          translateY.setValue(follow(g.dy, s.up, s.down));
        }
      },
      onPanResponderRelease: (_, g) => {
        const s = swipeRef.current;
        let direction: SwipeDirection | undefined;
        if (axis.current === 'x') {
          if (s.left && (g.dx < -60 || g.vx < -0.3)) direction = 'left';
          else if (s.right && (g.dx > 60 || g.vx > 0.3)) direction = 'right';
        } else {
          if (s.up && (g.dy < -24 || g.vy < -0.6)) direction = 'up';
          else if (s.down && (g.dy > 24 || g.vy > 0.6)) direction = 'down';
        }
        if (direction) {
          dragging.current = false;
          actions.current.dismiss(direction);
          return;
        }
        snapBack();
      },
      onPanResponderTerminate: () => snapBack(),
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  // Enter animation + announce for screen readers.
  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        damping: 18,
        stiffness: 180,
        mass: 0.9,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
    startTimer();
    const spoken = [toast.title, toast.message].filter(Boolean).join('. ');
    if (spoken) AccessibilityInfo.announceForAccessibility(spoken);
    return () => progress.stopAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Same id shown again → content updated, restart the timer.
  const firstRev = useRef(toast.rev);
  useEffect(() => {
    if (toast.rev === firstRev.current) return;
    progress.stopAnimation();
    progress.setValue(1);
    startTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.rev, duration]);

  useEffect(() => {
    if (toast.dismissing) dismiss();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.dismissing]);

  const handlePress = () => {
    toast.onPress?.();
    dismiss();
  };

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const sizeStyle = {
    ...(o.width !== undefined && { width: o.width }),
    ...(o.maxWidth !== undefined && { maxWidth: o.maxWidth }),
    ...(o.minHeight !== undefined && { minHeight: o.minHeight }),
    ...(o.height !== undefined && { height: o.height }),
  };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.container,
        isTop ? { top: topOffset } : { bottom: bottomOffset },
        {
          opacity: Animated.multiply(opacity, sideFade),
          transform: [{ translateX }, { translateY }],
        },
      ]}
      {...pan.panHandlers}
    >
      <View
        style={[
          styles.shadow,
          { backgroundColor: cardBg, borderColor, borderRadius: radius },
          sizeStyle,
          o.style,
        ]}
      >
        <Pressable
          onPress={handlePress}
          onPressIn={pauseTimer}
          onPressOut={startTimer}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={[styles.card, { borderRadius: radius }]}
        >
          {variant === 'tinted' ? (
            <View
              pointerEvents="none"
              style={[
                styles.fill,
                {
                  backgroundColor: accent,
                  opacity: scheme === 'dark' ? 0.16 : 0.08,
                },
              ]}
            />
          ) : null}

          {showAccentBar ? (
            <View style={[styles.accentBar, { backgroundColor: accent }]} />
          ) : null}

          <View
            style={[
              styles.row,
              showAccentBar && styles.rowWithBar,
              !hasLeft && styles.rowTextOnly,
            ]}
          >
            {leftImage ? (
              <View style={{ width: iconSize, height: iconSize }}>
                <Image
                  source={leftImage}
                  style={{
                    width: iconSize,
                    height: iconSize,
                    borderRadius: Math.round(iconSize * 0.28),
                  }}
                />
                {showCornerBadge ? (
                  <View
                    style={[
                      styles.cornerBadge,
                      {
                        width: cornerBadge,
                        height: cornerBadge,
                        borderRadius: cornerBadge / 2,
                        backgroundColor: badgeBg,
                        borderColor: cardBg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.glyph,
                        {
                          color: badgeGlyph,
                          fontSize: Math.round(cornerBadge * 0.5),
                          lineHeight: Math.round(cornerBadge * 0.62),
                        },
                      ]}
                    >
                      {glyph}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : showTypeIcon ? (
              <View
                style={[
                  styles.iconWrap,
                  {
                    width: iconSize,
                    height: iconSize,
                    borderRadius: Math.round(iconSize * 0.3),
                  },
                ]}
              >
                <View
                  style={[
                    styles.fill,
                    {
                      backgroundColor: filled ? '#FFFFFF' : accent,
                      opacity: filled ? 0.22 : 0.12,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.innerBadge,
                    {
                      width: innerBadge,
                      height: innerBadge,
                      borderRadius: innerBadge / 2,
                      backgroundColor: badgeBg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.glyph,
                      {
                        color: badgeGlyph,
                        fontSize: Math.round(innerBadge * 0.58),
                        lineHeight: Math.round(innerBadge * 0.72),
                      },
                    ]}
                  >
                    {glyph}
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={styles.texts}>
              {toast.title ? (
                <Text
                  numberOfLines={titleLines}
                  style={[styles.title, { color: titleColor }, o.titleStyle]}
                >
                  {toast.title}
                </Text>
              ) : null}
              {toast.message ? (
                <Text
                  numberOfLines={messageLines}
                  style={[
                    styles.message,
                    { color: messageColor },
                    filled && styles.softText,
                    o.messageStyle,
                  ]}
                >
                  {toast.message}
                </Text>
              ) : null}
            </View>

            {rightImage ? (
              <Image
                source={rightImage}
                style={{
                  width: imageSize,
                  height: imageSize,
                  borderRadius: Math.round(imageSize * 0.23),
                }}
              />
            ) : null}
          </View>

          {showProgress && duration > 0 ? (
            <View
              style={[
                styles.track,
                {
                  backgroundColor: filled
                    ? 'rgba(255,255,255,0.25)'
                    : palette.track,
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.bar,
                  {
                    backgroundColor: filled ? onFilled : accent,
                    width: barWidth,
                  },
                ]}
              />
            </View>
          ) : null}
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  shadow: {
    width: '100%',
    maxWidth: 560,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  card: {
    flexGrow: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 12,
  },
  rowWithBar: {
    paddingLeft: 18,
  },
  rowTextOnly: {
    paddingVertical: 14,
    paddingRight: 16,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  innerBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontWeight: '800',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  texts: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  message: {
    fontSize: 13.5,
    lineHeight: 18,
    marginTop: 2,
  },
  softText: {
    opacity: 0.88,
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
  },
  bar: {
    height: 3,
  },
});
