import React, { useLayoutEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenScrollView } from "../ScreenScrollView";
import { getRecoveryPathById } from "../../constants/recoveryPaths";

const PREMIUM = {
  bg: "#0b0d0f",
  card: "#101217",
  border: "rgba(255,255,255,0.06)",
  text: "#F2F3F5",
  muted: "#8B919A",
  accent: "#2EC4B6",
} as const;

const PLACEHOLDER_ROOMS = [
  "Morning grounding",
  "Urge skills lab",
  "Evening check-in",
] as const;

export default function RoomListScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const raw = useLocalSearchParams<{ pathId?: string | string[] }>();
  const pathId = Array.isArray(raw.pathId) ? raw.pathId[0] : raw.pathId;
  const path = useMemo(() => getRecoveryPathById(pathId), [pathId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: path ? path.title : "Rooms",
    });
  }, [navigation, path]);

  return (
    <View style={[styles.root, { paddingTop: 8 }]}>
      <ScreenScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        {path ? (
          <>
            <Text style={styles.phase}>{path.phase}</Text>
            <Text style={styles.lead}>{path.description}</Text>
            <Text style={styles.sectionLabel}>Along this path</Text>
            {PLACEHOLDER_ROOMS.map((label) => (
              <View key={label} style={styles.roomRow}>
                <View style={styles.dot} />
                <Text style={styles.roomTitle}>{label}</Text>
              </View>
            ))}
            <Text style={styles.hint}>Live room directory will connect here.</Text>
          </>
        ) : (
          <Text style={styles.lead}>Select a recovery path to see matched rooms.</Text>
        )}
      </ScreenScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PREMIUM.bg,
  },
  scroll: {
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  phase: {
    color: PREMIUM.accent,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  lead: {
    color: PREMIUM.muted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
  },
  sectionLabel: {
    color: PREMIUM.text,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  roomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: PREMIUM.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PREMIUM.border,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PREMIUM.accent,
    opacity: 0.7,
  },
  roomTitle: {
    color: PREMIUM.text,
    fontSize: 16,
    fontWeight: "600",
  },
  hint: {
    marginTop: 18,
    color: PREMIUM.muted,
    fontSize: 13,
    lineHeight: 18,
  },
});
