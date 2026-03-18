import { Stack } from "expo-router";
import Colors from "@/constants/colors";

export default function ConnectionLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: "600" as const },
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Connection" }} />
      <Stack.Screen
        name="recovery-rooms"
        options={{
          title: "Recovery Rooms",
        }}
      />
      <Stack.Screen
        name="room-session"
        options={{
          // The existing `/room-session` route hides the header.
          headerShown: false,
          presentation: "modal",
        }}
      />
    </Stack>
  );
}

