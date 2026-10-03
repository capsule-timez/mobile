import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { TokenStorage } from './session';

const TOKEN_KEY = 'capsula.auth.token';
const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

// SecureStore is native-only. Web sessions last only while this page is open.
let webToken: string | null = null;

export const tokenStorage: TokenStorage = {
  async read() {
    if (Platform.OS === 'web') return webToken;
    return SecureStore.getItemAsync(TOKEN_KEY, options);
  },
  async write(token) {
    if (Platform.OS === 'web') { webToken = token; return; }
    await SecureStore.setItemAsync(TOKEN_KEY, token, options);
  },
  async remove() {
    if (Platform.OS === 'web') { webToken = null; return; }
    await SecureStore.deleteItemAsync(TOKEN_KEY, options);
  },
};
