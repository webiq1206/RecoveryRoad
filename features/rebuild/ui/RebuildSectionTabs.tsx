import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';

export type RebuildSectionKey = 'program' | 'habits' | 'routine' | 'goals' | 'confidence';

export function RebuildSectionTabs(props: {
  activeSection: RebuildSectionKey;
  onChange: (key: RebuildSectionKey) => void;
  tabs: { key: RebuildSectionKey; label: string; icon: React.ReactNode }[];
  styles: any;
}) {
  const { activeSection, onChange, tabs, styles } = props;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabsContainer}
      style={styles.tabsScroll}
    >
      {tabs.map((t) => (
        <TouchableOpacity
          key={t.key}
          style={[styles.sectionTab, activeSection === t.key && styles.sectionTabActive]}
          onPress={() => onChange(t.key)}
          activeOpacity={0.7}
        >
          {t.icon}
          <Text style={[styles.sectionTabText, activeSection === t.key && styles.sectionTabTextActive]}>{t.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

