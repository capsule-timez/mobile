import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function NovaCapsulaScreen() {
  const router = useRouter();
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');

  // O envio para a API ainda não está implementado: por ora a tela apenas
  // volta para a listagem.
  function handleSalvar() {
    router.back();
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.field}>
        <Text style={styles.label}>Título</Text>
        <TextInput
          style={styles.input}
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Título da cápsula"
          placeholderTextColor="#aeaeb2"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Mensagem</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={mensagem}
          onChangeText={setMensagem}
          placeholder="O que você quer guardar?"
          placeholderTextColor="#aeaeb2"
          multiline
          textAlignVertical="top"
        />
      </View>

      <Pressable style={styles.button} onPress={handleSalvar}>
        <Text style={styles.buttonText}>Salvar</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1c1c1e',
  },
  textarea: {
    minHeight: 140,
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
