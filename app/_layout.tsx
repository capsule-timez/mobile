import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black';
import { SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/auth/AuthProvider';
import { Button } from '../src/components/Button';
import { EmptyState } from '../src/components/EmptyState';
import { PaperBackground } from '../src/components/PaperBackground';
import { ShadowBox } from '../src/components/ShadowBox';
import { Spinner } from '../src/components/Spinner';
import { ToastProvider } from '../src/components/Toast';
import { colors, fonts } from '../src/theme/tokens';

function Navigation() {
  const { state, restore } = useAuth();

  if (state.status === 'loading') {
    return (
      <PaperBackground>
        <View style={styles.center}>
          <ShadowBox offset={8} style={styles.loading}>
            <Spinner size={22} color={colors.ink} />
            <Text style={styles.loadingText} accessibilityLiveRegion="polite">Recuperando sua sessão…</Text>
          </ShadowBox>
        </View>
      </PaperBackground>
    );
  }

  if (state.status === 'error') {
    return (
      <PaperBackground>
        <View style={styles.center}>
          <EmptyState
            icon="alert"
            title="Sessão indisponível"
            description={state.message}
            action={<Button onPress={() => void restore()}>Tentar novamente</Button>}
          />
        </View>
      </PaperBackground>
    );
  }

  const signedIn = state.status === 'signedIn';
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" />
        <Stack.Screen name="cadastro" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ArchivoBlack_400Regular,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  if (!fontsLoaded && !fontError) return <View style={styles.blank} />;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <ToastProvider>
          <Navigation />
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  blank: { flex: 1, backgroundColor: colors.paper },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 20, paddingHorizontal: 24 },
  loadingText: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.6 },
});
