/**
 * Replacement for removed React Native InteractionManager.runAfterInteractions
 * (RN 0.87+ / Expo SDK 58). Schedules work after the current interactions settle.
 */
export function runAfterInteractions(task: () => void): { cancel: () => void } {
  const globalWithIdle = globalThis as typeof globalThis & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };

  if (typeof globalWithIdle.requestIdleCallback === 'function') {
    const id = globalWithIdle.requestIdleCallback(task, { timeout: 500 });
    return {
      cancel: () => {
        globalWithIdle.cancelIdleCallback?.(id);
      },
    };
  }

  const timeoutId = setTimeout(task, 0);
  return {
    cancel: () => {
      clearTimeout(timeoutId);
    },
  };
}

export function waitForInteractions(): Promise<void> {
  return new Promise((resolve) => {
    runAfterInteractions(() => resolve());
  });
}
