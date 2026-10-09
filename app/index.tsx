import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useState } from 'react';
import { useAuth } from '../src/auth/AuthProvider';

type Capsula = {
  id: string;
  titulo: string;
};

export default function ListaCapsulasScreen() {
  const { signOut } = useAuth();
  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  async function logout() {
    setLoggingOut(true); setLogoutError('');
    try { await signOut(); } catch (error) { setLogoutError(error instanceof Error ? error.message : 'Não foi possível sair.'); }
    finally { setLoggingOut(false); }
  }
  // A listagem ainda não consome a API — a tela existe para validar a
  // navegação e a configuração do ambiente.
  const capsulas: Capsula[] = [];

  return (
    <View style={styles.container}>
      <FlatList
        data={capsulas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.titulo}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nenhuma cápsula ainda</Text>
            <Text style={styles.emptyText}>
              Crie a primeira cápsula para vê-la aqui.
            </Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <Pressable accessibilityRole="button" disabled={loggingOut} onPress={() => void logout()} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={styles.apiUrl}>{loggingOut ? 'Saindo…' : 'Sair da conta'}</Text></Pressable>
        {!!logoutError && <Text accessibilityRole="alert" style={{ color: '#a31d30' }}>{logoutError}</Text>}
        <Link href="/nova" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Nova cápsula</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  emptyText: {
    fontSize: 14,
    color: '#6c6c70',
  },
  footer: {
    padding: 16,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#d1d1d6',
    backgroundColor: '#ffffff',
  },
  apiUrl: {
    fontSize: 12,
    color: '#6c6c70',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
