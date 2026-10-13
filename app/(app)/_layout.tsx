import { Tabs } from 'expo-router';
import { BottomTabBar } from '../../src/components/BottomTabBar';
import { colors } from '../../src/theme/tokens';

/** Telas autenticadas: duas abas (listar / criar) com a barra inferior própria. */
export default function AppLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.paper } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Minhas cápsulas' }} />
      <Tabs.Screen name="nova" options={{ title: 'Nova cápsula' }} />
    </Tabs>
  );
}
