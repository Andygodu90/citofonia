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

type UserSession = {
  token: string;
  username: string;
  role: string;
};

type HistoryItem = {
  id: string;
  type: 'visitor' | 'call' | 'message';
  title: string;
  subtitle: string;
  status: string;
  occurredAt: string;
};

export default function App() {
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [username, setUsername] = useState('porteria');
  const [password, setPassword] = useState('Porteria123*');
  const [session, setSession] = useState<UserSession | null>(null);
  const [query, setQuery] = useState('31 1A');
  const [units, setUnits] = useState<UnitSearchResult[]>([]);
  const [selectedSummary, setSelectedSummary] =
    useState<UnitSearchResult | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<UnitDetail | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState(
    'Buen dia, por favor confirmar autorizacion de ingreso.',
  );
  const [visitorName, setVisitorName] = useState('Visitante de prueba');
  const [visitorDocument, setVisitorDocument] = useState('123456789');
  const [visitorPhone, setVisitorPhone] = useState('3000000000');
  const [visitorType, setVisitorType] = useState('invitado');
  const [visitReason, setVisitReason] = useState('Visita familiar');
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
        ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? 'No se pudo completar la solicitud');
    }

    return data as T;
  }

  async function login() {
    setLoading(true);
    setNotice({ tone: 'info', text: 'Validando usuario de porteria...' });

    try {
      const response = await fetch(`${normalizedApiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'No se pudo iniciar sesion');
      }

      setSession({
        token: data.token,
        username: data.user.username,
        role: data.user.role,
      });
      setNotice({
        tone: 'success',
        text: 'Sesion iniciada. Ya puedes buscar unidades.',
      });
    } catch (error) {
      setNotice({
        tone: 'error',
        text:
          error instanceof Error ? error.message : 'Error iniciando sesion.',
      });
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setSession(null);
    setUnits([]);
    setSelectedSummary(null);
    setSelectedUnit(null);
    setHistoryItems([]);
    setIsHistoryOpen(false);
    setNotice({ tone: 'info', text: 'Sesion cerrada.' });
  }

  async function searchUnits() {
    setLoading(true);
    setSelectedSummary(null);
    setSelectedUnit(null);
    setHistoryItems([]);
    setIsHistoryOpen(false);
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

  async function loadUnit(unit: UnitSearchResult) {
    setLoading(true);
    setSelectedSummary(unit);
    setUnits([]);
    setNotice({ tone: 'info', text: 'Cargando detalle protegido...' });

    try {
      const data = await request<{ unit: UnitDetail }>(
        `/api/porter/units/${unit.id}`,
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

  function clearSelectedUnit() {
    setSelectedSummary(null);
    setSelectedUnit(null);
    setHistoryItems([]);
    setNotice({
      tone: 'info',
      text: 'Puedes buscar o seleccionar otra unidad.',
    });
  }

  async function loadHistory() {
    setLoading(true);
    setNotice({ tone: 'info', text: 'Cargando historial de porteria...' });

    try {
      const data = await request<{ items: HistoryItem[] }>('/api/porter/history');
      setHistoryItems(data.items);
      setNotice({
        tone: 'success',
        text:
          data.items.length === 0
            ? 'No hay historial reciente.'
            : `Historial actualizado: ${data.items.length} evento(s).`,
      });
    } catch (error) {
      setNotice({
        tone: 'error',
        text:
          error instanceof Error ? error.message : 'Error cargando historial.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function toggleHistory() {
    const nextOpen = !isHistoryOpen;
    setIsHistoryOpen(nextOpen);

    if (nextOpen && historyItems.length === 0) {
      await loadHistory();
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

  async function registerVisitor() {
    if (!selectedUnit) {
      return;
    }

    setLoading(true);
    setNotice({ tone: 'info', text: 'Registrando visitante...' });

    try {
      const data = await request<{
        message: string;
        authorization: { status: string };
      }>(`/api/porter/units/${selectedUnit.id}/visitors`, {
        method: 'POST',
        body: JSON.stringify({
          fullName: visitorName,
          documentId: visitorDocument,
          phone: visitorPhone,
          visitorType,
          reason: visitReason,
        }),
      });

      setNotice({
        tone: 'success',
        text: `${data.message} Estado: ${data.authorization.status}.`,
      });
    } catch (error) {
      setNotice({
        tone: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Error registrando visitante.',
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

        {!session ? (
          <View style={styles.panel}>
            <Text style={styles.label}>Ingreso de porteria</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setUsername}
              placeholder="Usuario"
              style={styles.input}
              value={username}
            />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setPassword}
              placeholder="Contrasena"
              secureTextEntry
              style={styles.input}
              value={password}
            />
            <Pressable
              disabled={loading}
              onPress={login}
              style={[styles.button, styles.primaryButton, loading && styles.disabledButton]}
            >
              <Text style={styles.primaryButtonText}>Ingresar</Text>
            </Pressable>
            <Text style={styles.hint}>
              Usuario de prueba: porteria / Porteria123*
            </Text>
          </View>
        ) : (
          <View style={styles.sessionBar}>
            <View>
              <Text style={styles.sessionLabel}>Sesion activa</Text>
              <Text style={styles.sessionUser}>
                {session.username} - {session.role}
              </Text>
            </View>
            <Pressable onPress={logout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Salir</Text>
            </Pressable>
          </View>
        )}

        {session ? (
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

          {selectedSummary ? (
            <View style={[styles.unitItem, styles.unitItemSelected]}>
              <Text style={styles.unitTitle}>{selectedSummary.displayLabel}</Text>
              <Text style={styles.unitMeta}>{selectedSummary.privacyLabel}</Text>
              <Pressable onPress={clearSelectedUnit} style={styles.inlineButton}>
                <Text style={styles.inlineButtonText}>Cambiar unidad</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={units}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable onPress={() => loadUnit(item)} style={styles.unitItem}>
                  <Text style={styles.unitTitle}>{item.displayLabel}</Text>
                  <Text style={styles.unitMeta}>{item.privacyLabel}</Text>
                </Pressable>
              )}
              scrollEnabled={false}
            />
          )}
        </View>
        ) : null}

        {session ? (
          <View style={styles.panel}>
            <Pressable onPress={toggleHistory} style={styles.accordionHeader}>
              <View>
                <Text style={styles.label}>Historial reciente</Text>
                <Text style={styles.hint}>
                  {isHistoryOpen ? 'Toca para ocultar' : 'Toca para abrir'}
                </Text>
              </View>
              <Text style={styles.accordionIcon}>
                {isHistoryOpen ? 'Cerrar' : 'Abrir'}
              </Text>
            </Pressable>

            {isHistoryOpen ? (
              <View style={styles.accordionBody}>
                <Pressable
                  disabled={loading}
                  onPress={loadHistory}
                  style={styles.inlineButton}
                >
                  <Text style={styles.inlineButtonText}>Actualizar</Text>
                </Pressable>

                {historyItems.length === 0 ? (
                  <Text style={styles.hint}>
                    Aun no hay historial reciente para mostrar.
                  </Text>
                ) : (
                  historyItems.map((item) => (
                    <View
                      key={`${item.type}-${item.id}`}
                      style={styles.historyItem}
                    >
                      <Text style={styles.historyType}>{item.type}</Text>
                      <Text style={styles.historyTitle}>{item.title}</Text>
                      <Text style={styles.historyMeta}>
                        {item.subtitle} - {item.status}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            ) : null}
          </View>
        ) : null}

        {session && selectedUnit ? (
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

            <View style={styles.divider} />

            <Text style={styles.label}>Registro de visitante</Text>
            <TextInput
              onChangeText={setVisitorName}
              placeholder="Nombre del visitante"
              style={styles.input}
              value={visitorName}
            />
            <TextInput
              keyboardType="number-pad"
              onChangeText={setVisitorDocument}
              placeholder="Documento"
              style={styles.input}
              value={visitorDocument}
            />
            <TextInput
              keyboardType="phone-pad"
              onChangeText={setVisitorPhone}
              placeholder="Telefono"
              style={styles.input}
              value={visitorPhone}
            />
            <View style={styles.twoColumns}>
              <TextInput
                onChangeText={setVisitorType}
                placeholder="Tipo"
                style={[styles.input, styles.columnInput]}
                value={visitorType}
              />
              <TextInput
                onChangeText={setVisitReason}
                placeholder="Motivo"
                style={[styles.input, styles.columnInput]}
                value={visitReason}
              />
            </View>
            <Pressable
              disabled={loading}
              onPress={registerVisitor}
              style={[styles.button, styles.warningButton]}
            >
              <Text style={styles.warningButtonText}>
                Registrar visitante pendiente
              </Text>
            </Pressable>

            <View style={styles.divider} />

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
  accordionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  accordionBody: {
    gap: 10,
  },
  accordionIcon: {
    color: '#1d4ed8',
    fontSize: 14,
    fontWeight: '900',
  },
  sessionBar: {
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 16,
  },
  sessionLabel: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  sessionUser: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  logoutText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '900',
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
    backgroundColor: '#eff6ff',
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
  divider: {
    backgroundColor: '#e5e7eb',
    height: 1,
    marginVertical: 4,
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 10,
  },
  columnInput: {
    flex: 1,
  },
  inlineButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineButtonText: {
    color: '#1d4ed8',
    fontSize: 14,
    fontWeight: '900',
  },
  historyItem: {
    borderColor: '#e5e7eb',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  historyType: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  historyTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },
  historyMeta: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 3,
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
  warningButton: {
    backgroundColor: '#f59e0b',
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
  warningButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '900',
  },
  messageInput: {
    minHeight: 94,
    textAlignVertical: 'top',
  },
});
