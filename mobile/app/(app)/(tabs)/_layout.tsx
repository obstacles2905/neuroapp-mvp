import { Link, Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { AnimatedTabBarIcon } from '@/components/navigation/AnimatedTabBarIcon';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { tabTransitionSpec } from '@/constants/navigation-motion';
import { useAppTheme } from '@/hooks/useAppTheme';
import { isBiometricsOnlyMode } from '@/lib/config/feature-flags';

export default function AppTabsLayout(): React.JSX.Element {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const headerShown = useClientOnlyValue(false, true);
  const screenOptions = useMemo(() => {
    const paddingTop = 8;
    /** Edge-to-edge + жестовая панель: без insets зона нажатий уезжает под системную навигацию. */
    const bottomInset = Math.max(
      insets.bottom,
      Platform.OS === 'android' ? 20 : 10,
    );
    const contentRow = Platform.OS === 'ios' ? 52 : 50;
    const tabBarHeight = contentRow + paddingTop + bottomInset;

    return {
      animation: 'fade' as const,
      transitionSpec: tabTransitionSpec,
      sceneStyle: { backgroundColor: t.background },
      tabBarActiveTintColor: t.tabIconSelected,
      tabBarInactiveTintColor: t.tabIconDefault,
      tabBarStyle: {
        backgroundColor: t.surface,
        borderTopColor: t.borderSubtle,
        borderTopWidth: 1,
        height: tabBarHeight,
        paddingBottom: bottomInset,
        paddingTop,
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
    };
  }, [t, headerShown, insets.bottom]);

  return (
    <Tabs
      detachInactiveScreens={false}
      initialRouteName={isBiometricsOnlyMode ? 'biometrics' : 'index'}
      screenOptions={screenOptions}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: isBiometricsOnlyMode ? null : undefined,
          title: 'Учёба',
          tabBarIcon: ({ focused }) => (
            <AnimatedTabBarIcon
              name="book"
              focused={focused}
              activeColor={t.tabIconSelected}
              inactiveColor={t.tabIconDefault}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="now"
        options={{
          href: isBiometricsOnlyMode ? null : undefined,
          title: 'Тревожная кнопка',
          tabBarLabel: 'SOS',
          tabBarIcon: ({ focused }) => (
            <AnimatedTabBarIcon
              name="life-ring"
              focused={focused}
              activeColor={t.tabIconSelected}
              inactiveColor={t.tabIconDefault}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="biometrics"
        options={{
          title: 'Биозамеры',
          tabBarLabel: 'Био',
          tabBarIcon: ({ focused }) => (
            <AnimatedTabBarIcon
              name="heartbeat"
              focused={focused}
              activeColor={t.tabIconSelected}
              inactiveColor={t.tabIconDefault}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="jam"
        options={{
          href: isBiometricsOnlyMode ? null : undefined,
          title: 'Джем',
          tabBarIcon: ({ focused }) => (
            <AnimatedTabBarIcon
              name="music"
              focused={focused}
              activeColor={t.tabIconSelected}
              inactiveColor={t.tabIconDefault}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: isBiometricsOnlyMode ? null : undefined,
          title: 'Профиль',
          tabBarIcon: ({ focused }) => (
            <AnimatedTabBarIcon
              name="user"
              focused={focused}
              activeColor={t.tabIconSelected}
              inactiveColor={t.tabIconDefault}
            />
          ),
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
