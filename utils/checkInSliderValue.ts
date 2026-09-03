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

/**
 * Keeps slider thumb position stable across drags and ignores stale parent props
 * that would snap the thumb back (e.g. 67 → 50 on second touch).
 */
export class CheckInSliderValueController {
  private sliderValue: number;
  private isSliding = false;
  private lastEmitted: number;
  private hasUserInteracted = false;

  constructor(initial: number) {
    const rounded = roundCheckInSliderValue(initial);
    this.sliderValue = rounded;
    this.lastEmitted = rounded;
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
    return this.sliderValue;
  }

  onSlideMove(raw: number): SlideMoveResult {
    const clamped = clampCheckInSliderValue(raw);
    this.sliderValue = clamped;
    const rounded = roundCheckInSliderValue(clamped);
    if (rounded === this.lastEmitted) {
      return { sliderValue: clamped, emitValue: null };
    }
    this.lastEmitted = rounded;
    return { sliderValue: clamped, emitValue: rounded };
  }

  onSlideComplete(raw: number): SlideCompleteResult {
    this.isSliding = false;
    const final = roundCheckInSliderValue(raw);
    this.sliderValue = final;
    this.lastEmitted = final;
    return { sliderValue: final, emitValue: final };
  }
}
