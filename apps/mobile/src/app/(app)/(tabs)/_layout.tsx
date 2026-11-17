import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { IconName } from "@/components/button";
import { getMessages } from "@/i18n";
import { tapFeedback } from "@/lib/haptics";
import { colors, fonts } from "@/theme";

type Tab = { name: string; label: string; icon: IconName; iconActive: IconName };

/** Barra inferior: las cuatro secciones principales de la app. */
export default function TabsLayout() {
  const t = getMessages();
  const tabs: Tab[] = [
    { name: "inicio", label: t.tabs.home, icon: "home-outline", iconActive: "home" },
    { name: "buscar", label: t.tabs.search, icon: "search-outline", iconActive: "search" },
    { name: "escanear", label: t.tabs.scan, icon: "scan-outline", iconActive: "scan" },
    { name: "perfil", label: t.tabs.profile, icon: "person-outline", iconActive: "person" },
  ];

  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 17, color: colors.text },
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
      }}
      screenListeners={{ tabPress: () => tapFeedback() }}
    >
      {tabs.map((tab, index) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarAccessibilityLabel: t.tabs.accessibilityLabel(tab.label, index + 1, tabs.length),
            tabBarIcon: ({ focused, size }) => (
              <Ionicons
                name={focused ? tab.iconActive : tab.icon}
                color={focused ? colors.primary : colors.textSubtle}
                size={size}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
