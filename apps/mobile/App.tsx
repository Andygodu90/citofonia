import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const DEFAULT_API_URL = 'http://localhost:3000';

type UnitSearchResult = {
  id: string;
  propertyName: string;
  block: string;
  unitNumber: string;
  displayLabel: string;
  activeResidents: number;
  privacyLabel: string;
};

type UnitDetail = UnitSearchResult & {
  propertyId: string;
  enabledContacts: number;
  canCall: boolean;
  canChat: boolean;
  protectedSummary: string;
  privacyNotice: string;
};

type Notice = {
  tone: 'success' | 'error' | 'info';
  text: string;
};

export default function App() {
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [query, setQuery] = useState('31 1A');
  const [units, setUnits] = useState<UnitSearchResult[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<UnitDetail | null>(null);
  const [chatMessage, setChatMessage] = useState(
    'Buen dia, por favor confirmar autorizacion de ingreso.',
  );
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice>({
    tone: 'info',
    text: 'Busca por bloque o apartamento. Ejemplo: 31, 1A, 45 5D.',
  });

  const normalizedApiUrl = useMemo(() => apiUrl.replace(/\/$/, ''), [apiUrl]);

  async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${normalizedApiUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? 'No se pudo completar la solicitud');
    }

    return data as T;
  }

  async function searchUnits() {
    setLoading(true);
    setSelectedUnit(null);
    setNotice({ tone: 'info', text: 'Buscando unidades...' });

    try {
      const searchQuery = encodeURIComponent(query.trim());
      const data = await request<{ units: UnitSearchResult[] }>(
        `/api/porter/units?query=${searchQuery}`,
      );

      setUnits(data.units);
      setNotice({
        tone: 'success',
        text:
          data.units.length === 0
            ? 'No encontramos unidades con ese criterio.'
            : `Encontramos ${data.units.length} resultado(s).`,
      });
    } catch (error) {
      setNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Error buscando unidades.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadUnit(unitId: string) {
    setLoading(true);
    setNotice({ tone: 'info', text: 'Cargando detalle protegido...' });

    try {
      const data = await request<{ unit: UnitDetail }>(
        `/api/porter/units/${unitId}`,
      );
      setSelectedUnit(data.unit);
      setNotice({
        tone: 'success',
        text: 'Unidad seleccionada. Datos sensibles protegidos.',
      });
    } catch (error) {
      setNotice({
        tone: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Error cargando la unidad seleccionada.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function registerCall() {
    if (!selectedUnit) {
      return;
    }

    setLoading(true);
    setNotice({ tone: 'info', text: 'Registrando intento de llamada...' });

    try {
      const data = await request<{
        call: { status: string; message: string };
      }>(`/api/porter/units/${selectedUnit.id}/calls`, {
        method: 'POST',
        body: JSON.stringify({ status: 'initiated' }),
      });

      setNotice({ tone: 'success', text: data.call.message });
    } catch (error) {
      setNotice({
        tone: 'error',
        text:
          error instanceof Error ? error.message : 'Error registrando llamada.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!selectedUnit) {
      return;
    }

    setLoading(true);
    setNotice({ tone: 'info', text: 'Guardando mensaje interno...' });

    try {
      const data = await request<{
        thread: { message: string };
      }>(`/api/porter/units/${selectedUnit.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: chatMessage }),
      });

      setNotice({ tone: 'success', text: data.thread.message });
    } catch (error) {
      setNotice({
        tone: 'error',
        text:
          error instanceof Error ? error.message : 'Error guardando mensaje.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Porteria</Text>
          <Text style={styles.title}>Arcadas de San Isidro</Text>
          <Text style={styles.subtitle}>
            Busca una unidad, contacta al residente y registra la gestion sin
            mostrar nombres ni telefonos.
          </Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.label}>Servidor API</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setApiUrl}
            placeholder="http://localhost:3000"
            style={styles.input}
            value={apiUrl}
          />
          <Text style={styles.hint}>
            En Expo Go con celular fisico usa la IP del computador en la misma
            red.
          </Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.label}>Buscar unidad</Text>
          <View style={styles.searchRow}>
            <TextInput
              autoCapitalize="characters"
              onChangeText={setQuery}
              placeholder="Bloque o apto"
              style={[styles.input, styles.searchInput]}
              value={query}
            />
            <Pressable
              disabled={loading}
              onPress={searchUnits}
              style={[styles.smallButton, loading && styles.disabledButton]}
            >
              <Text style={styles.smallButtonText}>Buscar</Text>
            </Pressable>
          </View>

          {loading ? <ActivityIndicator color="#111827" /> : null}

          <View style={[styles.notice, styles[`${notice.tone}Notice`]]}>
            <Text style={styles.noticeText}>{notice.text}</Text>
          </View>

          <FlatList
            data={units}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => loadUnit(item.id)}
                style={[
                  styles.unitItem,
                  selectedUnit?.id === item.id && styles.unitItemSelected,
                ]}
              >
                <Text style={styles.unitTitle}>{item.displayLabel}</Text>
                <Text style={styles.unitMeta}>{item.privacyLabel}</Text>
              </Pressable>
            )}
            scrollEnabled={false}
          />
        </View>

        {selectedUnit ? (
          <View style={styles.panel}>
            <Text style={styles.label}>Unidad seleccionada</Text>
            <Text style={styles.selectedTitle}>{selectedUnit.displayLabel}</Text>
            <Text style={styles.hint}>{selectedUnit.protectedSummary}</Text>
            <Text style={styles.privacy}>{selectedUnit.privacyNotice}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {selectedUnit.activeResidents}
                </Text>
                <Text style={styles.statLabel}>Residentes</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {selectedUnit.enabledContacts}
                </Text>
                <Text style={styles.statLabel}>Contactos</Text>
              </View>
            </View>

            <Pressable
              disabled={loading || !selectedUnit.canCall}
              onPress={registerCall}
              style={[styles.button, styles.primaryButton]}
            >
              <Text style={styles.primaryButtonText}>Registrar llamada</Text>
            </Pressable>

            <Text style={styles.label}>Mensaje interno</Text>
            <TextInput
              multiline
              onChangeText={setChatMessage}
              style={[styles.input, styles.messageInput]}
              value={chatMessage}
            />

            <Pressable
              disabled={loading || !selectedUnit.canChat}
              onPress={sendMessage}
              style={[styles.button, styles.secondaryButton]}
            >
              <Text style={styles.secondaryButtonText}>
                Guardar chat de prueba
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    gap: 8,
    marginBottom: 18,
    marginTop: 10,
  },
  eyebrow: {
    color: '#1d4ed8',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: '#111827',
    fontSize: 31,
    fontWeight: '900',
  },
  subtitle: {
    color: '#4b5563',
    fontSize: 16,
    lineHeight: 23,
  },
  panel: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    marginBottom: 16,
    padding: 16,
  },
  label: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderColor: '#d1d5db',
    borderRadius: 8,
    borderWidth: 1,
    color: '#111827',
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  hint: {
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 20,
  },
  searchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  searchInput: {
    flex: 1,
  },
  smallButton: {
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 18,
  },
  smallButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.6,
  },
  notice: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  infoNotice: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  successNotice: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  errorNotice: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  noticeText: {
    color: '#1f2937',
    fontSize: 14,
    lineHeight: 20,
  },
  unitItem: {
    borderColor: '#e5e7eb',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    padding: 14,
  },
  unitItemSelected: {
    borderColor: '#2563eb',
  },
  unitTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '900',
  },
  unitMeta: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 4,
  },
  selectedTitle: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '900',
  },
  privacy: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    color: '#374151',
    fontSize: 14,
    lineHeight: 20,
    padding: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    flex: 1,
    padding: 12,
  },
  statValue: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '900',
  },
  statLabel: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 2,
  },
  button: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 54,
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
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '900',
  },
  messageInput: {
    minHeight: 94,
    textAlignVertical: 'top',
  },
});
