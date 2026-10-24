import { Tabs } from "expo-router";
import { StyleSheet, View, type ColorValue } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Home,
  TrendingUp,
  Hammer,
  Users,
  BookOpen,
  Handshake,
} from "lucide-react-native";
import React, { useCallback } from "react";
import Colors from "../../constants/colors";
import { hairline, shadows, spacing } from "../../constants/theme";

type IconType = typeof Home;
type TabBarIconProps = { focused: boolean; color: ColorValue; size: number };

function tabIconColor(color: ColorValue): string {
  return typeof color === 'string' ? color : Colors.primary;
}
import { useAppMeta } from "../../core/domains/useAppMeta";

const STABILITY_DOT_COLORS: Record<string, string> = {
  green: '#22C55E',
  yellow: '#EAB308',
  orange: '#F97316',
  red: '#EF4444',
};

function getStabilityDotColor(score: number): string {
  if (score >= 70) return STABILITY_DOT_COLORS.green;
  if (score >= 50) return STABILITY_DOT_COLORS.yellow;
  if (score >= 30) return STABILITY_DOT_COLORS.orange;
  return STABILITY_DOT_COLORS.red;
}

const TabIcon = React.memo(
  ({
    IconComponent,
    color,
    size,
  }: {
    IconComponent: IconType;
    color: string;
    size: number;
  }) => <IconComponent color={color} size={size} />,
);

const HomeTabIcon = React.memo(
  ({ color, size, dotColor }: { color: string; size: number; dotColor: string }) => (
    <View style={{ width: size + 6, height: size + 2, alignItems: 'center', justifyContent: 'center' }}>
      <Home color={color} size={size} />
      <View
        style={{
          position: 'absolute',
          top: -1,
          right: 0,
          width: 7,
          height: 7,
          borderRadius: 3.5,
          backgroundColor: dotColor,
          borderWidth: 1,
          borderColor: Colors.tabBar,
        }}
      />
    </View>
  ),
);

export default function TabLayout() {
  const { stabilityScore } = useAppMeta();
  const insets = useSafeAreaInsets();
  const dotColor = getStabilityDotColor(stabilityScore);
  const tabBarBottomInset = Math.max(insets.bottom, spacing.xxs);

  const ICON_SIZE = 20;

  const renderHomeIcon = useCallback(
    ({ color }: TabBarIconProps) => (
      <HomeTabIcon color={tabIconColor(color)} size={ICON_SIZE} dotColor={dotColor} />
    ),
    [dotColor],
  );

  const renderProgressIcon = useCallback(
    ({ color }: TabBarIconProps) => (
      <TabIcon IconComponent={TrendingUp} color={tabIconColor(color)} size={ICON_SIZE} />
    ),
    [],
  );

  const renderRebuildIcon = useCallback(
    ({ color }: TabBarIconProps) => (
      <TabIcon IconComponent={Hammer} color={tabIconColor(color)} size={ICON_SIZE} />
    ),
    [],
  );

  const renderConnectionIcon = useCallback(
    ({ color }: TabBarIconProps) => (
      <TabIcon IconComponent={Users} color={tabIconColor(color)} size={ICON_SIZE} />
    ),
    [],
  );

  const renderAccountabilityIcon = useCallback(
    ({ color }: TabBarIconProps) => (
      <TabIcon IconComponent={Handshake} color={tabIconColor(color)} size={ICON_SIZE} />
    ),
    [],
  );

  const renderJournalIcon = useCallback(
    ({ color }: TabBarIconProps) => (
      <TabIcon IconComponent={BookOpen} color={tabIconColor(color)} size={ICON_SIZE} />
    ),
    [],
  );

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSecondary,
          tabBarShowLabel: true,
          tabBarStyle: {
            backgroundColor: Colors.tabBar,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: hairline,
            paddingTop: spacing.xxs,
            paddingBottom: tabBarBottomInset,
            ...shadows.tabBar,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "700" as const,
            letterSpacing: 0.2,
            marginBottom: spacing.xxs,
          },
          lazy: true,
        }}
      >
        <Tabs.Screen
          name="(home)"
          options={{
            title: "Today",
            tabBarIcon: renderHomeIcon,
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: "Progress",
            tabBarIcon: renderProgressIcon,
          }}
        />
        <Tabs.Screen
          name="journal"
          options={{
            title: "Journal",
            tabBarIcon: renderJournalIcon,
          }}
        />
        <Tabs.Screen
          name="rebuild"
          options={{
            title: "Rebuild",
            tabBarIcon: renderRebuildIcon,
          }}
        />
        <Tabs.Screen
          name="connection"
          options={{
            title: "Connect",
            tabBarIcon: renderConnectionIcon,
          }}
        />
        <Tabs.Screen
          name="accountability"
          options={{
            title: "Accountability",
            tabBarIcon: renderAccountabilityIcon,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="community"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="check-ins/index"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="relapse-prevention/index"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="support"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="milestones"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="pledges"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="triggers"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </View>
  );
}
