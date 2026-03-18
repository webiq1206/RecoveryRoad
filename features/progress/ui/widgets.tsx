import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, ChevronRight, ChevronUp, Minus, Shield } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { getProtectionReadingSummary } from '@/constants/emotionalRisk';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 72;
const CHART_HEIGHT = 100;

export function MiniBarChart({ data, color, maxVal }: { data: number[]; color: string; maxVal: number }) {
  const bars = data.slice(0, 7).reverse();
  const barWidth = Math.min((CHART_WIDTH - (bars.length - 1) * 4) / Math.max(bars.length, 1), 28);

  return (
    <View style={chartStyles.container}>
      <View style={chartStyles.barsRow}>
        {bars.map((val, i) => {
          const height = maxVal > 0 ? Math.max((val / maxVal) * CHART_HEIGHT, 4) : 4;
          return (
            // eslint-disable-next-line react/no-array-index-key
            <View key={i} style={chartStyles.barWrapper}>
              <View
                style={[
                  chartStyles.bar,
                  {
                    height,
                    width: barWidth,
                    backgroundColor: color,
                    opacity: i === bars.length - 1 ? 1 : 0.4 + (i / bars.length) * 0.5,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={chartStyles.labelsRow}>
        {bars.map((_, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <Text key={i} style={[chartStyles.label, { width: barWidth }]}>
            {bars.length - i === 1 ? 'Today' : `${bars.length - i}d`}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function MiniLineChart({ data, color }: { data: number[]; color: string }) {
  const points = data.slice(0, 7).reverse();
  if (points.length < 2) {
    return (
      <View style={[chartStyles.container, { alignItems: 'center', justifyContent: 'center', height: CHART_HEIGHT }]}>
        <Text style={{ color: Colors.textMuted, fontSize: 12 }}>Need more data</Text>
      </View>
    );
  }
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const stepX = CHART_WIDTH / (points.length - 1);

  return (
    <View style={[chartStyles.container, { height: CHART_HEIGHT + 30 }]}>
      <View style={{ height: CHART_HEIGHT, width: CHART_WIDTH, position: 'relative' }}>
        {points.map((val, i) => {
          if (i === points.length - 1) return null;
          const x1 = i * stepX;
          const y1 = CHART_HEIGHT - ((val - min) / range) * (CHART_HEIGHT - 8) - 4;
          const x2 = (i + 1) * stepX;
          const y2 = CHART_HEIGHT - ((points[i + 1] - min) / range) * (CHART_HEIGHT - 8) - 4;
          const dx = x2 - x1;
          const dy = y2 - y1;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          return (
            <View
              key={`line-${i}`}
              style={{
                position: 'absolute',
                left: x1,
                top: y1,
                width: length,
                height: 2.5,
                backgroundColor: color,
                borderRadius: 1.5,
                transform: [{ rotate: `${angle}deg` }],
                transformOrigin: 'left center',
                opacity: 0.8,
              }}
            />
          );
        })}
        {points.map((val, i) => {
          const x = i * stepX;
          const y = CHART_HEIGHT - ((val - min) / range) * (CHART_HEIGHT - 8) - 4;
          return (
            <View
              key={`dot-${i}`}
              style={{
                position: 'absolute',
                left: x - 4,
                top: y - 4,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === points.length - 1 ? color : 'transparent',
                borderWidth: 2,
                borderColor: color,
              }}
            />
          );
        })}
      </View>
      <View style={[chartStyles.labelsRow, { marginTop: 6 }]}>
        {points.map((_, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <Text key={i} style={[chartStyles.label, { width: stepX, textAlign: 'center' }]}>
            {points.length - i === 1 ? 'Now' : `${points.length - i}d`}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function VulnerabilityMeter({ score }: { score: number }) {
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animVal, {
      toValue: score,
      useNativeDriver: false,
      tension: 30,
      friction: 10,
    }).start();
  }, [score, animVal]);

  const level = score <= 25 ? 'Low' : score <= 50 ? 'Moderate' : score <= 75 ? 'Elevated' : 'High';
  const levelColor = score <= 25 ? '#66BB6A' : score <= 50 ? '#FFC107' : score <= 75 ? '#FF9800' : '#EF5350';
  const levelDesc =
    score <= 25
      ? 'You are in a strong place right now.'
      : score <= 50
        ? 'Stay mindful. Use your tools if needed.'
        : score <= 75
          ? 'Reach out to your support circle today.'
          : 'Consider activating Crisis Mode.';

  const widthInterp = animVal.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={meterStyles.container}>
      <View style={meterStyles.header}>
        <View style={meterStyles.headerLeft}>
          <Shield size={18} color={levelColor} />
          <Text style={meterStyles.title}>Relapse Vulnerability</Text>
        </View>
        <View style={[meterStyles.badge, { backgroundColor: levelColor + '22' }]}>
          <Text style={[meterStyles.badgeText, { color: levelColor }]}>{level}</Text>
        </View>
      </View>
      <View style={meterStyles.trackOuter}>
        <Animated.View style={[meterStyles.trackFill, { width: widthInterp, backgroundColor: levelColor }]} />
        <View style={[meterStyles.marker, { left: '25%' }]} />
        <View style={[meterStyles.marker, { left: '50%' }]} />
        <View style={[meterStyles.marker, { left: '75%' }]} />
      </View>
      <Text style={meterStyles.desc}>{levelDesc}</Text>
    </View>
  );
}

export function TrendIcon(props: { trend: 'up' | 'down' | 'stable'; positiveDirection: 'up' | 'down' }) {
  const { trend, positiveDirection } = props;
  const isGood = (trend === 'up' && positiveDirection === 'up') || (trend === 'down' && positiveDirection === 'down');
  const color = trend === 'stable' ? Colors.textMuted : isGood ? '#66BB6A' : '#EF5350';
  if (trend === 'up') return <ChevronUp size={14} color={color} />;
  if (trend === 'down') return <ChevronDown size={14} color={color} />;
  return <Minus size={14} color={color} />;
}

export function ProtectionReadingCard(props: {
  stabilityScore: number;
  hasCheckIns: boolean;
  onPress: () => void;
}) {
  const { stabilityScore, hasCheckIns, onPress } = props;
  const { line, reassurance } = getProtectionReadingSummary(stabilityScore, hasCheckIns);
  return (
    <Pressable style={meterStyles.container} onPress={onPress} testID="progress-protection-reading-link">
      <View style={meterStyles.header}>
        <View style={meterStyles.headerLeft}>
          <Shield size={18} color={Colors.primary} />
          <Text style={meterStyles.title}>How your protection reads you</Text>
        </View>
        <ChevronRight size={18} color={Colors.textMuted} />
      </View>
      <Text style={meterStyles.desc}>{line}</Text>
      <Text style={meterStyles.reassurance}>{reassurance}</Text>
      <Text style={meterStyles.seeDetail}>See detailed patterns & factors</Text>
    </Pressable>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    width: CHART_WIDTH,
    marginTop: 10,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: CHART_HEIGHT,
  },
  barWrapper: {
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 6,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  label: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});

const meterStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  trackOuter: {
    height: 10,
    backgroundColor: Colors.surface,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  trackFill: {
    height: 10,
    borderRadius: 6,
  },
  marker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: Colors.border,
    opacity: 0.5,
  },
  desc: {
    marginTop: 10,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  reassurance: {
    marginTop: 8,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
    fontWeight: '500' as const,
  },
  seeDetail: {
    marginTop: 10,
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
});

