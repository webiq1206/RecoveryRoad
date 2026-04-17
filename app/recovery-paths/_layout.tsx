import { Stack } from "expo-router";
import React from "react";

const headerBg = "#0b0d0f";
const contentBg = "#0b0d0f";
const tint = "#F2F3F5";

export default function RecoveryPathsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: headerBg },
        headerTintColor: tint,
        headerTitleStyle: { fontWeight: "600" as const, color: tint },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: contentBg },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Recovery paths",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="room-list"
        options={{
          title: "Rooms",
        }}
      />
      <Stack.Screen
        name="chat-room"
        options={{
          title: "Room",
        }}
      />
    </Stack>
  );
}
