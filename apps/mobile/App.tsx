import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import {
  Poppins_300Light,
  Poppins_500Medium,
  Poppins_900Black,
} from '@expo-google-fonts/poppins';
import { useState } from 'react';
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

  return 'http://192.168.80.27:3000';
}

const DEFAULT_API_URL = getDefaultApiUrl();

const appFonts = {
  light: 'Poppins_300Light',
  medium: 'Poppins_500Medium',
  black: 'Poppins_900Black',
};

const palette = {
  bg: '#ffffff',
  surface: '#ffffff',
  surfaceMuted: '#f6faff',
  ink: '#08214a',
  muted: '#4d6280',
  line: '#dce8f5',
  primary: '#1877f2',
  primaryDark: '#0b4fb3',
  navy: '#08214a',
  amber: '#f6b440',
  green: '#22a06b',
  red: '#dc2626',
  blue: '#1877f2',
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
  fonts: {
    ...MD3LightTheme.fonts,
    bodyLarge: { ...MD3LightTheme.fonts.bodyLarge, fontFamily: appFonts.medium },
    bodyMedium: { ...MD3LightTheme.fonts.bodyMedium, fontFamily: appFonts.medium },
    labelLarge: { ...MD3LightTheme.fonts.labelLarge, fontFamily: appFonts.medium },
    labelMedium: { ...MD3LightTheme.fonts.labelMedium, fontFamily: appFonts.medium },
    titleLarge: { ...MD3LightTheme.fonts.titleLarge, fontFamily: appFonts.black },
    titleMedium: { ...MD3LightTheme.fonts.titleMedium, fontFamily: appFonts.medium },
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

type IconName = keyof typeof Ionicons.glyphMap;

type IconBadgeProps = {
  name: IconName;
  tone?: 'blue' | 'green' | 'amber' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
};

type ShortcutCardProps = {
  icon: IconName;
  title: string;
  description: string;
  tone?: 'blue' | 'green' | 'amber' | 'neutral';
  onPress?: () => void;
};

type RoleOverviewViewProps = {
  title: string;
  eyebrow: string;
  description: string;
  badge: string;
  icon: IconName;
  stats: Array<{
    icon: IconName;
    label: string;
    tone?: 'blue' | 'green' | 'amber' | 'neutral';
    value: string;
  }>;
  shortcuts: Array<{
    description: string;
    icon: IconName;
    title: string;
    tone?: 'blue' | 'green' | 'amber' | 'neutral';
  }>;
};

type AdminTab = 'home' | 'admin' | 'settings';
type PorterView =
  | 'home'
  | 'search'
  | 'unit'
  | 'visitors'
  | 'calls'
  | 'messages'
  | 'movements'
  | 'pending'
  | 'history';

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

function IconBadge({ name, tone = 'blue', size = 'md' }: IconBadgeProps) {
  const sizeStyle =
    size === 'lg'
      ? styles.iconBadgeLarge
      : size === 'sm'
        ? styles.iconBadgeSmall
        : null;

  const iconSize = size === 'lg' ? 34 : size === 'sm' ? 18 : 24;

  return (
    <View style={[styles.iconBadge, styles[`${tone}IconBadge`], sizeStyle]}>
      <Ionicons
        color={
          tone === 'green'
            ? palette.green
            : tone === 'amber'
              ? '#b7791f'
              : tone === 'neutral'
                ? palette.muted
                : palette.primary
        }
        name={name}
        size={iconSize}
      />
    </View>
  );
}

function ShortcutCard({
  icon,
  title,
  description,
  tone = 'blue',
  onPress,
}: ShortcutCardProps) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={styles.shortcutCard}
    >
      <IconBadge name={icon} tone={tone} />
      <View style={styles.shortcutTextBlock}>
        <Text style={styles.shortcutTitle}>{title}</Text>
        <Text style={styles.shortcutDescription}>{description}</Text>
      </View>
      {onPress ? (
        <Ionicons color={palette.primary} name="chevron-forward" size={18} />
      ) : null}
    </Pressable>
  );
}

function RoleOverviewView({
  title,
  eyebrow,
  description,
  badge,
  icon,
  stats,
  shortcuts,
}: RoleOverviewViewProps) {
  return (
    <View style={styles.roleView}>
      <View style={styles.panel}>
        <View style={styles.panelHeadingRow}>
          <View style={styles.panelHeadingText}>
            <Text style={styles.label}>{eyebrow}</Text>
            <Text style={styles.selectedTitle}>{title}</Text>
            <Text style={styles.hint}>{description}</Text>
          </View>
          <IconBadge name={icon} size="lg" />
        </View>
        <Chip compact style={styles.roleChip} textStyle={styles.roleChipText}>
          {badge}
        </Chip>

        <View style={styles.statsRow}>
          {stats.map((item) => (
            <View key={`${title}-${item.label}`} style={styles.statBox}>
              <IconBadge name={item.icon} size="sm" tone={item.tone ?? 'blue'} />
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.shortcutGrid}>
          {shortcuts.map((item) => (
            <ShortcutCard
              key={`${title}-${item.title}`}
              description={item.description}
              icon={item.icon}
              title={item.title}
              tone={item.tone}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function SuperAdminView() {
  return (
    <RoleOverviewView
      badge="Super Admin"
      description="Vista independiente para controlar la plataforma y preparar la gestion de conjuntos."
      eyebrow="Panel principal"
      icon="shield-checkmark-outline"
      shortcuts={[
        {
          description: 'Administrar conjuntos y configuraciones generales.',
          icon: 'business-outline',
          title: 'Conjuntos',
        },
        {
          description: 'Gestionar administradores, porteria y residentes.',
          icon: 'people-outline',
          title: 'Usuarios',
        },
        {
          description: 'Consultar actividad global del sistema.',
          icon: 'bar-chart-outline',
          title: 'Reportes',
          tone: 'neutral',
        },
      ]}
      stats={[
        { icon: 'business-outline', label: 'Conjuntos', value: '1' },
        { icon: 'people-outline', label: 'Usuarios', value: 'Base' },
        { icon: 'pulse-outline', label: 'Sistema', tone: 'green', value: 'OK' },
      ]}
      title="Super Admin"
    />
  );
}

function AdminView() {
  return (
    <RoleOverviewView
      badge="Admin"
      description="Vista independiente para administrar Arcadas de San Isidro."
      eyebrow="Administracion"
      icon="business-outline"
      shortcuts={[
        {
          description: 'Gestiona la informacion de los residentes.',
          icon: 'people-outline',
          title: 'Residentes',
        },
        {
          description: 'Administra bloques, apartamentos y contactos.',
          icon: 'business-outline',
          title: 'Apartamentos',
        },
        {
          description: 'Consulta actividad y reportes del conjunto.',
          icon: 'bar-chart-outline',
          title: 'Reportes',
          tone: 'neutral',
        },
      ]}
      stats={[
        { icon: 'people-outline', label: 'Residentes', value: '300' },
        { icon: 'business-outline', label: 'Unidades', value: '300' },
        { icon: 'mail-outline', label: 'Invitaciones', tone: 'green', value: 'Hoy' },
      ]}
      title="Administracion"
    />
  );
}

function AdminHomeView() {
  return (
    <View style={styles.roleView}>
      <View style={styles.panel}>
        <View style={styles.panelHeadingRow}>
          <View style={styles.panelHeadingText}>
            <Text style={styles.label}>Conjunto residencial</Text>
            <Text style={styles.selectedTitle}>Arcadas de San Isidro</Text>
            <Text style={styles.hint}>
              Panel general de ocupacion, accesos y actividad del dia.
            </Text>
          </View>
          <IconBadge name="business-outline" size="lg" />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <IconBadge name="business-outline" size="sm" />
            <Text style={styles.statValue}>300</Text>
            <Text style={styles.statLabel}>Unidades</Text>
          </View>
          <View style={styles.statBox}>
            <IconBadge name="layers-outline" size="sm" tone="neutral" />
            <Text style={styles.statValue}>15</Text>
            <Text style={styles.statLabel}>Bloques</Text>
          </View>
          <View style={styles.statBox}>
            <IconBadge name="shield-checkmark-outline" size="sm" tone="green" />
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Porterias</Text>
          </View>
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeadingRow}>
          <View>
            <Text style={styles.panelTitle}>Visitantes</Text>
            <Text style={styles.hint}>Resumen compacto del flujo de acceso.</Text>
          </View>
          <Chip compact style={styles.roleChip} textStyle={styles.roleChipText}>
            Hoy
          </Chip>
        </View>

        <View style={styles.adminVisitorGrid}>
          <View style={styles.adminVisitorCard}>
            <IconBadge name="walk-outline" size="sm" tone="green" />
            <Text style={styles.adminVisitorValue}>12</Text>
            <Text style={styles.adminVisitorLabel}>Activos dentro</Text>
          </View>
          <View style={styles.adminVisitorCard}>
            <IconBadge name="time-outline" size="sm" tone="amber" />
            <Text style={styles.adminVisitorValue}>6</Text>
            <Text style={styles.adminVisitorLabel}>Pendientes residente</Text>
          </View>
          <View style={styles.adminVisitorCard}>
            <IconBadge name="id-card-outline" size="sm" />
            <Text style={styles.adminVisitorValue}>4</Text>
            <Text style={styles.adminVisitorLabel}>Pendientes porteria</Text>
          </View>
        </View>

        <View style={styles.porterSummaryList}>
          <View style={styles.porterSummaryItem}>
            <Text style={styles.porterSummaryName}>Porteria Principal</Text>
            <Text style={styles.porterSummaryMeta}>7 activos - 2 pendientes</Text>
          </View>
          <View style={styles.porterSummaryItem}>
            <Text style={styles.porterSummaryName}>Porteria Parqueadero</Text>
            <Text style={styles.porterSummaryMeta}>3 activos - 1 pendiente</Text>
          </View>
          <View style={styles.porterSummaryItem}>
            <Text style={styles.porterSummaryName}>Porteria Peatonal</Text>
            <Text style={styles.porterSummaryMeta}>2 activos - 1 pendiente</Text>
          </View>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Acciones rapidas</Text>
        <View style={styles.shortcutGrid}>
          <ShortcutCard
            description="Revisar solicitudes y movimientos del dia."
            icon="clipboard-outline"
            title="Control de accesos"
            tone="green"
          />
          <ShortcutCard
            description="Consultar residentes, apartamentos y reportes."
            icon="bar-chart-outline"
            title="Resumen administrativo"
          />
        </View>
      </View>
    </View>
  );
}

function AdminSettingsView() {
  return (
    <RoleOverviewView
      badge="Ajustes"
      description="Vista independiente para configuraciones futuras de administracion."
      eyebrow="Configuracion"
      icon="settings-outline"
      shortcuts={[
        {
          description: 'Gestionar preferencias del conjunto.',
          icon: 'options-outline',
          title: 'Preferencias',
          tone: 'neutral',
        },
        {
          description: 'Preparar cambios de usuarios y permisos.',
          icon: 'key-outline',
          title: 'Seguridad',
        },
      ]}
      stats={[
        { icon: 'shield-checkmark-outline', label: 'Estado', tone: 'green', value: 'OK' },
        { icon: 'people-outline', label: 'Roles', value: '4' },
        { icon: 'settings-outline', label: 'Modulo', tone: 'neutral', value: 'Base' },
      ]}
      title="Ajustes"
    />
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
  const [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_500Medium,
    Poppins_900Black,
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('home');
  const [activePorterView, setActivePorterView] =
    useState<PorterView>('home');
  const [session, setSession] = useState<UserSession | null>(null);
  const [query, setQuery] = useState('');
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

  const normalizedApiUrl = DEFAULT_API_URL.replace(/\/$/, '');
  const isSuperAdminSession = session?.role === 'superadmin';
  const isAdminSession = session?.role === 'admin';
  const isPorterSession = session?.role === 'porter';
  const isResidentSession = session?.role === 'resident';
  const selectedUnitActiveVisits = selectedUnit
    ? movements.pendingExit.filter(
        (item) => item.unitLabel === selectedUnit.displayLabel,
      )
    : [];
  const selectedUnitPendingAuthorizations = selectedUnit
    ? pendingAuthorizations.filter(
        (item) => item.unitLabel === selectedUnit.displayLabel,
      )
    : [];

  if (!fontsLoaded) {
    return (
      <PaperProvider theme={paperTheme}>
        <SafeAreaView style={[styles.screen, styles.loginScreen]}>
          <ActivityIndicator color={palette.primary} />
        </SafeAreaView>
      </PaperProvider>
    );
  }

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
    if (!username.trim() || !password.trim()) {
      showValidationError('Escribe usuario y contraseña para ingresar.');
      return;
    }

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
      setActiveAdminTab('home');
      setActivePorterView('home');
      setNotice({
        tone: 'info',
        text: '',
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
    setActiveAdminTab('home');
    setActivePorterView('home');
    setNotice({ tone: 'info', text: 'Sesion cerrada.' });
  }

  async function searchUnits(overrideQuery?: string) {
    const searchText = overrideQuery ?? query;

    setLoading(true);
    setActivePorterView('search');
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
      const searchQuery = encodeURIComponent(searchText.trim());
      const data = await request<{ units: UnitSearchResult[] }>(
        `/api/porter/units?query=${searchQuery}`,
      );

      setUnits(data.units);
      setNotice({
        tone: 'success',
        text:
          data.units.length === 0
            ? 'No encontramos unidades con ese criterio.'
            : searchText.trim()
              ? `Encontramos ${data.units.length} resultado(s).`
              : `Listado de unidades cargado: ${data.units.length}.`,
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
      const [movementData, pendingData] = await Promise.all([
        request<MovementsState>('/api/porter/movements'),
        request<{ items: PendingAuthorization[] }>('/api/porter/authorizations'),
      ]);
      setSelectedUnit(data.unit);
      setMovements(movementData);
      setPendingAuthorizations(pendingData.items);
      setActivePorterView('unit');
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
    setActivePorterView('search');
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
      <SafeAreaView style={[styles.screen, !session ? styles.loginScreen : null]}>
        <StatusBar style="dark" />
        {session ? (
          <View style={styles.sessionBar}>
            <View style={styles.sessionIdentity}>
              <IconBadge
                name={
                  isResidentSession
                    ? 'home-outline'
                    : isPorterSession
                      ? 'business-outline'
                      : 'shield-checkmark-outline'
                }
                size="sm"
              />
              <View>
                <Text style={styles.sessionLabel}>
                  {isResidentSession
                    ? 'Mi hogar'
                    : isPorterSession
                      ? 'Porteria'
                      : isAdminSession
                        ? 'Administracion'
                        : 'Super Admin'}
                </Text>
                <Text style={styles.sessionUser}>
                  {session.username} - {session.role}
                </Text>
              </View>
            </View>
            <Ionicons color="#ffffff" name="notifications-outline" size={20} />
            <ActionButton label="Salir" onPress={logout} tone="danger" />
          </View>
        ) : null}
        <ScrollView
          contentContainerStyle={[
            styles.content,
            !session ? styles.loginContent : null,
          ]}
        >
        {!session ? (
          <View style={styles.loginShell}>
            <View style={styles.loginBrandBlock}>
              <IconBadge name="business-outline" size="lg" />
              <Text style={styles.loginTitleLarge}>Citofonia</Text>
              <Text style={styles.loginBrand}>ARCADAS DE SAN ISIDRO</Text>
              <View style={styles.loginDivider} />
            </View>
            <Text style={styles.loginTitle}>Inicio de sesion</Text>
            <PaperTextInput
              autoCapitalize="none"
              autoCorrect={false}
              dense
              mode="outlined"
              onChangeText={setUsername}
              activeOutlineColor={palette.primary}
              label="Usuario"
              outlineColor={palette.line}
              outlineStyle={styles.loginInputOutline}
              placeholder="Usuario"
              style={styles.loginInput}
              value={username}
            />
            <PaperTextInput
              autoCapitalize="none"
              autoCorrect={false}
              dense
              mode="outlined"
              onChangeText={setPassword}
              activeOutlineColor={palette.primary}
              label="Contraseña"
              outlineColor={palette.line}
              outlineStyle={styles.loginInputOutline}
              placeholder="Contraseña"
              secureTextEntry
              style={styles.loginInput}
              value={password}
            />
            <Pressable
              onPress={() => setRememberMe((current) => !current)}
              style={styles.rememberRow}
            >
              <View
                style={[
                  styles.rememberBox,
                  rememberMe ? styles.rememberBoxActive : null,
                ]}
              >
                {rememberMe ? (
                  <Ionicons color="#ffffff" name="checkmark" size={14} />
                ) : null}
              </View>
              <Text style={styles.rememberText}>Recordarme</Text>
            </Pressable>
            <PaperButton
              disabled={loading}
              mode="contained"
              onPress={login}
              buttonColor={palette.primary}
              textColor="#ffffff"
              style={styles.loginButton}
            >
              Ingresar
            </PaperButton>
            {loading ? <ActivityIndicator color={palette.primary} /> : null}
            {notice.tone === 'error' ? (
              <View style={[styles.notice, styles.errorNotice]}>
                <Text style={styles.noticeText}>{notice.text}</Text>
              </View>
            ) : null}
            <View style={styles.loginIllustration}>
              <View style={styles.buildingSmall}>
                <View style={styles.windowGrid}>
                  <View style={styles.windowDot} />
                  <View style={styles.windowDot} />
                  <View style={styles.windowDot} />
                  <View style={styles.windowDot} />
                </View>
              </View>
              <View style={styles.buildingGate}>
                <Ionicons color="#b7cff0" name="business-outline" size={42} />
              </View>
              <View style={styles.buildingTall}>
                <View style={styles.windowGridTall}>
                  <View style={styles.windowLine} />
                  <View style={styles.windowLine} />
                  <View style={styles.windowLine} />
                  <View style={styles.windowLine} />
                </View>
              </View>
            </View>
            <View style={styles.secureConnection}>
              <Ionicons color={palette.green} name="shield-checkmark" size={18} />
              <Text style={styles.secureConnectionText}>Conexión segura</Text>
            </View>
          </View>
        ) : null}

        {session && notice.text && notice.tone === 'error' ? (
          <View style={[styles.notice, styles[`${notice.tone}Notice`]]}>
            <Text style={styles.noticeText}>{notice.text}</Text>
          </View>
        ) : null}

        {isSuperAdminSession ? <SuperAdminView /> : null}

        {isAdminSession && activeAdminTab === 'home' ? <AdminHomeView /> : null}

        {isAdminSession && activeAdminTab === 'admin' ? <AdminView /> : null}

        {isAdminSession && activeAdminTab === 'settings' ? (
          <AdminSettingsView />
        ) : null}

        {isPorterSession && activePorterView === 'home' ? (
          <View style={styles.panel}>
            <View style={styles.panelHeadingRow}>
              <View>
                <Text style={styles.panelTitle}>Porteria</Text>
                <Text style={styles.hint}>Operacion del turno actual</Text>
              </View>
              <Chip compact style={styles.roleChip} textStyle={styles.roleChipText}>
                En servicio
              </Chip>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <IconBadge name="person-add-outline" size="sm" tone="green" />
                <Text style={styles.statValue}>{pendingAuthorizations.length}</Text>
                <Text style={styles.statLabel}>Pendientes</Text>
              </View>
              <View style={styles.statBox}>
                <IconBadge name="log-in-outline" size="sm" />
                <Text style={styles.statValue}>{movements.pendingEntry.length}</Text>
                <Text style={styles.statLabel}>Por entrar</Text>
              </View>
              <View style={styles.statBox}>
                <IconBadge name="log-out-outline" size="sm" tone="amber" />
                <Text style={styles.statValue}>{movements.pendingExit.length}</Text>
                <Text style={styles.statLabel}>Por salir</Text>
              </View>
            </View>
            <View style={styles.shortcutGrid}>
              <ActionButton
                label="BUSCAR UNIDAD"
                onPress={() => {
                  setActivePorterView('search');
                  if (units.length === 0) {
                    void searchUnits();
                  }
                }}
              />
              <ShortcutCard
                description="Busca apartamentos y contacta residentes."
                icon="search-outline"
                onPress={() => {
                  setActivePorterView('search');
                  if (units.length === 0) {
                    void searchUnits();
                  }
                }}
                title="Buscar unidad"
              />
              <ShortcutCard
                description="Consulta registros recientes."
                icon="time-outline"
                onPress={() => {
                  setActivePorterView('history');
                  setIsHistoryOpen(true);
                  if (historyItems.length === 0) {
                    void loadHistory();
                  }
                }}
                title="Historial"
                tone="neutral"
              />
              <ShortcutCard
                description="Controla visitantes aprobados y salidas."
                icon="log-in-outline"
                onPress={() => {
                  setActivePorterView('movements');
                  setIsMovementsOpen(true);
                  void loadMovements();
                }}
                title="Entradas y salidas"
                tone="green"
              />
              <ShortcutCard
                description="Aprobar o rechazar ingresos pendientes."
                icon="id-card-outline"
                onPress={() => {
                  setActivePorterView('pending');
                  setIsPendingOpen(true);
                  void loadPendingAuthorizations();
                }}
                title="Ingresos pendientes"
                tone="amber"
              />
            </View>
          </View>
        ) : null}

        {isResidentSession ? (
          <View style={styles.panel}>
            <View style={styles.panelHeadingRow}>
              <View style={styles.panelHeadingText}>
                <Text style={styles.label}>Mi hogar</Text>
                <Text style={styles.selectedTitle}>
                  {residentDashboard?.resident.unitLabel ?? 'Unidad residencial'}
                </Text>
                <Text style={styles.hint}>
                  {residentDashboard?.resident.propertyName ?? 'Conjunto residencial'}
                </Text>
              </View>
              <IconBadge name="home-outline" size="lg" />
            </View>

            <ActionButton
              disabled={loading}
              label="Actualizar panel"
              onPress={() => loadResidentDashboard()}
              tone="secondary"
            />

            <View style={styles.shortcutGrid}>
              <ShortcutCard
                description="Invita a un visitante."
                icon="person-add-outline"
                title="Nuevo visitante"
                tone="green"
              />
              <ShortcutCard
                description="Ver registros de visitas."
                icon="time-outline"
                title="Historial"
              />
            </View>

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

        {isPorterSession && activePorterView === 'search' ? (
          <View style={styles.panel}>
            <View style={styles.panelHeadingRow}>
              <View>
                <Text style={styles.panelTitle}>Consulta de apartamentos</Text>
                <Text style={styles.hint}>
                  Lista completa o filtro por bloque, apartamento o combinacion.
                </Text>
              </View>
              <ActionButton compact label="Inicio" onPress={() => setActivePorterView('home')} tone="secondary" />
            </View>
            <View style={styles.searchRow}>
              <PaperTextInput
                autoCapitalize="characters"
                dense
                mode="outlined"
                onChangeText={setQuery}
                label="Bloque o apto"
                outlineStyle={styles.paperInputOutline}
                placeholder="Ejemplo: 35 1C"
                style={[styles.paperInput, styles.searchInput]}
                value={query}
              />
              <ActionButton
                compact
                disabled={loading}
                label="Buscar"
                onPress={() => void searchUnits()}
              />
            </View>
            <ActionButton
              compact
              disabled={loading}
              label="Ver todas las unidades"
              onPress={() => {
                setQuery('');
                void searchUnits('');
              }}
              tone="secondary"
            />

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
                    <Text style={styles.unitMeta}>Tocar para abrir opciones de la unidad</Text>
                  </Pressable>
                )}
                scrollEnabled={false}
              />
            )}
          </View>
        ) : null}

        {isPorterSession && activePorterView === 'movements' ? (
          <View style={styles.panel}>
            <ActionButton compact label="Inicio" onPress={() => setActivePorterView('home')} tone="secondary" />
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

        {isPorterSession && activePorterView === 'pending' ? (
          <View style={styles.panel}>
            <ActionButton compact label="Inicio" onPress={() => setActivePorterView('home')} tone="secondary" />
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

        {isPorterSession && activePorterView === 'history' ? (
          <View style={styles.panel}>
            <ActionButton compact label="Inicio" onPress={() => setActivePorterView('home')} tone="secondary" />
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

        {isPorterSession &&
        selectedUnit &&
        ['unit', 'visitors', 'calls', 'messages'].includes(activePorterView) ? (
          <View style={styles.panel}>
            <View style={styles.panelHeadingRow}>
              <View style={styles.panelHeadingText}>
                <Text style={styles.panelTitle}>Unidad seleccionada</Text>
                <Text style={styles.selectedTitle}>{selectedUnit.displayLabel}</Text>
              </View>
              <ActionButton
                compact
                label="Buscar"
                onPress={() => setActivePorterView('search')}
                tone="secondary"
              />
            </View>
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
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {selectedUnitActiveVisits.length}
                </Text>
                <Text style={styles.statLabel}>Visitas activas</Text>
              </View>
            </View>

            {activePorterView === 'unit' ? (
              <View style={styles.shortcutGrid}>
                <ShortcutCard
                  description="Registrar visitantes y ver visitas activas o pendientes."
                  icon="person-add-outline"
                  onPress={() => {
                    setActivePorterView('visitors');
                    setIsMovementsOpen(true);
                    setIsPendingOpen(true);
                    void loadMovements();
                    void loadPendingAuthorizations();
                  }}
                  title="Registro de visitantes"
                  tone="green"
                />
                <ShortcutCard
                  description="Registrar llamada a la unidad con trazabilidad."
                  icon="call-outline"
                  onPress={() => setActivePorterView('calls')}
                  title="Llamar a la unidad"
                />
                <ShortcutCard
                  description="Abrir chat protegido con el residente."
                  icon="chatbubble-ellipses-outline"
                  onPress={() => {
                    setActivePorterView('messages');
                    void loadChatHistory();
                  }}
                  title="Mensajeria"
                  tone="neutral"
                />
              </View>
            ) : null}

            {activePorterView === 'calls' ? (
              <>
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
              </>
            ) : null}

            {activePorterView === 'visitors' ? (
              <>
                <View style={styles.divider} />

                <Text style={styles.subsectionTitle}>Visitantes activos</Text>
                {selectedUnitActiveVisits.length === 0 ? (
                  <Text style={styles.hint}>
                    Esta unidad no tiene visitantes activos en este momento.
                  </Text>
                ) : (
                  selectedUnitActiveVisits.map((item) => (
                    <View key={item.authorizationId} style={styles.historyItem}>
                      <Text style={styles.historyType}>activo</Text>
                      <Text style={styles.historyTitle}>{item.visitorName}</Text>
                      <Text style={styles.historyMeta}>
                        {item.visitorType} - pendiente salida
                      </Text>
                    </View>
                  ))
                )}

                <Text style={styles.subsectionTitle}>Pendientes por confirmar</Text>
                {selectedUnitPendingAuthorizations.length === 0 ? (
                  <Text style={styles.hint}>
                    No hay solicitudes pendientes para esta unidad.
                  </Text>
                ) : (
                  selectedUnitPendingAuthorizations.map((item) => (
                    <View key={item.id} style={styles.pendingItem}>
                      <Text style={styles.historyType}>pendiente</Text>
                      <Text style={styles.historyTitle}>{item.visitorName}</Text>
                      <Text style={styles.historyMeta}>
                        {item.visitorType} - {item.status}
                      </Text>
                    </View>
                  ))
                )}

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
              </>
            ) : null}

            {activePorterView === 'messages' ? (
              <>
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
              </>
            ) : null}
          </View>
        ) : null}
        </ScrollView>
        {session ? (
          <View style={styles.bottomNav}>
            <Pressable
              onPress={() => {
                if (isAdminSession) {
                  setActiveAdminTab('home');
                }
                if (isPorterSession) {
                  setActivePorterView('home');
                }
              }}
              style={
                (isAdminSession && activeAdminTab === 'home') ||
                (isPorterSession && activePorterView === 'home') ||
                (!isAdminSession && !isPorterSession)
                  ? styles.bottomNavItemActive
                  : styles.bottomNavItem
              }
            >
              <Ionicons
                color={
                  (isAdminSession && activeAdminTab === 'home') ||
                  (isPorterSession && activePorterView === 'home') ||
                  (!isAdminSession && !isPorterSession)
                    ? palette.primary
                    : palette.muted
                }
                name="home"
                size={20}
              />
              <Text
                style={
                  (isAdminSession && activeAdminTab === 'home') ||
                  (isPorterSession && activePorterView === 'home') ||
                  (!isAdminSession && !isPorterSession)
                    ? styles.bottomNavTextActive
                    : styles.bottomNavText
                }
              >
                Inicio
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (isAdminSession) {
                  setActiveAdminTab('admin');
                }
                if (isPorterSession) {
                  setActivePorterView('search');
                  if (units.length === 0) {
                    void searchUnits('');
                  }
                }
              }}
              style={
                (isAdminSession && activeAdminTab === 'admin') ||
                (isPorterSession && activePorterView !== 'home')
                  ? styles.bottomNavItemActive
                  : styles.bottomNavItem
              }
            >
              <Ionicons
                color={
                  (isAdminSession && activeAdminTab === 'admin') ||
                  (isPorterSession && activePorterView !== 'home')
                    ? palette.primary
                    : palette.muted
                }
                name={
                  isResidentSession
                    ? 'mail-outline'
                    : isPorterSession
                      ? 'people-outline'
                      : 'bar-chart-outline'
                }
                size={20}
              />
              <Text
                style={
                  (isAdminSession && activeAdminTab === 'admin') ||
                  (isPorterSession && activePorterView !== 'home')
                    ? styles.bottomNavTextActive
                    : styles.bottomNavText
                }
              >
                {isResidentSession
                  ? 'Invitaciones'
                  : isPorterSession
                    ? 'Porteria'
                    : isAdminSession
                      ? 'Admin'
                      : 'Super Admin'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (isAdminSession) {
                  setActiveAdminTab('settings');
                }
              }}
              style={
                isAdminSession && activeAdminTab === 'settings'
                  ? styles.bottomNavItemActive
                  : styles.bottomNavItem
              }
            >
              <Ionicons
                color={
                  isAdminSession && activeAdminTab === 'settings'
                    ? palette.primary
                    : palette.muted
                }
                name="settings-outline"
                size={20}
              />
              <Text
                style={
                  isAdminSession && activeAdminTab === 'settings'
                    ? styles.bottomNavTextActive
                    : styles.bottomNavText
                }
              >
                Ajustes
              </Text>
            </Pressable>
          </View>
        ) : null}
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  loginScreen: {
    backgroundColor: '#ffffff',
  },
  content: {
    alignSelf: 'center',
    maxWidth: 1120,
    padding: 16,
    paddingBottom: 96,
    width: '100%',
  },
  loginContent: {
    flexGrow: 1,
    justifyContent: 'center',
    maxWidth: 460,
    paddingHorizontal: 24,
  },
  loginShell: {
    backgroundColor: '#ffffff',
    borderColor: 'transparent',
    borderRadius: 8,
    borderWidth: 0,
    gap: 14,
    paddingHorizontal: 24,
    paddingVertical: 30,
    shadowColor: '#0b3778',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  loginBrandBlock: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  loginEyebrow: {
    color: palette.primary,
    fontFamily: appFonts.medium,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  loginBrand: {
    color: palette.ink,
    fontFamily: appFonts.medium,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 18,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  loginTitleLarge: {
    color: palette.ink,
    fontFamily: appFonts.black,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
    textAlign: 'center',
  },
  loginDivider: {
    backgroundColor: palette.primary,
    height: 2,
    marginTop: 4,
    width: 72,
  },
  loginTitle: {
    color: palette.ink,
    fontFamily: appFonts.medium,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  loginInput: {
    backgroundColor: '#ffffff',
    fontFamily: appFonts.light,
    fontSize: 15,
  },
  loginInputOutline: {
    borderColor: palette.line,
    borderRadius: 8,
  },
  loginButton: {
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 4,
    minHeight: 48,
  },
  rememberRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  rememberBox: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: palette.line,
    borderRadius: 4,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  rememberBoxActive: {
    backgroundColor: palette.green,
    borderColor: palette.green,
  },
  rememberText: {
    color: palette.ink,
    fontFamily: appFonts.medium,
    fontSize: 14,
    fontWeight: '700',
  },
  loginHint: {
    color: palette.muted,
    fontFamily: appFonts.light,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    textAlign: 'center',
  },
  loginIllustration: {
    alignItems: 'flex-end',
    alignSelf: 'center',
    borderBottomColor: '#cfe1f7',
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 130,
    justifyContent: 'center',
    marginTop: 4,
    width: '86%',
  },
  buildingSmall: {
    borderColor: '#cfe1f7',
    borderRadius: 4,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    marginRight: -8,
    width: 54,
  },
  buildingGate: {
    alignItems: 'center',
    borderColor: '#cfe1f7',
    borderRadius: 6,
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    marginBottom: -1,
    width: 78,
    zIndex: 1,
  },
  buildingTall: {
    borderColor: '#cfe1f7',
    borderRadius: 5,
    borderWidth: 1,
    height: 104,
    justifyContent: 'center',
    marginLeft: -8,
    width: 64,
  },
  windowGrid: {
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    width: 25,
  },
  windowDot: {
    backgroundColor: '#cfe1f7',
    borderRadius: 2,
    height: 4,
    width: 4,
  },
  windowGridTall: {
    gap: 10,
    paddingHorizontal: 14,
  },
  windowLine: {
    backgroundColor: '#cfe1f7',
    borderRadius: 3,
    height: 5,
    width: 24,
  },
  secureConnection: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#e8f7ef',
    borderColor: '#b9e7cf',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  secureConnectionText: {
    color: palette.green,
    fontFamily: appFonts.medium,
    fontSize: 13,
    fontWeight: '900',
  },
  iconBadge: {
    alignItems: 'center',
    borderRadius: 999,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  iconBadgeSmall: {
    height: 34,
    width: 34,
  },
  iconBadgeLarge: {
    borderRadius: 8,
    height: 64,
    width: 64,
  },
  blueIconBadge: {
    backgroundColor: '#eaf4ff',
  },
  greenIconBadge: {
    backgroundColor: '#e8f7ef',
  },
  amberIconBadge: {
    backgroundColor: '#fff3d5',
  },
  neutralIconBadge: {
    backgroundColor: '#f1f5f9',
  },
  shortcutGrid: {
    gap: 10,
    marginTop: 4,
  },
  shortcutCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomColor: palette.line,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderWidth: 0,
    flexDirection: 'row',
    gap: 12,
    minHeight: 76,
    padding: 12,
  },
  shortcutTextBlock: {
    flex: 1,
  },
  shortcutTitle: {
    color: palette.ink,
    fontFamily: appFonts.medium,
    fontSize: 15,
    fontWeight: '900',
  },
  shortcutDescription: {
    color: palette.muted,
    fontFamily: appFonts.light,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  bottomNav: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopColor: palette.line,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-around',
    left: 0,
    paddingBottom: 10,
    paddingTop: 8,
    position: 'absolute',
    right: 0,
  },
  bottomNavItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  bottomNavItemActive: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  bottomNavText: {
    color: palette.muted,
    fontFamily: appFonts.medium,
    fontSize: 11,
    fontWeight: '700',
  },
  bottomNavTextActive: {
    color: palette.primary,
    fontFamily: appFonts.medium,
    fontSize: 11,
    fontWeight: '900',
  },
  adminVisitorGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  adminVisitorCard: {
    backgroundColor: '#ffffff',
    borderColor: 'transparent',
    borderRadius: 8,
    borderWidth: 0,
    flex: 1,
    gap: 5,
    minHeight: 104,
    padding: 10,
  },
  adminVisitorValue: {
    color: palette.ink,
    fontFamily: appFonts.black,
    fontSize: 22,
    fontWeight: '900',
  },
  adminVisitorLabel: {
    color: palette.muted,
    fontFamily: appFonts.light,
    fontSize: 11,
    lineHeight: 15,
  },
  porterSummaryList: {
    backgroundColor: '#ffffff',
    borderColor: 'transparent',
    borderRadius: 8,
    borderWidth: 0,
    gap: 8,
    padding: 10,
  },
  porterSummaryItem: {
    borderBottomColor: palette.line,
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  porterSummaryName: {
    color: palette.ink,
    fontFamily: appFonts.medium,
    fontSize: 13,
    fontWeight: '900',
  },
  porterSummaryMeta: {
    color: palette.muted,
    fontFamily: appFonts.light,
    fontSize: 12,
    marginTop: 2,
  },
  panel: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderRadius: 8,
    borderWidth: 0,
    gap: 12,
    marginBottom: 12,
    padding: 0,
    shadowColor: '#0b3778',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  roleView: {
    gap: 12,
  },
  utilityPanel: {
    backgroundColor: '#ffffff',
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    marginBottom: 12,
    padding: 14,
  },
  panelTitle: {
    color: palette.ink,
    fontFamily: appFonts.black,
    fontSize: 18,
    fontWeight: '900',
  },
  panelHeadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  panelHeadingText: {
    flex: 1,
  },
  accordionHeader: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: 'transparent',
    borderRadius: 8,
    borderWidth: 0,
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
    fontFamily: appFonts.black,
    fontSize: 14,
    fontWeight: '900',
  },
  accordionChip: {
    backgroundColor: '#eaf4ff',
  },
  accordionChipText: {
    color: palette.primaryDark,
    fontFamily: appFonts.medium,
    fontSize: 12,
    fontWeight: '900',
  },
  accordionChipOpen: {
    backgroundColor: '#e8f7ef',
  },
  accordionChipOpenText: {
    color: palette.green,
    fontFamily: appFonts.medium,
    fontSize: 12,
    fontWeight: '900',
  },
  sessionBar: {
    alignItems: 'center',
    backgroundColor: palette.navy,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sessionIdentity: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  roleChip: {
    backgroundColor: '#eaf4ff',
  },
  roleChipText: {
    color: palette.primaryDark,
    fontFamily: appFonts.medium,
    fontSize: 12,
    fontWeight: '800',
  },
  sessionLabel: {
    color: '#d8e9ff',
    fontFamily: appFonts.medium,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  sessionUser: {
    color: '#ffffff',
    fontFamily: appFonts.medium,
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
    fontFamily: appFonts.medium,
    fontSize: 14,
    fontWeight: '900',
  },
  label: {
    color: palette.muted,
    fontFamily: appFonts.medium,
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
    fontFamily: appFonts.light,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  paperInput: {
    backgroundColor: palette.surface,
    fontFamily: appFonts.light,
    fontSize: 15,
  },
  paperInputOutline: {
    borderColor: palette.line,
    borderRadius: 8,
  },
  hint: {
    color: palette.muted,
    fontFamily: appFonts.light,
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
    fontFamily: appFonts.medium,
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
    backgroundColor: '#eaf4ff',
    borderColor: '#b9dcff',
  },
  successNotice: {
    backgroundColor: '#e8f7ef',
    borderColor: '#b9e7cf',
  },
  errorNotice: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  noticeText: {
    color: palette.ink,
    fontFamily: appFonts.light,
    fontSize: 14,
    lineHeight: 20,
  },
  unitItem: {
    backgroundColor: 'transparent',
    borderBottomColor: palette.line,
    borderColor: 'transparent',
    borderRadius: 8,
    borderBottomWidth: 1,
    borderWidth: 0,
    marginTop: 10,
    padding: 14,
  },
  unitItemSelected: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  unitTitle: {
    color: palette.ink,
    fontFamily: appFonts.medium,
    fontSize: 17,
    fontWeight: '900',
  },
  unitMeta: {
    color: palette.muted,
    fontFamily: appFonts.light,
    fontSize: 14,
    marginTop: 4,
  },
  selectedTitle: {
    color: palette.ink,
    fontFamily: appFonts.black,
    fontSize: 24,
    fontWeight: '900',
  },
  privacy: {
    backgroundColor: '#fff8e7',
    borderRadius: 8,
    color: '#7c2d12',
    fontFamily: appFonts.light,
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
    backgroundColor: '#eaf4ff',
    borderRadius: 8,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineButtonText: {
    color: palette.primaryDark,
    fontFamily: appFonts.medium,
    fontSize: 14,
    fontWeight: '900',
  },
  historyItem: {
    backgroundColor: 'transparent',
    borderBottomColor: palette.line,
    borderColor: 'transparent',
    borderRadius: 8,
    borderBottomWidth: 1,
    borderWidth: 0,
    padding: 12,
  },
  pendingItem: {
    backgroundColor: 'transparent',
    borderBottomColor: palette.line,
    borderColor: 'transparent',
    borderRadius: 8,
    borderBottomWidth: 1,
    borderWidth: 0,
    padding: 12,
  },
  historyType: {
    color: palette.blue,
    fontFamily: appFonts.medium,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  historyTitle: {
    color: palette.ink,
    fontFamily: appFonts.medium,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },
  historyMeta: {
    color: palette.muted,
    fontFamily: appFonts.light,
    fontSize: 14,
    marginTop: 3,
  },
  subsectionTitle: {
    color: palette.ink,
    fontFamily: appFonts.medium,
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
    borderColor: '#f4b9b9',
    borderWidth: 1,
  },
  decisionButtonText: {
    color: '#ffffff',
    fontFamily: appFonts.medium,
    fontSize: 15,
    fontWeight: '900',
  },
  rejectButtonText: {
    color: palette.red,
    fontFamily: appFonts.medium,
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
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
    borderRadius: 8,
    flex: 1,
    padding: 12,
  },
  statValue: {
    color: palette.ink,
    fontFamily: appFonts.black,
    fontSize: 24,
    fontWeight: '900',
  },
  statLabel: {
    color: palette.muted,
    fontFamily: appFonts.light,
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
    backgroundColor: '#fff0c7',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontFamily: appFonts.medium,
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButtonText: {
    color: palette.ink,
    fontFamily: appFonts.medium,
    fontSize: 16,
    fontWeight: '900',
  },
  warningButtonText: {
    color: '#7c5607',
    fontFamily: appFonts.medium,
    fontSize: 16,
    fontWeight: '900',
  },
  messageInput: {
    minHeight: 94,
    textAlignVertical: 'top',
  },
  chatShell: {
    backgroundColor: '#ffffff',
    borderColor: 'transparent',
    borderRadius: 8,
    borderWidth: 0,
    overflow: 'hidden',
  },
  chatHeader: {
    alignItems: 'center',
    backgroundColor: palette.navy,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  chatAvatar: {
    alignItems: 'center',
    backgroundColor: '#eaf4ff',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  chatAvatarText: {
    color: palette.primary,
    fontFamily: appFonts.black,
    fontSize: 16,
    fontWeight: '900',
  },
  chatHeaderText: {
    flex: 1,
  },
  chatTitle: {
    color: '#ffffff',
    fontFamily: appFonts.medium,
    fontSize: 15,
    fontWeight: '900',
  },
  chatSubtitle: {
    color: '#d8e9ff',
    fontFamily: appFonts.light,
    fontSize: 12,
    marginTop: 1,
  },
  chatStatusChip: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  chatStatusText: {
    color: '#ffffff',
    fontFamily: appFonts.medium,
    fontSize: 11,
    fontWeight: '800',
  },
  chatTimeline: {
    gap: 8,
    minHeight: 220,
    paddingVertical: 12,
  },
  emptyChat: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 170,
    padding: 18,
  },
  emptyChatTitle: {
    color: palette.ink,
    fontFamily: appFonts.medium,
    fontSize: 16,
    fontWeight: '900',
  },
  emptyChatText: {
    color: palette.muted,
    fontFamily: appFonts.light,
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
    backgroundColor: '#e8f7ef',
    borderTopRightRadius: 2,
  },
  chatBubbleText: {
    fontFamily: appFonts.light,
    fontSize: 15,
    lineHeight: 21,
  },
  chatBubbleTextInbound: {
    color: palette.ink,
  },
  chatBubbleTextOutbound: {
    color: '#0e4a32',
  },
  chatBubbleFooter: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    flexDirection: 'row',
    gap: 4,
    marginTop: 3,
  },
  chatTime: {
    fontFamily: appFonts.light,
    fontSize: 10,
    fontWeight: '700',
  },
  chatTimeInbound: {
    color: palette.muted,
  },
  chatTimeOutbound: {
    color: '#3f7f61',
  },
  chatCheck: {
    color: '#34b7f1',
    fontFamily: appFonts.medium,
    fontSize: 11,
    fontWeight: '900',
  },
  chatComposer: {
    alignItems: 'flex-end',
    backgroundColor: '#ffffff',
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
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    color: palette.ink,
    fontFamily: appFonts.light,
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
    fontFamily: appFonts.medium,
    fontSize: 14,
    fontWeight: '900',
  },
});
