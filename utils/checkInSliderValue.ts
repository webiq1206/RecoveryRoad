/** Shared 0–100 check-in slider value helpers and drag lifecycle controller. */

export function clampCheckInSliderValue(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

export function roundCheckInSliderValue(n: number): number {
  return Math.round(clampCheckInSliderValue(n));
}

export interface SlideMoveResult {
  sliderValue: number;
  emitValue: number | null;
}

export interface SlideCompleteResult {
  sliderValue: number;
  emitValue: number;
}

export interface NudgeResult {
  sliderValue: number;
  emitValue: number | null;
}

/** First-sample jump larger than this (0–100) is treated as tap-to-position. */
export const CHECK_IN_SLIDER_TAP_SEEK_THRESHOLD = 12;

/** Movement from the first sample that means a real drag, not near-thumb jitter. */
export const CHECK_IN_SLIDER_DRAG_DETECT = 2;

/**
 * Keeps slider thumb position stable across drags and ignores stale parent props
 * that would snap the thumb back (e.g. 67 → 50 on second touch).
 */
export class CheckInSliderValueController {
  private sliderValue: number;
  private isSliding = false;
  private lastEmitted: number;
  private hasUserInteracted = false;
  private originValue = 0;
  private firstSample: number | null = null;
  private grabCommitted = false;

  constructor(initial: number) {
    const rounded = roundCheckInSliderValue(initial);
    this.sliderValue = rounded;
    this.lastEmitted = rounded;
    this.originValue = rounded;
  }

  getSliderValue(): number {
    return this.sliderValue;
  }

  getDisplayValue(): number {
    return roundCheckInSliderValue(this.sliderValue);
  }

  isSlidingActive(): boolean {
    return this.isSliding;
  }

  /** Apply a new value from the parent when not sliding. Returns true if applied. */
  syncFromProp(propValue: number): boolean {
    if (this.isSliding) return false;

    const rounded = roundCheckInSliderValue(propValue);
    const localRounded = roundCheckInSliderValue(this.sliderValue);

    if (rounded === localRounded) {
      this.lastEmitted = rounded;
      return false;
    }

    // After user interaction, ignore stale parent props until they match our last emit.
    if (
      this.hasUserInteracted &&
      rounded !== this.lastEmitted &&
      localRounded === this.lastEmitted
    ) {
      return false;
    }

    this.sliderValue = rounded;
    this.lastEmitted = rounded;
    return true;
  }

  onSlideStart(): number {
    this.isSliding = true;
    this.hasUserInteracted = true;
    this.grabCommitted = false;
    this.firstSample = null;
    this.originValue = this.sliderValue;
    return this.sliderValue;
  }

  onSlideMove(raw: number): SlideMoveResult {
    const clamped = clampCheckInSliderValue(raw);

    if (!this.grabCommitted) {
      if (this.firstSample === null) {
        this.firstSample = clamped;
        if (Math.abs(clamped - this.originValue) > CHECK_IN_SLIDER_TAP_SEEK_THRESHOLD) {
          this.grabCommitted = true;
          return this.applyMove(clamped);
        }
        return { sliderValue: this.sliderValue, emitValue: null };
      }

      if (Math.abs(clamped - this.firstSample) > CHECK_IN_SLIDER_DRAG_DETECT) {
        this.grabCommitted = true;
        return this.applyMove(clamped);
      }

      return { sliderValue: this.sliderValue, emitValue: null };
    }

    return this.applyMove(clamped);
  }

  onSlideComplete(raw: number): SlideCompleteResult {
    this.isSliding = false;
    const clamped = clampCheckInSliderValue(raw);

    const final =
      this.grabCommitted ||
      Math.abs(clamped - this.originValue) > CHECK_IN_SLIDER_TAP_SEEK_THRESHOLD
        ? roundCheckInSliderValue(clamped)
        : roundCheckInSliderValue(this.originValue);

    this.grabCommitted = false;
    this.firstSample = null;
    this.sliderValue = final;
    this.lastEmitted = final;
    return { sliderValue: final, emitValue: final };
  }

  private applyMove(clamped: number): SlideMoveResult {
    this.sliderValue = clamped;
    const rounded = roundCheckInSliderValue(clamped);
    if (rounded === this.lastEmitted) {
      return { sliderValue: clamped, emitValue: null };
    }
    this.lastEmitted = rounded;
    return { sliderValue: clamped, emitValue: rounded };
  }

  /**
   * Integer step from the current display value. Clamps to 0–100 and does not wrap.
   * Ignored while a drag is in progress so stepper and slider stay on one value.
   */
  nudge(delta: number): NudgeResult {
    if (this.isSliding) {
      return { sliderValue: this.sliderValue, emitValue: null };
    }

    this.hasUserInteracted = true;
    const current = roundCheckInSliderValue(this.sliderValue);
    const next = roundCheckInSliderValue(current + delta);
    if (next === current) {
      return { sliderValue: current, emitValue: null };
    }

    this.sliderValue = next;
    this.lastEmitted = next;
    return { sliderValue: next, emitValue: next };
  }
}
