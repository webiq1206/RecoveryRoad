import React from 'react';
import { Animated, Text, View } from 'react-native';
import { Hammer } from 'lucide-react-native';

export function RebuildHeroCard(props: {
  headerAnim: Animated.Value;
  affirmation: string;
  combinedScore: number;
  stats: { activeHabits: number; goalsCompleted: number; totalGoals: number; milestoneCount: number };
  programProgress: { modulesCompleted: number; totalModules: number };
  Colors: any;
  styles: any;
}) {
  const { headerAnim, affirmation, combinedScore, stats, programProgress, Colors, styles } = props;

  return (
    <Animated.View
      style={[
        styles.heroCard,
        {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        },
      ]}
    >
      <View style={styles.heroTop}>
        <View style={styles.heroIconWrap}>
          <Hammer size={22} color={Colors.background} />
        </View>
        <View style={styles.identityScoreWrap}>
          <Text style={styles.identityScoreLabel}>Identity Score</Text>
          <Text style={styles.identityScoreValue}>{combinedScore}</Text>
        </View>
      </View>
      <Text style={styles.heroAffirmation}>{affirmation}</Text>
      <View style={styles.heroStats}>
        <View style={styles.heroStat}>
          <Text style={styles.heroStatValue}>
            {programProgress.modulesCompleted}/{programProgress.totalModules}
          </Text>
          <Text style={styles.heroStatLabel}>Modules</Text>
        </View>
        <View style={styles.heroStatDivider} />
        <View style={styles.heroStat}>
          <Text style={styles.heroStatValue}>{stats.activeHabits}</Text>
          <Text style={styles.heroStatLabel}>Habits</Text>
        </View>
        <View style={styles.heroStatDivider} />
        <View style={styles.heroStat}>
          <Text style={styles.heroStatValue}>
            {stats.goalsCompleted}/{stats.totalGoals}
          </Text>
          <Text style={styles.heroStatLabel}>Goals</Text>
        </View>
        <View style={styles.heroStatDivider} />
        <View style={styles.heroStat}>
          <Text style={styles.heroStatValue}>{stats.milestoneCount}</Text>
          <Text style={styles.heroStatLabel}>Wins</Text>
        </View>
      </View>
    </Animated.View>
  );
}

