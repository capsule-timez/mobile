import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthProvider, useAuth } from '../src/auth/AuthProvider';

function Navigation() {
  const { state, restore } = useAuth();
  if (state.status === 'loading' || state.status === 'error') {
    return (
      <View style={styles.center}>
        {state.status === 'loading'
          ? <><ActivityIndicator size="large" /><Text>Recuperando sua sessão…</Text></>
          : <><Text style={styles.message} accessibilityRole="alert">{state.message}</Text>
            <Pressable accessibilityRole="button" onPress={() => void restore()} style={styles.button}>
              <Text style={styles.buttonText}>Tentar novamente</Text>
            </Pressable></>}
      </View>
    );
  }
  const signedIn = state.status === 'signedIn';
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: '#ffffff' },
      headerTitleStyle: { fontWeight: '600' },
      contentStyle: { backgroundColor: '#f5f5f7' },
    }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="cadastro" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="index" options={{ title: 'Cápsulas' }} />
        <Stack.Screen name="nova" options={{ title: 'Nova cápsula' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return <AuthProvider><StatusBar style="dark" /><Navigation /></AuthProvider>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20, backgroundColor: '#f5f5f7' },
  message: { textAlign: 'center', fontSize: 16 },
  button: { backgroundColor: '#1c1c1e', padding: 16, borderRadius: 12 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
