import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

export interface KeyboardState {
  visible: boolean;
  /** Keyboard height in dp. Always 0 while hidden. */
  height: number;
}

const HIDDEN: KeyboardState = { visible: false, height: 0 };

/**
 * Tracks software keyboard visibility and height.
 *
 * iOS uses the `will` events so UI moves with the keyboard animation. Android only
 * fires the `did` events reliably, so it uses those.
 */
export function useKeyboardState(): KeyboardState {
  const [state, setState] = useState<KeyboardState>(HIDDEN);

  useEffect(() => {
    const isIOS = Platform.OS === 'ios';
    const showSub = Keyboard.addListener(isIOS ? 'keyboardWillShow' : 'keyboardDidShow', (event) => {
      setState({ visible: true, height: event.endCoordinates?.height ?? 0 });
    });
    const hideSub = Keyboard.addListener(isIOS ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      setState(HIDDEN);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return state;
}
