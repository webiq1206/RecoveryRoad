import type { HostInstance, ScrollView } from 'react-native';

/**
 * The content view instance of a ScrollView, for use as `measureLayout`'s
 * reference when scrolling a child into view.
 *
 * `measureLayout` requires a host instance: on the New Architecture a node handle
 * from `findNodeHandle()` is rejected with "ref.measureLayout must be called with
 * a ref to a native component" and the call is dropped without invoking onFail.
 *
 * Returns null when the ScrollView is not mounted yet, in which case the caller
 * should skip measuring rather than scroll to a guessed position.
 */
export function getScrollContentRef(scroll: ScrollView | null): HostInstance | null {
  const scrollWithInnerView = scroll as unknown as {
    getInnerViewRef?: () => HostInstance | null;
  } | null;

  return scrollWithInnerView?.getInnerViewRef?.() ?? null;
}
