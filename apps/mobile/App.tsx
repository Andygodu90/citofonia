import { StatusBar } from 'expo-status-bar';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Porteria</Text>
        <Text style={styles.title}>Citofonia residencial</Text>
        <Text style={styles.subtitle}>
          Contacta una unidad sin mostrar datos privados del residente.
        </Text>
      </View>

      <View style={styles.searchPanel}>
        <Text style={styles.label}>Unidad seleccionada</Text>
        <Text style={styles.unit}>Torre A - Apto 101</Text>
        <Text style={styles.helper}>
          Los nombres y telefonos se resolveran desde el backend.
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.button, styles.primaryButton]}>
          <Text style={styles.primaryButtonText}>Llamar</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.secondaryButton]}>
          <Text style={styles.secondaryButtonText}>Abrir chat</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f7f8fa',
    padding: 24,
  },
  header: {
    gap: 10,
    marginTop: 24,
    marginBottom: 32,
  },
  eyebrow: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: '#111827',
    fontSize: 34,
    fontWeight: '800',
  },
  subtitle: {
    color: '#4b5563',
    fontSize: 17,
    lineHeight: 25,
  },
  searchPanel: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 8,
    borderWidth: 1,
    padding: 20,
    gap: 8,
  },
  label: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  unit: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '800',
  },
  helper: {
    color: '#6b7280',
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    gap: 12,
    marginTop: 24,
  },
  button: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 56,
  },
  primaryButton: {
    backgroundColor: '#111827',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
    borderWidth: 1,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '800',
  },
});
