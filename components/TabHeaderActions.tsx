import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { User, Settings } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';

const ICON_SIZE = 18;

/**
 * Profile + settings actions for tab stack headers and the Today hub custom header.
 */
export function TabHeaderActions() {
  const router = useRouter();
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => router.push('/profile' as any)}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Profile"
      >
        <User size={ICON_SIZE} color={Colors.text} />
      </Pressable>
      <Pressable
        onPress={() => router.push('/settings' as any)}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Settings"
      >
        <Settings size={ICON_SIZE} color={Colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingRight: 4,
  },
});
