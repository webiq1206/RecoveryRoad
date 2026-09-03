/** Press-and-hold repeat for check-in stepper buttons. */

export const STEPPER_HOLD_DELAY_MS = 400;
export const STEPPER_HOLD_INTERVAL_MS = 125;

export type StepperHoldDirection = -1 | 1;

export interface StepperHoldTimerApi {
  setTimeout: typeof setTimeout;
  clearTimeout: typeof clearTimeout;
  setInterval: typeof setInterval;
  clearInterval: typeof clearInterval;
}

/**
 * Owns delay + interval timers for one stepper.
 * A quick press/release is a tap; holding past the delay repeats until stop().
 */
export class CheckInStepperHoldController {
  private delayId: ReturnType<typeof setTimeout> | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private hasRepeated = false;
  private direction: StepperHoldDirection | null = null;
  private onTick: (() => boolean) | null = null;

  constructor(private readonly timers: StepperHoldTimerApi = globalThis) {}

  isActive(): boolean {
    return this.direction !== null;
  }

  start(direction: StepperHoldDirection, onTick: () => boolean): void {
    this.clearTimers();
    this.hasRepeated = false;
    this.direction = direction;
    this.onTick = onTick;

    this.delayId = this.timers.setTimeout(() => {
      this.delayId = null;
      this.hasRepeated = true;
      if (!this.runTick()) {
        this.clearTimers();
        return;
      }
      this.intervalId = this.timers.setInterval(() => {
        if (!this.runTick()) {
          this.clearTimers();
        }
      }, STEPPER_HOLD_INTERVAL_MS);
    }, STEPPER_HOLD_DELAY_MS);
  }

  /**
   * Stops timers for this direction. Returns whether the caller should apply a single tap.
   * A different direction is ignored so one button's pressOut cannot steal the other.
   */
  release(direction: StepperHoldDirection): { shouldTap: boolean } {
    if (this.direction !== direction) {
      return { shouldTap: false };
    }
    const shouldTap = !this.hasRepeated;
    this.stop();
    return { shouldTap };
  }

  /** Cancel without treating the press as a tap (unmount, blur, cancelled gesture). */
  stop(): void {
    this.clearTimers();
    this.hasRepeated = false;
    this.direction = null;
    this.onTick = null;
  }

  private runTick(): boolean {
    if (!this.onTick) return false;
    return this.onTick();
  }

  private clearTimers(): void {
    if (this.delayId !== null) {
      this.timers.clearTimeout(this.delayId);
      this.delayId = null;
    }
    if (this.intervalId !== null) {
      this.timers.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
