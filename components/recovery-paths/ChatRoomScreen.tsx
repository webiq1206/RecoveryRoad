import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ListRenderItem,
} from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Send } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { findDemoRoomById } from "../../constants/recoveryPathRooms";

const PREMIUM = {
  bg: "#0b0d0f",
  bubbleOther: "#161a22",
  bubbleOwn: "#1a3d38",
  border: "rgba(255,255,255,0.08)",
  text: "#F2F3F5",
  muted: "#8B919A",
  tag: "#9AA3AE",
  accent: "#2EC4B6",
  timeOwn: "rgba(242,243,245,0.55)",
  timeOther: "rgba(138,145,154,0.9)",
  inputBg: "#101217",
  sendDisabled: "#5A626C",
} as const;

export type RoomChatMessage = {
  id: string;
  userTag: string;
  text: string;
  createdAt: number;
  isOwn: boolean;
};

function formatMessageTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function buildSeedMessages(roomName: string | undefined): RoomChatMessage[] {
  const t = Date.now();
  const label = roomName ?? "this room";
  return [
    {
      id: "seed-1",
      userTag: "Mentor",
      text: `Welcome to ${label}. Keep it kind, specific, and one-day-at-a-time.`,
      createdAt: t - 1000 * 60 * 12,
      isOwn: false,
    },
    {
      id: "seed-2",
      userTag: "Day 12",
      text: "First time speaking here. Rough morning but I didn’t use.",
      createdAt: t - 1000 * 60 * 9,
      isOwn: false,
    },
    {
      id: "seed-3",
      userTag: "Day 4",
      text: "Proud of you for showing up. What helped most the first hour?",
      createdAt: t - 1000 * 60 * 8,
      isOwn: false,
    },
    {
      id: "seed-4",
      userTag: "You",
      text: "Checking in—sleep was better after the wind-down thread.",
      createdAt: t - 1000 * 60 * 5,
      isOwn: true,
    },
  ];
}

function nextMessageId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function ChatRoomScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const raw = useLocalSearchParams<{ roomId?: string | string[] }>();
  const roomId = Array.isArray(raw.roomId) ? raw.roomId[0] : raw.roomId;
  const room = useMemo(() => findDemoRoomById(roomId), [roomId]);
  const messageSeed = useMemo(() => buildSeedMessages(room?.name), [room?.name, roomId]);
  const [messages, setMessages] = useState<RoomChatMessage[]>(messageSeed);
  const [input, setInput] = useState("");

  useEffect(() => {
    setMessages(messageSeed);
  }, [messageSeed]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: room?.name ?? "Room",
    });
  }, [navigation, room?.name]);

  /** Newest first for inverted FlatList */
  const listData = useMemo(() => [...messages].reverse(), [messages]);

  const onSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const msg: RoomChatMessage = {
      id: nextMessageId(),
      userTag: "You",
      text,
      createdAt: Date.now(),
      isOwn: true,
    };
    setMessages((prev) => [...prev, msg]);
    setInput("");
  }, [input]);

  const renderItem = useCallback<ListRenderItem<RoomChatMessage>>(({ item }) => {
    return (
      <View style={[styles.msgRow, item.isOwn ? styles.msgRowOwn : styles.msgRowOther]}>
        <View style={[styles.msgBlock, item.isOwn ? styles.msgBlockOwn : styles.msgBlockOther]}>
          <Text style={styles.userTag}>{item.userTag}</Text>
          <View style={[styles.bubble, item.isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
            <Text style={styles.bubbleText} selectable>
              {item.text}
            </Text>
            <Text style={[styles.timeText, item.isOwn ? styles.timeOwn : styles.timeOther]}>
              {formatMessageTime(item.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    );
  }, []);

  /** Stack header + status bar — aligns composer above keyboard on iOS */
  const keyboardOffset = Platform.OS === "ios" ? insets.top + 52 : 0;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={keyboardOffset}
    >
      <FlatList
        data={listData}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        inverted
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: 10 + insets.bottom, paddingBottom: 8 },
        ]}
      />
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TextInput
          style={styles.input}
          placeholder="Message"
          placeholderTextColor={PREMIUM.muted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={2000}
          testID="recovery-room-chat-input"
        />
        <Pressable
          onPress={onSend}
          disabled={!input.trim()}
          style={({ pressed }) => [
            styles.sendBtn,
            !input.trim() && styles.sendBtnDisabled,
            pressed && !!input.trim() && styles.sendBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          testID="recovery-room-chat-send"
        >
          <Send size={22} color={input.trim() ? PREMIUM.text : PREMIUM.sendDisabled} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PREMIUM.bg,
  },
  listContent: {
    paddingHorizontal: 14,
    flexGrow: 1,
  },
  msgRow: {
    marginBottom: 14,
    maxWidth: "92%",
  },
  msgRowOwn: {
    alignSelf: "flex-end",
  },
  msgRowOther: {
    alignSelf: "flex-start",
  },
  msgBlock: {
    minWidth: "44%",
  },
  msgBlockOwn: {
    alignItems: "flex-end",
  },
  msgBlockOther: {
    alignItems: "flex-start",
  },
  userTag: {
    fontSize: 11,
    fontWeight: "700",
    color: PREMIUM.tag,
    letterSpacing: 0.4,
    marginBottom: 4,
    marginHorizontal: 2,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    borderWidth: 1,
  },
  bubbleOwn: {
    backgroundColor: PREMIUM.bubbleOwn,
    borderColor: "rgba(46,196,182,0.25)",
  },
  bubbleOther: {
    backgroundColor: PREMIUM.bubbleOther,
    borderColor: PREMIUM.border,
  },
  bubbleText: {
    color: PREMIUM.text,
    fontSize: 16,
    lineHeight: 22,
  },
  timeText: {
    fontSize: 11,
    marginTop: 6,
    alignSelf: "flex-end",
  },
  timeOwn: {
    color: PREMIUM.timeOwn,
  },
  timeOther: {
    color: PREMIUM.timeOther,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: PREMIUM.border,
    backgroundColor: PREMIUM.bg,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: PREMIUM.inputBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PREMIUM.border,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    color: PREMIUM.text,
    fontSize: 16,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PREMIUM.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  sendBtnDisabled: {
    backgroundColor: "#2a3038",
  },
  sendBtnPressed: {
    opacity: 0.92,
  },
});
