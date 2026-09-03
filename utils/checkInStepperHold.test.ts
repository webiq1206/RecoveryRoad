import { describe, expect, test } from 'bun:test';
import {
  CheckInStepperHoldController,
  type StepperHoldTimerApi,
} from './checkInStepperHold';

function createMemoryTimers() {
  let nextId = 1;
  const timeouts = new Map<number, () => void>();
  const intervals = new Map<number, () => void>();

  const api: StepperHoldTimerApi & {
    flushTimeouts: () => void;
    tickIntervals: () => void;
    timeoutCount: () => number;
    intervalCount: () => number;
  } = {
    setTimeout: (fn: () => void) => {
      const id = nextId++;
      timeouts.set(id, fn);
      return id as unknown as ReturnType<typeof setTimeout>;
    },
    clearTimeout: (id: ReturnType<typeof setTimeout>) => {
      timeouts.delete(id as unknown as number);
    },
    setInterval: (fn: () => void) => {
      const id = nextId++;
      intervals.set(id, fn);
      return id as unknown as ReturnType<typeof setInterval>;
    },
    clearInterval: (id: ReturnType<typeof setInterval>) => {
      intervals.delete(id as unknown as number);
    },
    flushTimeouts: () => {
      const fns = [...timeouts.values()];
      timeouts.clear();
      for (const fn of fns) fn();
    },
    tickIntervals: () => {
      for (const fn of [...intervals.values()]) fn();
    },
    timeoutCount: () => timeouts.size,
    intervalCount: () => intervals.size,
  };

  return api;
}

describe('CheckInStepperHoldController', () => {
  test('quick release before delay is a single tap and leaves no timers', () => {
    const timers = createMemoryTimers();
    const hold = new CheckInStepperHoldController(timers);
    let ticks = 0;

    hold.start(1, () => {
      ticks += 1;
      return true;
    });
    expect(hold.isActive()).toBe(true);

    const { shouldTap } = hold.release(1);
    expect(shouldTap).toBe(true);
    expect(ticks).toBe(0);
    expect(hold.isActive()).toBe(false);
    expect(timers.timeoutCount()).toBe(0);
    expect(timers.intervalCount()).toBe(0);
  });

  test('after the delay, ticks repeat until release', () => {
    const timers = createMemoryTimers();
    const hold = new CheckInStepperHoldController(timers);
    let ticks = 0;

    hold.start(-1, () => {
      ticks += 1;
      return true;
    });
    timers.flushTimeouts();
    expect(ticks).toBe(1);

    timers.tickIntervals();
    timers.tickIntervals();
    expect(ticks).toBe(3);

    const { shouldTap } = hold.release(-1);
    expect(shouldTap).toBe(false);
    expect(timers.timeoutCount()).toBe(0);
    expect(timers.intervalCount()).toBe(0);
  });

  test('stops repeating when the tick hits a bound', () => {
    const timers = createMemoryTimers();
    const hold = new CheckInStepperHoldController(timers);
    let ticks = 0;

    hold.start(1, () => {
      ticks += 1;
      return ticks < 2;
    });
    timers.flushTimeouts();
    expect(ticks).toBe(1);
    expect(timers.intervalCount()).toBe(1);

    timers.tickIntervals();
    expect(ticks).toBe(2);
    expect(timers.intervalCount()).toBe(0);
  });

  test('stop cancels delay and does not tap', () => {
    const timers = createMemoryTimers();
    const hold = new CheckInStepperHoldController(timers);
    let ticks = 0;

    hold.start(1, () => {
      ticks += 1;
      return true;
    });
    hold.stop();
    timers.flushTimeouts();
    expect(ticks).toBe(0);
    expect(hold.release(1).shouldTap).toBe(false);
    expect(timers.timeoutCount()).toBe(0);
    expect(timers.intervalCount()).toBe(0);
  });

  test('pressOut on the other button does not steal an active hold', () => {
    const timers = createMemoryTimers();
    const hold = new CheckInStepperHoldController(timers);
    let ticks = 0;

    hold.start(1, () => {
      ticks += 1;
      return true;
    });
    expect(hold.release(-1).shouldTap).toBe(false);
    expect(hold.isActive()).toBe(true);

    timers.flushTimeouts();
    expect(ticks).toBe(1);
    hold.stop();
  });
});
