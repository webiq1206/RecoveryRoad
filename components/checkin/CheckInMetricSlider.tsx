import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '../../constants/colors';
import {
  CheckInSliderValueController,
  roundCheckInSliderValue,
} from '../../utils/checkInSliderValue';

export interface CheckInMetricSliderProps {
  label: string;
  icon: React.ReactNode;
  color: string;
  lowLabel: string;
  highLabel: string;
  value: number;
  onValueChange: (val: number) => void;
  readOnly?: boolean;
  locked?: boolean;
  onDragStateChange?: (dragging: boolean) => void;
}

export function CheckInMetricSlider({
  label,
  icon,
  color,
  lowLabel,
  highLabel,
  value,
  onValueChange,
  readOnly = false,
  locked = false,
  onDragStateChange,
}: CheckInMetricSliderProps) {
  const controllerRef = useRef<CheckInSliderValueController>(
    new CheckInSliderValueController(value),
  );
  const controller = controllerRef.current;

  const [sliderValue, setSliderValue] = useState(() => controller.getSliderValue());
  const [displayValue, setDisplayValue] = useState(() => controller.getDisplayValue());

  const onValueChangeRef = useRef(onValueChange);
  const onDragStateChangeRef = useRef(onDragStateChange);
  const lastHapticRef = useRef(displayValue);

  useEffect(() => {
    onValueChangeRef.current = onValueChange;
  }, [onValueChange]);

  useEffect(() => {
    onDragStateChangeRef.current = onDragStateChange;
  }, [onDragStateChange]);

  useEffect(() => {
    if (controller.syncFromProp(value)) {
      setSliderValue(controller.getSliderValue());
      setDisplayValue(controller.getDisplayValue());
      lastHapticRef.current = controller.getDisplayValue();
    }
  }, [value, controller]);

  const emitIfNeeded = useCallback((emitValue: number | null) => {
    if (emitValue === null) return;
    if (emitValue !== lastHapticRef.current) {
      lastHapticRef.current = emitValue;
      Haptics.selectionAsync();
    }
    onValueChangeRef.current(emitValue);
  }, []);

  const handleSlidingStart = useCallback(() => {
    controller.onSlideStart();
    onDragStateChangeRef.current?.(true);
  }, [controller]);

  const handleValueChange = useCallback(
    (raw: number) => {
      const { sliderValue: next, emitValue } = controller.onSlideMove(raw);
      setSliderValue(next);
      setDisplayValue(roundCheckInSliderValue(next));
      emitIfNeeded(emitValue);
    },
    [controller, emitIfNeeded],
  );

  const handleSlidingComplete = useCallback(
    (raw: number) => {
      const { sliderValue: next, emitValue } = controller.onSlideComplete(raw);
      setSliderValue(next);
      setDisplayValue(next);
      lastHapticRef.current = emitValue;
      onValueChangeRef.current(emitValue);
      onDragStateChangeRef.current?.(false);
    },
    [controller],
  );

  const isDisabled = readOnly || locked;
  const trackColor = locked ? Colors.textMuted : color;

  return (
    <View style={[styles.container, isDisabled && styles.containerDisabled]}>
      <View style={styles.labelRow}>
        <View style={styles.iconLabel}>
          {icon}
          <Text style={styles.label}>{label}</Text>
          {locked && <Lock size={12} color={Colors.textMuted} />}
        </View>
        <Text style={[styles.valueText, { color: trackColor }]}>{displayValue}</Text>
      </View>

      <View style={styles.sliderWrap}>
        <Slider
          style={styles.slider}
          value={sliderValue}
          onSlidingStart={handleSlidingStart}
          onValueChange={handleValueChange}
          onSlidingComplete={handleSlidingComplete}
          minimumValue={0}
          maximumValue={100}
          step={1}
          disabled={isDisabled}
          minimumTrackTintColor={trackColor}
          maximumTrackTintColor={Colors.surface}
          thumbTintColor={trackColor}
          tapToSeek
        />
      </View>

      <View style={styles.rangeLabels}>
        <Text style={styles.rangeText}>{lowLabel}</Text>
        {locked && <Text style={styles.lockedText}>From morning check-in</Text>}
        <Text style={styles.rangeText}>{highLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  containerDisabled: {
    opacity: 0.45,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  iconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  valueText: {
    fontSize: 18,
    fontWeight: '700' as const,
    fontVariant: ['tabular-nums'],
  },
  sliderWrap: {
    height: 40,
    justifyContent: 'center',
    marginHorizontal: -4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  rangeText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  lockedText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontStyle: 'italic' as const,
  },
});
