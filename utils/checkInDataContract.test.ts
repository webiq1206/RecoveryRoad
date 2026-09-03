/**
 * Regression contract: slider + stepper must keep feeding Stability Score
 * the same integer 0–100 metrics as before the combined control.
 * Do not change scoring formulas to make these pass.
 */

import { describe, expect, test } from 'bun:test';
import { CHECKIN_METRIC_KEYS } from '../features/checkin/constants/checkinMetrics';
import { computeDailyCheckInStabilityScore } from './stabilityEngine';
import {
  CheckInSliderValueController,
  roundCheckInSliderValue,
} from './checkInSliderValue';

const LIMITED_PROFILE = { supportAvailability: 'limited' as const, triggers: [] as string[] };

describe('Morning Check-In data contract', () => {
  test('saved metric keys are unchanged', () => {
    expect(CHECKIN_METRIC_KEYS).toEqual([
      'mood',
      'cravingLevel',
      'stress',
      'sleepQuality',
      'environment',
      'emotionalState',
    ]);
  });

  test('Stability Score still uses 0–100 slider numbers (golden fixtures)', () => {
    const strong = computeDailyCheckInStabilityScore(
      {
        mood: 90,
        cravingLevel: 10,
        stress: 10,
        sleepQuality: 90,
        environment: 90,
        emotionalState: 90,
      },
      LIMITED_PROFILE,
    );
    const strained = computeDailyCheckInStabilityScore(
      {
        mood: 10,
        cravingLevel: 90,
        stress: 90,
        sleepQuality: 10,
        environment: 10,
        emotionalState: 10,
      },
      LIMITED_PROFILE,
    );

    expect(strong).toBe(92);
    expect(strained).toBe(45);
  });

  test('slider drag and stepper nudge of the same integer yield the same Stability Score', () => {
    const fromSlider = new CheckInSliderValueController(50);
    fromSlider.onSlideStart();
    fromSlider.onSlideMove(77);
    const slid = fromSlider.onSlideComplete(77).emitValue;

    const fromStepper = new CheckInSliderValueController(76);
    const nudged = fromStepper.nudge(1).emitValue;

    expect(slid).toBe(77);
    expect(nudged).toBe(77);
    expect(Number.isInteger(slid)).toBe(true);
    expect(Number.isInteger(nudged)).toBe(true);

    const metricsFromSlider = {
      mood: 50,
      cravingLevel: 50,
      stress: slid as number,
      sleepQuality: 50,
      environment: 50,
      emotionalState: 50,
    };
    const metricsFromStepper = { ...metricsFromSlider, stress: nudged as number };

    expect(computeDailyCheckInStabilityScore(metricsFromSlider, LIMITED_PROFILE)).toBe(
      computeDailyCheckInStabilityScore(metricsFromStepper, LIMITED_PROFILE),
    );
  });

  test('roundCheckInSliderValue keeps persistence values as integers 0–100', () => {
    expect(roundCheckInSliderValue(77.4)).toBe(77);
    expect(roundCheckInSliderValue(77.6)).toBe(78);
    expect(roundCheckInSliderValue(-2)).toBe(0);
    expect(roundCheckInSliderValue(140)).toBe(100);
  });
});

const MORNING_QA_CATEGORIES = [
  'cravingLevel',
  'stress',
  'sleepQuality',
  'environment',
  'emotionalState',
] as const;

describe('Morning Check-In slider + stepper QA sequences', () => {
  test.each([...MORNING_QA_CATEGORIES])(
    '%s: drag, tap, hold bounds, then mix slider and stepper; display stays in sync',
    (metricKey) => {
      expect(CHECKIN_METRIC_KEYS).toContain(metricKey);
      const displayed = (c: CheckInSliderValueController) => c.getDisplayValue();
      const c = new CheckInSliderValueController(50);
      expect(displayed(c)).toBe(50);

      // 1. Drag upward
      c.onSlideStart();
      c.onSlideMove(70);
      c.onSlideComplete(70);
      expect(displayed(c)).toBe(70);

      // 2. Drag downward
      c.onSlideStart();
      expect(c.onSlideMove(68).emitValue).toBeNull();
      c.onSlideMove(60);
      c.onSlideComplete(60);
      expect(displayed(c)).toBe(60);

      // 3. Tap plus repeatedly
      expect(c.nudge(1).emitValue).toBe(61);
      expect(c.nudge(1).emitValue).toBe(62);
      expect(displayed(c)).toBe(62);

      // 4. Tap minus repeatedly
      expect(c.nudge(-1).emitValue).toBe(61);
      expect(c.nudge(-1).emitValue).toBe(60);
      expect(displayed(c)).toBe(60);

      // 5–6. Hold is repeated nudge; same source of truth
      for (let i = 0; i < 5; i++) c.nudge(1);
      expect(displayed(c)).toBe(65);
      for (let i = 0; i < 5; i++) c.nudge(-1);
      expect(displayed(c)).toBe(60);

      // 7. Exceed 100
      const atMax = new CheckInSliderValueController(100);
      expect(atMax.nudge(1).emitValue).toBeNull();
      expect(displayed(atMax)).toBe(100);
      atMax.onSlideStart();
      atMax.onSlideMove(150);
      expect(atMax.onSlideComplete(150).emitValue).toBe(100);

      // 8. Below 0
      const atMin = new CheckInSliderValueController(0);
      expect(atMin.nudge(-1).emitValue).toBeNull();
      expect(displayed(atMin)).toBe(0);
      atMin.onSlideStart();
      atMin.onSlideMove(-20);
      expect(atMin.onSlideComplete(-20).emitValue).toBe(0);

      // 9. Drag then stepper
      c.onSlideStart();
      c.onSlideMove(80);
      c.onSlideComplete(80);
      expect(displayed(c)).toBe(80);
      expect(c.nudge(1).emitValue).toBe(81);
      expect(displayed(c)).toBe(81);

      // 10. Stepper then drag
      expect(c.nudge(-1).emitValue).toBe(80);
      c.onSlideStart();
      c.onSlideMove(55);
      c.onSlideComplete(55);
      expect(displayed(c)).toBe(55);

      // 11. Score always matches controller integer
      expect(displayed(c)).toBe(c.getSliderValue());
      expect(Number.isInteger(displayed(c))).toBe(true);
    },
  );
});
