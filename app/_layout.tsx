import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#ffffff' },
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: '#f5f5f7' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Cápsulas' }} />
        <Stack.Screen name="nova" options={{ title: 'Nova cápsula' }} />
      </Stack>
    </>
  );
}
