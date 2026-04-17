import React, { useLayoutEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { findDemoRoomById } from "../../constants/recoveryPathRooms";

const PREMIUM = {
  bg: "#0b0d0f",
  card: "#101217",
  border: "rgba(255,255,255,0.06)",
  text: "#F2F3F5",
  muted: "#8B919A",
} as const;

export default function ChatRoomScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const raw = useLocalSearchParams<{ roomId?: string | string[] }>();
  const roomId = Array.isArray(raw.roomId) ? raw.roomId[0] : raw.roomId;
  const room = useMemo(() => findDemoRoomById(roomId), [roomId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: room?.name ?? "Room",
    });
  }, [navigation, room?.name]);

  return (
    <View style={[styles.root, { paddingTop: 12, paddingBottom: insets.bottom + 20 }]}>
      {room ? (
        <>
          <View style={styles.card}>
            <Text style={styles.meta}>Room ID · {room.id}</Text>
            <Text style={styles.description}>{room.description}</Text>
            <View style={styles.row}>
              <View style={[styles.badge, room.status === "live" ? styles.badgeLive : styles.badgeOpen]}>
                <Text style={styles.badgeText}>{room.status === "live" ? "Live" : "Open"}</Text>
              </View>
              <Text style={styles.count}>{room.activeUsers} here now</Text>
            </View>
          </View>
          <Text style={styles.placeholder}>
            Chat messages will appear here once the live channel is connected.
          </Text>
        </>
      ) : (
        <Text style={styles.placeholder}>This room could not be found.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PREMIUM.bg,
    paddingHorizontal: 22,
  },
  card: {
    backgroundColor: PREMIUM.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PREMIUM.border,
    padding: 18,
    marginBottom: 20,
  },
  meta: {
    color: PREMIUM.muted,
    fontSize: 12,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  description: {
    color: PREMIUM.text,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeLive: {
    backgroundColor: "rgba(46,196,182,0.18)",
  },
  badgeOpen: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  badgeText: {
    color: PREMIUM.text,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  count: {
    color: PREMIUM.muted,
    fontSize: 13,
    flex: 1,
    textAlign: "right",
  },
  placeholder: {
    color: PREMIUM.muted,
    fontSize: 15,
    lineHeight: 22,
  },
});
