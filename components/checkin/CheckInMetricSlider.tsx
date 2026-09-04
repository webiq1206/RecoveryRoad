import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Slider, { type SliderProps, type SliderRef } from '@react-native-community/slider';
import { Lock, Minus, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '../../constants/colors';
import {
  CheckInSliderValueController,
  roundCheckInSliderValue,
} from '../../utils/checkInSliderValue';
import {
  CheckInStepperHoldController,
  type StepperHoldDirection,
} from '../../utils/checkInStepperHold';

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
  // Only web attaches an imperative handle; native forwards the host component.
  const sliderRef = useRef<Partial<SliderRef> | null>(null);
  const holdRef = useRef(new CheckInStepperHoldController());
  const holdScrollLockedRef = useRef(false);
  const pendingTapRef = useRef<StepperHoldDirection | null>(null);
  const holdHapticPlayedRef = useRef(false);

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
    onValueChangeRef.current(roundCheckInSliderValue(emitValue));
  }, []);

  const playSliderHaptic = useCallback((emitValue: number) => {
    if (emitValue === lastHapticRef.current) return;
    lastHapticRef.current = emitValue;
    void Haptics.selectionAsync();
  }, []);

  const playStepperHaptic = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const resyncSliderThumb = useCallback((next: number) => {
    // updateValue only exists on web; on native the ref is the host component
    // and the value prop drives the thumb.
    const instance = sliderRef.current;
    if (typeof instance?.updateValue === 'function') instance.updateValue(next);
  }, []);

  const handleSlidingStart = useCallback(() => {
    controller.onSlideStart();
    onDragStateChangeRef.current?.(true);
  }, [controller]);

  const handleValueChange = useCallback(
    (raw: number) => {
      const previous = controller.getSliderValue();
      const { sliderValue: next, emitValue } = controller.onSlideMove(raw);
      setSliderValue(next);
      setDisplayValue(roundCheckInSliderValue(next));
      if (next === previous && emitValue === null) {
        resyncSliderThumb(next);
      }
      if (emitValue !== null) playSliderHaptic(emitValue);
      emitIfNeeded(emitValue);
    },
    [controller, emitIfNeeded, playSliderHaptic, resyncSliderThumb],
  );

  const handleSlidingComplete = useCallback(
    (raw: number) => {
      const { sliderValue: next, emitValue } = controller.onSlideComplete(raw);
      setSliderValue(next);
      setDisplayValue(next);
      resyncSliderThumb(next);
      lastHapticRef.current = emitValue;
      onValueChangeRef.current(roundCheckInSliderValue(emitValue));
      onDragStateChangeRef.current?.(false);
    },
    [controller, resyncSliderThumb],
  );

  const applyStepperDelta = useCallback(
    (delta: number, haptic: 'tap' | 'holdStart' | 'none'): boolean => {
      const { sliderValue: next, emitValue } = controller.nudge(delta);
      setSliderValue(next);
      setDisplayValue(controller.getDisplayValue());
      if (emitValue === null) return false;
      resyncSliderThumb(next);
      lastHapticRef.current = emitValue;
      if (haptic !== 'none') playStepperHaptic();
      emitIfNeeded(emitValue);
      return true;
    },
    [controller, emitIfNeeded, playStepperHaptic, resyncSliderThumb],
  );

  const unlockHoldScroll = useCallback(() => {
    if (!holdScrollLockedRef.current) return;
    holdScrollLockedRef.current = false;
    onDragStateChangeRef.current?.(false);
  }, []);

  const stopHold = useCallback(() => {
    holdRef.current.stop();
    pendingTapRef.current = null;
    unlockHoldScroll();
  }, [unlockHoldScroll]);

  const isDisabled = readOnly || locked;

  const startHold = useCallback(
    (direction: StepperHoldDirection) => {
      if (isDisabled) return;
      const current = controller.getDisplayValue();
      if (direction < 0 && current <= 0) return;
      if (direction > 0 && current >= 100) return;

      pendingTapRef.current = null;
      holdHapticPlayedRef.current = false;
      if (!holdScrollLockedRef.current) {
        holdScrollLockedRef.current = true;
        onDragStateChangeRef.current?.(true);
      }
      holdRef.current.start(direction, () => {
        const haptic = holdHapticPlayedRef.current ? 'none' : 'holdStart';
        holdHapticPlayedRef.current = true;
        return applyStepperDelta(direction, haptic);
      });
    },
    [applyStepperDelta, controller, isDisabled],
  );

  const endHold = useCallback(
    (direction: StepperHoldDirection) => {
      const { shouldTap } = holdRef.current.release(direction);
      pendingTapRef.current = shouldTap ? direction : null;
      unlockHoldScroll();
    },
    [unlockHoldScroll],
  );

  const commitTap = useCallback(
    (direction: StepperHoldDirection) => {
      if (isDisabled) {
        pendingTapRef.current = null;
        return;
      }
      if (holdRef.current.isActive()) {
        const { shouldTap } = holdRef.current.release(direction);
        unlockHoldScroll();
        if (shouldTap) applyStepperDelta(direction, 'tap');
        pendingTapRef.current = null;
        return;
      }
      if (pendingTapRef.current !== direction) return;
      pendingTapRef.current = null;
      applyStepperDelta(direction, 'tap');
    },
    [applyStepperDelta, isDisabled, unlockHoldScroll],
  );

  useEffect(() => stopHold, [stopHold]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        stopHold();
      };
    }, [stopHold]),
  );

  const minusDisabled = isDisabled || displayValue <= 0;
  const plusDisabled = isDisabled || displayValue >= 100;
  const trackColor = locked ? Colors.textMuted : color;
  const valueA11yText = `${displayValue} of 100`;
  const lockedHint = 'Locked from your morning check-in.';
  const sliderA11yHint = isDisabled
    ? lockedHint
    : `${lowLabel} to ${highLabel}. Swipe to adjust.`;
  const minusA11yHint = isDisabled
    ? lockedHint
    : minusDisabled
      ? 'Already at the minimum of 0.'
      : `Currently ${valueA11yText}.`;
  const plusA11yHint = isDisabled
    ? lockedHint
    : plusDisabled
      ? 'Already at the maximum of 100.'
      : `Currently ${valueA11yText}.`;
  const { width: windowWidth } = useWindowDimensions();
  const sliderStepperGap = windowWidth < 360 ? 12 : 16;
  const availableWidth = Math.max(0, windowWidth - SCREEN_HORIZONTAL_INSET);
  const sliderMinWidth = Math.max(
    96,
    Math.min(128, availableWidth - STEPPER_HIT_WIDTH - sliderStepperGap),
  );

  return (
    <View style={[styles.container, isDisabled && styles.containerDisabled]}>
      <View style={styles.labelRow}>
        <View style={styles.iconLabel} importantForAccessibility="no-hide-descendants">
          <View accessible={false}>{icon}</View>
          <Text style={styles.label}>{label}</Text>
          {locked && <Lock size={12} color={Colors.textMuted} />}
        </View>
        <Text
          style={[styles.valueText, { color: trackColor }]}
          accessibilityRole="text"
          accessibilityLabel={valueA11yText}
          accessibilityLiveRegion="polite"
        >
          {displayValue}
        </Text>
      </View>

      <View style={[styles.sliderRow, { gap: sliderStepperGap }]}>
        <View style={[styles.sliderWrap, { minWidth: sliderMinWidth }]}>
          <Slider
            ref={sliderRef as unknown as SliderProps['ref']}
            style={styles.slider}
            value={sliderValue}
            onSlidingStart={handleSlidingStart}
            onValueChange={handleValueChange}
            onSlidingComplete={handleSlidingComplete}
            minimumValue={0}
            maximumValue={100}
            step={0}
            disabled={isDisabled}
            minimumTrackTintColor={trackColor}
            maximumTrackTintColor={Colors.surface}
            thumbTintColor={trackColor}
            tapToSeek
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={label}
            accessibilityHint={sliderA11yHint}
            accessibilityState={{ disabled: isDisabled }}
            accessibilityValue={{
              min: 0,
              max: 100,
              now: displayValue,
              text: valueA11yText,
            }}
          />
        </View>
        <View style={styles.stepperHitWrap} collapsable={false}>
          <View style={styles.stepperChrome} pointerEvents="none" />
          <Pressable
            style={({ pressed }) => [
              styles.stepperHitCell,
              pressed && !minusDisabled && styles.stepperCellPressed,
            ]}
            onPressIn={() => startHold(-1)}
            onPressOut={() => endHold(-1)}
            onPress={() => commitTap(-1)}
            disabled={isDisabled}
            hitSlop={MINUS_HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel={`Decrease ${label}`}
            accessibilityHint={minusA11yHint}
            accessibilityState={{ disabled: minusDisabled }}
            accessibilityValue={{ min: 0, max: 100, now: displayValue, text: valueA11yText }}
          >
            <Minus
              size={14}
              color={minusDisabled ? Colors.borderLight : Colors.textMuted}
              strokeWidth={2}
            />
          </Pressable>
          <View style={styles.stepperDivider} pointerEvents="none" />
          <Pressable
            style={({ pressed }) => [
              styles.stepperHitCell,
              pressed && !plusDisabled && styles.stepperCellPressed,
            ]}
            onPressIn={() => startHold(1)}
            onPressOut={() => endHold(1)}
            onPress={() => commitTap(1)}
            disabled={isDisabled}
            hitSlop={PLUS_HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel={`Increase ${label}`}
            accessibilityHint={plusA11yHint}
            accessibilityState={{ disabled: plusDisabled }}
            accessibilityValue={{ min: 0, max: 100, now: displayValue, text: valueA11yText }}
          >
            <Plus
              size={14}
              color={plusDisabled ? Colors.borderLight : Colors.textMuted}
              strokeWidth={2}
            />
          </Pressable>
        </View>
      </View>

      <View style={[styles.rangeLabels, { gap: sliderStepperGap }]}>
        <View
          style={[styles.rangeLabelsTrack, { minWidth: sliderMinWidth }]}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          <Text style={styles.rangeText}>{lowLabel}</Text>
          {locked && <Text style={styles.lockedText}>From morning check-in</Text>}
          <Text style={styles.rangeText}>{highLabel}</Text>
        </View>
        <View style={styles.rangeLabelsSpacer} />
      </View>
    </View>
  );
}

const SLIDER_HIT_HEIGHT = 64;
const STEPPER_HIT_SIZE = 48;
const STEPPER_HIT_WIDTH = STEPPER_HIT_SIZE * 2;
const STEPPER_CHROME_INSET_Y = 6;
const SCREEN_HORIZONTAL_INSET = 56;
const MINUS_HIT_SLOP = { top: 4, bottom: 4, left: 0, right: 0 };
const PLUS_HIT_SLOP = { top: 4, bottom: 4, left: 0, right: 10 };

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  containerDisabled: {
    opacity: 0.45,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  iconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  valueText: {
    fontSize: 20,
    fontWeight: '700' as const,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  sliderWrap: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    height: SLIDER_HIT_HEIGHT,
    justifyContent: 'center',
  },
  slider: {
    width: '100%',
    height: SLIDER_HIT_HEIGHT,
  },
  stepperHitWrap: {
    width: STEPPER_HIT_WIDTH,
    height: STEPPER_HIT_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 0,
    flexShrink: 0,
    overflow: 'visible',
  },
  stepperChrome: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: STEPPER_CHROME_INSET_Y,
    bottom: STEPPER_CHROME_INSET_Y,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  stepperHitCell: {
    flex: 1,
    height: STEPPER_HIT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepperCellPressed: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  stepperDivider: {
    width: StyleSheet.hairlineWidth,
    height: 14,
    backgroundColor: Colors.border,
    zIndex: 2,
  },
  rangeLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -6,
    minWidth: 0,
  },
  rangeLabelsTrack: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeLabelsSpacer: {
    width: STEPPER_HIT_WIDTH,
    flexGrow: 0,
    flexShrink: 0,
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
