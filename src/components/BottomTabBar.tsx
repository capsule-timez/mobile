import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, stroke, strokeThin } from '../theme/tokens';
import { Icon, type IconName } from './Icon';
import { ShadowBox } from './ShadowBox';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Minhas cápsulas', icon: 'hourglass' },
  nova: { label: 'Nova cápsula', icon: 'plus' },
};

export function BottomTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10), paddingLeft: 16 + insets.left, paddingRight: 16 + insets.right }]}
    >
      {state.routes.map((route, index) => {
        const meta = TABS[route.name];
        if (!meta) return null;
        const focused = state.index === index;

        function onPress() {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        }

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={meta.label}
            accessibilityState={{ selected: focused }}
            onPress={onPress}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            style={styles.tab}
          >
            {({ pressed }) => (
              <ShadowBox
                offset={3}
                shadowVisible={focused}
                borderWidth={strokeThin}
                borderColor={focused || pressed ? colors.ink : 'transparent'}
                backgroundColor={focused ? colors.orange : pressed ? colors.yellow : 'transparent'}
                style={styles.tabBox}
              >
                <Icon name={meta.icon} size={22} />
                <Text style={styles.label} numberOfLines={1}>{meta.label}</Text>
              </ShadowBox>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: stroke,
    borderTopColor: colors.ink,
    backgroundColor: colors.surface,
  },
  tab: { flex: 1 },
  tabBox: { alignItems: 'center', gap: 2, paddingVertical: 6, paddingHorizontal: 8, minHeight: 52 },
  label: {
    color: colors.ink,
    fontFamily: fonts.bodyBold,
    fontSize: 11.5,
    letterSpacing: 0.46,
    textTransform: 'uppercase',
  },
});
