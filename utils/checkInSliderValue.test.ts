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
      expect(controller.onSlideMove(69).emitValue).toBeNull();
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
    controller.onSlideMove(55);
    const committed = controller.onSlideMove(58);
    expect(committed.emitValue).toBe(58);

    expect(controller.onSlideMove(58.4).emitValue).toBeNull();
    expect(controller.onSlideMove(58.6).emitValue).toBe(59);
    expect(controller.onSlideMove(59.2).emitValue).toBeNull();
    expect(controller.onSlideMove(59.8).emitValue).toBe(60);
  });

  test('does not stop mid-drag when parent prop echoes emitted value', () => {
    const controller = new CheckInSliderValueController(50);
    controller.onSlideStart();
    controller.onSlideMove(70);
    expect(controller.syncFromProp(70)).toBe(false);
    expect(controller.isSlidingActive()).toBe(true);
    expect(controller.getSliderValue()).toBe(70);

    const mid = controller.onSlideMove(75);
    expect(mid.sliderValue).toBe(75);
    expect(mid.emitValue).toBe(75);
  });

  test('external override (sleep carry-over) applies when not sliding', () => {
    const controller = new CheckInSliderValueController(50);
    expect(controller.syncFromProp(80)).toBe(true);
    expect(controller.getSliderValue()).toBe(80);
  });
});

describe('CheckInSliderValueController — stepper nudge', () => {
  test('minus and plus step by 1 from the shared value', () => {
    const controller = new CheckInSliderValueController(78);

    const minus = controller.nudge(-1);
    expect(minus.sliderValue).toBe(77);
    expect(minus.emitValue).toBe(77);
    expect(controller.getDisplayValue()).toBe(77);
    expect(controller.getSliderValue()).toBe(77);

    const plus = controller.nudge(1);
    expect(plus.sliderValue).toBe(78);
    expect(plus.emitValue).toBe(78);
  });

  test('after a slider drag, nudge continues from the dragged value', () => {
    const controller = new CheckInSliderValueController(78);
    controller.onSlideStart();
    controller.onSlideMove(64);
    controller.onSlideComplete(64);

    expect(controller.getDisplayValue()).toBe(64);

    const minus = controller.nudge(-1);
    expect(minus.emitValue).toBe(63);
    expect(controller.getSliderValue()).toBe(63);

    const plus = controller.nudge(1);
    expect(plus.emitValue).toBe(64);
    expect(controller.getSliderValue()).toBe(64);
  });

  test('clamps at 0 and 100 and does not wrap', () => {
    const atMin = new CheckInSliderValueController(0);
    expect(atMin.nudge(-1).emitValue).toBeNull();
    expect(atMin.getSliderValue()).toBe(0);
    expect(atMin.nudge(1).emitValue).toBe(1);

    const atMax = new CheckInSliderValueController(100);
    expect(atMax.nudge(1).emitValue).toBeNull();
    expect(atMax.getSliderValue()).toBe(100);
    expect(atMax.nudge(-1).emitValue).toBe(99);
  });

  test('ignores nudge while sliding so stepper cannot fork state', () => {
    const controller = new CheckInSliderValueController(50);
    controller.onSlideStart();
    controller.onSlideMove(70);

    const nudged = controller.nudge(1);
    expect(nudged.emitValue).toBeNull();
    expect(controller.getSliderValue()).toBe(70);
    expect(controller.isSlidingActive()).toBe(true);
  });
});

describe('CheckInSliderValueController — grab vs tap', () => {
  test('small near-thumb movement does not jump the value', () => {
    const controller = new CheckInSliderValueController(50);
    controller.onSlideStart();

    expect(controller.onSlideMove(52).emitValue).toBeNull();
    expect(controller.getSliderValue()).toBe(50);
    expect(controller.onSlideMove(51.5).emitValue).toBeNull();
    expect(controller.getSliderValue()).toBe(50);

    const complete = controller.onSlideComplete(52);
    expect(complete.emitValue).toBe(50);
    expect(controller.getSliderValue()).toBe(50);
  });

  test('tap far along the track moves to that position', () => {
    const controller = new CheckInSliderValueController(50);
    controller.onSlideStart();

    const move = controller.onSlideMove(80);
    expect(move.emitValue).toBe(80);
    expect(controller.getSliderValue()).toBe(80);

    const complete = controller.onSlideComplete(80);
    expect(complete.emitValue).toBe(80);
  });

  test('a complete-only tap far from the thumb still seeks', () => {
    const controller = new CheckInSliderValueController(50);
    controller.onSlideStart();
    const complete = controller.onSlideComplete(80);
    expect(complete.emitValue).toBe(80);
    expect(controller.getSliderValue()).toBe(80);
  });

  test('drag after a near-thumb press follows the finger', () => {
    const controller = new CheckInSliderValueController(50);
    controller.onSlideStart();
    expect(controller.onSlideMove(52).emitValue).toBeNull();

    const dragged = controller.onSlideMove(56);
    expect(dragged.emitValue).toBe(56);
    expect(controller.getSliderValue()).toBe(56);

    const complete = controller.onSlideComplete(64);
    expect(complete.emitValue).toBe(64);
  });
});

function expectIntegerMetric(n: number | null) {
  expect(n).not.toBeNull();
  expect(Number.isInteger(n)).toBe(true);
  expect(n as number).toBeGreaterThanOrEqual(0);
  expect(n as number).toBeLessThanOrEqual(100);
}

describe('check-in value contract — integers 0–100', () => {
  test('slider complete and stepper nudge both emit integers in range', () => {
    const slider = new CheckInSliderValueController(50);
    slider.onSlideStart();
    slider.onSlideMove(80.4);
    const fromSlider = slider.onSlideComplete(80.4);
    expectIntegerMetric(fromSlider.emitValue);
    expect(fromSlider.emitValue).toBe(80);

    const stepper = new CheckInSliderValueController(80);
    const plus = stepper.nudge(1);
    expectIntegerMetric(plus.emitValue);
    expect(plus.emitValue).toBe(81);
    const minus = stepper.nudge(-1);
    expectIntegerMetric(minus.emitValue);
    expect(minus.emitValue).toBe(80);
  });

  test('nudge does not wrap past 0 or 100', () => {
    const low = new CheckInSliderValueController(0);
    expect(low.nudge(-1).emitValue).toBeNull();
    expect(low.getDisplayValue()).toBe(0);

    const high = new CheckInSliderValueController(100);
    expect(high.nudge(1).emitValue).toBeNull();
    expect(high.getDisplayValue()).toBe(100);
  });
});
