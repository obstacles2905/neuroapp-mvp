import { Link, Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, Pressable } from 'react-native';

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useAppTheme } from '@/hooks/useAppTheme';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}): React.JSX.Element {
  return <FontAwesome size={22} style={{ marginBottom: -2 }} {...props} />;
}

export default function AppTabsLayout(): React.JSX.Element {
  const t = useAppTheme();
  const headerShown = useClientOnlyValue(false, true);
  const screenOptions = useMemo(
    () => ({
      tabBarActiveTintColor: t.tabIconSelected,
      tabBarInactiveTintColor: t.tabIconDefault,
      tabBarStyle: {
        backgroundColor: t.surface,
        borderTopColor: t.borderSubtle,
        borderTopWidth: 1,
        height: Platform.select({ ios: 84, android: 64 }),
        paddingBottom: Platform.select({ ios: 26, android: 8 }),
        paddingTop: 8,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600' as const,
        letterSpacing: 0.2,
      },
      headerTintColor: t.tint,
      headerShadowVisible: false,
      headerStyle: {
        backgroundColor: t.surface,
        borderBottomWidth: 1,
        borderBottomColor: t.borderSubtle,
      },
      headerTitleStyle: {
        fontWeight: '700' as const,
        fontSize: 17,
        letterSpacing: -0.3,
        color: t.text,
      },
      headerShown,
    }),
    [t, headerShown],
  );

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Учёба',
          tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color} />,
        }}
      />
      <Tabs.Screen
        name="now"
        options={{
          title: 'Тревожная кнопка',
          tabBarLabel: 'SOS',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="life-ring" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="biometrics"
        options={{
          title: 'Биозамеры',
          tabBarLabel: 'Био',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="heartbeat" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="jam"
        options={{
          title: 'Джем',
          tabBarIcon: ({ color }) => <TabBarIcon name="music" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="info-circle"
                    size={22}
                    color={t.textSecondary}
                    style={{ marginRight: 16, opacity: pressed ? 0.55 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
    </Tabs>
  );
}
