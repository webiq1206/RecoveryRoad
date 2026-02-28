import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import type { ProtectionStatus } from '@/utils/protectionScore';
import Colors from '@/constants/colors';

export interface ProtectionScoreCircleProps {
  score: number;
  status: ProtectionStatus;
  size?: number;
}

function getStatusColor(status: ProtectionStatus): string {
  switch (status) {
    case 'High Alert':
      return '#EF5350';
    case 'Guarded':
      return '#FF9800';
    case 'Strengthening':
      return Colors.primary;
    case 'Stable':
    default:
      return '#4CAF50';
  }
}

export function ProtectionScoreCircle({ score, status, size = 160 }: ProtectionScoreCircleProps) {
  const color = getStatusColor(status);
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();
  }, [scaleAnim]);

  const radius = size / 2;

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: radius,
          borderColor: color,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={[styles.inner, { width: size - 8, height: size - 8, borderRadius: radius - 4 }]}>
        <Text style={[styles.scoreNumber, { color, fontSize: size * 0.28 }]}>{score}</Text>
        <Text style={[styles.scoreLabel, { color }]}>{status}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  inner: {
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
});

export default ProtectionScoreCircle;
