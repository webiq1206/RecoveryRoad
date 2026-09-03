import { describe, expect, test } from 'bun:test';
import {
  CheckInSliderValueController,
  clampCheckInSliderValue,
  roundCheckInSliderValue,
} from './checkInSliderValue';
import { CHECKIN_METRIC_KEYS } from '../features/checkin/constants/checkinMetrics';

describe('clampCheckInSliderValue', () => {
  test('clamps to 0–100', () => {
    expect(clampCheckInSliderValue(-5)).toBe(0);
    expect(clampCheckInSliderValue(150)).toBe(100);
    expect(clampCheckInSliderValue(67.4)).toBe(67.4);
  });
});

describe('roundCheckInSliderValue', () => {
  test('rounds within range', () => {
    expect(roundCheckInSliderValue(66.6)).toBe(67);
    expect(roundCheckInSliderValue(50)).toBe(50);
  });
});

describe('CheckInSliderValueController — drag lifecycle', () => {
  test('each check-in metric: 50 → 67, release, second drag starts at 67', () => {
    for (const metricKey of CHECKIN_METRIC_KEYS) {
      const parentValue = 50;
      const controller = new CheckInSliderValueController(parentValue);
      expect(controller.getDisplayValue()).toBe(50);

      controller.onSlideStart();
      const move = controller.onSlideMove(67);
      expect(move.sliderValue).toBe(67);
      expect(move.emitValue).toBe(67);

      const complete = controller.onSlideComplete(67);
      expect(complete.emitValue).toBe(67);
      expect(controller.isSlidingActive()).toBe(false);
      expect(controller.getSliderValue()).toBe(67);

      // Stale parent prop (still 50) must not reset thumb before second drag.
      const synced = controller.syncFromProp(50);
      expect(synced).toBe(false);
      expect(controller.getSliderValue()).toBe(67);

      // Parent catches up.
      controller.syncFromProp(67);
      expect(controller.getSliderValue()).toBe(67);

      // Second drag begins at 67, not 50.
      controller.onSlideStart();
      expect(controller.getSliderValue()).toBe(67);
      const secondMove = controller.onSlideMove(72);
      expect(secondMove.sliderValue).toBe(72);
      expect(secondMove.emitValue).toBe(72);
      controller.onSlideComplete(72);
      expect(controller.getSliderValue()).toBe(72);

      void metricKey;
    }
  });

  test('continuous drag updates emit only on integer steps', () => {
    const controller = new CheckInSliderValueController(50);
    controller.onSlideStart();

    expect(controller.onSlideMove(50.4).emitValue).toBeNull();
    expect(controller.onSlideMove(50.6).emitValue).toBe(51);
    expect(controller.onSlideMove(51.2).emitValue).toBeNull();
    expect(controller.onSlideMove(51.8).emitValue).toBe(52);
  });

  test('does not stop mid-drag when parent prop echoes emitted value', () => {
    const controller = new CheckInSliderValueController(50);
    controller.onSlideStart();
    controller.onSlideMove(55);
    expect(controller.syncFromProp(55)).toBe(false);
    expect(controller.isSlidingActive()).toBe(true);
    expect(controller.getSliderValue()).toBe(55);

    const mid = controller.onSlideMove(60);
    expect(mid.sliderValue).toBe(60);
    expect(mid.emitValue).toBe(60);
  });

  test('external override (sleep carry-over) applies when not sliding', () => {
    const controller = new CheckInSliderValueController(50);
    expect(controller.syncFromProp(80)).toBe(true);
    expect(controller.getSliderValue()).toBe(80);
  });
});
