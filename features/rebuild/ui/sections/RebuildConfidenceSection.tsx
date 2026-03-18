import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Award, Plus, Sparkles, Star } from 'lucide-react-native';

import type { ConfidenceMilestone } from '@/types';

export function RebuildConfidenceSection(props: {
  milestones: ConfidenceMilestone[];
  onOpenAddMilestone: () => void;
  Colors: any;
  styles: any;
}) {
  const { milestones, onOpenAddMilestone, Colors, styles } = props;

  return (
    <View style={styles.sectionContent}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Confidence Wins</Text>
          <Text style={styles.sectionSubtitle}>Celebrate how far you've come</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={onOpenAddMilestone} activeOpacity={0.7}>
          <Plus size={18} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {milestones.length === 0 ? (
        <View style={styles.emptyState}>
          <Award size={32} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No wins recorded yet</Text>
          <Text style={styles.emptySubtext}>Log moments that made you feel proud or strong</Text>
        </View>
      ) : (
        milestones.map((m, i) => (
          <View key={m.id} style={styles.milestoneCard}>
            <View style={styles.milestoneIcon}>
              <Star size={18} color={Colors.accentWarm} />
            </View>
            <View style={styles.milestoneContent}>
              <Text style={styles.milestoneTitle}>{m.title}</Text>
              {m.description ? <Text style={styles.milestoneDesc}>{m.description}</Text> : null}
              <Text style={styles.milestoneDate}>
                {new Date(m.achievedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
            {i === 0 && (
              <View style={styles.latestBadge}>
                <Sparkles size={10} color={Colors.primary} />
                <Text style={styles.latestBadgeText}>Latest</Text>
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );
}

