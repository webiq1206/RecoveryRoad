import { Stack } from "expo-router";
import React from "react";
import Colors from "@/constants/colors";

export default function JournalLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Journal & Exercises' }} />
    </Stack>
  );
}
