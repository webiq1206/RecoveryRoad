import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '../constants/colors';

const LINKS: { label: string; href: `/${string}` }[] = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms', href: '/terms-of-service' },
  { label: 'Data & sharing', href: '/data-and-sharing' },
  { label: 'Community', href: '/community-guidelines' },
];

type Props = {
  /** Tighter spacing for onboarding hero */
  compact?: boolean;
};

export function LegalDocLinksRow({ compact }: Props) {
  const router = useRouter();

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      {LINKS.map((item, i) => (
        <View key={item.href} style={styles.itemWrap}>
          {i > 0 ? <Text style={styles.sep}>·</Text> : null}
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              router.push(item.href as never);
            }}
            hitSlop={6}
          >
            <Text style={[styles.link, compact && styles.linkCompact]}>{item.label}</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  rowCompact: { marginTop: 12 },
  itemWrap: { flexDirection: 'row', alignItems: 'center' },
  sep: { color: Colors.textMuted, marginHorizontal: 4, fontSize: 13 },
  link: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600' as const,
    textDecorationLine: 'underline',
  },
  linkCompact: { fontSize: 13 },
});
