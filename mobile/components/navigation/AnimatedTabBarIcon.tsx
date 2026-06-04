import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useEffect } from 'react';
import Animated, {
  interpolateColor,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { NAV_MOTION } from '@/constants/navigation-motion';

const AnimatedIcon = Animated.createAnimatedComponent(FontAwesome);

type AnimatedTabBarIconProps = {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  focused: boolean;
  activeColor: string;
  inactiveColor: string;
};

export function AnimatedTabBarIcon({
  name,
  focused,
  activeColor,
  inactiveColor,
}: AnimatedTabBarIconProps): React.JSX.Element {
  const focus = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    focus.value = withTiming(focused ? 1 : 0, {
      duration: NAV_MOTION.tabIconMs,
    });
  }, [focused, focus]);

  const animatedProps = useAnimatedProps(() => ({
    color: interpolateColor(
      focus.value,
      [0, 1],
      [inactiveColor, activeColor],
    ),
  }));

  return (
    <AnimatedIcon
      size={22}
      name={name}
      style={{ marginBottom: -2 }}
      animatedProps={animatedProps}
    />
  );
}
