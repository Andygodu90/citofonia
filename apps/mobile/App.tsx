import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import {
  Poppins_300Light,
  Poppins_500Medium,
  Poppins_900Black,
} from '@expo-google-fonts/poppins';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  Vibration,
  View,
} from 'react-native';
import {
  Button as PaperButton,
  Chip,
  MD3LightTheme,
  PaperProvider,
  TextInput as PaperTextInput,
} from 'react-native-paper';

const PRODUCTION_API_URL = 'https://citofonia.julissasantis.com';

function getDefaultApiUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const hostname = window.location.hostname || 'localhost';

    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.')
    ) {
      return `http://${hostname}:3000`;
    }

    return window.location.origin;
  }

  if (__DEV__) {
    return 'http://192.168.80.27:3000';
  }

  return PRODUCTION_API_URL;
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

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type UnitSearchResult = {
  id: string;
  propertyName: string;
  block: string;
  unitNumber: string;
  displayLabel: string;
  activeResidents: number;
  isAccessBlocked?: boolean;
  accessBlockReason?: string | null;
  privacyLabel: string;
};

type UnitDetail = UnitSearchResult & {
  propertyId: string;
  isAccessBlocked: boolean;
  accessBlockReason: string | null;
  visibleResidentNames?: string | null;
  visibleResidentPhones?: string | null;
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
  direction?: 'inbound' | 'outbound';
  readAt?: string | null;
};

type MovementItem = {
  authorizationId: string;
  visitorName: string;
  visitorType: string;
  unitLabel: string;
  updatedAt?: string;
  enteredAt?: string;
  vehiclePlate?: string | null;
  photoUrl?: string | null;
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
  vehiclePlate?: string | null;
  photoUrl?: string | null;
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
  vehiclePlate?: string | null;
  photoUrl?: string | null;
};

type ResidentHistoryItem = {
  id: string;
  type: string;
  status: string;
  visitorName: string;
  occurredAt: string;
  vehiclePlate?: string | null;
  photoUrl?: string | null;
};

type CallSession = {
  id: string;
  status: 'dialing' | 'connected' | 'ended';
  startedAt: string;
  endedAt?: string | null;
  durationSeconds: number;
};

type MessageConversationItem = {
  unit: UnitSearchResult;
  latest?: HistoryItem;
  unreadCount: number;
};

type PackageItem = {
  id: string;
  unitLabel: string;
  recipientName: string;
  packageType: string;
  status: string;
  createdAt: string;
  deliveredAt?: string | null;
};

type PorterAlert = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  targetView: PorterView;
  tone: 'amber' | 'blue' | 'green';
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
  | 'home'
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
  isWideLayout?: boolean;
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
  | 'visitorDashboard'
  | 'calls'
  | 'messageHub'
  | 'messages'
  | 'movements'
  | 'pending'
  | 'history'
  | 'packages'
  | 'blockedUnits'
  | 'alerts';

function normalizeLookup(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isMissedCallItem(item: HistoryItem) {
  const status = item.status.toLowerCase();

  return (
    item.direction === 'inbound' ||
    status.includes('perd') ||
    status.includes('no_answer') ||
    status.includes('rechaz') ||
    status.includes('rejected')
  );
}

function sortHistoryByNewest<T extends { occurredAt: string }>(items: T[]) {
  return [...items].sort(
    (a, b) =>
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
}

function normalizePhoneForDial(phone: string) {
  return phone.replace(/[^\d+]/g, '');
}

function getActionButtonColors(tone: ActionButtonTone) {
  if (tone === 'secondary') {
    return {
      buttonColor: palette.surface,
      mode: 'outlined' as const,
      textColor: palette.ink,
    };
  }

  if (tone === 'home') {
    return {
      buttonColor: '#EAF4FF',
      mode: 'contained' as const,
      textColor: palette.primary,
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
      buttonColor: palette.red,
      mode: 'contained' as const,
      textColor: '#ffffff',
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
  isWideLayout = false,
}: RoleOverviewViewProps) {
  return (
    <View style={[styles.roleView, isWideLayout ? styles.adminWebRoleView : null]}>
      <View style={[styles.panel, isWideLayout ? styles.adminWebPanel : null]}>
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
          description: 'Consultar operacion de paquetes por conjunto.',
          icon: 'cube-outline',
          title: 'Paquetes',
          tone: 'green',
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

function AdminView({ isWideLayout = false }: { isWideLayout?: boolean }) {
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
          description: 'Seguimiento de paquetes recibidos en porteria.',
          icon: 'cube-outline',
          title: 'Paquetes',
          tone: 'green',
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
      isWideLayout={isWideLayout}
    />
  );
}

function AdminHomeView({ isWideLayout = false }: { isWideLayout?: boolean }) {
  return (
    <View style={[styles.roleView, isWideLayout ? styles.adminWebRoleView : null]}>
      <View style={[styles.panel, isWideLayout ? styles.adminWebHeroPanel : null]}>
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

      <View style={isWideLayout ? styles.adminWebDashboardGrid : null}>
      <View style={[styles.panel, isWideLayout ? styles.adminWebPanel : null]}>
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

      <View style={[styles.panel, isWideLayout ? styles.adminWebPanel : null]}>
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
    </View>
  );
}

function AdminSettingsView({ isWideLayout = false }: { isWideLayout?: boolean }) {
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
      isWideLayout={isWideLayout}
    />
  );
}

type AccordionToggleProps = {
  title: string;
  summary: string;
  isOpen: boolean;
  onPress: () => void;
  tone?: 'default' | 'warning';
};

function AccordionToggle({
  title,
  summary,
  isOpen,
  onPress,
  tone = 'default',
}: AccordionToggleProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.accordionHeader,
        tone === 'warning' ? styles.accordionHeaderWarning : null,
      ]}
    >
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
  const { width } = useWindowDimensions();
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
    useState<PorterView>('search');
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
  const [chatVisibleCount, setChatVisibleCount] = useState(15);
  const [messageQuery, setMessageQuery] = useState('');
  const [messageUnits, setMessageUnits] = useState<UnitSearchResult[]>([]);
  const [blockedUnitQuery, setBlockedUnitQuery] = useState('');
  const [readMessageIds, setReadMessageIds] = useState<string[]>([]);
  const [readAlertIds, setReadAlertIds] = useState<string[]>([]);
  const [readBlockedUnitIds, setReadBlockedUnitIds] = useState<string[]>([]);
  const [readCallIds, setReadCallIds] = useState<string[]>([]);
  const [lastNotificationKey, setLastNotificationKey] = useState('');
  const [residentDashboard, setResidentDashboard] =
    useState<ResidentDashboard | null>(null);
  const [residentVisitorName, setResidentVisitorName] = useState(
    'Visitante autorizado',
  );
  const [residentVisitorDocument, setResidentVisitorDocument] = useState('');
  const [residentVisitorType, setResidentVisitorType] = useState('invitado');
  const [visitorName, setVisitorName] = useState('');
  const [visitorDocument, setVisitorDocument] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitReason, setVisitReason] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [visitorPhotoUri, setVisitorPhotoUri] = useState('');
  const [visitorPhotoDataUrl, setVisitorPhotoDataUrl] = useState('');
  const [isVisitorFormOpen, setIsVisitorFormOpen] = useState(false);
  const [hasUnitSearchResults, setHasUnitSearchResults] = useState(false);
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [packageItems, setPackageItems] = useState<PackageItem[]>([]);
  const [packageUnitQuery, setPackageUnitQuery] = useState('');
  const [packageUnitSuggestions, setPackageUnitSuggestions] = useState<
    UnitSearchResult[]
  >([]);
  const [packageRecipientName, setPackageRecipientName] = useState('');
  const [packageType, setPackageType] = useState('');
  const [isActiveVisitorsOpen, setIsActiveVisitorsOpen] = useState(false);
  const [isCallHistoryOpen, setIsCallHistoryOpen] = useState(false);
  const [isCallLogOpen, setIsCallLogOpen] = useState(false);
  const [isMissedCallsOpen, setIsMissedCallsOpen] = useState(false);
  const [isCompletedCallsOpen, setIsCompletedCallsOpen] = useState(true);
  const [isPackageFormOpen, setIsPackageFormOpen] = useState(false);
  const [isPackageHistoryOpen, setIsPackageHistoryOpen] = useState(false);
  const [packageHistoryQuery, setPackageHistoryQuery] = useState('');
  const [packageHistoryPage, setPackageHistoryPage] = useState(1);
  const [selectedActiveVisitor, setSelectedActiveVisitor] =
    useState<MovementItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice>({
    tone: 'info',
    text: 'Busca por bloque o apartamento. Ejemplo: 31, 1A, 45 5D.',
  });

  const normalizedApiUrl = DEFAULT_API_URL.replace(/\/$/, '');
  const isSuperAdminSession = session?.role === 'superadmin';
  const isAdminCredentialSession = session?.role === 'admin';
  const isAdminSession = false;
  const isPorterSession = session?.role === 'porter' || isAdminCredentialSession;
  const isResidentSession = session?.role === 'resident';
  const isAdminWebLayout =
    Platform.OS === 'web' && width >= 900 && (isAdminSession || isSuperAdminSession);
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
  const selectedUnitPendingPorter = selectedUnitPendingAuthorizations.length;
  const selectedUnitPendingResident = 0;
  const visibleChatMessages = [...chatHistory]
    .reverse()
    .slice(Math.max(chatHistory.length - chatVisibleCount, 0));
  const filteredMessageUnits = messageUnits.filter((unit) => {
    const term = messageQuery.trim().toLowerCase();

    if (!term) {
      return true;
    }

    return [unit.displayLabel, unit.privacyLabel, unit.block, unit.unitNumber]
      .join(' ')
      .toLowerCase()
      .includes(term);
  });
  const filteredBlockedUnitStatus = messageUnits.filter((unit) => {
    const term = blockedUnitQuery.trim().toLowerCase();

    if (!term) {
      return unit.isAccessBlocked;
    }

    return [unit.displayLabel, unit.privacyLabel, unit.block, unit.unitNumber]
      .join(' ')
      .toLowerCase()
      .includes(term);
  });
  const recentCallHistory = historyItems
    .filter(
      (item) =>
        item.type === 'call' &&
        (!selectedUnit || item.subtitle.includes(selectedUnit.displayLabel)),
    )
    .slice(0, 5);
  const callHistoryItems = sortHistoryByNewest(
    historyItems.filter((item) => item.type === 'call'),
  );
  const missedCallHistory = callHistoryItems.filter(isMissedCallItem);
  const completedCallHistory = callHistoryItems.filter(
    (item) => !missedCallHistory.some((missed) => missed.id === item.id),
  );
  const unreadMissedCallCount = missedCallHistory.filter(
    (item) => !item.readAt && !readCallIds.includes(item.id),
  ).length;
  const messageHistoryItems = sortHistoryByNewest(
    historyItems.filter((item) => item.type === 'message'),
  );
  const messageConversationItems: MessageConversationItem[] =
    filteredMessageUnits
      .map((unit) => {
        const unitTerms = [
          unit.displayLabel,
          unit.unitNumber,
          unit.block,
          unit.privacyLabel,
        ]
          .filter(Boolean)
          .map((value) => normalizeLookup(String(value)));
        const relatedMessages = messageHistoryItems.filter((item) => {
          const subtitle = normalizeLookup(item.subtitle);
          const title = normalizeLookup(item.title);

          return unitTerms.some(
            (term) =>
              term.length > 0 &&
              (subtitle.includes(term) || title.includes(term)),
          );
        });
        const latest = relatedMessages[0];
        const unreadCount = relatedMessages.filter(
          (item) =>
            item.direction === 'inbound' &&
            !item.readAt &&
            !readMessageIds.includes(item.id),
        ).length;

        return { unit, latest, unreadCount };
      })
      .sort((a, b) => {
        if (a.unreadCount !== b.unreadCount) {
          return b.unreadCount - a.unreadCount;
        }

        return (
          new Date(b.latest?.occurredAt ?? 0).getTime() -
          new Date(a.latest?.occurredAt ?? 0).getTime()
        );
      });
  const activePackages = packageItems.filter((item) => item.status !== 'delivered');
  const filteredPackageHistory = packageItems.filter((item) => {
    const term = packageHistoryQuery.trim().toLowerCase();

    if (!term) {
      return true;
    }

    return item.unitLabel.toLowerCase().includes(term);
  });
  const packageHistoryPageSize = 10;
  const packageHistoryTotalPages = Math.max(
    1,
    Math.ceil(filteredPackageHistory.length / packageHistoryPageSize),
  );
  const pagedPackageHistory = filteredPackageHistory.slice(
    (packageHistoryPage - 1) * packageHistoryPageSize,
    packageHistoryPage * packageHistoryPageSize,
  );
  const messageAlerts = historyItems.filter(
    (item) =>
      item.type === 'message' &&
      item.direction === 'inbound' &&
      !item.readAt,
  );
  const porterAlerts: PorterAlert[] = [
    ...pendingAuthorizations.map((item) => ({
      id: `pending-${item.id}`,
      title: 'Ingreso pendiente por porteria',
      body: `${item.visitorName} para ${item.unitLabel}`,
      createdAt: item.createdAt,
      targetView: 'pending' as PorterView,
      tone: 'amber' as const,
    })),
    ...movements.pendingEntry.map((item) => ({
      id: `entry-${item.authorizationId}`,
      title: 'Visitante autorizado para entrada',
      body: `${item.visitorName} - ${item.unitLabel}`,
      createdAt: item.updatedAt ?? new Date().toISOString(),
      targetView: 'movements' as PorterView,
      tone: 'green' as const,
    })),
    ...messageAlerts.map((item) => ({
      id: `message-${item.id}`,
      title: 'Mensaje pendiente por revisar',
      body: item.subtitle,
      createdAt: item.occurredAt,
      targetView: 'messageHub' as PorterView,
      tone: 'blue' as const,
    })),
  ];
  const unreadMessageCount = messageAlerts.filter(
    (item) => !readMessageIds.includes(item.id),
  ).length;
  const unreadMessageAlerts = messageAlerts.filter(
    (item) => !readMessageIds.includes(item.id),
  );
  const operationalAlerts = porterAlerts.filter(
    (item) => item.targetView !== 'messageHub',
  );
  const blockedUnitAlerts = messageUnits.filter((unit) => unit.isAccessBlocked);
  const unreadBlockedUnitAlerts = blockedUnitAlerts.filter(
    (unit) => !readBlockedUnitIds.includes(unit.id),
  );
  const unreadOperationalAlerts = operationalAlerts.filter(
    (item) => !readAlertIds.includes(item.id),
  );
  const unreadAlertCount =
    unreadBlockedUnitAlerts.length + unreadOperationalAlerts.length;
  const unseenCallAlerts = historyItems.filter(
    (item) => item.type === 'call' && !item.readAt && !readCallIds.includes(item.id),
  );
  const unreadCallCount = unseenCallAlerts.length;

  async function readApiJson<T>(response: Response): Promise<T> {
    const text = await response.text();
    let data: { error?: string } | null = null;

    if (text) {
      try {
        data = JSON.parse(text) as { error?: string };
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      throw new Error(
        data?.error ??
          `La API respondio con error ${response.status}. Verifica que el servidor este encendido.`,
      );
    }

    if (!data) {
      throw new Error(
        'La API no devolvio una respuesta valida. Verifica la conexion local.',
      );
    }

    return data as T;
  }
  useEffect(() => {
    if (!activeCall || activeCall.status === 'ended') {
      return;
    }

    const timer = setInterval(() => {
      setActiveCall((current) => {
        if (!current || current.status === 'ended') {
          return current;
        }

        const startedAt = new Date(current.startedAt).getTime();
        const elapsed = Math.max(
          0,
          Math.floor((Date.now() - startedAt) / 1000),
        );

        return { ...current, durationSeconds: elapsed };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeCall]);

  useEffect(() => {
    if (!isPorterSession) {
      return;
    }

    const notificationKey = `${unreadAlertCount}-${unreadMessageCount}-${unreadCallCount}`;

    if (
      notificationKey === lastNotificationKey ||
      (unreadAlertCount === 0 && unreadMessageCount === 0 && unreadCallCount === 0)
    ) {
      return;
    }

    setLastNotificationKey(notificationKey);
    void notifyDevice(
      unreadMessageCount > 0
        ? 'Mensajeria pendiente'
        : unreadCallCount > 0
          ? 'Llamadas pendientes'
          : 'Alertas de porteria',
      unreadMessageCount > 0
        ? `Tienes ${unreadMessageCount} chat(s) por revisar.`
        : unreadCallCount > 0
          ? `Tienes ${unreadCallCount} llamada(s) por revisar.`
          : `Tienes ${unreadAlertCount} alerta(s) por revisar.`,
    );
  }, [
    isPorterSession,
    lastNotificationKey,
    unreadAlertCount,
    unreadCallCount,
    unreadMessageCount,
  ]);

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

  async function notifyDevice(title: string, body: string) {
    if (Platform.OS === 'web') {
      return;
    }

    const currentPermission = await Notifications.getPermissionsAsync();
    const finalPermission =
      currentPermission.granted
        ? currentPermission
        : await Notifications.requestPermissionsAsync();

    if (!finalPermission.granted) {
      return;
    }

    Vibration.vibrate([0, 260, 140, 260]);
    await Notifications.scheduleNotificationAsync({
      content: {
        body,
        sound: true,
        title,
      },
      trigger: null,
    });
  }

  function openAlertsView() {
    setActivePorterView('alerts');
    void loadPendingAuthorizations();
    void loadMovements();
    void loadHistory();
    void loadPackages();
    void searchMessageUnits('');
  }

  function openBlockedUnitsView() {
    setActivePorterView('blockedUnits');
    setBlockedUnitQuery('');
    setSelectedSummary(null);
    setSelectedUnit(null);
    void loadPorterUnitsForStatus();
  }

  function openMessageHub() {
    setMessageQuery('');
    setMessageUnits([]);
    setSelectedSummary(null);
    setSelectedUnit(null);
    setActivePorterView('messageHub');
    void loadHistory();
    void searchMessageUnits('');
  }

  function openPorterHome() {
    setActivePorterView('home');
    setSelectedSummary(null);
    setSelectedUnit(null);
    setUnits([]);
    setQuery('');
    setHasUnitSearchResults(false);
    setActiveCall(null);
    void loadPorterBootstrap(session?.token ?? '');
  }

  function openCallsSearch() {
    setActivePorterView('calls');
    setSelectedSummary(null);
    setSelectedUnit(null);
    setUnits([]);
    setQuery('');
    setHasUnitSearchResults(false);
    setActiveCall(null);
    setIsCallLogOpen(false);
    void loadHistory();
  }

  function openUnitSearch() {
    setActivePorterView('search');
    setSelectedSummary(null);
    setSelectedUnit(null);
    setUnits([]);
    setQuery('');
    setHasUnitSearchResults(false);
  }

  function handleBlockedUnitAlertPress(unit: UnitSearchResult) {
    setReadBlockedUnitIds((current) => Array.from(new Set([...current, unit.id])));
    void loadUnit(unit);
  }

  function handleCallHistoryPress(item: HistoryItem) {
    setReadCallIds((current) => Array.from(new Set([...current, item.id])));
    setQuery(item.subtitle);
    setNotice({
      tone: 'info',
      text: `Llamada revisada: ${item.subtitle}. Puedes buscar la unidad para volver a marcar.`,
    });
  }

  function handleAlertPress(alert: PorterAlert) {
    setReadAlertIds((current) => Array.from(new Set([...current, alert.id])));

    if (alert.targetView === 'pending') {
      setActivePorterView('pending');
      setIsPendingOpen(true);
      void loadPendingAuthorizations();
      return;
    }

    if (alert.targetView === 'movements') {
      setActivePorterView('movements');
      setIsMovementsOpen(true);
      void loadMovements();
      return;
    }

    if (alert.targetView === 'messageHub') {
      openMessageHub();
    }
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

    return readApiJson<T>(response);
  }

  async function requestWithToken<T>(
    token: string,
    path: string,
    options?: RequestInit,
  ): Promise<T> {
    const response = await fetch(`${normalizedApiUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options?.headers,
      },
    });

    return readApiJson<T>(response);
  }

  async function loadPorterBootstrap(token: string) {
    try {
      const [pendingData, movementData, historyData, packageData, unitData] =
        await Promise.all([
          requestWithToken<{ items: PendingAuthorization[] }>(
            token,
            '/api/porter/authorizations',
          ),
          requestWithToken<MovementsState>(token, '/api/porter/movements'),
          requestWithToken<{ items: HistoryItem[] }>(token, '/api/porter/history'),
          requestWithToken<{ items: PackageItem[] }>(token, '/api/porter/packages'),
          requestWithToken<{ units: UnitSearchResult[] }>(
            token,
            '/api/porter/units?query=',
          ),
        ]);

      setPendingAuthorizations(pendingData.items);
      setMovements(movementData);
      setHistoryItems(historyData.items);
      setPackageItems(packageData.items);
      setMessageUnits(unitData.units);
    } catch {
      // La sesion puede continuar aunque algun resumen operativo no cargue.
    }
  }

  async function registerPushToken(token: string) {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      const currentPermissions = await Notifications.getPermissionsAsync();
      const finalPermissions =
        currentPermissions.status === 'granted'
          ? currentPermissions
          : await Notifications.requestPermissionsAsync();

      if (finalPermissions.status !== 'granted') {
        return;
      }

      const pushToken = await Notifications.getExpoPushTokenAsync();

      await requestWithToken(token, '/api/notifications/register', {
        method: 'POST',
        body: JSON.stringify({
          expoPushToken: pushToken.data,
          platform: Platform.OS,
        }),
      });
    } catch {
      // La app sigue funcionando aunque el dispositivo no entregue token push.
    }
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

      const data = await readApiJson<{
        token: string;
        user: {
          username: string;
          role: UserSession['role'];
          residentId?: string | null;
        };
      }>(response);

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

      if (data.user.role === 'porter' || data.user.role === 'admin') {
        await loadPorterBootstrap(data.token);
      }

      void registerPushToken(data.token);
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
    if (activePorterView !== 'calls') {
      setHistoryItems([]);
    }
    setChatHistory([]);
    setMessageQuery('');
    setMessageUnits([]);
    setReadMessageIds([]);
    setReadAlertIds([]);
    setReadBlockedUnitIds([]);
    setReadCallIds([]);
    setLastNotificationKey('');
    setIsHistoryOpen(false);
    setPendingAuthorizations([]);
    setIsPendingOpen(false);
    setMovements({ pendingEntry: [], pendingExit: [] });
    setIsMovementsOpen(false);
    setResidentDashboard(null);
    setActiveAdminTab('home');
    setActivePorterView('search');
    setHasUnitSearchResults(false);
    setActiveCall(null);
    setPackageItems([]);
    setIsActiveVisitorsOpen(false);
    setIsCallHistoryOpen(false);
    setIsCallLogOpen(false);
    setIsMissedCallsOpen(false);
    setIsCompletedCallsOpen(true);
    setIsPackageFormOpen(false);
    resetVisitorForm();
    setNotice({ tone: 'info', text: 'Sesion cerrada.' });
  }

  function resetVisitorForm() {
    setVisitorName('');
    setVisitorDocument('');
    setVisitorPhone('');
    setVisitReason('');
    setVehiclePlate('');
    setVisitorPhotoUri('');
    setVisitorPhotoDataUrl('');
    setIsVisitorFormOpen(false);
  }

  async function searchUnits(overrideQuery?: string) {
    const searchText = overrideQuery ?? query;
    const shouldShowAll = overrideQuery === '';

    if (!searchText.trim() && !shouldShowAll) {
      showValidationError('Escribe un bloque o apartamento, o usa Ver todas las unidades.');
      return;
    }

    setLoading(true);
    setActivePorterView(activePorterView === 'calls' ? 'calls' : 'search');
    setHasUnitSearchResults(true);
    setSelectedSummary(null);
    setSelectedUnit(null);
    if (activePorterView !== 'calls') {
      setHistoryItems([]);
    }
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

  async function searchMessageUnits(overrideQuery?: string) {
    const searchText = overrideQuery ?? messageQuery;

    setLoading(true);
    setNotice({ tone: 'info', text: 'Cargando chats de mensajeria...' });

    try {
      const searchQuery = encodeURIComponent(searchText.trim());
      const data = await request<{ units: UnitSearchResult[] }>(
        `/api/porter/units?query=${searchQuery}`,
      );
      setMessageUnits(data.units);
      setNotice({
        tone: 'success',
        text:
          data.units.length === 0
            ? 'No encontramos conversaciones con ese criterio.'
            : `Chats disponibles: ${data.units.length}.`,
      });
    } catch (error) {
      setNotice({
        tone: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Error buscando unidad para mensajeria.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadPorterUnitsForStatus() {
    setLoading(true);
    setNotice({ tone: 'info', text: 'Cargando estado de unidades...' });

    try {
      const data = await request<{ units: UnitSearchResult[] }>(
        '/api/porter/units?query=',
      );
      setMessageUnits(data.units);
      setNotice({
        tone: 'success',
        text: `Estado actualizado: ${data.units.filter((unit) => unit.isAccessBlocked).length} unidad(es) bloqueada(s).`,
      });
    } catch (error) {
      setNotice({
        tone: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Error cargando estado de unidades.',
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

  async function openUnitChat(unit: UnitSearchResult) {
    setLoading(true);
    setSelectedSummary(unit);
    setNotice({ tone: 'info', text: 'Abriendo chat protegido...' });

    try {
      const data = await request<{ unit: UnitDetail }>(
        `/api/porter/units/${unit.id}`,
      );
      const [movementData, pendingData, chatData] = await Promise.all([
        request<MovementsState>('/api/porter/movements'),
        request<{ items: PendingAuthorization[] }>('/api/porter/authorizations'),
        request<{ messages: ChatHistoryItem[] }>(
          `/api/porter/units/${unit.id}/messages`,
        ),
      ]);

      setSelectedUnit(data.unit);
      setMovements(movementData);
      setPendingAuthorizations(pendingData.items);
      setChatHistory(chatData.messages);
      setChatVisibleCount(15);
      setActivePorterView('messages');
      setNotice({ tone: 'success', text: 'Chat cargado para la unidad.' });
    } catch (error) {
      setNotice({
        tone: 'error',
        text:
          error instanceof Error ? error.message : 'Error abriendo el chat.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function openChatFromHistory(item: HistoryItem) {
    setReadMessageIds((current) => Array.from(new Set([...current, item.id])));
    setMessageQuery(item.subtitle);
    setLoading(true);
    setNotice({ tone: 'info', text: 'Buscando chat relacionado...' });

    try {
      await request(`/api/porter/messages/${item.id}/read`, {
        method: 'PATCH',
        body: JSON.stringify({}),
      });
      const searchQuery = encodeURIComponent(item.subtitle);
      const data = await request<{ units: UnitSearchResult[] }>(
        `/api/porter/units?query=${searchQuery}`,
      );

      if (data.units.length === 0) {
        setActivePorterView('messageHub');
        setMessageUnits([]);
        setNotice({
          tone: 'error',
          text: 'No pude ubicar automaticamente la unidad del mensaje.',
        });
        return;
      }

      await openUnitChat(data.units[0]);
    } catch (error) {
      setNotice({
        tone: 'error',
        text:
          error instanceof Error ? error.message : 'Error abriendo mensaje.',
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
    setHasUnitSearchResults(false);
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
    status: 'initiated' | 'answered' | 'no_answer' | 'rejected' = 'initiated',
    unitOverride?: UnitDetail,
  ) {
    const callUnit = unitOverride ?? selectedUnit;

    if (!callUnit) {
      return;
    }

    setLoading(true);
    setNotice({ tone: 'info', text: 'Registrando llamada protegida...' });

    try {
      const data = await request<{
        call: {
          id: string;
          status: string;
          startedAt: string;
          phoneE164?: string | null;
          message: string;
        };
      }>(`/api/porter/units/${callUnit.id}/calls`, {
        method: 'POST',
        body: JSON.stringify({
          status,
          notes: 'Llamada protegida desde app de porteria. Numero protegido.',
        }),
      });

      setActiveCall({
        id: data.call.id,
        status: 'connected',
        startedAt: new Date().toISOString(),
        durationSeconds: 0,
      });
      setIsCallHistoryOpen(false);
      setNotice({ tone: 'success', text: data.call.message });

      if (status === 'initiated') {
        await startSimCall(data.call.phoneE164);
      }

      void loadHistory();
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

  async function startSimCall(phoneE164?: string | null) {
    const phone = normalizePhoneForDial(phoneE164 ?? '');

    if (!phone) {
      setNotice({
        tone: 'error',
        text: 'No hay numero habilitado para llamar a esta unidad.',
      });
      return;
    }

    if (Platform.OS === 'web') {
      setNotice({
        tone: 'info',
        text: 'La llamada por SIM solo se prueba en Android instalado. En web se conserva el registro.',
      });
      return;
    }

    try {
      await Linking.openURL(`tel:${phone}`);
      setNotice({
        tone: 'success',
        text: 'Se abrio la llamada del telefono. El numero sigue protegido dentro de la app.',
      });
    } catch {
      setNotice({
        tone: 'error',
        text: 'Android no pudo abrir la llamada. Revisa permisos de telefono y que el equipo tenga SIM activa.',
      });
    }
  }

  async function endActiveCall() {
    if (!activeCall) {
      return;
    }

    setLoading(true);
    setNotice({ tone: 'info', text: 'Finalizando llamada...' });

    try {
      const data = await request<{
        call: { id: string; status: string; startedAt: string; endedAt: string | null };
      }>(`/api/porter/calls/${activeCall.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: activeCall.status === 'connected' ? 'answered' : 'no_answer',
          ended: true,
          notes: `Duracion registrada por app: ${formatDuration(activeCall.durationSeconds)}.`,
        }),
      });

      setActiveCall({
        ...activeCall,
        status: 'ended',
        endedAt: data.call.endedAt,
      });
      setNotice({
        tone: 'success',
        text: `Llamada finalizada. Duracion: ${formatDuration(activeCall.durationSeconds)}.`,
      });

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

  function openCallView() {
    setActivePorterView('calls');
    setIsCallHistoryOpen(false);

    if (!activeCall || activeCall.status === 'ended') {
      void registerCall('initiated');
    }
  }

  async function openUnitCall(unit: UnitSearchResult) {
    setLoading(true);
    setSelectedSummary(unit);
    setNotice({ tone: 'info', text: 'Cargando unidad para llamada...' });

    try {
      const data = await request<{ unit: UnitDetail }>(
        `/api/porter/units/${unit.id}`,
      );
      setSelectedUnit(data.unit);
      setChatHistory([]);
      setActivePorterView('calls');
      setIsCallHistoryOpen(false);
      await registerCall('initiated', data.unit);
    } catch (error) {
      setNotice({
        tone: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Error preparando la llamada.',
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
      setChatMessage('');
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
      setChatVisibleCount(15);
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
          visitorType: 'visitante',
          reason: visitReason.trim() || 'Visita',
          vehiclePlate: vehiclePlate.trim(),
          photoUrl: visitorPhotoDataUrl || visitorPhotoUri,
        }),
      });

      setNotice({
        tone: 'success',
        text: `${data.message} Estado: ${data.authorization.status}.`,
      });

      if (isPendingOpen) {
        await loadPendingAuthorizations();
      }

      await Promise.all([loadPendingAuthorizations(), loadMovements()]);
      resetVisitorForm();
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

  async function takeVisitorPhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      showValidationError('Debes permitir la camara para tomar la foto.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      base64: true,
      quality: 0.45,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    setVisitorPhotoUri(asset.uri);

    if (asset.base64) {
      const mimeType = asset.mimeType ?? 'image/jpeg';
      setVisitorPhotoDataUrl(`data:${mimeType};base64,${asset.base64}`);
    }
  }

  function formatDuration(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = Math.max(0, totalSeconds % 60)
      .toString()
      .padStart(2, '0');

    return `${minutes}:${seconds}`;
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
      const data = await readApiJson<ResidentDashboard>(response);

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

  async function loadPackages() {
    setLoading(true);
    setNotice({ tone: 'info', text: 'Cargando paquetes...' });

    try {
      const data = await request<{ items: PackageItem[] }>('/api/porter/packages');
      setPackageItems(data.items);
      setNotice({
        tone: 'success',
        text:
          data.items.length === 0
            ? 'No hay paquetes registrados.'
            : `Paquetes cargados: ${data.items.length}.`,
      });
    } catch (error) {
      setNotice({
        tone: 'error',
        text:
          error instanceof Error ? error.message : 'Error cargando paquetes.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function registerPackage() {
    const unitQuery = packageUnitQuery.trim() || selectedUnit?.displayLabel || '';

    if (!unitQuery) {
      showValidationError('Indica la unidad a la que pertenece el paquete.');
      return;
    }

    setLoading(true);
    setNotice({ tone: 'info', text: 'Registrando paquete...' });

    try {
      const data = await request<{ message: string; package: PackageItem }>(
        '/api/porter/packages',
        {
          method: 'POST',
          body: JSON.stringify({
            unitQuery,
            recipientName: packageRecipientName.trim() || 'Residente',
            packageType: packageType.trim() || 'Paquete',
          }),
        },
      );

      setPackageItems((current) => [data.package, ...current]);
      setPackageUnitQuery('');
      setPackageUnitSuggestions([]);
      setPackageRecipientName('');
      setPackageType('');
      setIsPackageFormOpen(false);
      setNotice({ tone: 'success', text: data.message });
    } catch (error) {
      setNotice({
        tone: 'error',
        text:
          error instanceof Error ? error.message : 'Error registrando paquete.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function updatePackageUnitQuery(text: string) {
    setPackageUnitQuery(text);

    if (!text.trim()) {
      setPackageUnitSuggestions([]);
      return;
    }

    try {
      const data = await request<{ units: UnitSearchResult[] }>(
        `/api/porter/units?query=${encodeURIComponent(text.trim())}`,
      );
      setPackageUnitSuggestions(data.units.slice(0, 8));
    } catch {
      setPackageUnitSuggestions([]);
    }
  }

  function selectPackageUnit(unit: UnitSearchResult) {
    setPackageUnitQuery(unit.displayLabel);
    setPackageUnitSuggestions([]);
  }

  async function markPackageDelivered(id: string) {
    setLoading(true);
    setNotice({ tone: 'info', text: 'Marcando paquete como entregado...' });

    try {
      const data = await request<{ message: string; package: Partial<PackageItem> }>(
        `/api/porter/packages/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: 'delivered' }),
        },
      );

      setPackageItems((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                deliveredAt: data.package.deliveredAt ?? item.deliveredAt,
                status: data.package.status ?? item.status,
              }
            : item,
        ),
      );
      setNotice({ tone: 'success', text: data.message });
    } catch (error) {
      setNotice({
        tone: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Error marcando paquete como entregado.',
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

  function formatHistoryDateTime(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const formattedDate = date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `${formattedDate} - ${formattedTime}`;
  }

  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaView style={[styles.screen, !session ? styles.loginScreen : null]}>
        <StatusBar style="dark" />
        {session ? (
          <View style={[styles.sessionBar, isAdminWebLayout ? styles.adminWebSessionBar : null]}>
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
            isAdminWebLayout ? styles.adminWebContent : null,
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

        {isAdminSession && activeAdminTab === 'home' ? (
          <AdminHomeView isWideLayout={isAdminWebLayout} />
        ) : null}

        {isAdminSession && activeAdminTab === 'admin' ? (
          <AdminView isWideLayout={isAdminWebLayout} />
        ) : null}

        {isAdminSession && activeAdminTab === 'settings' ? (
          <AdminSettingsView isWideLayout={isAdminWebLayout} />
        ) : null}

        {isPorterSession && activePorterView === 'home' ? (
          <View style={styles.homeShell}>
            <View style={styles.homeHeader}>
              <View style={styles.homeHeaderText}>
                <Text style={styles.label}>Porteria</Text>
                <Text style={styles.homeTitle}>Arcadas de San Isidro</Text>
                <Text style={styles.homeSubtitle}>
                  Control operativo de unidades, llamadas, mensajes y alertas.
                </Text>
              </View>
              <IconBadge name="business-outline" size="lg" />
            </View>

            <View style={styles.homeMetricGrid}>
              <Pressable
                onPress={openBlockedUnitsView}
                style={styles.homeMetricCard}
              >
                <View style={styles.homeMetricTopRow}>
                  <IconBadge name="ban-outline" size="sm" tone="amber" />
                  <Ionicons color={palette.primary} name="chevron-forward" size={16} />
                </View>
                <View style={styles.homeMetricTextBlock}>
                  <Text style={styles.homeMetricValue}>{blockedUnitAlerts.length}</Text>
                  <Text style={styles.homeMetricLabel}>Unidades bloqueadas</Text>
                </View>
              </Pressable>
              <Pressable
                onPress={openMessageHub}
                style={styles.homeMetricCard}
              >
                <View style={styles.homeMetricTopRow}>
                  <IconBadge name="chatbubble-ellipses-outline" size="sm" />
                  <Ionicons color={palette.primary} name="chevron-forward" size={16} />
                </View>
                <View style={styles.homeMetricTextBlock}>
                  <Text style={styles.homeMetricValue}>{unreadMessageCount}</Text>
                  <Text style={styles.homeMetricLabel}>Mensajes sin leer</Text>
                </View>
              </Pressable>
              <Pressable
                onPress={openAlertsView}
                style={styles.homeMetricCard}
              >
                <View style={styles.homeMetricTopRow}>
                  <IconBadge name="notifications-outline" size="sm" tone="green" />
                  <Ionicons color={palette.primary} name="chevron-forward" size={16} />
                </View>
                <View style={styles.homeMetricTextBlock}>
                  <Text style={styles.homeMetricValue}>{unreadAlertCount}</Text>
                  <Text style={styles.homeMetricLabel}>Alertas sin ver</Text>
                </View>
              </Pressable>
              <Pressable
                onPress={openCallsSearch}
                style={styles.homeMetricCard}
              >
                <View style={styles.homeMetricTopRow}>
                  <IconBadge name="call-outline" size="sm" tone="neutral" />
                  <Ionicons color={palette.primary} name="chevron-forward" size={16} />
                </View>
                <View style={styles.homeMetricTextBlock}>
                  <Text style={styles.homeMetricValue}>{unreadCallCount}</Text>
                  <Text style={styles.homeMetricLabel}>Llamadas sin ver</Text>
                </View>
              </Pressable>
            </View>

            <View style={styles.homeShortcutGrid}>
              <ShortcutCard
                description="Buscar unidad y ver opciones protegidas."
                icon="business-outline"
                onPress={openUnitSearch}
                title="Unidades"
              />
              <ShortcutCard
                description="Buscar unidad e iniciar llamada."
                icon="call-outline"
                onPress={openCallsSearch}
                title="Llamadas"
              />
              <ShortcutCard
                description="Abrir listado de chats protegidos."
                icon="chatbubble-ellipses-outline"
                onPress={openMessageHub}
                title="Mensajeria"
                tone="neutral"
              />
              <ShortcutCard
                description="Ver bloqueos y novedades pendientes."
                icon="notifications-outline"
                onPress={openAlertsView}
                title="Alertas"
                tone="green"
              />
            </View>
          </View>
        ) : null}

        {isPorterSession && activePorterView === 'blockedUnits' ? (
          <View style={styles.panel}>
            <View style={styles.panelHeadingRow}>
              <View style={styles.panelHeadingText}>
                <Text style={styles.label}>Control de acceso</Text>
                <Text style={styles.panelTitle}>Unidades bloqueadas</Text>
                <Text style={styles.hint}>
                  Consulta bloqueos activos o filtra cualquier unidad para revisar su estado.
                </Text>
              </View>
              <ActionButton compact label="Inicio" onPress={openPorterHome} tone="home" />
            </View>

            <View style={styles.searchRow}>
              <PaperTextInput
                autoCapitalize="characters"
                dense
                mode="outlined"
                onChangeText={setBlockedUnitQuery}
                label="Filtrar unidad"
                outlineStyle={styles.paperInputOutline}
                placeholder="Ejemplo: 35 1C"
                style={[styles.paperInput, styles.searchInput]}
                value={blockedUnitQuery}
              />
              <ActionButton
                compact
                disabled={loading}
                label="Actualizar"
                onPress={loadPorterUnitsForStatus}
                tone="secondary"
              />
            </View>

            {loading ? <ActivityIndicator color={palette.primary} /> : null}

            {filteredBlockedUnitStatus.length === 0 ? (
              <View style={styles.emptyState}>
                <IconBadge name="shield-checkmark-outline" size="lg" tone="green" />
                <Text style={styles.emptyStateTitle}>
                  {blockedUnitQuery.trim()
                    ? 'No encontramos unidades con ese filtro'
                    : 'No hay unidades bloqueadas'}
                </Text>
                <Text style={styles.emptyStateText}>
                  Cuando administracion bloquee una unidad, aparecera aqui para porteria.
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredBlockedUnitStatus}
                keyExtractor={(item) => `blocked-status-${item.id}`}
                renderItem={({ item }) => (
                  <View style={styles.blockedUnitCard}>
                    <View style={styles.blockedUnitHeader}>
                      <View style={styles.panelHeadingText}>
                        <Text style={styles.unitTitle}>{item.displayLabel}</Text>
                        <Text style={styles.unitMeta}>{item.privacyLabel}</Text>
                      </View>
                      <View
                        style={[
                          styles.unitStatusBadge,
                          item.isAccessBlocked
                            ? styles.unitStatusBadgeBlocked
                            : styles.unitStatusBadgeEnabled,
                        ]}
                      >
                        <Text
                          style={[
                            styles.unitStatusBadgeText,
                            item.isAccessBlocked
                              ? styles.unitStatusBadgeTextBlocked
                              : styles.unitStatusBadgeTextEnabled,
                          ]}
                        >
                          {item.isAccessBlocked ? 'Bloqueada' : 'Habilitada'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.unitMeta}>
                      {item.isAccessBlocked
                        ? item.accessBlockReason || 'No permitir domicilios ni vehiculos.'
                        : 'Unidad sin bloqueo operativo.'}
                    </Text>
                    <View style={styles.cardActionRow}>
                      <ActionButton
                        compact
                        label="Ver unidad"
                        onPress={() => void loadUnit(item)}
                        tone="secondary"
                      />
                    </View>
                  </View>
                )}
                scrollEnabled={false}
              />
            )}
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
              <ShortcutCard
                description="Consulta paquetes recibidos en porteria."
                icon="cube-outline"
                title="Paquetes"
                tone="neutral"
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
              <View style={styles.panelHeadingText}>
                <Text style={styles.panelTitle}>Consulta de apartamentos</Text>
                <Text style={styles.hint}>
                  Lista completa o filtro por bloque, apartamento o combinacion.
                </Text>
              </View>
              <ActionButton compact label="Inicio" onPress={() => setActivePorterView('home')} tone="home" />
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
            ) : hasUnitSearchResults ? (
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
            ) : (
              <View style={styles.emptyState}>
                <IconBadge name="business-outline" size="lg" />
                <Text style={styles.emptyStateTitle}>Busca una unidad</Text>
                <Text style={styles.emptyStateText}>
                  Usa el campo superior para filtrar por bloque o apartamento, o carga el listado completo cuando lo necesites.
                </Text>
              </View>
            )}
          </View>
        ) : null}

        {isPorterSession && activePorterView === 'calls' && !selectedUnit ? (
          <View style={styles.panel}>
            <View style={styles.panelHeadingRow}>
              <View style={styles.panelHeadingText}>
                <Text style={styles.panelTitle}>Llamadas</Text>
                <Text style={styles.hint}>
                  Busca una unidad y registra la llamada sin exponer datos sensibles.
                </Text>
              </View>
              <Chip compact style={styles.roleChip} textStyle={styles.roleChipText}>
                {unreadCallCount} sin revisar
              </Chip>
            </View>

            <View style={styles.callSearchBlock}>
              <Text style={styles.subsectionTitle}>Buscar unidad para llamar</Text>
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
            </View>

            {loading ? <ActivityIndicator color="#111827" /> : null}

            {hasUnitSearchResults ? (
              <FlatList
                data={units}
                keyExtractor={(item) => `call-unit-${item.id}`}
                renderItem={({ item }) => (
                  <Pressable onPress={() => void openUnitCall(item)} style={styles.unitItem}>
                    <View style={styles.unitCallRow}>
                      <View style={styles.panelHeadingText}>
                        <Text style={styles.unitTitle}>{item.displayLabel}</Text>
                        <Text style={styles.unitMeta}>{item.privacyLabel}</Text>
                      </View>
                      <IconBadge name="call-outline" size="sm" />
                    </View>
                  </Pressable>
                )}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyStateCompact}>
                <IconBadge name="call-outline" size="lg" />
                <Text style={styles.emptyStateTitle}>Busca una unidad</Text>
                <Text style={styles.emptyStateText}>
                  Desde aqui podras iniciar la llamada protegida y registrar la trazabilidad.
                </Text>
              </View>
            )}

            <ActionButton
              compact
              label={
                isCallLogOpen
                  ? 'Ocultar historial de llamadas'
                  : 'Ver historial de llamadas'
              }
              onPress={() => setIsCallLogOpen((current) => !current)}
              tone={unreadMissedCallCount > 0 ? 'warning' : 'secondary'}
            />

            {isCallLogOpen ? (
              <View style={styles.callLogList}>
                {callHistoryItems.length === 0 ? (
                  <Text style={styles.hint}>Aun no hay llamadas registradas.</Text>
                ) : (
                  callHistoryItems.map((item) => {
                    const isMissed = isMissedCallItem(item);
                    const directionLabel = isMissed
                      ? 'Perdida'
                      : item.direction === 'inbound'
                        ? 'Entrante'
                        : 'Saliente';

                    return (
                      <Pressable
                        key={`call-log-${item.id}`}
                        onPress={() => handleCallHistoryPress(item)}
                        style={[
                          styles.callLogItem,
                          isMissed &&
                          !item.readAt &&
                          !readCallIds.includes(item.id)
                            ? styles.callLogItemUnreadMissed
                            : null,
                        ]}
                      >
                        <IconBadge
                          name="call-outline"
                          size="sm"
                          tone={isMissed ? 'amber' : 'neutral'}
                        />
                        <View style={styles.panelHeadingText}>
                          <View style={styles.callLogHeader}>
                            <Text style={styles.historyTitle}>{directionLabel}</Text>
                            <Text style={styles.historyType}>{item.status}</Text>
                          </View>
                          <Text style={styles.historyMeta}>{item.subtitle}</Text>
                          <Text style={styles.historyMeta}>
                            {formatHistoryDateTime(item.occurredAt)}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </View>
            ) : null}
          </View>
        ) : null}

        {isPorterSession && activePorterView === 'movements' ? (
          <View style={styles.panel}>
            <ActionButton compact label="Inicio" onPress={() => setActivePorterView('home')} tone="home" />
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
                          onPress={() => void registerMovement(item.authorizationId, 'exit')}
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
            <ActionButton compact label="Inicio" onPress={() => setActivePorterView('home')} tone="home" />
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
            <ActionButton compact label="Inicio" onPress={() => setActivePorterView('home')} tone="home" />
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

        {isPorterSession && activePorterView === 'visitorDashboard' ? (
          <View style={styles.panel}>
            <View style={styles.panelHeadingRow}>
              <View style={styles.panelHeadingText}>
                <Text style={styles.panelTitle}>Visitantes</Text>
                <Text style={styles.hint}>
                  Vista general para porteria: activos, pendientes y gestion por unidad.
                </Text>
              </View>
              <ActionButton compact label="Actualizar" onPress={() => {
                void loadPendingAuthorizations();
                void loadMovements();
              }} tone="secondary" />
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{pendingAuthorizations.length}</Text>
                <Text style={styles.statLabel}>Pend. porteria</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Pend. residente</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{movements.pendingExit.length}</Text>
                <Text style={styles.statLabel}>Activos</Text>
              </View>
            </View>
            <ActionButton
              label="Buscar unidad para registrar"
              onPress={openUnitSearch}
            />
            <AccordionToggle
              isOpen={isActiveVisitorsOpen}
              onPress={() => setIsActiveVisitorsOpen((current) => !current)}
              summary={
                isActiveVisitorsOpen
                  ? 'Ocultar visitantes actualmente dentro del conjunto.'
                  : 'Abrir visitantes activos dentro del conjunto.'
              }
              title="Visitantes activos"
            />
            {isActiveVisitorsOpen ? (
              <View style={styles.accordionBody}>
                {movements.pendingExit.length === 0 ? (
                  <Text style={styles.hint}>No hay visitantes activos registrados.</Text>
                ) : (
                  movements.pendingExit.map((item) => (
                    <Pressable
                      key={`visitor-dashboard-${item.authorizationId}`}
                      onPress={() => setSelectedActiveVisitor(item)}
                      style={styles.historyItem}
                    >
                      <Text style={styles.historyType}>activo</Text>
                      <Text style={styles.historyTitle}>{item.visitorName}</Text>
                      <Text style={styles.historyMeta}>{item.unitLabel} - pendiente salida</Text>
                      <View style={styles.cardActionRow}>
                        <ActionButton
                          compact
                          disabled={loading}
                          label="Registrar salida"
                          onPress={() => void registerMovement(item.authorizationId, 'exit')}
                          tone="danger"
                        />
                      </View>
                    </Pressable>
                  ))
                )}
                {selectedActiveVisitor ? (
                  <View style={styles.detailPanel}>
                    <Text style={styles.historyType}>Detalle del visitante</Text>
                    <Text style={styles.historyTitle}>
                      {selectedActiveVisitor.visitorName}
                    </Text>
                    <Text style={styles.historyMeta}>
                      Unidad: {selectedActiveVisitor.unitLabel}
                    </Text>
                    <Text style={styles.historyMeta}>
                      Tipo: {selectedActiveVisitor.visitorType}
                    </Text>
                    {selectedActiveVisitor.vehiclePlate ? (
                      <Text style={styles.historyMeta}>
                        Placa: {selectedActiveVisitor.vehiclePlate}
                      </Text>
                    ) : null}
                    {selectedActiveVisitor.photoUrl ? (
                      <Image
                        source={{ uri: selectedActiveVisitor.photoUrl }}
                        style={styles.visitorPhotoPreviewLarge}
                      />
                    ) : null}
                    <ActionButton
                      compact
                      label="Cerrar detalle"
                      onPress={() => setSelectedActiveVisitor(null)}
                      tone="secondary"
                    />
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}

        {isPorterSession && activePorterView === 'packages' ? (
          <View style={styles.panel}>
            <View style={styles.panelHeadingRow}>
              <View style={styles.panelHeadingText}>
                <Text style={styles.panelTitle}>Paquetes</Text>
                <Text style={styles.hint}>
                  Registro de paquetes recibidos en porteria para notificar y consultar por unidad.
                </Text>
              </View>
              <ActionButton compact label="Actualizar" onPress={loadPackages} tone="secondary" />
            </View>
            <View style={[styles.statsRow, styles.centeredStatsRow]}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{packageItems.length}</Text>
                <Text style={styles.statLabel}>Registros</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{activePackages.length}</Text>
                <Text style={styles.statLabel}>En porteria</Text>
              </View>
            </View>
            <ActionButton
              disabled={loading}
              label={isPackageFormOpen ? 'Ocultar registro' : 'Registrar paquete'}
              onPress={() => setIsPackageFormOpen((current) => !current)}
            />
            {isPackageFormOpen ? (
              <>
                <Text style={styles.subsectionTitle}>Registrar recibido</Text>
                <TextInput
                  onChangeText={(text) => void updatePackageUnitQuery(text)}
                  placeholder="Ejemplo: 35 1C"
                  style={styles.input}
                  value={packageUnitQuery}
                />
                {packageUnitSuggestions.length > 0 ? (
                  <View style={styles.suggestionList}>
                    {packageUnitSuggestions.map((item) => (
                      <Pressable
                        key={`package-suggestion-${item.id}`}
                        onPress={() => selectPackageUnit(item)}
                        style={styles.suggestionItem}
                      >
                        <Text style={styles.unitTitle}>{item.displayLabel}</Text>
                        <Text style={styles.unitMeta}>Seleccionar unidad</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                <TextInput
                  onChangeText={setPackageRecipientName}
                  placeholder="Recibe o destinatario (opcional)"
                  style={styles.input}
                  value={packageRecipientName}
                />
                <TextInput
                  onChangeText={setPackageType}
                  placeholder="Tipo de paquete (caja, sobre, domicilio...)"
                  style={styles.input}
                  value={packageType}
                />
                <ActionButton disabled={loading} label="Guardar paquete" onPress={registerPackage} />
              </>
            ) : null}
            <Text style={styles.subsectionTitle}>Paquetes en porteria</Text>
            {activePackages.length === 0 ? (
              <View style={styles.emptyState}>
                <IconBadge name="cube-outline" size="lg" tone="green" />
                <Text style={styles.emptyStateTitle}>Sin paquetes en porteria</Text>
                <Text style={styles.emptyStateText}>
                  Los paquetes pendientes de entrega apareceran en esta lista.
                </Text>
              </View>
            ) : (
              activePackages.map((item) => (
                <View key={item.id} style={styles.historyItem}>
                  <Text style={styles.historyType}>{item.status}</Text>
                  <Text style={styles.historyTitle}>{item.unitLabel}</Text>
                  <Text style={styles.historyMeta}>
                    {item.packageType} - {item.recipientName}
                  </Text>
                  {item.status !== 'delivered' ? (
                    <View style={styles.cardActionRow}>
                      <ActionButton
                        compact
                        disabled={loading}
                        label="Marcar entregado"
                        onPress={() =>
                          confirmAction(
                            'Entregar paquete',
                            `Marcar paquete de ${item.unitLabel} como entregado?`,
                            () => void markPackageDelivered(item.id),
                          )
                        }
                        tone="success"
                      />
                    </View>
                  ) : null}
                </View>
              ))
            )}
            <ActionButton
              compact
              label={isPackageHistoryOpen ? 'Ocultar historial' : 'Ver historial'}
              onPress={() => {
                setIsPackageHistoryOpen((current) => !current);
                setPackageHistoryQuery('');
                setPackageHistoryPage(1);
              }}
              tone="secondary"
            />
            {isPackageHistoryOpen ? (
              <View style={styles.accordionBody}>
                <PaperTextInput
                  autoCapitalize="characters"
                  dense
                  mode="outlined"
                  onChangeText={(text) => {
                    setPackageHistoryQuery(text);
                    setPackageHistoryPage(1);
                  }}
                  label="Filtrar historial por unidad"
                  outlineStyle={styles.paperInputOutline}
                  placeholder="Ejemplo: 35 1C"
                  style={styles.paperInput}
                  value={packageHistoryQuery}
                />
                {pagedPackageHistory.length === 0 ? (
                  <Text style={styles.hint}>No hay paquetes para ese filtro.</Text>
                ) : (
                  pagedPackageHistory.map((item) => (
                    <View key={`package-history-${item.id}`} style={styles.historyItem}>
                      <Text style={styles.historyType}>{item.status}</Text>
                      <Text style={styles.historyTitle}>{item.unitLabel}</Text>
                      <Text style={styles.historyMeta}>
                        {item.packageType} - {item.recipientName}
                      </Text>
                    </View>
                  ))
                )}
                <View style={styles.paginationRow}>
                  <ActionButton
                    compact
                    disabled={packageHistoryPage <= 1}
                    label="Anterior"
                    onPress={() =>
                      setPackageHistoryPage((current) => Math.max(1, current - 1))
                    }
                    tone="secondary"
                  />
                  <Text style={styles.paginationText}>
                    {packageHistoryPage} / {packageHistoryTotalPages}
                  </Text>
                  <ActionButton
                    compact
                    disabled={packageHistoryPage >= packageHistoryTotalPages}
                    label="Siguiente"
                    onPress={() =>
                      setPackageHistoryPage((current) =>
                        Math.min(packageHistoryTotalPages, current + 1),
                      )
                    }
                    tone="secondary"
                  />
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {isPorterSession && activePorterView === 'messageHub' ? (
          <View style={styles.panel}>
            <View style={styles.panelHeadingRow}>
              <View style={styles.panelHeadingText}>
                <Text style={styles.panelTitle}>Mensajeria</Text>
                <Text style={styles.hint}>
                  Conversaciones protegidas por unidad.
                </Text>
              </View>
              <Chip compact style={styles.roleChip} textStyle={styles.roleChipText}>
                {unreadMessageCount} pendientes
              </Chip>
            </View>
            <View style={styles.messageHubShell}>
              <View style={styles.messageSearchRow}>
                <Ionicons color={palette.muted} name="search-outline" size={18} />
                <TextInput
                  autoCapitalize="characters"
                  onChangeText={setMessageQuery}
                  placeholder="Buscar chat por unidad"
                  placeholderTextColor="#91a4bd"
                  style={styles.messageSearchInput}
                  value={messageQuery}
                />
                <Pressable
                  disabled={loading}
                  onPress={() => void searchMessageUnits('')}
                  style={styles.messageRefreshButton}
                >
                  <Ionicons color={palette.primary} name="refresh-outline" size={18} />
                </Pressable>
              </View>

              {messageConversationItems.length > 0 ? (
                <FlatList
                  data={messageConversationItems}
                  keyExtractor={(item) => `message-unit-${item.unit.id}`}
                  renderItem={({ item }) => {
                    const latestText =
                      item.latest?.title ||
                      item.latest?.status ||
                      'Sin mensajes registrados';
                    const latestTime = item.latest
                      ? formatChatTime(item.latest.occurredAt)
                      : '';

                    return (
                      <Pressable
                        onPress={() =>
                          item.latest && item.unreadCount > 0
                            ? void openChatFromHistory(item.latest)
                            : void openUnitChat(item.unit)
                        }
                        style={[
                          styles.mobileChatListItem,
                          item.unreadCount > 0 ? styles.mobileChatListItemUnread : null,
                        ]}
                      >
                        <View style={styles.chatListAvatar}>
                          <Text style={styles.chatListAvatarText}>
                            {item.unit.unitNumber.slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.mobileChatContent}>
                          <View style={styles.mobileChatTopRow}>
                            <Text style={styles.mobileChatTitle}>
                              {item.unit.displayLabel}
                            </Text>
                            {latestTime ? (
                              <Text
                                style={[
                                  styles.mobileChatTime,
                                  item.unreadCount > 0
                                    ? styles.mobileChatTimeUnread
                                    : null,
                                ]}
                              >
                                {latestTime}
                              </Text>
                            ) : null}
                          </View>
                          <View style={styles.mobileChatBottomRow}>
                            <View style={styles.mobileChatPreviewBlock}>
                              <Text style={styles.mobileChatResident}>
                                {item.unit.privacyLabel}
                              </Text>
                              <Text
                                numberOfLines={1}
                                style={styles.mobileChatPreview}
                              >
                                {latestText}
                              </Text>
                            </View>
                            {item.unreadCount > 0 ? (
                              <View style={styles.mobileUnreadBadge}>
                                <Text style={styles.mobileUnreadBadgeText}>
                                  {item.unreadCount}
                                </Text>
                              </View>
                            ) : (
                              <Ionicons
                                color={palette.muted}
                                name="chevron-forward"
                                size={17}
                              />
                            )}
                          </View>
                        </View>
                      </Pressable>
                    );
                  }}
                  scrollEnabled={false}
                />
              ) : (
                <View style={styles.emptyState}>
                  <IconBadge name="chatbubble-ellipses-outline" size="lg" />
                  <Text style={styles.emptyStateTitle}>Sin conversaciones visibles</Text>
                  <Text style={styles.emptyStateText}>
                    Actualiza el listado o prueba con otro criterio de busqueda.
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : null}

        {isPorterSession && activePorterView === 'alerts' ? (
          <View style={styles.panel}>
            <View style={styles.panelHeadingRow}>
              <View style={styles.panelHeadingText}>
                <Text style={styles.panelTitle}>Alertas</Text>
                <Text style={styles.hint}>
                  Bloqueos de unidades, mensajes pendientes y novedades operativas.
                </Text>
              </View>
              <Chip compact style={styles.roleChip} textStyle={styles.roleChipText}>
                {unreadAlertCount} nuevas
              </Chip>
            </View>
            {blockedUnitAlerts.length > 0 ? (
              <>
                <Text style={styles.subsectionTitle}>Unidades bloqueadas</Text>
                {blockedUnitAlerts.map((unit) => (
                  <Pressable
                    key={`blocked-${unit.id}`}
                    onPress={() => handleBlockedUnitAlertPress(unit)}
                    style={[
                      styles.alertItem,
                      readBlockedUnitIds.includes(unit.id) ? styles.alertItemRead : null,
                    ]}
                  >
                    <View style={styles.alertHeaderRow}>
                      <IconBadge name="ban-outline" size="sm" tone="amber" />
                      <View style={styles.panelHeadingText}>
                        <Text style={styles.historyTitle}>{unit.displayLabel}</Text>
                        <Text style={styles.historyMeta}>
                          {unit.accessBlockReason || 'No permitir domicilios ni vehiculos.'}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </>
            ) : null}

            {unreadMessageAlerts.length > 0 ? (
              <>
                <Text style={styles.subsectionTitle}>Mensajes sin leer</Text>
                {unreadMessageAlerts.map((item) => (
                  <Pressable
                    key={`alert-message-${item.id}`}
                    onPress={() => void openChatFromHistory(item)}
                    style={[
                      styles.alertItem,
                      readMessageIds.includes(item.id) ? styles.alertItemRead : null,
                    ]}
                  >
                    <View style={styles.alertHeaderRow}>
                      <IconBadge name="chatbubble-ellipses-outline" size="sm" />
                      <View style={styles.panelHeadingText}>
                        <Text style={styles.historyTitle}>{item.title}</Text>
                        <Text style={styles.historyMeta}>{item.subtitle}</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </>
            ) : null}

            {operationalAlerts.length === 0 &&
            blockedUnitAlerts.length === 0 &&
            unreadMessageAlerts.length === 0 ? (
              <View style={styles.emptyState}>
                <IconBadge name="notifications-outline" size="lg" tone="green" />
                <Text style={styles.emptyStateTitle}>Sin alertas pendientes</Text>
                <Text style={styles.emptyStateText}>
                  Los bloqueos, mensajes y novedades importantes apareceran aqui.
                </Text>
              </View>
            ) : (
              <>
                {operationalAlerts.length > 0 ? (
                  <Text style={styles.subsectionTitle}>Otras novedades</Text>
                ) : null}
                {operationalAlerts.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => handleAlertPress(item)}
                    style={[
                      styles.alertItem,
                      readAlertIds.includes(item.id) ? styles.alertItemRead : null,
                    ]}
                  >
                    <View style={styles.alertHeaderRow}>
                      <IconBadge
                        name={item.targetView === 'movements' ? 'log-in-outline' : 'notifications-outline'}
                        size="sm"
                        tone={item.tone}
                      />
                      <View style={styles.panelHeadingText}>
                        <Text style={styles.historyTitle}>{item.title}</Text>
                        <Text style={styles.historyMeta}>{item.body}</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </>
            )}
          </View>
        ) : null}

        {isPorterSession &&
        selectedUnit &&
        ['unit', 'visitors', 'calls', 'messages'].includes(activePorterView) ? (
          <View style={styles.panel}>
            {activePorterView !== 'calls' ? (
              <>
                <View style={styles.panelHeadingRow}>
                  <View style={styles.panelHeadingText}>
                    <Text style={styles.panelTitle}>Unidad seleccionada</Text>
                    <Text style={styles.selectedTitle}>{selectedUnit.displayLabel}</Text>
                  </View>
                  <ActionButton
                    compact
                    label="Buscar"
                    onPress={openUnitSearch}
                    tone="secondary"
                  />
                </View>
                {activePorterView === 'unit' ? (
                  <>
                    <Text style={styles.hint}>{selectedUnit.protectedSummary}</Text>
                    <Text style={styles.privacy}>{selectedUnit.privacyNotice}</Text>
                    {selectedUnit.visibleResidentNames ? (
                      <Text style={styles.unitMeta}>
                        Residente visible: {selectedUnit.visibleResidentNames}
                      </Text>
                    ) : null}
                    {selectedUnit.visibleResidentPhones ? (
                      <Text style={styles.unitMeta}>
                        Telefono visible: {selectedUnit.visibleResidentPhones}
                      </Text>
                    ) : null}
                    {selectedUnit.isAccessBlocked ? (
                      <View style={styles.blockedNotice}>
                        <Ionicons color={palette.red} name="ban-outline" size={18} />
                        <Text style={styles.blockedNoticeText}>
                          Unidad bloqueada: {selectedUnit.accessBlockReason || 'no permitir domicilios ni vehiculos.'}
                        </Text>
                      </View>
                    ) : null}
                  </>
                ) : null}

                {activePorterView !== 'unit' ? (
                  <ActionButton
                    compact
                    label="Volver a unidad"
                    onPress={() => setActivePorterView('unit')}
                    tone="secondary"
                  />
                ) : null}

                {activePorterView !== 'messages' ? (
                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>
                        {selectedUnitPendingPorter}
                      </Text>
                      <Text style={styles.statLabel}>Pend. porteria</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>
                        {selectedUnitPendingResident}
                      </Text>
                      <Text style={styles.statLabel}>Pend. residente</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>
                        {selectedUnitActiveVisits.length}
                      </Text>
                      <Text style={styles.statLabel}>Visitas activas</Text>
                    </View>
                  </View>
                ) : null}
              </>
            ) : null}

            {activePorterView === 'unit' ? (
              <View style={styles.shortcutGrid}>
                <ShortcutCard
                  description="Registrar llamada a la unidad con trazabilidad."
                  icon="call-outline"
                  onPress={openCallView}
                  title="Llamar a la unidad"
                />
                <ShortcutCard
                  description="Abrir chat protegido con el residente."
                  icon="chatbubble-ellipses-outline"
                  onPress={() => {
                    setActivePorterView('messages');
                    setChatVisibleCount(15);
                    void loadChatHistory();
                  }}
                  title="Mensajeria"
                  tone="neutral"
                />
              </View>
            ) : null}

            {activePorterView === 'calls' ? (
              <>
                <View style={styles.callScreen}>
                  <View style={styles.callAvatar}>
                    <Ionicons color={palette.primary} name="call" size={36} />
                  </View>
                  <Text style={styles.callTitle}>Llamada protegida</Text>
                  <Text style={styles.callUnitLabel}>{selectedUnit.displayLabel}</Text>
                  <Text style={styles.callNumber}>Numero: *** *** **48</Text>
                  <Text style={styles.callStatus}>
                    {activeCall?.status === 'ended'
                        ? 'Finalizada'
                        : 'Llamada en curso'}
                  </Text>
                  <Text style={styles.callTimer}>
                    {formatDuration(activeCall?.durationSeconds ?? 0)}
                  </Text>

                  {activeCall && activeCall.status !== 'ended' ? (
                    <ActionButton
                      disabled={loading || !selectedUnit.canCall}
                      label="Finalizar llamada"
                      onPress={() => void endActiveCall()}
                      tone="danger"
                    />
                  ) : null}

                  {activeCall?.status === 'ended' ? (
                    <>
                      <View style={styles.callActions}>
                        <ActionButton
                          flex
                          label="Volver a marcar"
                          onPress={() => void registerCall('initiated')}
                        />
                        <ActionButton
                          flex
                          label="Mensajeria"
                          onPress={() => {
                            setActivePorterView('messages');
                            void loadChatHistory();
                          }}
                          tone="secondary"
                        />
                      </View>
                      <View style={styles.callHistoryButtonRow}>
                        <ActionButton
                          compact
                          label={
                            isCallHistoryOpen
                              ? 'Ocultar historial'
                              : 'Ver historial de llamadas'
                          }
                          onPress={() => setIsCallHistoryOpen((current) => !current)}
                          tone="secondary"
                        />
                      </View>
                      <ActionButton
                        compact
                        label="Volver a unidad"
                        onPress={() => setActivePorterView('unit')}
                        tone="secondary"
                      />
                    </>
                  ) : null}
                </View>

                {isCallHistoryOpen ? (
                  <>
                    <Text style={styles.subsectionTitle}>Historial de llamadas</Text>
                    {recentCallHistory.length === 0 ? (
                      <Text style={styles.hint}>
                        Aun no hay llamadas recientes para esta unidad.
                      </Text>
                    ) : (
                      recentCallHistory.map((item) => (
                        <View key={`recent-call-${item.id}`} style={styles.historyItem}>
                          <Text style={styles.historyType}>llamada</Text>
                          <Text style={styles.historyTitle}>{item.status}</Text>
                          <Text style={styles.historyMeta}>{item.subtitle}</Text>
                        </View>
                      ))
                    )}
                  </>
                ) : null}
              </>
            ) : null}

            {activePorterView === 'visitors' ? (
              <>
                <View style={styles.divider} />

                <Text style={styles.subsectionTitle}>Visitantes activos en la unidad</Text>
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
                      {item.vehiclePlate ? (
                        <Text style={styles.historyMeta}>Placa: {item.vehiclePlate}</Text>
                      ) : null}
                      {item.photoUrl ? (
                        <Image source={{ uri: item.photoUrl }} style={styles.visitorPhotoPreview} />
                      ) : null}
                      <View style={styles.cardActionRow}>
                        <ActionButton
                          compact
                          disabled={loading}
                          label="Registrar salida"
                          onPress={() => void registerMovement(item.authorizationId, 'exit')}
                          tone="danger"
                        />
                      </View>
                    </View>
                  ))
                )}

                <Text style={styles.subsectionTitle}>Pendientes por confirmar en porteria</Text>
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
                      {item.vehiclePlate ? (
                        <Text style={styles.historyMeta}>Placa: {item.vehiclePlate}</Text>
                      ) : null}
                      {item.photoUrl ? (
                        <Image source={{ uri: item.photoUrl }} style={styles.visitorPhotoPreview} />
                      ) : null}
                    </View>
                  ))
                )}

                <View style={styles.divider} />

                <ActionButton
                  label={isVisitorFormOpen ? 'Ocultar registro' : 'Registrar visitante'}
                  onPress={() => setIsVisitorFormOpen((current) => !current)}
                  tone={isVisitorFormOpen ? 'secondary' : 'primary'}
                />

                {!isVisitorFormOpen ? (
                  <View style={styles.emptyState}>
                    <IconBadge name="person-add-outline" size="lg" tone="green" />
                    <Text style={styles.emptyStateTitle}>Registro bajo demanda</Text>
                    <Text style={styles.emptyStateText}>
                      Abre el formulario solo cuando llegue un visitante nuevo a esta unidad.
                    </Text>
                  </View>
                ) : (
                  <>
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
                    <TextInput
                      autoCapitalize="characters"
                      onChangeText={setVehiclePlate}
                      placeholder="Placa del vehiculo (opcional)"
                      style={styles.input}
                      value={vehiclePlate}
                    />
                  <TextInput
                    onChangeText={setVisitReason}
                    placeholder="Motivo"
                    style={styles.input}
                    value={visitReason}
                  />
                    <ActionButton
                      disabled={loading}
                      label={visitorPhotoUri ? 'Cambiar foto' : 'Tomar foto'}
                      onPress={() => void takeVisitorPhoto()}
                      tone="secondary"
                    />
                    {visitorPhotoUri ? (
                      <Image source={{ uri: visitorPhotoUri }} style={styles.visitorPhotoPreviewLarge} />
                    ) : null}
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
                )}
              </>
            ) : null}

            {activePorterView === 'messages' ? (
              <>
            <View style={styles.divider} />

            <View style={styles.chatShellFull}>
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
                {chatHistory.length > chatVisibleCount ? (
                  <Pressable
                    onPress={() => setChatVisibleCount((current) => current + 15)}
                    style={styles.loadMoreMessages}
                  >
                    <Text style={styles.loadMoreMessagesText}>Ver mensajes anteriores</Text>
                  </Pressable>
                ) : null}
                {chatHistory.length === 0 ? (
                  <View style={styles.emptyChat}>
                    <Text style={styles.emptyChatTitle}>Sin mensajes cargados</Text>
                    <Text style={styles.emptyChatText}>
                      Carga el historial o envia el primer mensaje protegido.
                    </Text>
                  </View>
                ) : (
                  visibleChatMessages.map((item) => {
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
                  label="Enviar"
                  onPress={() => void sendMessage('text')}
                />
              </View>
              <View style={styles.chatUtilityRow}>
                <Ionicons color={palette.muted} name="mic-outline" size={18} />
                <Text style={styles.chatUtilityText}>
                  Audio preparado para integrar con WhatsApp Business en la siguiente fase.
                </Text>
              </View>
            </View>
              </>
            ) : null}
          </View>
        ) : null}
        </ScrollView>
        {session && isPorterSession ? (
          <View style={styles.bottomNav}>
            <Pressable
              onPress={openPorterHome}
              style={activePorterView === 'home' ? styles.bottomNavItemActive : styles.bottomNavItem}
            >
              <Ionicons
                color={activePorterView === 'home' ? palette.primary : palette.muted}
                name="home"
                size={20}
              />
              <Text style={activePorterView === 'home' ? styles.bottomNavTextActive : styles.bottomNavText}>
                Inicio
              </Text>
            </Pressable>
            <Pressable
              onPress={openUnitSearch}
              style={
                ['search', 'unit'].includes(activePorterView)
                  ? styles.bottomNavItemActive
                  : styles.bottomNavItem
              }
            >
              <Ionicons
                color={
                  ['search', 'unit'].includes(activePorterView)
                    ? palette.primary
                    : palette.muted
                }
                name="business-outline"
                size={20}
              />
              <Text
                style={
                  ['search', 'unit'].includes(activePorterView)
                    ? styles.bottomNavTextActive
                    : styles.bottomNavText
                }
              >
                Unidades
              </Text>
            </Pressable>
            <Pressable
              onPress={openCallsSearch}
              style={activePorterView === 'calls' ? styles.bottomNavItemActive : styles.bottomNavItem}
            >
              <View style={styles.navIconWrap}>
                <Ionicons
                  color={activePorterView === 'calls' ? palette.primary : palette.muted}
                  name="call-outline"
                  size={20}
                />
                {unreadCallCount > 0 ? (
                  <View style={styles.navBadge}>
                    <Text style={styles.navBadgeText}>{unreadCallCount}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={activePorterView === 'calls' ? styles.bottomNavTextActive : styles.bottomNavText}>
                Llamadas
              </Text>
            </Pressable>
            <Pressable
              onPress={openMessageHub}
              style={
                ['messageHub', 'messages'].includes(activePorterView)
                  ? styles.bottomNavItemActive
                  : styles.bottomNavItem
              }
            >
              <View style={styles.navIconWrap}>
                <Ionicons
                  color={
                    ['messageHub', 'messages'].includes(activePorterView)
                      ? palette.primary
                      : palette.muted
                  }
                  name="chatbubble-ellipses-outline"
                  size={20}
                />
                {unreadMessageCount > 0 ? (
                  <View style={styles.navBadge}>
                    <Text style={styles.navBadgeText}>{unreadMessageCount}</Text>
                  </View>
                ) : null}
              </View>
              <Text
                style={
                  ['messageHub', 'messages'].includes(activePorterView)
                    ? styles.bottomNavTextActive
                    : styles.bottomNavText
                }
              >
                Mensajeria
              </Text>
            </Pressable>
            <Pressable
              onPress={openAlertsView}
              style={activePorterView === 'alerts' ? styles.bottomNavItemActive : styles.bottomNavItem}
            >
              <View style={styles.navIconWrap}>
                <Ionicons color={activePorterView === 'alerts' ? palette.primary : palette.muted} name="notifications-outline" size={20} />
                {unreadAlertCount > 0 ? (
                  <View style={styles.navBadge}>
                    <Text style={styles.navBadgeText}>{unreadAlertCount}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={activePorterView === 'alerts' ? styles.bottomNavTextActive : styles.bottomNavText}>Alertas</Text>
            </Pressable>
          </View>
        ) : null}
        {session && !isPorterSession ? (
          <View style={[styles.bottomNav, isAdminWebLayout ? styles.adminWebBottomNav : null]}>
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
  adminWebContent: {
    maxWidth: 1180,
    paddingHorizontal: 28,
    paddingTop: 28,
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
  adminWebBottomNav: {
    paddingHorizontal: 320,
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
  navIconWrap: {
    position: 'relative',
  },
  navBadge: {
    alignItems: 'center',
    backgroundColor: palette.red,
    borderRadius: 999,
    minWidth: 18,
    paddingHorizontal: 5,
    paddingVertical: 1,
    position: 'absolute',
    right: -12,
    top: -8,
  },
  navBadgeText: {
    color: '#ffffff',
    fontFamily: appFonts.medium,
    fontSize: 10,
    fontWeight: '900',
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
    justifyContent: 'center',
  },
  adminVisitorCard: {
    alignItems: 'center',
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
    textAlign: 'center',
  },
  adminVisitorLabel: {
    color: palette.muted,
    fontFamily: appFonts.light,
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
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
  homeShell: {
    backgroundColor: '#ffffff',
    gap: 18,
  },
  homeHeader: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomColor: palette.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  homeHeaderText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  homeTitle: {
    color: palette.ink,
    flexShrink: 1,
    flexWrap: 'wrap',
    fontFamily: appFonts.black,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
  },
  homeSubtitle: {
    color: palette.muted,
    flexShrink: 1,
    flexWrap: 'wrap',
    fontFamily: appFonts.light,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  homeMetricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  homeMetricCard: {
    backgroundColor: '#ffffff',
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    flexBasis: '48%',
    gap: 10,
    justifyContent: 'space-between',
    minHeight: 104,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  homeMetricTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  homeMetricTextBlock: {
    gap: 2,
    minWidth: 0,
  },
  homeMetricValue: {
    color: palette.ink,
    fontFamily: appFonts.black,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
  },
  homeMetricLabel: {
    color: palette.muted,
    fontFamily: appFonts.medium,
    fontSize: 12,
    lineHeight: 15,
  },
  homeShortcutGrid: {
    gap: 10,
  },
  adminWebRoleView: {
    gap: 18,
  },
  adminWebHeroPanel: {
    backgroundColor: '#ffffff',
    borderColor: palette.line,
    borderWidth: 1,
    gap: 22,
    padding: 24,
    shadowColor: '#0b3778',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 2,
  },
  adminWebPanel: {
    backgroundColor: '#ffffff',
    borderColor: palette.line,
    borderWidth: 1,
    flex: 1,
    gap: 16,
    padding: 22,
    shadowColor: '#0b3778',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 1,
  },
  adminWebDashboardGrid: {
    flexDirection: 'row',
    gap: 18,
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
  accordionHeaderWarning: {
    backgroundColor: '#fff8e7',
    borderColor: '#ffd37a',
    borderWidth: 1,
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
  adminWebSessionBar: {
    paddingHorizontal: 28,
    paddingVertical: 14,
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
    flexShrink: 1,
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
  unitCallRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
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
  emptyState: {
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    minHeight: 180,
    paddingHorizontal: 18,
    paddingVertical: 22,
  },
  emptyStateCompact: {
    backgroundColor: '#ffffff',
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  emptyStateTitle: {
    color: palette.ink,
    fontFamily: appFonts.medium,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyStateText: {
    color: palette.muted,
    fontFamily: appFonts.light,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
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
  blockedNotice: {
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    padding: 12,
  },
  blockedNoticeText: {
    color: '#991b1b',
    flex: 1,
    fontFamily: appFonts.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  blockedUnitCard: {
    backgroundColor: '#ffffff',
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    marginTop: 10,
    padding: 14,
  },
  blockedUnitHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  unitStatusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  unitStatusBadgeBlocked: {
    backgroundColor: '#fef2f2',
  },
  unitStatusBadgeEnabled: {
    backgroundColor: '#e8f7ef',
  },
  unitStatusBadgeText: {
    fontFamily: appFonts.medium,
    fontSize: 12,
    fontWeight: '900',
  },
  unitStatusBadgeTextBlocked: {
    color: '#b91c1c',
  },
  unitStatusBadgeTextEnabled: {
    color: palette.green,
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
  detailPanel: {
    backgroundColor: '#ffffff',
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  alertItem: {
    backgroundColor: '#fff8e7',
    borderBottomColor: palette.line,
    borderRadius: 8,
    borderBottomWidth: 1,
    padding: 12,
  },
  alertItemRead: {
    backgroundColor: '#ffffff',
    opacity: 0.72,
  },
  alertHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
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
  centeredStatsRow: {
    alignSelf: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  callGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  callScreen: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  callAvatar: {
    alignItems: 'center',
    backgroundColor: '#eaf4ff',
    borderRadius: 999,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  callTitle: {
    color: palette.ink,
    fontFamily: appFonts.black,
    fontSize: 22,
    fontWeight: '900',
  },
  callUnitLabel: {
    color: palette.ink,
    fontFamily: appFonts.medium,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  callNumber: {
    color: palette.muted,
    fontFamily: appFonts.medium,
    fontSize: 14,
    fontWeight: '800',
  },
  callStatus: {
    color: palette.green,
    fontFamily: appFonts.medium,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  callTimer: {
    color: palette.ink,
    fontFamily: appFonts.black,
    fontSize: 42,
    fontWeight: '900',
  },
  callActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  callHistoryButtonRow: {
    alignItems: 'center',
    width: '100%',
  },
  callSearchBlock: {
    backgroundColor: '#ffffff',
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  callLogList: {
    backgroundColor: '#ffffff',
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  callLogItem: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomColor: palette.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  callLogItemUnreadMissed: {
    backgroundColor: '#fff8e7',
  },
  callLogHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
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
    alignItems: 'center',
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
    textAlign: 'center',
  },
  statLabel: {
    color: palette.muted,
    fontFamily: appFonts.light,
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
  },
  suggestionList: {
    backgroundColor: '#ffffff',
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  suggestionItem: {
    borderBottomColor: palette.line,
    borderBottomWidth: 1,
    padding: 12,
  },
  paginationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  paginationText: {
    color: palette.ink,
    fontFamily: appFonts.medium,
    fontSize: 13,
    fontWeight: '900',
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
  chatShellFull: {
    backgroundColor: '#ffffff',
    borderColor: 'transparent',
    borderRadius: 8,
    borderWidth: 0,
    flex: 1,
    minHeight: 520,
    overflow: 'hidden',
  },
  messageHubShell: {
    backgroundColor: '#ffffff',
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  messageSearchRow: {
    alignItems: 'center',
    backgroundColor: '#f6faff',
    borderBottomColor: palette.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  messageSearchInput: {
    color: palette.ink,
    flex: 1,
    fontFamily: appFonts.light,
    fontSize: 14,
    minHeight: 38,
    padding: 0,
  },
  messageRefreshButton: {
    alignItems: 'center',
    backgroundColor: '#eaf4ff',
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  chatListItem: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomColor: palette.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  mobileChatListItem: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomColor: palette.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  mobileChatListItemUnread: {
    backgroundColor: '#f6faff',
  },
  mobileChatContent: {
    flex: 1,
    minWidth: 0,
  },
  mobileChatTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  mobileChatTitle: {
    color: palette.ink,
    flex: 1,
    fontFamily: appFonts.medium,
    fontSize: 15,
    fontWeight: '900',
  },
  mobileChatTime: {
    color: palette.muted,
    fontFamily: appFonts.light,
    fontSize: 11,
  },
  mobileChatTimeUnread: {
    color: palette.green,
    fontFamily: appFonts.medium,
    fontWeight: '900',
  },
  mobileChatBottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    marginTop: 2,
  },
  mobileChatPreviewBlock: {
    flex: 1,
    minWidth: 0,
  },
  mobileChatResident: {
    color: palette.muted,
    fontFamily: appFonts.medium,
    fontSize: 12,
    fontWeight: '800',
  },
  mobileChatPreview: {
    color: palette.muted,
    fontFamily: appFonts.light,
    fontSize: 12,
    marginTop: 1,
  },
  mobileUnreadBadge: {
    alignItems: 'center',
    backgroundColor: palette.green,
    borderRadius: 999,
    minWidth: 22,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  mobileUnreadBadgeText: {
    color: '#ffffff',
    fontFamily: appFonts.medium,
    fontSize: 11,
    fontWeight: '900',
  },
  chatListAvatar: {
    alignItems: 'center',
    backgroundColor: palette.primary,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  chatListAvatarText: {
    color: '#ffffff',
    fontFamily: appFonts.black,
    fontSize: 13,
    fontWeight: '900',
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
    minHeight: 360,
    paddingVertical: 12,
  },
  loadMoreMessages: {
    alignSelf: 'center',
    backgroundColor: '#eaf4ff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  loadMoreMessagesText: {
    color: palette.primaryDark,
    fontFamily: appFonts.medium,
    fontSize: 12,
    fontWeight: '900',
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
  chatUtilityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  chatUtilityText: {
    color: palette.muted,
    flex: 1,
    fontFamily: appFonts.light,
    fontSize: 12,
    lineHeight: 17,
  },
  visitorPhotoPreview: {
    borderRadius: 8,
    height: 76,
    marginTop: 8,
    width: 96,
  },
  visitorPhotoPreviewLarge: {
    alignSelf: 'center',
    borderRadius: 8,
    height: 180,
    width: '100%',
  },
});
