import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Button as PaperButton,
  Card,
  Chip,
  MD3LightTheme,
  PaperProvider,
  TextInput as PaperTextInput,
} from 'react-native-paper';

function getDefaultApiUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const hostname = window.location.hostname || 'localhost';

    return `http://${hostname}:3000`;
  }

  return 'http://localhost:3000';
}

const DEFAULT_API_URL = getDefaultApiUrl();

const palette = {
  bg: '#eef4f8',
  surface: '#ffffff',
  surfaceMuted: '#f6f8fb',
  ink: '#172033',
  muted: '#667085',
  line: '#dde5ee',
  primary: '#0f766e',
  primaryDark: '#134e4a',
  navy: '#172554',
  amber: '#f59e0b',
  green: '#16a34a',
  red: '#dc2626',
  blue: '#2563eb',
};

const paperTheme = {
  ...MD3LightTheme,
  roundness: 2,
  colors: {
    ...MD3LightTheme.colors,
    primary: palette.primary,
    secondary: palette.amber,
    tertiary: palette.navy,
    surface: palette.surface,
    surfaceVariant: palette.surfaceMuted,
    outline: palette.line,
  },
};

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
  residentId?: string | null;
};

type HistoryItem = {
  id: string;
  type: 'visitor' | 'call' | 'message' | 'entry' | 'exit';
  title: string;
  subtitle: string;
  status: string;
  occurredAt: string;
};

type MovementItem = {
  authorizationId: string;
  visitorName: string;
  visitorType: string;
  unitLabel: string;
};

type MovementsState = {
  pendingEntry: MovementItem[];
  pendingExit: MovementItem[];
};

type PendingAuthorization = {
  id: string;
  visitorName: string;
  visitorType: string;
  unitLabel: string;
  status: string;
  createdAt: string;
  notes: string | null;
};

type ChatHistoryItem = {
  id: string;
  direction: 'inbound' | 'outbound';
  body: string;
  sentAt: string;
};

type ResidentPendingItem = {
  id: string;
  visitorName: string;
  visitorType: string;
  status: string;
  notes: string | null;
  createdAt: string;
};

type ResidentHistoryItem = {
  id: string;
  type: string;
  status: string;
  visitorName: string;
  occurredAt: string;
};

type ResidentDashboard = {
  resident: {
    fullName: string;
    unitId: string;
    unitLabel: string;
    propertyName: string;
  };
  pending: ResidentPendingItem[];
  history: ResidentHistoryItem[];
};

type ActionButtonTone =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger';

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: ActionButtonTone;
  compact?: boolean;
  flex?: boolean;
};

function getActionButtonColors(tone: ActionButtonTone) {
  if (tone === 'secondary') {
    return {
      buttonColor: palette.surface,
      mode: 'outlined' as const,
      textColor: palette.ink,
    };
  }

  if (tone === 'success') {
    return {
      buttonColor: palette.green,
      mode: 'contained' as const,
      textColor: '#ffffff',
    };
  }

  if (tone === 'warning') {
    return {
      buttonColor: palette.amber,
      mode: 'contained' as const,
      textColor: palette.ink,
    };
  }

  if (tone === 'danger') {
    return {
      buttonColor: '#ffffff',
      mode: 'outlined' as const,
      textColor: palette.red,
    };
  }

  return {
    buttonColor: palette.primary,
    mode: 'contained' as const,
    textColor: '#ffffff',
  };
}

function ActionButton({
  label,
  onPress,
  disabled = false,
  tone = 'primary',
  compact = false,
  flex = false,
}: ActionButtonProps) {
  const colors = getActionButtonColors(tone);

  return (
    <PaperButton
      compact={compact}
      disabled={disabled}
      mode={colors.mode}
      onPress={onPress}
      buttonColor={colors.buttonColor}
      textColor={colors.textColor}
      style={[styles.actionButton, flex ? styles.actionButtonFlex : null]}
    >
      {label}
    </PaperButton>
  );
}

type AccordionToggleProps = {
  title: string;
  summary: string;
  isOpen: boolean;
  onPress: () => void;
};

function AccordionToggle({
  title,
  summary,
  isOpen,
  onPress,
}: AccordionToggleProps) {
  return (
    <Pressable onPress={onPress} style={styles.accordionHeader}>
      <View style={styles.accordionTitleBlock}>
        <Text style={styles.panelTitle}>{title}</Text>
        <Text style={styles.hint}>{summary}</Text>
      </View>
      <Chip
        compact
        style={isOpen ? styles.accordionChipOpen : styles.accordionChip}
        textStyle={
          isOpen ? styles.accordionChipOpenText : styles.accordionChipText
        }
      >
        {isOpen ? 'Cerrar' : 'Abrir'}
      </Chip>
    </Pressable>
  );
}

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
  const [pendingAuthorizations, setPendingAuthorizations] = useState<
    PendingAuthorization[]
  >([]);
  const [isPendingOpen, setIsPendingOpen] = useState(false);
  const [movements, setMovements] = useState<MovementsState>({
    pendingEntry: [],
    pendingExit: [],
  });
  const [isMovementsOpen, setIsMovementsOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState(
    'Buen dia, por favor confirmar autorizacion de ingreso.',
  );
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [residentDashboard, setResidentDashboard] =
    useState<ResidentDashboard | null>(null);
  const [residentVisitorName, setResidentVisitorName] = useState(
    'Visitante autorizado',
  );
  const [residentVisitorDocument, setResidentVisitorDocument] = useState('');
  const [residentVisitorType, setResidentVisitorType] = useState('invitado');
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
  const isPorterSession = Boolean(
    session && ['porter', 'admin', 'superadmin'].includes(session.role),
  );
  const isResidentSession = session?.role === 'resident';

  function showValidationError(text: string) {
    setNotice({ tone: 'error', text });
  }

  function confirmAction(title: string, message: string, action: () => void) {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(`${title}\n\n${message}`)) {
        action();
      }

      return;
    }

    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        style: 'default',
        onPress: action,
      },
    ]);
  }

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
        residentId: data.user.residentId ?? null,
      });
      setNotice({
        tone: 'success',
        text:
          data.user.role === 'resident'
            ? 'Sesion de residente iniciada.'
            : 'Sesion iniciada. Ya puedes buscar unidades.',
      });

      if (data.user.role === 'resident') {
        await loadResidentDashboard(data.token);
      }
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
    setChatHistory([]);
    setIsHistoryOpen(false);
    setPendingAuthorizations([]);
    setIsPendingOpen(false);
    setMovements({ pendingEntry: [], pendingExit: [] });
    setIsMovementsOpen(false);
    setResidentDashboard(null);
    setNotice({ tone: 'info', text: 'Sesion cerrada.' });
  }

  async function searchUnits() {
    if (!query.trim()) {
      showValidationError('Escribe un bloque o apartamento para buscar.');
      return;
    }

    setLoading(true);
    setSelectedSummary(null);
    setSelectedUnit(null);
    setHistoryItems([]);
    setChatHistory([]);
    setIsHistoryOpen(false);
    setPendingAuthorizations([]);
    setIsPendingOpen(false);
    setMovements({ pendingEntry: [], pendingExit: [] });
    setIsMovementsOpen(false);
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
    setChatHistory([]);
    setPendingAuthorizations([]);
    setMovements({ pendingEntry: [], pendingExit: [] });
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

  async function loadPendingAuthorizations() {
    setLoading(true);
    setNotice({ tone: 'info', text: 'Cargando ingresos pendientes...' });

    try {
      const data = await request<{ items: PendingAuthorization[] }>(
        '/api/porter/authorizations',
      );
      setPendingAuthorizations(data.items);
      setNotice({
        tone: 'success',
        text:
          data.items.length === 0
            ? 'No hay ingresos pendientes.'
            : `Ingresos pendientes: ${data.items.length}.`,
      });
    } catch (error) {
      setNotice({
        tone: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Error cargando ingresos pendientes.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function togglePendingAuthorizations() {
    const nextOpen = !isPendingOpen;
    setIsPendingOpen(nextOpen);

    if (nextOpen && pendingAuthorizations.length === 0) {
      await loadPendingAuthorizations();
    }
  }

  async function decideAuthorization(id: string, decision: 'approved' | 'rejected') {
    setLoading(true);
    setNotice({
      tone: 'info',
      text: decision === 'approved' ? 'Aprobando ingreso...' : 'Rechazando ingreso...',
    });

    try {
      const data = await request<{ message: string }>(
        `/api/porter/authorizations/${id}/decision`,
        {
          method: 'POST',
          body: JSON.stringify({ decision }),
        },
      );
      setNotice({ tone: 'success', text: data.message });
      await loadPendingAuthorizations();

      if (isMovementsOpen) {
        await loadMovements();
      }

      if (isHistoryOpen) {
        await loadHistory();
      }
    } catch (error) {
      setNotice({
        tone: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Error gestionando autorizacion.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadMovements() {
    setLoading(true);
    setNotice({ tone: 'info', text: 'Cargando entradas y salidas...' });

    try {
      const data = await request<MovementsState>('/api/porter/movements');
      setMovements(data);
      setNotice({
        tone: 'success',
        text: `Por entrar: ${data.pendingEntry.length}. Por salir: ${data.pendingExit.length}.`,
      });
    } catch (error) {
      setNotice({
        tone: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Error cargando movimientos.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function toggleMovements() {
    const nextOpen = !isMovementsOpen;
    setIsMovementsOpen(nextOpen);

    if (
      nextOpen &&
      movements.pendingEntry.length === 0 &&
      movements.pendingExit.length === 0
    ) {
      await loadMovements();
    }
  }

  async function registerMovement(
    authorizationId: string,
    movement: 'entry' | 'exit',
  ) {
    setLoading(true);
    setNotice({
      tone: 'info',
      text: movement === 'entry' ? 'Registrando entrada...' : 'Registrando salida...',
    });

    try {
      const data = await request<{ message: string }>(
        `/api/porter/movements/${authorizationId}/${movement}`,
        {
          method: 'POST',
          body: JSON.stringify({}),
        },
      );
      setNotice({ tone: 'success', text: data.message });
      await loadMovements();

      if (isHistoryOpen) {
        await loadHistory();
      }
    } catch (error) {
      setNotice({
        tone: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Error registrando movimiento.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function registerCall(
    status: 'initiated' | 'answered' | 'no_answer' | 'rejected',
  ) {
    if (!selectedUnit) {
      return;
    }

    setLoading(true);
    setNotice({ tone: 'info', text: 'Registrando llamada protegida...' });

    try {
      const data = await request<{
        call: { status: string; message: string };
      }>(`/api/porter/units/${selectedUnit.id}/calls`, {
        method: 'POST',
        body: JSON.stringify({
          status,
          notes: 'Registro manual desde app de porteria. Numero protegido.',
        }),
      });

      setNotice({ tone: 'success', text: data.call.message });

      if (isHistoryOpen) {
        await loadHistory();
      }
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

  async function sendMessage(sendMode: 'text' | 'template' = 'text') {
    if (!selectedUnit) {
      return;
    }

    if (!chatMessage.trim()) {
      showValidationError('Escribe un mensaje antes de enviarlo.');
      return;
    }

    setLoading(true);
    setNotice({ tone: 'info', text: 'Guardando mensaje interno...' });

    try {
      const data = await request<{
        thread: { message: string };
      }>(`/api/porter/units/${selectedUnit.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          message: chatMessage.trim(),
          sendMode,
        }),
      });

      setNotice({ tone: 'success', text: data.thread.message });
      await loadChatHistory();
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

  async function loadChatHistory() {
    if (!selectedUnit) {
      return;
    }

    setLoading(true);
    setNotice({ tone: 'info', text: 'Cargando chat protegido...' });

    try {
      const data = await request<{ messages: ChatHistoryItem[] }>(
        `/api/porter/units/${selectedUnit.id}/messages`,
      );
      setChatHistory(data.messages);
      setNotice({
        tone: 'success',
        text:
          data.messages.length === 0
            ? 'No hay mensajes para esta unidad.'
            : `Chat cargado: ${data.messages.length} mensaje(s).`,
      });
    } catch (error) {
      setNotice({
        tone: 'error',
        text:
          error instanceof Error ? error.message : 'Error cargando chat.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function registerVisitor() {
    if (!selectedUnit) {
      return;
    }

    if (!visitorName.trim()) {
      showValidationError('El nombre del visitante es obligatorio.');
      return;
    }

    if (!visitorDocument.trim()) {
      showValidationError('El documento del visitante es obligatorio.');
      return;
    }

    if (!visitorType.trim()) {
      showValidationError('El tipo de visitante es obligatorio.');
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
          fullName: visitorName.trim(),
          documentId: visitorDocument.trim(),
          phone: visitorPhone.trim(),
          visitorType: visitorType.trim(),
          reason: visitReason.trim(),
        }),
      });

      setNotice({
        tone: 'success',
        text: `${data.message} Estado: ${data.authorization.status}.`,
      });

      if (isPendingOpen) {
        await loadPendingAuthorizations();
      }
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

  async function loadResidentDashboard(tokenOverride?: string) {
    setLoading(true);
    setNotice({ tone: 'info', text: 'Cargando panel de residente...' });

    try {
      const response = await fetch(`${normalizedApiUrl}/api/resident/dashboard`, {
        headers: {
          Authorization: `Bearer ${tokenOverride ?? session?.token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'No se pudo cargar el panel de residente');
      }

      setResidentDashboard(data);
      setNotice({
        tone: 'success',
        text: `Panel de residente actualizado. Pendientes: ${data.pending.length}.`,
      });
    } catch (error) {
      setNotice({
        tone: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Error cargando panel de residente.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function decideResidentAuthorization(
    id: string,
    decision: 'approved' | 'rejected',
  ) {
    setLoading(true);
    setNotice({
      tone: 'info',
      text:
        decision === 'approved'
          ? 'Aprobando desde residente...'
          : 'Rechazando desde residente...',
    });

    try {
      const data = await request<{ message: string }>(
        `/api/resident/authorizations/${id}/decision`,
        {
          method: 'POST',
          body: JSON.stringify({ decision }),
        },
      );
      setNotice({ tone: 'success', text: data.message });
      await loadResidentDashboard();
    } catch (error) {
      setNotice({
        tone: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Error gestionando autorizacion.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function createResidentVisitor() {
    if (!residentVisitorName.trim()) {
      showValidationError('El nombre del visitante autorizado es obligatorio.');
      return;
    }

    if (!residentVisitorType.trim()) {
      showValidationError('El tipo de visitante autorizado es obligatorio.');
      return;
    }

    setLoading(true);
    setNotice({ tone: 'info', text: 'Creando visitante autorizado...' });

    try {
      const data = await request<{ message: string }>('/api/resident/visitors', {
        method: 'POST',
        body: JSON.stringify({
          fullName: residentVisitorName.trim(),
          documentId: residentVisitorDocument.trim(),
          visitorType: residentVisitorType.trim(),
        }),
      });
      setNotice({ tone: 'success', text: data.message });
      await loadResidentDashboard();
    } catch (error) {
      setNotice({
        tone: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Error creando visitante autorizado.',
      });
    } finally {
      setLoading(false);
    }
  }

  function formatChatTime(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.headerCard}>
          <Card.Content style={styles.headerCardContent}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>A</Text>
            </View>
            <View style={styles.brandTextBlock}>
              <Text style={styles.eyebrow}>Citofonia residencial</Text>
              <Text style={styles.title}>Arcadas de San Isidro</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Control de acceso, visitas y comunicacion protegida para porteria y
            residentes.
          </Text>
          <View style={styles.headerMetrics}>
            <View style={styles.metricTile}>
              <Text style={styles.metricValue}>300</Text>
              <Text style={styles.metricLabel}>Unidades</Text>
            </View>
            <View style={styles.metricTile}>
              <Text style={styles.metricValue}>15</Text>
              <Text style={styles.metricLabel}>Bloques</Text>
            </View>
            <View style={styles.metricTile}>
              <Text style={styles.metricValue}>
                {session ? session.role : 'Demo'}
              </Text>
              <Text style={styles.metricLabel}>Perfil</Text>
            </View>
          </View>
          </Card.Content>
        </Card>

        <View style={styles.utilityPanel}>
          <Text style={styles.label}>Conexion API</Text>
          <PaperTextInput
            autoCapitalize="none"
            autoCorrect={false}
            dense
            mode="outlined"
            onChangeText={setApiUrl}
            label="URL del backend"
            outlineStyle={styles.paperInputOutline}
            style={styles.paperInput}
            value={apiUrl}
          />
          <Text style={styles.hint}>
            En Expo Go con celular fisico usa la IP del computador en la misma
            red.
          </Text>
        </View>

        {!session ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Ingresar al sistema</Text>
            <Text style={styles.hint}>
              Usa tu perfil de porteria, administracion o residente.
            </Text>
            <PaperTextInput
              autoCapitalize="none"
              autoCorrect={false}
              dense
              mode="outlined"
              onChangeText={setUsername}
              label="Usuario"
              outlineStyle={styles.paperInputOutline}
              style={styles.paperInput}
              value={username}
            />
            <PaperTextInput
              autoCapitalize="none"
              autoCorrect={false}
              dense
              mode="outlined"
              onChangeText={setPassword}
              label="Contrasena"
              outlineStyle={styles.paperInputOutline}
              secureTextEntry
              style={styles.paperInput}
              value={password}
            />
            <ActionButton disabled={loading} label="Ingresar" onPress={login} />
            <Text style={styles.hint}>
              Usuarios de prueba: porteria / Porteria123* o residente / Residente123*
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
            <Chip compact style={styles.roleChip} textStyle={styles.roleChipText}>
              {session.role}
            </Chip>
            <ActionButton label="Salir" onPress={logout} tone="danger" />
          </View>
        )}

        <View style={[styles.notice, styles[`${notice.tone}Notice`]]}>
          <Text style={styles.noticeText}>{notice.text}</Text>
        </View>

        {isPorterSession ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Resumen de porteria</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{pendingAuthorizations.length}</Text>
                <Text style={styles.statLabel}>Pendientes</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{movements.pendingEntry.length}</Text>
                <Text style={styles.statLabel}>Por entrar</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{movements.pendingExit.length}</Text>
                <Text style={styles.statLabel}>Por salir</Text>
              </View>
            </View>
          </View>
        ) : null}

        {isResidentSession ? (
          <View style={styles.panel}>
            <Text style={styles.label}>Panel de residente</Text>
            <Text style={styles.selectedTitle}>
              {residentDashboard?.resident.unitLabel ?? 'Unidad residencial'}
            </Text>
            <Text style={styles.hint}>
              {residentDashboard?.resident.propertyName ?? 'Conjunto residencial'}
            </Text>

            <ActionButton
              disabled={loading}
              label="Actualizar panel"
              onPress={() => loadResidentDashboard()}
              tone="secondary"
            />

            <View style={styles.divider} />

            <Text style={styles.subsectionTitle}>Solicitudes pendientes</Text>
            {residentDashboard?.pending.length === 0 ? (
              <Text style={styles.hint}>No tienes solicitudes pendientes.</Text>
            ) : (
              residentDashboard?.pending.map((item) => (
                <View key={item.id} style={styles.pendingItem}>
                  <Text style={styles.historyType}>pendiente</Text>
                  <Text style={styles.historyTitle}>{item.visitorName}</Text>
                  <Text style={styles.historyMeta}>{item.visitorType}</Text>
                  <View style={styles.actionRow}>
                    <ActionButton
                      disabled={loading}
                      flex
                      label="Aprobar"
                      onPress={() =>
                        confirmAction(
                          'Aprobar solicitud',
                          `Autorizar ingreso de ${item.visitorName}?`,
                          () => void decideResidentAuthorization(item.id, 'approved'),
                        )
                      }
                      tone="success"
                    />
                    <ActionButton
                      disabled={loading}
                      flex
                      label="Rechazar"
                      onPress={() =>
                        confirmAction(
                          'Rechazar solicitud',
                          `Rechazar ingreso de ${item.visitorName}?`,
                          () => void decideResidentAuthorization(item.id, 'rejected'),
                        )
                      }
                      tone="danger"
                    />
                  </View>
                </View>
              ))
            )}

            <View style={styles.divider} />

            <Text style={styles.subsectionTitle}>Autorizar visitante</Text>
            <TextInput
              onChangeText={setResidentVisitorName}
              placeholder="Nombre del visitante"
              style={styles.input}
              value={residentVisitorName}
            />
            <TextInput
              onChangeText={setResidentVisitorDocument}
              placeholder="Documento"
              style={styles.input}
              value={residentVisitorDocument}
            />
            <TextInput
              onChangeText={setResidentVisitorType}
              placeholder="Tipo de visitante"
              style={styles.input}
              value={residentVisitorType}
            />
            <ActionButton
              disabled={loading}
              label="Crear autorizado"
              onPress={() =>
                confirmAction(
                  'Crear autorizado',
                  `Autorizar a ${residentVisitorName || 'este visitante'}?`,
                  () => void createResidentVisitor(),
                )
              }
              tone="warning"
            />

            <View style={styles.divider} />

            <Text style={styles.subsectionTitle}>Historial de tu unidad</Text>
            {residentDashboard?.history.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <Text style={styles.historyType}>{item.type}</Text>
                <Text style={styles.historyTitle}>{item.visitorName}</Text>
                <Text style={styles.historyMeta}>{item.status}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {isPorterSession ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Buscador de unidades</Text>
            <Text style={styles.hint}>Consulta por bloque, apartamento o combinacion.</Text>
            <View style={styles.searchRow}>
              <PaperTextInput
                autoCapitalize="characters"
                dense
                mode="outlined"
                onChangeText={setQuery}
                label="Bloque o apto"
                outlineStyle={styles.paperInputOutline}
                style={[styles.paperInput, styles.searchInput]}
                value={query}
              />
              <ActionButton
                compact
                disabled={loading}
                label="Buscar"
                onPress={searchUnits}
              />
            </View>

            {loading ? <ActivityIndicator color="#111827" /> : null}

            {selectedSummary ? (
              <View style={[styles.unitItem, styles.unitItemSelected]}>
                <Text style={styles.unitTitle}>{selectedSummary.displayLabel}</Text>
                <Text style={styles.unitMeta}>{selectedSummary.privacyLabel}</Text>
                <View style={styles.cardActionRow}>
                  <ActionButton
                    compact
                    label="Cambiar unidad"
                    onPress={clearSelectedUnit}
                    tone="secondary"
                  />
                </View>
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

        {isPorterSession ? (
          <View style={styles.panel}>
            <AccordionToggle
              isOpen={isMovementsOpen}
              onPress={toggleMovements}
              summary={
                isMovementsOpen
                  ? 'Control de visitantes aprobados y salidas abiertas.'
                  : 'Ver visitantes por entrar o por salir.'
              }
              title="Entradas y salidas"
            />

            {isMovementsOpen ? (
              <View style={styles.accordionBody}>
                <ActionButton
                  disabled={loading}
                  label="Actualizar movimientos"
                  onPress={loadMovements}
                  tone="secondary"
                />

                <Text style={styles.subsectionTitle}>Aprobados por entrar</Text>
                {movements.pendingEntry.length === 0 ? (
                  <Text style={styles.hint}>No hay visitantes pendientes de entrada.</Text>
                ) : (
                  movements.pendingEntry.map((item) => (
                    <View key={`entry-${item.authorizationId}`} style={styles.pendingItem}>
                      <Text style={styles.historyTitle}>{item.visitorName}</Text>
                      <Text style={styles.historyMeta}>
                        {item.unitLabel} - {item.visitorType}
                      </Text>
                      <View style={styles.cardActionRow}>
                        <ActionButton
                          disabled={loading}
                          label="Registrar entrada"
                          onPress={() =>
                            confirmAction(
                              'Registrar entrada',
                              `Confirmar entrada de ${item.visitorName}?`,
                              () => void registerMovement(item.authorizationId, 'entry'),
                            )
                          }
                          tone="success"
                        />
                      </View>
                    </View>
                  ))
                )}

                <Text style={styles.subsectionTitle}>Ingresados por salir</Text>
                {movements.pendingExit.length === 0 ? (
                  <Text style={styles.hint}>No hay visitantes pendientes de salida.</Text>
                ) : (
                  movements.pendingExit.map((item) => (
                    <View key={`exit-${item.authorizationId}`} style={styles.historyItem}>
                      <Text style={styles.historyTitle}>{item.visitorName}</Text>
                      <Text style={styles.historyMeta}>
                        {item.unitLabel} - {item.visitorType}
                      </Text>
                      <View style={styles.cardActionRow}>
                        <ActionButton
                          disabled={loading}
                          label="Registrar salida"
                          onPress={() =>
                            confirmAction(
                              'Registrar salida',
                              `Confirmar salida de ${item.visitorName}?`,
                              () => void registerMovement(item.authorizationId, 'exit'),
                            )
                          }
                          tone="danger"
                        />
                      </View>
                    </View>
                  ))
                )}
              </View>
            ) : null}
          </View>
        ) : null}

        {isPorterSession ? (
          <View style={styles.panel}>
            <AccordionToggle
              isOpen={isPendingOpen}
              onPress={togglePendingAuthorizations}
              summary={
                isPendingOpen
                  ? 'Solicitudes listas para decision de porteria.'
                  : 'Abrir autorizaciones pendientes.'
              }
              title="Ingresos pendientes"
            />

            {isPendingOpen ? (
              <View style={styles.accordionBody}>
                <ActionButton
                  disabled={loading}
                  label="Actualizar pendientes"
                  onPress={loadPendingAuthorizations}
                  tone="secondary"
                />

                {pendingAuthorizations.length === 0 ? (
                  <Text style={styles.hint}>
                    No hay solicitudes pendientes por gestionar.
                  </Text>
                ) : (
                  pendingAuthorizations.map((item) => (
                    <View key={item.id} style={styles.pendingItem}>
                      <Text style={styles.historyType}>pendiente</Text>
                      <Text style={styles.historyTitle}>{item.visitorName}</Text>
                      <Text style={styles.historyMeta}>
                        {item.unitLabel} - {item.visitorType}
                      </Text>
                      <View style={styles.actionRow}>
                        <ActionButton
                          disabled={loading}
                          flex
                          label="Aprobar"
                          onPress={() =>
                            confirmAction(
                              'Aprobar ingreso',
                              `Aprobar ingreso de ${item.visitorName} para ${item.unitLabel}?`,
                              () => void decideAuthorization(item.id, 'approved'),
                            )
                          }
                          tone="success"
                        />
                        <ActionButton
                          disabled={loading}
                          flex
                          label="Rechazar"
                          onPress={() =>
                            confirmAction(
                              'Rechazar ingreso',
                              `Rechazar ingreso de ${item.visitorName} para ${item.unitLabel}?`,
                              () => void decideAuthorization(item.id, 'rejected'),
                            )
                          }
                          tone="danger"
                        />
                      </View>
                    </View>
                  ))
                )}
              </View>
            ) : null}
          </View>
        ) : null}

        {isPorterSession ? (
          <View style={styles.panel}>
            <AccordionToggle
              isOpen={isHistoryOpen}
              onPress={toggleHistory}
              summary={
                isHistoryOpen
                  ? 'Trazabilidad visible del turno.'
                  : 'Consultar eventos recientes.'
              }
              title="Historial reciente"
            />

            {isHistoryOpen ? (
              <View style={styles.accordionBody}>
                <ActionButton
                  disabled={loading}
                  label="Actualizar historial"
                  onPress={loadHistory}
                  tone="secondary"
                />

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

        {isPorterSession && selectedUnit ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Unidad seleccionada</Text>
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

            <Text style={styles.subsectionTitle}>Registro de llamada</Text>
            <View style={styles.callGrid}>
              <ActionButton
                disabled={loading || !selectedUnit.canCall}
                flex
                label="Iniciada"
                onPress={() =>
                  confirmAction(
                    'Registrar llamada',
                    'Marcar llamada como iniciada?',
                    () => void registerCall('initiated'),
                  )
                }
              />
              <ActionButton
                disabled={loading || !selectedUnit.canCall}
                flex
                label="Contestada"
                onPress={() =>
                  confirmAction(
                    'Registrar llamada',
                    'Marcar llamada como contestada?',
                    () => void registerCall('answered'),
                  )
                }
                tone="success"
              />
              <ActionButton
                disabled={loading || !selectedUnit.canCall}
                flex
                label="No contesta"
                onPress={() =>
                  confirmAction(
                    'Registrar llamada',
                    'Marcar llamada como no contestada?',
                    () => void registerCall('no_answer'),
                  )
                }
                tone="secondary"
              />
              <ActionButton
                disabled={loading || !selectedUnit.canCall}
                flex
                label="Rechazada"
                onPress={() =>
                  confirmAction(
                    'Registrar llamada',
                    'Marcar llamada como rechazada?',
                    () => void registerCall('rejected'),
                  )
                }
                tone="danger"
              />
            </View>

            <View style={styles.divider} />

            <Text style={styles.panelTitle}>Registro de visitante</Text>
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
            <ActionButton
              disabled={loading}
              label="Registrar visitante pendiente"
              onPress={() =>
                confirmAction(
                  'Registrar visitante',
                  `Crear solicitud pendiente para ${visitorName || 'este visitante'}?`,
                  () => void registerVisitor(),
                )
              }
              tone="warning"
            />

            <View style={styles.divider} />

            <View style={styles.chatShell}>
              <View style={styles.chatHeader}>
                <View style={styles.chatAvatar}>
                  <Text style={styles.chatAvatarText}>R</Text>
                </View>
                <View style={styles.chatHeaderText}>
                  <Text style={styles.chatTitle}>Chat con residente</Text>
                  <Text style={styles.chatSubtitle}>
                    {selectedUnit.displayLabel} - numero protegido
                  </Text>
                </View>
                <Chip compact style={styles.chatStatusChip} textStyle={styles.chatStatusText}>
                  Seguro
                </Chip>
              </View>

              <View style={styles.chatTimeline}>
                {chatHistory.length === 0 ? (
                  <View style={styles.emptyChat}>
                    <Text style={styles.emptyChatTitle}>Sin mensajes cargados</Text>
                    <Text style={styles.emptyChatText}>
                      Carga el historial o envia el primer mensaje protegido.
                    </Text>
                  </View>
                ) : (
                  [...chatHistory].reverse().map((item) => {
                    const isOutbound = item.direction === 'outbound';

                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.chatMessageRow,
                          isOutbound
                            ? styles.chatMessageRowOutbound
                            : styles.chatMessageRowInbound,
                        ]}
                      >
                        <View
                          style={[
                            styles.chatBubble,
                            isOutbound ? styles.chatBubbleOutbound : styles.chatBubbleInbound,
                          ]}
                        >
                          <Text
                            style={[
                              styles.chatBubbleText,
                              isOutbound
                                ? styles.chatBubbleTextOutbound
                                : styles.chatBubbleTextInbound,
                            ]}
                          >
                            {item.body}
                          </Text>
                          <View style={styles.chatBubbleFooter}>
                            <Text
                              style={[
                                styles.chatTime,
                                isOutbound
                                  ? styles.chatTimeOutbound
                                  : styles.chatTimeInbound,
                              ]}
                            >
                              {formatChatTime(item.sentAt)}
                            </Text>
                            {isOutbound ? (
                              <Text style={styles.chatCheck}>✓✓</Text>
                            ) : null}
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>

              <View style={styles.chatComposer}>
                <TextInput
                  multiline
                  onChangeText={setChatMessage}
                  placeholder="Escribe un mensaje..."
                  style={styles.chatInput}
                  value={chatMessage}
                />
                <ActionButton
                  disabled={loading || !selectedUnit.canChat}
                  label="Texto"
                  onPress={() => void sendMessage('text')}
                />
              </View>

              <ActionButton
                disabled={loading || !selectedUnit.canChat}
                label="Enviar plantilla WhatsApp"
                onPress={() => void sendMessage('template')}
                tone="warning"
              />
              <ActionButton
                disabled={loading || !selectedUnit.canChat}
                label="Cargar historial del chat"
                onPress={loadChatHistory}
                tone="secondary"
              />
            </View>
          </View>
        ) : null}
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  content: {
    alignSelf: 'center',
    maxWidth: 1120,
    padding: 16,
    paddingBottom: 36,
    width: '100%',
  },
  headerCard: {
    backgroundColor: palette.navy,
    borderRadius: 8,
    marginBottom: 14,
    marginTop: 8,
    shadowColor: '#0f172a',
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  headerCardContent: {
    gap: 14,
    padding: 18,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  brandMarkText: {
    color: palette.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  brandTextBlock: {
    flex: 1,
  },
  eyebrow: {
    color: '#bde7e3',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 25,
    fontWeight: '900',
  },
  subtitle: {
    color: '#dce7f3',
    fontSize: 14,
    lineHeight: 21,
  },
  headerMetrics: {
    flexDirection: 'row',
    gap: 8,
  },
  metricTile: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    padding: 10,
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },
  metricLabel: {
    color: '#b9c8da',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  panel: {
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#102033',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  utilityPanel: {
    backgroundColor: '#f8fbfd',
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    marginBottom: 12,
    padding: 14,
  },
  panelTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  accordionHeader: {
    alignItems: 'center',
    backgroundColor: palette.surfaceMuted,
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    padding: 12,
  },
  accordionTitleBlock: {
    flex: 1,
  },
  accordionBody: {
    gap: 10,
  },
  accordionIcon: {
    color: palette.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  accordionChip: {
    backgroundColor: '#e6f3f2',
  },
  accordionChipText: {
    color: palette.primaryDark,
    fontSize: 12,
    fontWeight: '900',
  },
  accordionChipOpen: {
    backgroundColor: '#eef2ff',
  },
  accordionChipOpenText: {
    color: palette.navy,
    fontSize: 12,
    fontWeight: '900',
  },
  sessionBar: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: 16,
  },
  roleChip: {
    backgroundColor: '#ccfbf1',
  },
  roleChipText: {
    color: palette.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  sessionLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  sessionUser: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  logoutText: {
    color: palette.red,
    fontSize: 14,
    fontWeight: '900',
  },
  label: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: palette.surfaceMuted,
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    color: palette.ink,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  paperInput: {
    backgroundColor: palette.surface,
    fontSize: 15,
  },
  paperInputOutline: {
    borderColor: palette.line,
    borderRadius: 8,
  },
  hint: {
    color: palette.muted,
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
  searchButton: {
    alignSelf: 'stretch',
    borderRadius: 8,
    justifyContent: 'center',
  },
  paperButton: {
    borderRadius: 8,
  },
  actionButton: {
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 44,
  },
  actionButtonFlex: {
    flex: 1,
    minWidth: '47%',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  cardActionRow: {
    alignItems: 'flex-start',
    marginTop: 12,
  },
  smallButton: {
    alignItems: 'center',
    backgroundColor: palette.primary,
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
    marginBottom: 12,
    padding: 12,
  },
  infoNotice: {
    backgroundColor: '#ecfeff',
    borderColor: '#a5f3fc',
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
    color: palette.ink,
    fontSize: 14,
    lineHeight: 20,
  },
  unitItem: {
    backgroundColor: palette.surfaceMuted,
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    padding: 14,
  },
  unitItemSelected: {
    borderColor: palette.primary,
    backgroundColor: '#ecfdf5',
  },
  unitTitle: {
    color: palette.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  unitMeta: {
    color: palette.muted,
    fontSize: 14,
    marginTop: 4,
  },
  selectedTitle: {
    color: palette.ink,
    fontSize: 24,
    fontWeight: '900',
  },
  privacy: {
    backgroundColor: '#fff7ed',
    borderRadius: 8,
    color: '#7c2d12',
    fontSize: 14,
    lineHeight: 20,
    padding: 12,
  },
  divider: {
    backgroundColor: palette.line,
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
    backgroundColor: '#ccfbf1',
    borderRadius: 8,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineButtonText: {
    color: palette.primaryDark,
    fontSize: 14,
    fontWeight: '900',
  },
  historyItem: {
    backgroundColor: palette.surfaceMuted,
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  pendingItem: {
    backgroundColor: '#fffbeb',
    borderColor: '#fcd34d',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  historyType: {
    color: palette.blue,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  historyTitle: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },
  historyMeta: {
    color: palette.muted,
    fontSize: 14,
    marginTop: 3,
  },
  subsectionTitle: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 4,
  },
  decisionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  decisionButton: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: palette.green,
  },
  successButton: {
    backgroundColor: palette.green,
  },
  rejectButton: {
    backgroundColor: '#ffffff',
    borderColor: '#fecaca',
    borderWidth: 1,
  },
  decisionButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  rejectButtonText: {
    color: palette.red,
    fontSize: 15,
    fontWeight: '900',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  callGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  callButton: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: '47%',
    paddingHorizontal: 10,
  },
  statBox: {
    backgroundColor: palette.surfaceMuted,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: 8,
    flex: 1,
    padding: 12,
  },
  statValue: {
    color: palette.ink,
    fontSize: 24,
    fontWeight: '900',
  },
  statLabel: {
    color: palette.muted,
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
    backgroundColor: palette.primary,
  },
  secondaryButton: {
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderWidth: 1,
  },
  warningButton: {
    backgroundColor: palette.amber,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButtonText: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  warningButtonText: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  messageInput: {
    minHeight: 94,
    textAlignVertical: 'top',
  },
  chatShell: {
    backgroundColor: '#e7f0ea',
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  chatHeader: {
    alignItems: 'center',
    backgroundColor: palette.primaryDark,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  chatAvatar: {
    alignItems: 'center',
    backgroundColor: '#ccfbf1',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  chatAvatarText: {
    color: palette.primaryDark,
    fontSize: 16,
    fontWeight: '900',
  },
  chatHeaderText: {
    flex: 1,
  },
  chatTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  chatSubtitle: {
    color: '#bde7e3',
    fontSize: 12,
    marginTop: 1,
  },
  chatStatusChip: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  chatStatusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  chatTimeline: {
    gap: 8,
    minHeight: 220,
    padding: 12,
  },
  emptyChat: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 170,
    padding: 18,
  },
  emptyChatTitle: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  emptyChatText: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
    textAlign: 'center',
  },
  chatMessageRow: {
    flexDirection: 'row',
  },
  chatMessageRowInbound: {
    justifyContent: 'flex-start',
  },
  chatMessageRowOutbound: {
    justifyContent: 'flex-end',
  },
  chatBubble: {
    borderRadius: 8,
    maxWidth: '82%',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chatBubbleInbound: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 2,
  },
  chatBubbleOutbound: {
    backgroundColor: '#d9fdd3',
    borderTopRightRadius: 2,
  },
  chatBubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  chatBubbleTextInbound: {
    color: palette.ink,
  },
  chatBubbleTextOutbound: {
    color: '#14351f',
  },
  chatBubbleFooter: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    flexDirection: 'row',
    gap: 4,
    marginTop: 3,
  },
  chatTime: {
    fontSize: 10,
    fontWeight: '700',
  },
  chatTimeInbound: {
    color: palette.muted,
  },
  chatTimeOutbound: {
    color: '#4d7c54',
  },
  chatCheck: {
    color: '#34b7f1',
    fontSize: 11,
    fontWeight: '900',
  },
  chatComposer: {
    alignItems: 'flex-end',
    backgroundColor: '#f0f2f5',
    borderTopColor: 'rgba(15, 23, 42, 0.08)',
    borderRadius: 8,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    margin: 10,
    padding: 8,
  },
  chatInput: {
    backgroundColor: '#ffffff',
    borderColor: '#d7dde5',
    borderRadius: 8,
    borderWidth: 1,
    color: palette.ink,
    flex: 1,
    fontSize: 15,
    maxHeight: 110,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  chatSendButton: {
    alignItems: 'center',
    backgroundColor: palette.primary,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  chatSendText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
});
