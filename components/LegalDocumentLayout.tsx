import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { ScreenScrollView } from './ScreenScrollView';
import Colors from '../constants/colors';
import type { LegalSection } from '../constants/legalInAppCopy';
import { IN_APP_LEGAL_LAST_UPDATED } from '../constants/legalInAppCopy';

type Props = {
  title: string;
  sections: LegalSection[];
  intro?: string;
};

export function LegalDocumentLayout({ title, sections, intro }: Props) {
  return (
    <View style={styles.wrapper}>
      <Stack.Screen
        options={{
          title,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
        }}
      />
      <ScreenScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator>
        <Text style={styles.meta}>Last updated: {IN_APP_LEGAL_LAST_UPDATED}</Text>
        {intro ? <Text style={styles.intro}>{intro}</Text> : null}
        {sections.map((s, i) => (
          <View key={i} style={styles.block}>
            <Text style={styles.heading}>{s.heading}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
        <Text style={styles.disclaimer}>
          This in-app summary is for transparency. It is not personalized legal advice. Use your app store listing
          support contact for formal requests.
        </Text>
      </ScreenScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 48 },
  meta: { fontSize: 13, color: Colors.textMuted, marginBottom: 12 },
  intro: { fontSize: 15, lineHeight: 23, color: Colors.textSecondary, marginBottom: 16 },
  block: { marginBottom: 20 },
  heading: { fontSize: 16, fontWeight: '700' as const, color: Colors.text, marginBottom: 8 },
  body: { fontSize: 14, lineHeight: 22, color: Colors.textSecondary },
  disclaimer: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textMuted,
    fontStyle: 'italic' as const,
  },
});
