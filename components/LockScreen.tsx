import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Platform } from 'react-native';
import { Fingerprint, Delete, Lock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Colors from '../constants/colors';
import { useSecurity } from '../providers/SecurityProvider';

const PIN_LENGTH = 4;

interface LockScreenProps {
  onUnlock: () => void;
  mode?: 'unlock' | 'setup' | 'confirm' | 'verify';
  onSetupComplete?: (pin: string) => void;
  onVerifyComplete?: (pin: string) => void;
  title?: string;
  subtitle?: string;
}

export default React.memo(function LockScreen({
  onUnlock,
  mode = 'unlock',
  onSetupComplete,
  onVerifyComplete,
  title,
  subtitle,
}: LockScreenProps) {
  const insets = useSafeAreaInsets();
  const { authenticateWithPIN, authenticateBiometric, biometricAvailable, settings, remainingLockoutSeconds } = useSecurity();
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [isConfirmStep, setIsConfirmStep] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const dotAnims = useRef(Array.from({ length: PIN_LENGTH }, () => new Animated.Value(0))).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (mode === 'unlock' && biometricAvailable && settings.biometricEnabled) {
      const timer = setTimeout(() => {
        handleBiometric();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const shakeAnimation = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const animateDot = useCallback((index: number, filled: boolean) => {
    Animated.spring(dotAnims[index], {
      toValue: filled ? 1 : 0,
      friction: 5,
      tension: 300,
      useNativeDriver: true,
    }).start();
  }, [dotAnims]);

  const handleBiometric = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const success = await authenticateBiometric();
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onUnlock();
      } else {
        setError('Biometric failed. Use PIN instead.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      setError('Biometric not available');
    }
    setIsProcessing(false);
  }, [isProcessing, authenticateBiometric, onUnlock]);

  const handlePinEntry = useCallback(async (newPin: string) => {
    if (newPin.length !== PIN_LENGTH) return;

    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (mode === 'setup') {
      if (!isConfirmStep) {
        setConfirmPin(newPin);
        setIsConfirmStep(true);
        setPin('');
        dotAnims.forEach((anim) => anim.setValue(0));
        setError('');
        setIsProcessing(false);
        return;
      }
      if (newPin === confirmPin) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSetupComplete?.(newPin);
      } else {
        setError('PINs do not match. Try again.');
        shakeAnimation();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setIsConfirmStep(false);
        setConfirmPin('');
        setPin('');
        dotAnims.forEach((anim) => anim.setValue(0));
      }
      setIsProcessing(false);
      return;
    }

    if (mode === 'verify') {
      onVerifyComplete?.(newPin);
      setPin('');
      dotAnims.forEach((anim) => anim.setValue(0));
      setIsProcessing(false);
      return;
    }

    const success = await authenticateWithPIN(newPin);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onUnlock();
    } else {
      setError(
        remainingLockoutSeconds > 0
          ? `Too many attempts. Try again in ${Math.ceil(remainingLockoutSeconds / 60)} min`
          : `Incorrect PIN. ${MAX_FAILED_ATTEMPTS - settings.failedAttempts - 1} attempts left`
      );
      shakeAnimation();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPin('');
      dotAnims.forEach((anim) => anim.setValue(0));
    }
    setIsProcessing(false);
  }, [mode, isConfirmStep, confirmPin, authenticateWithPIN, onUnlock, onSetupComplete, onVerifyComplete, shakeAnimation, dotAnims, remainingLockoutSeconds, settings.failedAttempts]);

  const MAX_FAILED_ATTEMPTS = 5;

  const handleDigitPress = useCallback((digit: string) => {
    if (isProcessing || remainingLockoutSeconds > 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setPin(prev => {
      if (prev.length >= PIN_LENGTH) return prev;
      const newPin = prev + digit;
      animateDot(newPin.length - 1, true);
      if (newPin.length === PIN_LENGTH) {
        setTimeout(() => handlePinEntry(newPin), 200);
      }
      return newPin;
    });
    setError('');
  }, [isProcessing, remainingLockoutSeconds, animateDot, handlePinEntry]);

  const handleDelete = useCallback(() => {
    if (isProcessing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPin(prev => {
      if (prev.length === 0) return prev;
      animateDot(prev.length - 1, false);
      return prev.slice(0, -1);
    });
  }, [isProcessing, animateDot]);

  const getTitle = () => {
    if (title) return title;
    if (mode === 'setup' && !isConfirmStep) return 'Create Your PIN';
    if (mode === 'setup' && isConfirmStep) return 'Confirm Your PIN';
    if (mode === 'verify') return 'Enter Current PIN';
    return 'Welcome Back';
  };

  const getSubtitle = () => {
    if (subtitle) return subtitle;
    if (mode === 'setup' && !isConfirmStep) return 'Choose a 4-digit PIN to protect your data';
    if (mode === 'setup' && isConfirmStep) return 'Enter the same PIN again to confirm';
    if (mode === 'verify') return 'Verify your identity to continue';
    return 'Enter your PIN to continue';
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  const navBarBottom =
    insets.bottom > 0 ? insets.bottom : Platform.OS === 'android' ? 40 : 0;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          paddingTop: Math.max(48, insets.top + 16),
          paddingBottom: Math.max(32, navBarBottom + 28),
        },
      ]}
    >
      <View style={styles.topSection}>
        <View style={styles.iconContainer}>
          <Lock size={32} color={Colors.primary} />
        </View>
        <Text style={styles.title}>{getTitle()}</Text>
        <Text style={styles.subtitle}>{getSubtitle()}</Text>

        <Animated.View style={[styles.dotsContainer, { transform: [{ translateX: shakeAnim }] }]}>
          {Array.from({ length: PIN_LENGTH }).map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  transform: [{
                    scale: dotAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.3],
                    }),
                  }],
                  backgroundColor: dotAnims[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [Colors.border, Colors.primary],
                  }),
                },
              ]}
            />
          ))}
        </Animated.View>

        {error ? <Text style={styles.errorText}>{error}</Text> : <View style={styles.errorPlaceholder} />}
      </View>

      <View style={styles.keypadContainer}>
        <View style={styles.keypadGrid}>
          {digits.map((digit) => (
            <Pressable
              key={digit}
              style={({ pressed }) => [styles.keypadButton, pressed && styles.keypadButtonPressed]}
              onPress={() => handleDigitPress(digit)}
              disabled={isProcessing || remainingLockoutSeconds > 0}
              testID={`pin-digit-${digit}`}
            >
              <Text style={styles.keypadText}>{digit}</Text>
            </Pressable>
          ))}

          {mode === 'unlock' && biometricAvailable && settings.biometricEnabled ? (
            <Pressable
              style={({ pressed }) => [styles.keypadButton, styles.keypadSpecial, pressed && styles.keypadButtonPressed]}
              onPress={handleBiometric}
              disabled={isProcessing}
              testID="biometric-button"
            >
              <Fingerprint size={26} color={Colors.primary} />
            </Pressable>
          ) : (
            <View style={styles.keypadEmpty} />
          )}

          <Pressable
            style={({ pressed }) => [styles.keypadButton, pressed && styles.keypadButtonPressed]}
            onPress={() => handleDigitPress('0')}
            disabled={isProcessing || remainingLockoutSeconds > 0}
            testID="pin-digit-0"
          >
            <Text style={styles.keypadText}>0</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.keypadButton, styles.keypadSpecial, pressed && styles.keypadButtonPressed]}
            onPress={handleDelete}
            disabled={isProcessing}
            testID="pin-delete"
          >
            <Delete size={24} color={Colors.textSecondary} />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(46,196,182,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  errorText: {
    fontSize: 13,
    color: Colors.danger,
    textAlign: 'center',
    minHeight: 20,
    fontWeight: '500' as const,
  },
  errorPlaceholder: {
    minHeight: 20,
  },
  keypadContainer: {
    paddingHorizontal: 48,
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  keypadButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  keypadButtonPressed: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary + '40',
  },
  keypadSpecial: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  keypadEmpty: {
    width: 72,
    height: 72,
  },
  keypadText: {
    fontSize: 28,
    fontWeight: '500' as const,
    color: Colors.text,
  },
});
