import React, { useCallback, useEffect, useRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, spacing, typography } from '@/theme/colors';

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 3;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

interface TimeWheelPickerProps {
  hours: number;
  minutes: number;
  seconds: number;
  onChange: (hours: number, minutes: number, seconds: number) => void;
}

interface WheelColumnProps {
  label: string;
  value: number;
  max: number;
  onValueChange: (value: number) => void;
}

function WheelColumn({ label, value, max, onValueChange }: WheelColumnProps) {
  const scrollRef = useRef<ScrollView>(null);
  const isScrolling = useRef(false);
  const lastValue = useRef(value);

  // Generate items: 0 to max
  const items = Array.from({ length: max + 1 }, (_, i) => i);

  // Scroll to the correct position when value changes externally
  useEffect(() => {
    if (value !== lastValue.current && scrollRef.current) {
      lastValue.current = value;
      scrollRef.current.scrollTo({ y: value * ITEM_HEIGHT, animated: false });
    }
  }, [value]);

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(max, index));
      lastValue.current = clamped;
      onValueChange(clamped);
      // Snap to exact position
      scrollRef.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated: true });
    },
    [max, onValueChange]
  );

  const handleScrollBeginDrag = useCallback(() => {
    isScrolling.current = true;
  }, []);

  return (
    <View style={styles.wheelContainer}>
      <Text style={styles.wheelLabel}>{label}</Text>
      <View style={styles.wheelViewport}>
        {/* Selection highlight */}
        <View style={styles.selectionHighlight} pointerEvents="none" />
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={handleMomentumScrollEnd}
          onScrollBeginDrag={handleScrollBeginDrag}
          contentContainerStyle={{
            paddingVertical: ITEM_HEIGHT, // Center the first/last item
          }}
        >
          {items.map((item) => (
            <View key={item} style={styles.wheelItem}>
              <Text
                style={[
                  styles.wheelItemText,
                  item === value && styles.wheelItemTextActive,
                ]}
              >
                {String(item).padStart(2, '0')}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

/**
 * Three-column wheel picker for Hours | Minutes | Seconds.
 * Default: 00:25:00. Each column snaps to the nearest item on release.
 */
export function TimeWheelPicker({
  hours,
  minutes,
  seconds,
  onChange,
}: TimeWheelPickerProps) {
  const handleHoursChange = useCallback(
    (h: number) => onChange(h, minutes, seconds),
    [minutes, seconds, onChange]
  );

  const handleMinutesChange = useCallback(
    (m: number) => onChange(hours, m, seconds),
    [hours, seconds, onChange]
  );

  const handleSecondsChange = useCallback(
    (s: number) => onChange(hours, minutes, s),
    [hours, minutes, onChange]
  );

  return (
    <View style={styles.container}>
      <WheelColumn
        label="Giờ"
        value={hours}
        max={23}
        onValueChange={handleHoursChange}
      />
      <View style={styles.separator}>
        <Text style={styles.separatorText}>:</Text>
      </View>
      <WheelColumn
        label="Phút"
        value={minutes}
        max={59}
        onValueChange={handleMinutesChange}
      />
      <View style={styles.separator}>
        <Text style={styles.separatorText}>:</Text>
      </View>
      <WheelColumn
        label="Giây"
        value={seconds}
        max={59}
        onValueChange={handleSecondsChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  wheelContainer: {
    alignItems: 'center',
  },
  wheelLabel: {
    ...typography.label,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  wheelViewport: {
    height: WHEEL_HEIGHT,
    width: 64,
    overflow: 'hidden',
  },
  selectionHighlight: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.sm,
    zIndex: 0,
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelItemText: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  wheelItemTextActive: {
    color: colors.text,
    fontWeight: '700',
  },
  separator: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    paddingTop: 20, // Align with the wheel items (below label)
  },
  separatorText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});
