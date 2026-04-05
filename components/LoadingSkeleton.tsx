import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Colors from '../constants/colors';

const SkeletonPulse = React.memo(({ width, height, borderRadius = 8, style }: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.7, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: Colors.cardBackgroundLight,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
});

export function HomeLoadingSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <SkeletonPulse width={160} height={24} borderRadius={6} />
          <SkeletonPulse width={100} height={14} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
        <SkeletonPulse width={80} height={36} borderRadius={18} />
      </View>

      <SkeletonPulse width="100%" height={44} borderRadius={14} style={{ marginTop: 14 }} />

      <View style={styles.heroSkeleton}>
        <View style={styles.heroLeft}>
          <SkeletonPulse width={120} height={120} borderRadius={60} />
        </View>
        <View style={styles.heroRight}>
          <SkeletonPulse width={80} height={20} borderRadius={6} />
          <SkeletonPulse width={60} height={20} borderRadius={6} style={{ marginTop: 12 }} />
          <SkeletonPulse width={70} height={20} borderRadius={6} style={{ marginTop: 12 }} />
        </View>
      </View>

      <SkeletonPulse width="100%" height={120} borderRadius={20} style={{ marginTop: 16 }} />

      <SkeletonPulse width="100%" height={50} borderRadius={14} style={{ marginTop: 14 }} />

      <SkeletonPulse width="100%" height={70} borderRadius={16} style={{ marginTop: 14 }} />

      <SkeletonPulse width="100%" height={70} borderRadius={16} style={{ marginTop: 12 }} />

      <SkeletonPulse width="100%" height={60} borderRadius={16} style={{ marginTop: 12 }} />
    </View>
  );
}

export function GenericLoadingSkeleton({ lines = 5 }: { lines?: number }) {
  return (
    <View style={styles.genericContainer}>
      <SkeletonPulse width="70%" height={22} borderRadius={6} />
      <SkeletonPulse width="45%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonPulse
          key={i}
          width="100%"
          height={60 + (i % 2) * 20}
          borderRadius={14}
          style={{ marginTop: 14 }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 24,
    padding: 24,
    marginTop: 20,
    gap: 20,
  },
  heroLeft: {},
  heroRight: {
    flex: 1,
  },
  genericContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
});

export default SkeletonPulse;
