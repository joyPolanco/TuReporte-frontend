import React, {
  useState,
  useMemo,
  useRef,
  useCallback,
  useEffect,
} from "react";
import {
  Home,
  Map as MapIcon,
  PlusCircle,
  User,
  Bell,
  Search,
  Heart,
  MessageCircle,
  Camera,
  X,
  Check,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  Shield,
  Users,
  BarChart3,
  LogOut,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Lock,
  Eye,
  EyeOff,
  Award,
  TrendingUp,
  Building2,
  Trash2,
  Droplet,
  Droplets,
  Lightbulb,
  Leaf,
  Construction,
  HelpCircle,
  FileText,
  UserPlus,
  Filter,
  Star,
  Flag,
  Loader2,
  ScanLine,
  CreditCard,
  Phone,
  Mail,
  ArrowRight,
  ArrowLeft,
  Trophy,
  ThumbsUp,
  Send,
  Image as ImageIcon,
  Layers,
  Activity,
  Globe,
  ShieldCheck,
  ClipboardList,
  BadgeCheck,
  RefreshCw,
  Sparkles,
  ListChecks,
  TimerReset,
  Copy,
  UserCircle2,
  ChevronsUpDown,
  Info,
  Download,
  Gauge,
  Medal,
  MapPinned,
  ArrowUpRight,
  ArrowDownRight,
  CheckSquare,
  Square,
  PlayCircle,
  Ban,
  ClipboardCheck,
  Plus,
  Wrench,
  CalendarClock,
  History,
  Settings2,
  Flame,
  Edit2,
  Save,
  XCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import LandingPage from "./LandingPage.jsx";

// --- MAPA PROFESIONAL CON LEAFLET ---
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMap,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix para iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// ============================================================================
// TuReporte — MVP de frontend (React + Tailwind)
// Todo el contenido (usuarios, reportes, catálogo, instituciones) es simulado
// en memoria. No hay backend real: sirve para validar flujo, UX y arquitectura
// de una plataforma profesional de gestión de incidencias ciudadanas.
//
// MODELO OPERATIVO: Reportar → Validar → Clasificar → Asignar → Gestionar →
// Verificar → Resolver → Cerrar → Auditar. Ver TRANSITIONS más abajo para las
// transiciones de estado válidas por rol.
// ============================================================================

/* ---------------------------------- ROLES --------------------------------- */

const ROLE_META = {
  ciudadano: { label: "Ciudadano" },
  gestor: { label: "Gestor de incidencias" },
  supervisor: { label: "Supervisor" },
  admin: { label: "Administrador del sistema" },
};

/* Lo que cada rol puede hacer a nivel de plataforma (más allá de las
   transiciones de estado, que se controlan aparte en TRANSITIONS).
   Gestor = control OPERATIVO. Supervisor = gestor + verificación + arbitraje
   de escalamientos. Administrador = control TOTAL del sistema. */
const PERMISSIONS = {
  ciudadano: {
    crear: true,
    aportarInfo: true,
    reabrirPropio: true,
    calificar: true,
    confirmarResolucion: true,
  },
  gestor: {
    revisar: true,
    validar: true,
    clasificar: true,
    asignar: true,
    reasignar: true,
    escalar: true,
    marcarParaVerificacion: true,
    cerrar: true,
    reabrir: true,
    verificar: true,
    coordinarInstituciones: true,
    administrarCatalogo: false,
    administrarUsuarios: false,
    administrarInstituciones: false,
    verAuditoria: true,
  },
  supervisor: {
    revisar: true,
    validar: true,
    clasificar: true,
    asignar: true,
    reasignar: true,
    escalar: true,
    marcarParaVerificacion: true,
    cerrar: true,
    reabrir: true,
    verificar: true,
    resolverEscalamientos: true,
    coordinarInstituciones: true,
    administrarCatalogo: false,
    administrarUsuarios: false,
    administrarInstituciones: false,
    verAuditoria: true,
  },
  admin: {
    revisar: true,
    validar: true,
    clasificar: true,
    asignar: true,
    reasignar: true,
    escalar: true,
    marcarParaVerificacion: true,
    cerrar: true,
    reabrir: true,
    verificar: true,
    resolverEscalamientos: true,
    coordinarInstituciones: true,
    administrarCatalogo: true,
    administrarUsuarios: true,
    administrarInstituciones: true,
    verAuditoria: true,
  },
};
const can = (role, perm) => !!(PERMISSIONS[role] && PERMISSIONS[role][perm]);

/* -------------------------------- CATÁLOGO -------------------------------- */
/* Categoría → Subcategoría → institución sugerida (por tipo) + prioridad y
   SLA por defecto. Esto es lo que un panel de administración de catálogo
   editaría; aquí vive como datos de configuración, no si/else en el código. */

const CATEGORIES = [
  {
    id: "calles",
    label: "Infraestructura vial",
    Icon: Construction,
    badge: "bg-orange-100 text-orange-700",
    dot: "bg-orange-500",
    color: "#ea580c",
    defaultInstitutionKind: "ayuntamiento",
  },
  {
    id: "alumbrado",
    label: "Alumbrado público",
    Icon: Lightbulb,
    badge: "bg-yellow-100 text-yellow-800",
    dot: "bg-yellow-500",
    color: "#ca8a04",
    defaultInstitutionKind: "distribuidora",
  },
  {
    id: "basura",
    label: "Residuos y limpieza",
    Icon: Trash2,
    badge: "bg-amber-100 text-amber-800",
    dot: "bg-amber-600",
    color: "#b45309",
    defaultInstitutionKind: "ayuntamiento",
  },
  {
    id: "alcantarillado",
    label: "Alcantarillado y saneamiento",
    Icon: Droplet,
    badge: "bg-cyan-100 text-cyan-700",
    dot: "bg-cyan-600",
    color: "#0e7490",
    defaultInstitutionKind: "institucion_nacional",
  },
  {
    id: "agua",
    label: "Suministro de agua potable",
    Icon: Droplets,
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
    color: "#2563eb",
    defaultInstitutionKind: "institucion_nacional",
  },
  {
    id: "ambiente",
    label: "Medio ambiente",
    Icon: Leaf,
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-600",
    color: "#059669",
    defaultInstitutionKind: "institucion_nacional",
  },
  {
    id: "ocupacion",
    label: "Espacio público",
    Icon: AlertTriangle,
    badge: "bg-purple-100 text-purple-700",
    dot: "bg-purple-500",
    color: "#7c3aed",
    defaultInstitutionKind: "ayuntamiento",
  },
  {
    id: "mobiliario",
    label: "Mobiliario urbano",
    Icon: Building2,
    badge: "bg-rose-100 text-rose-700",
    dot: "bg-rose-500",
    color: "#e11d48",
    defaultInstitutionKind: "ayuntamiento",
  },
  {
    id: "otro",
    label: "Otro",
    Icon: HelpCircle,
    badge: "bg-slate-100 text-slate-700",
    dot: "bg-slate-500",
    color: "#475569",
    defaultInstitutionKind: "ayuntamiento",
  },
];
const getCategory = (id) =>
  CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

const SUBCATEGORIES = [
  {
    id: "sc-bache",
    categoryId: "calles",
    label: "Bache",
    defaultPriority: "alta",
  },
  {
    id: "sc-semaforo",
    categoryId: "calles",
    label: "Semáforo dañado",
    defaultPriority: "alta",
  },
  {
    id: "sc-senalizacion",
    categoryId: "calles",
    label: "Señalización vial ausente/dañada",
    defaultPriority: "media",
  },
  {
    id: "sc-inundacion",
    categoryId: "calles",
    label: "Vía inundada",
    defaultPriority: "alta",
  },
  {
    id: "sc-via-obstruida",
    categoryId: "calles",
    label: "Vía obstruida",
    defaultPriority: "media",
  },

  {
    id: "sc-luminaria-apagada",
    categoryId: "alumbrado",
    label: "Luminaria apagada",
    defaultPriority: "media",
  },
  {
    id: "sc-poste-danado",
    categoryId: "alumbrado",
    label: "Poste dañado o inclinado",
    defaultPriority: "alta",
  },
  {
    id: "sc-cableado",
    categoryId: "alumbrado",
    label: "Cableado expuesto",
    defaultPriority: "critica",
  },

  {
    id: "sc-acumulacion",
    categoryId: "basura",
    label: "Acumulación de basura",
    defaultPriority: "media",
  },
  {
    id: "sc-contenedor",
    categoryId: "basura",
    label: "Contenedor desbordado",
    defaultPriority: "media",
  },
  {
    id: "sc-quema",
    categoryId: "basura",
    label: "Quema de basura a cielo abierto",
    defaultPriority: "alta",
  },

  {
    id: "sc-alcantarilla-obstruida",
    categoryId: "alcantarillado",
    label: "Alcantarilla obstruida",
    defaultPriority: "alta",
  },
  {
    id: "sc-tapa-faltante",
    categoryId: "alcantarillado",
    label: "Tapa de alcantarilla faltante",
    defaultPriority: "critica",
  },
  {
    id: "sc-aguas-residuales",
    categoryId: "alcantarillado",
    label: "Fuga de aguas residuales",
    defaultPriority: "alta",
  },

  {
    id: "sc-falta-suministro",
    categoryId: "agua",
    label: "Falta de suministro",
    defaultPriority: "alta",
  },
  {
    id: "sc-fuga-potable",
    categoryId: "agua",
    label: "Fuga de agua potable",
    defaultPriority: "alta",
  },
  {
    id: "sc-baja-presion",
    categoryId: "agua",
    label: "Baja presión",
    defaultPriority: "media",
  },

  {
    id: "sc-canada",
    categoryId: "ambiente",
    label: "Contaminación de cañada/cuerpo de agua",
    defaultPriority: "alta",
  },
  {
    id: "sc-arbol-caido",
    categoryId: "ambiente",
    label: "Árbol caído",
    defaultPriority: "alta",
  },
  {
    id: "sc-tala",
    categoryId: "ambiente",
    label: "Tala ilegal",
    defaultPriority: "media",
  },

  {
    id: "sc-ocupacion-acera",
    categoryId: "ocupacion",
    label: "Ocupación de acera",
    defaultPriority: "baja",
  },
  {
    id: "sc-venta-ambulante",
    categoryId: "ocupacion",
    label: "Venta ambulante no autorizada",
    defaultPriority: "baja",
  },
  {
    id: "sc-escombros",
    categoryId: "ocupacion",
    label: "Escombros en vía pública",
    defaultPriority: "media",
  },

  {
    id: "sc-banca-danada",
    categoryId: "mobiliario",
    label: "Banca deteriorada",
    defaultPriority: "baja",
  },
  {
    id: "sc-parque-danado",
    categoryId: "mobiliario",
    label: "Equipo de parque dañado",
    defaultPriority: "media",
  },

  {
    id: "sc-otro",
    categoryId: "otro",
    label: "Otro / no clasificado",
    defaultPriority: "media",
  },
];
const getSubcategoriesFor = (categoryId) =>
  SUBCATEGORIES.filter((s) => s.categoryId === categoryId);
const getSubcategory = (id) => SUBCATEGORIES.find((s) => s.id === id);

/* ------------------------------ INSTITUCIONES ------------------------------ */

const INSTITUTIONS = [
  {
    id: "ayto-dn",
    name: "Ayuntamiento del Distrito Nacional",
    short: "ADN",
    kind: "ayuntamiento",
  },
  {
    id: "ayto-sde",
    name: "Ayuntamiento Santo Domingo Este",
    short: "ASDE",
    kind: "ayuntamiento",
  },
  {
    id: "ayto-sdn",
    name: "Ayuntamiento Santo Domingo Norte",
    short: "ASDN",
    kind: "ayuntamiento",
  },
  {
    id: "ayto-sdo",
    name: "Ayuntamiento Santo Domingo Oeste",
    short: "ASDO",
    kind: "ayuntamiento",
  },
  {
    id: "ayto-alc",
    name: "Ayuntamiento Los Alcarrizos",
    short: "A. Alcarrizos",
    kind: "ayuntamiento",
  },
  {
    id: "ayto-bch",
    name: "Ayuntamiento Boca Chica",
    short: "A. Boca Chica",
    kind: "ayuntamiento",
  },
  {
    id: "ayto-pbr",
    name: "Ayuntamiento Pedro Brand",
    short: "A. Pedro Brand",
    kind: "ayuntamiento",
  },
  {
    id: "ayto-sag",
    name: "Ayuntamiento San Antonio de Guerra",
    short: "A. San Antonio",
    kind: "ayuntamiento",
  },
  {
    id: "caasd",
    name: "CAASD — Acueducto y Alcantarillado de Santo Domingo",
    short: "CAASD",
    kind: "institucion_nacional",
  },
  {
    id: "inapa",
    name: "INAPA — Instituto Nacional de Aguas Potables",
    short: "INAPA",
    kind: "institucion_nacional",
  },
  {
    id: "mopc",
    name: "MOPC — Obras Públicas y Comunicaciones",
    short: "MOPC",
    kind: "institucion_nacional",
  },
  {
    id: "medioambiente",
    name: "Ministerio de Medio Ambiente y Recursos Naturales",
    short: "Medio Amb.",
    kind: "institucion_nacional",
  },
  {
    id: "ede-este",
    name: "EDE-Este",
    short: "EDE-Este",
    kind: "distribuidora",
  },
  {
    id: "ede-norte",
    name: "EDE-Norte",
    short: "EDE-Norte",
    kind: "distribuidora",
  },
  { id: "ede-sur", name: "EDE-Sur", short: "EDE-Sur", kind: "distribuidora" },
  {
    id: "otra",
    name: "Otra institución (especificar)",
    short: "Otra",
    kind: "institucion_nacional",
  },
];
const getInstitution = (id) =>
  INSTITUTIONS.find((i) => i.id === id) ||
  INSTITUTIONS[INSTITUTIONS.length - 1];

/* Departamentos internos por tipo de institución — genéricos y
   configurables, no inventamos instituciones nuevas, solo su estructura interna. */
const DEPARTMENTS_BY_KIND = {
  ayuntamiento: [
    "Obras Públicas Municipales",
    "Ornato y Limpieza",
    "Ingeniería Vial",
    "Medio Ambiente Municipal",
    "Atención Ciudadana",
  ],
  institucion_nacional: [
    "Operaciones",
    "Mantenimiento de Redes",
    "Ingeniería",
    "Atención al Usuario",
  ],
  distribuidora: [
    "Mantenimiento de Redes Eléctricas",
    "Cuadrillas de Campo",
    "Atención al Cliente",
  ],
};
const getDepartmentsFor = (institutionId) =>
  DEPARTMENTS_BY_KIND[getInstitution(institutionId).kind] || ["Operaciones"];

/* Responsables de campo por institución (personal técnico que ejecuta la
   incidencia; puede o no tener acceso al sistema como "gestor"). */
const RESPONSABLE_NAMES = [
  "Juan Pérez",
  "María González",
  "Luis Almonte",
  "Rosa Herrera",
  "Pedro Castillo",
  "Ana Beltré",
  "Carlos Núñez",
  "Yohanny Vargas",
];
function getResponsablesFor(institutionId) {
  const depts = getDepartmentsFor(institutionId);
  return depts.map((dept, i) => ({
    id: `resp-${institutionId}-${i}`,
    name: RESPONSABLE_NAMES[
      (institutionId.length + i) % RESPONSABLE_NAMES.length
    ],
    department: dept,
    institutionId,
  }));
}

const ESCALATION_TARGETS = [
  "Supervisor institucional",
  "Dirección General de la institución",
  "Institución de mayor jerarquía / MOPC",
];

/* --------------------------------- ZONAS ---------------------------------- */

const ZONES = [
  {
    id: "dn",
    name: "Distrito Nacional",
    top: "36%",
    left: "40%",
    size: 130,
    aytoId: "ayto-dn",
  },
  {
    id: "sdn",
    name: "Santo Domingo Norte",
    top: "6%",
    left: "34%",
    size: 118,
    aytoId: "ayto-sdn",
  },
  {
    id: "sdo",
    name: "Santo Domingo Oeste",
    top: "40%",
    left: "12%",
    size: 104,
    aytoId: "ayto-sdo",
  },
  {
    id: "sde",
    name: "Santo Domingo Este",
    top: "38%",
    left: "66%",
    size: 142,
    aytoId: "ayto-sde",
  },
  {
    id: "alc",
    name: "Los Alcarrizos",
    top: "50%",
    left: "-4%",
    size: 92,
    aytoId: "ayto-alc",
  },
  {
    id: "bch",
    name: "Boca Chica",
    top: "66%",
    left: "86%",
    size: 92,
    aytoId: "ayto-bch",
  },
  {
    id: "pbr",
    name: "Pedro Brand",
    top: "68%",
    left: "2%",
    size: 82,
    aytoId: "ayto-pbr",
  },
  {
    id: "sag",
    name: "San Antonio de Guerra",
    top: "74%",
    left: "48%",
    size: 88,
    aytoId: "ayto-sag",
  },
];
const getZone = (id) => ZONES.find((z) => z.id === id);

const NATIONAL_REGIONS = [
  {
    id: "cibao",
    name: "Región Norte (Cibao)",
    top: "4%",
    left: "26%",
    size: 150,
    active: false,
  },
  {
    id: "sur",
    name: "Región Sur",
    top: "52%",
    left: "4%",
    size: 138,
    active: false,
  },
  {
    id: "este-region",
    name: "Región Este",
    top: "40%",
    left: "70%",
    size: 148,
    active: false,
  },
  {
    id: "sd",
    name: "Gran Santo Domingo",
    top: "66%",
    left: "40%",
    size: 128,
    active: true,
  },
];

/* Institución sugerida automáticamente a partir de zona + categoría —
   representa el motor de enrutamiento inicial (Fase 1: Reporte). El gestor
   puede corregirla en la Fase 4 (Asignación) si no corresponde. */
const zoneToInstitution = (zoneId, categoryId) => {
  const z = getZone(zoneId);
  if (categoryId === "alcantarillado" || categoryId === "agua") return "caasd";
  if (categoryId === "ambiente") return "medioambiente";
  return z ? z.aytoId : "otra";
};

/* -------------------------- ESTADOS DEL CICLO DE VIDA ----------------------- */
/* 15 estados reales de una plataforma de gestión de incidencias — no un
   simple "pendiente/en proceso/resuelto". `group` se usa para agrupar KPIs
   de dashboard; `citizenStep` mapea cada estado interno al paso simplificado
   que ve el ciudadano (0..5, ver CITIZEN_STEPS). */
const STATUS_META = {
  nuevo: {
    label: "Nuevo",
    Icon: Sparkles,
    badge: "bg-slate-100 text-slate-700 border border-slate-200",
    color: "#64748b",
    group: "nuevas",
    citizenStep: 0,
  },
  en_revision: {
    label: "En revisión",
    Icon: Search,
    badge: "bg-amber-100 text-amber-700 border border-amber-200",
    color: "#d97706",
    group: "validacion",
    citizenStep: 1,
  },
  requiere_info: {
    label: "Requiere información",
    Icon: HelpCircle,
    badge: "bg-orange-100 text-orange-700 border border-orange-200",
    color: "#ea580c",
    group: "validacion",
    citizenStep: 1,
  },
  validado: {
    label: "Validado",
    Icon: BadgeCheck,
    badge: "bg-teal-100 text-teal-700 border border-teal-200",
    color: "#0d9488",
    group: "asignacion",
    citizenStep: 2,
  },
  clasificado: {
    label: "Clasificado",
    Icon: ListChecks,
    badge: "bg-cyan-100 text-cyan-700 border border-cyan-200",
    color: "#0891b2",
    group: "asignacion",
    citizenStep: 2,
  },
  asignado: {
    label: "Asignado",
    Icon: UserPlus,
    badge: "bg-blue-100 text-blue-700 border border-blue-200",
    color: "#2563eb",
    group: "asignacion",
    citizenStep: 2,
  },
  en_gestion: {
    label: "En gestión",
    Icon: RefreshCw,
    badge: "bg-indigo-100 text-indigo-700 border border-indigo-200",
    color: "#4f46e5",
    group: "gestion",
    citizenStep: 3,
  },
  en_espera: {
    label: "En espera",
    Icon: TimerReset,
    badge: "bg-slate-200 text-slate-600 border border-slate-300",
    color: "#94a3b8",
    group: "gestion",
    citizenStep: 3,
  },
  escalado: {
    label: "Escalado",
    Icon: TrendingUp,
    badge: "bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200",
    color: "#c026d3",
    group: "gestion",
    citizenStep: 3,
  },
  pendiente_verificacion: {
    label: "Pendiente de verificación",
    Icon: Eye,
    badge: "bg-purple-100 text-purple-700 border border-purple-200",
    color: "#9333ea",
    group: "verificacion",
    citizenStep: 4,
  },
  verificado: {
    label: "Verificado",
    Icon: ShieldCheck,
    badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    color: "#059669",
    group: "verificacion",
    citizenStep: 4,
  },
  resuelto: {
    label: "Resuelto",
    Icon: CheckCircle2,
    badge: "bg-green-100 text-green-700 border border-green-200",
    color: "#16a34a",
    group: "cerradas",
    citizenStep: 5,
  },
  cerrado: {
    label: "Cerrado",
    Icon: Flag,
    badge: "bg-slate-100 text-slate-600 border border-slate-200",
    color: "#475569",
    group: "cerradas",
    citizenStep: 5,
  },
  rechazado: {
    label: "Rechazado",
    Icon: X,
    badge: "bg-red-100 text-red-700 border border-red-200",
    color: "#dc2626",
    group: "rechazadas",
    citizenStep: -1,
  },
  duplicado: {
    label: "Duplicado",
    Icon: Copy,
    badge: "bg-rose-100 text-rose-700 border border-rose-200",
    color: "#e11d48",
    group: "rechazadas",
    citizenStep: -1,
  },
};
const STATUS_ORDER = [
  "nuevo",
  "en_revision",
  "requiere_info",
  "validado",
  "clasificado",
  "asignado",
  "en_gestion",
  "en_espera",
  "escalado",
  "pendiente_verificacion",
  "verificado",
  "resuelto",
  "cerrado",
  "rechazado",
  "duplicado",
];

const CITIZEN_STEPS = [
  { step: 0, label: "Reportado" },
  { step: 1, label: "Validado" },
  { step: 2, label: "Asignado a institución" },
  { step: 3, label: "En gestión" },
  { step: 4, label: "Pendiente de verificación" },
  { step: 5, label: "Cerrado" },
];

const PRIORITY_META = {
  baja: {
    label: "Baja",
    badge: "bg-slate-100 text-slate-600",
    color: "#64748b",
    slaHours: 168,
  },
  media: {
    label: "Media",
    badge: "bg-amber-100 text-amber-700",
    color: "#d97706",
    slaHours: 72,
  },
  alta: {
    label: "Alta",
    badge: "bg-orange-100 text-orange-700",
    color: "#ea580c",
    slaHours: 24,
  },
  critica: {
    label: "Crítica",
    badge: "bg-red-100 text-red-700",
    color: "#dc2626",
    slaHours: 4,
  },
};
const PRIORITY_ORDER = ["baja", "media", "alta", "critica"];

/* --------------------------- MOTOR DE REGLAS (§33) -------------------------- */
const DEFAULT_RULES = {
  routing: [],
  sla: [],
  notifySlaBreach: true,
  recurringMinCount: 3,
  recurringWindowDays: 30,
};

function applyRoutingRule(
  rules,
  categoryId,
  subcategoryId,
  fallbackInstitutionId,
) {
  const match = (rules?.routing || []).find(
    (r) =>
      r.enabled &&
      r.categoryId === categoryId &&
      (!r.subcategoryId || r.subcategoryId === subcategoryId),
  );
  return match ? match.institutionId : fallbackInstitutionId;
}
function applySlaHours(rules, priority, fallbackHours) {
  const match = (rules?.sla || []).find(
    (r) => r.enabled && r.priority === priority,
  );
  return match ? match.slaHours : fallbackHours;
}
function shouldNotifySlaBreach(rules) {
  return rules ? rules.notifySlaBreach !== false : true;
}
function getRecurringThreshold(rules) {
  return {
    minCount: rules?.recurringMinCount || 3,
    windowDays: rules?.recurringWindowDays || 30,
  };
}

/* --------------------------- TAREAS (§8 del brief) ------------------------- */
const TASK_STATUS_META = {
  pendiente: {
    label: "Pendiente",
    Icon: Square,
    color: "#94a3b8",
    badge: "bg-slate-100 text-slate-600 border border-slate-200",
  },
  en_progreso: {
    label: "En progreso",
    Icon: PlayCircle,
    color: "#2563eb",
    badge: "bg-blue-100 text-blue-700 border border-blue-200",
  },
  completada: {
    label: "Completada",
    Icon: CheckSquare,
    color: "#16a34a",
    badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  },
  bloqueada: {
    label: "Bloqueada",
    Icon: Ban,
    color: "#dc2626",
    badge: "bg-red-100 text-red-700 border border-red-200",
  },
};

const DEFAULT_TASK_TEMPLATE = [
  {
    key: "inspeccionar",
    title: "Inspeccionar ubicación",
    description:
      "Confirmar en sitio la existencia y alcance del problema reportado.",
    dependsOnKey: null,
  },
  {
    key: "causa",
    title: "Determinar causa",
    description:
      "Identificar el origen del problema para definir la intervención correcta.",
    dependsOnKey: null,
  },
  {
    key: "reparar",
    title: "Realizar reparación",
    description: "Ejecutar la intervención correctiva en sitio.",
    dependsOnKey: "causa",
  },
  {
    key: "evidencia",
    title: "Agregar evidencia",
    description: "Documentar el trabajo realizado con fotografías.",
    dependsOnKey: "reparar",
  },
  {
    key: "verificar",
    title: "Verificar solución",
    description:
      "Confirmar que el problema quedó resuelto antes de cerrar el expediente.",
    dependsOnKey: "reparar",
  },
];

/* ------------------------- INSPECCIONES (§18 del brief) -------------------- */
const INSPECTION_RESULT_META = {
  problema_confirmado: {
    label: "Problema confirmado",
    color: "#dc2626",
    badge: "bg-red-100 text-red-700 border border-red-200",
  },
  problema_no_encontrado: {
    label: "Problema no encontrado",
    color: "#64748b",
    badge: "bg-slate-100 text-slate-600 border border-slate-200",
  },
  requiere_intervencion: {
    label: "Requiere intervención",
    color: "#ea580c",
    badge: "bg-orange-100 text-orange-700 border border-orange-200",
  },
  riesgo_confirmado: {
    label: "Riesgo confirmado",
    color: "#b91c1c",
    badge: "bg-red-100 text-red-800 border border-red-300",
  },
  informacion_insuficiente: {
    label: "Información insuficiente",
    color: "#d97706",
    badge: "bg-amber-100 text-amber-700 border border-amber-200",
  },
};
const INSPECTION_RESULT_ORDER = Object.keys(INSPECTION_RESULT_META);

/* Transiciones válidas por estado. */
const TRANSITIONS = {
  nuevo: [
    {
      to: "en_revision",
      label: "Iniciar revisión",
      roles: ["gestor", "supervisor", "admin"],
      reason: false,
      Icon: Search,
    },
  ],
  en_revision: [
    {
      to: "validado",
      label: "Validar",
      roles: ["gestor", "supervisor", "admin"],
      reason: false,
      Icon: BadgeCheck,
      tone: "emerald",
    },
    {
      to: "requiere_info",
      label: "Solicitar información",
      roles: ["gestor", "supervisor", "admin"],
      reason: true,
      Icon: HelpCircle,
      tone: "amber",
    },
    {
      to: "rechazado",
      label: "Rechazar",
      roles: ["gestor", "supervisor", "admin"],
      reason: true,
      Icon: X,
      tone: "red",
    },
    {
      to: "duplicado",
      label: "Marcar como duplicado",
      roles: ["gestor", "supervisor", "admin"],
      reason: true,
      Icon: Copy,
      tone: "rose",
    },
  ],
  requiere_info: [
    {
      to: "en_revision",
      label: "Aportar información (ciudadano)",
      roles: ["ciudadano"],
      reason: true,
      reasonLabel: "Información adicional",
      Icon: Send,
      tone: "blue",
    },
    {
      to: "rechazado",
      label: "Rechazar (sin respuesta)",
      roles: ["gestor", "supervisor", "admin"],
      reason: true,
      Icon: X,
      tone: "red",
    },
  ],
  validado: [
    {
      to: "clasificado",
      label: "Clasificar",
      roles: ["gestor", "supervisor", "admin"],
      reason: false,
      Icon: ListChecks,
      tone: "cyan",
      needsClassification: true,
    },
  ],
  clasificado: [
    {
      to: "asignado",
      label: "Asignar institución / responsable",
      roles: ["gestor", "supervisor", "admin"],
      reason: false,
      Icon: UserPlus,
      tone: "blue",
      needsAssignment: true,
    },
  ],
  asignado: [
    {
      to: "en_gestion",
      label: "Iniciar gestión",
      roles: ["gestor", "supervisor", "admin"],
      reason: false,
      Icon: RefreshCw,
      tone: "indigo",
    },
    {
      to: "escalado",
      label: "Escalar",
      roles: ["gestor", "supervisor", "admin"],
      reason: true,
      Icon: TrendingUp,
      tone: "fuchsia",
      needsEscalation: true,
    },
  ],
  en_gestion: [
    {
      to: "en_espera",
      label: "Marcar en espera",
      roles: ["gestor", "supervisor", "admin"],
      reason: true,
      Icon: TimerReset,
      tone: "slate",
    },
    {
      to: "escalado",
      label: "Escalar",
      roles: ["gestor", "supervisor", "admin"],
      reason: true,
      Icon: TrendingUp,
      tone: "fuchsia",
      needsEscalation: true,
    },
    {
      to: "pendiente_verificacion",
      label: "Marcar listo para verificación",
      roles: ["gestor", "supervisor", "admin"],
      reason: false,
      Icon: Eye,
      tone: "purple",
    },
  ],
  en_espera: [
    {
      to: "en_gestion",
      label: "Reanudar gestión",
      roles: ["gestor", "supervisor", "admin"],
      reason: false,
      Icon: RefreshCw,
      tone: "indigo",
    },
    {
      to: "escalado",
      label: "Escalar",
      roles: ["gestor", "supervisor", "admin"],
      reason: true,
      Icon: TrendingUp,
      tone: "fuchsia",
      needsEscalation: true,
    },
  ],
  escalado: [
    {
      to: "en_gestion",
      label: "Retomar gestión",
      roles: ["gestor", "supervisor", "admin"],
      reason: false,
      Icon: RefreshCw,
      tone: "indigo",
    },
    {
      to: "asignado",
      label: "Reasignar",
      roles: ["gestor", "supervisor", "admin"],
      reason: false,
      Icon: UserPlus,
      tone: "blue",
      needsAssignment: true,
    },
  ],
  pendiente_verificacion: [
    {
      to: "verificado",
      label: "Verificar y aprobar",
      roles: ["gestor", "supervisor", "admin"],
      reason: false,
      Icon: ShieldCheck,
      tone: "emerald",
    },
    {
      to: "en_gestion",
      label: "Objetar verificación (reabrir gestión)",
      roles: ["gestor", "supervisor", "admin"],
      reason: true,
      Icon: RefreshCw,
      tone: "amber",
    },
  ],
  verificado: [
    {
      to: "resuelto",
      label: "Marcar como resuelto",
      roles: ["gestor", "supervisor", "admin"],
      reason: false,
      Icon: CheckCircle2,
      tone: "green",
    },
  ],
  resuelto: [
    {
      to: "cerrado",
      label: "Cerrar caso",
      roles: ["gestor", "supervisor", "admin"],
      reason: false,
      Icon: Flag,
      tone: "slate",
    },
  ],
  cerrado: [
    {
      to: "en_gestion",
      label: "Reabrir incidencia",
      roles: ["ciudadano", "gestor", "supervisor", "admin"],
      reason: true,
      Icon: RefreshCw,
      tone: "amber",
    },
  ],
  rechazado: [
    {
      to: "en_revision",
      label: "Reconsiderar rechazo",
      roles: ["admin"],
      reason: true,
      Icon: RefreshCw,
      tone: "amber",
    },
  ],
  duplicado: [
    {
      to: "en_revision",
      label: "Revertir marca de duplicado",
      roles: ["admin"],
      reason: true,
      Icon: RefreshCw,
      tone: "amber",
    },
  ],
};
const availableActions = (report, role) =>
  (TRANSITIONS[report.status] || []).filter((a) => a.roles.includes(role));

/* Sugiere posibles duplicados: misma subcategoría, misma zona, creado dentro
   de una ventana de 5 días — el gestor decide si fusiona o mantiene separado. */
function findPossibleDuplicates(report, allReports) {
  const WINDOW = 5 * 86400000;
  return allReports
    .filter(
      (r) =>
        r.id !== report.id &&
        r.category === report.category &&
        r.zone === report.zone &&
        Math.abs(r.createdAt - report.createdAt) < WINDOW,
    )
    .slice(0, 4);
}

/* Detecta problemas estructurales/recurrentes: 3+ incidencias de la misma
   subcategoría en la misma zona dentro de los últimos 30 días — señal de que
   el problema no es puntual sino de infraestructura. */
function findRecurringProblems(report, allReports, rules) {
  const { minCount, windowDays } = getRecurringThreshold(rules);
  const WINDOW = windowDays * 86400000;
  const now = Date.now();
  const related = allReports.filter(
    (r) =>
      r.category === report.category &&
      r.zone === report.zone &&
      now - r.createdAt < WINDOW,
  );
  return related.length >= minCount ? related : [];
}

/* --------------------------- HOTSPOTS (§27) -------------------------------- */
const HOTSPOT_MIN_ACTIVE = 4;
const HOTSPOT_WINDOW_DAYS = 30;

function findHotspots(
  allReports,
  { minCount = HOTSPOT_MIN_ACTIVE, windowDays = HOTSPOT_WINDOW_DAYS } = {},
) {
  const WINDOW = windowDays * 86400000;
  const now = Date.now();
  const recentActive = allReports.filter((r) => {
    const group = STATUS_META[r.status]?.group;
    return (
      group !== "cerradas" &&
      group !== "rechazadas" &&
      now - r.createdAt < WINDOW
    );
  });
  return ZONES.map((zone) => {
    const inZone = recentActive.filter((r) => r.zone === zone.id);
    if (inZone.length < minCount) return null;
    const byCat = {};
    inZone.forEach((r) => {
      byCat[r.category] = (byCat[r.category] || 0) + 1;
    });
    const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
    const critical = inZone.filter(
      (r) => r.priority === "critica" || r.priority === "alta",
    ).length;
    return {
      zone,
      count: inZone.length,
      topCat: { id: topCat[0], count: topCat[1] },
      critical,
      reports: inZone,
    };
  })
    .filter(Boolean)
    .sort((a, b) => b.count - a.count);
}

function getLevel(points) {
  if (points >= 600)
    return {
      tier: 4,
      label: "Guardián cívico",
      bg: "bg-purple-100",
      text: "text-purple-700",
      ring: "ring-purple-400",
      dot: "bg-purple-500",
      grad: "from-purple-600 to-fuchsia-500",
    };
  if (points >= 300)
    return {
      tier: 3,
      label: "Vecino experto",
      bg: "bg-blue-100",
      text: "text-blue-700",
      ring: "ring-blue-400",
      dot: "bg-blue-500",
      grad: "from-blue-600 to-teal-500",
    };
  if (points >= 100)
    return {
      tier: 2,
      label: "Colaborador activo",
      bg: "bg-teal-100",
      text: "text-teal-700",
      ring: "ring-teal-400",
      dot: "bg-teal-500",
      grad: "from-teal-600 to-emerald-500",
    };
  return {
    tier: 1,
    label: "Nuevo vecino",
    bg: "bg-slate-100",
    text: "text-slate-600",
    ring: "ring-slate-300",
    dot: "bg-slate-400",
    grad: "from-slate-400 to-slate-500",
  };
}

const MOCK_USERS = [
  {
    id: "u1",
    name: "Awilka Jerome",
    cedula: "402-1234567-8",
    phone: "809-555-0142",
    email: "awilka@correo.com",
    role: "ciudadano",
    points: 420,
    isPublic: true,
    seed: "Awilka",
  },
  {
    id: "u2",
    name: "Johaly Concepción",
    cedula: "402-7654321-0",
    phone: "829-555-0198",
    email: "johaly@correo.com",
    role: "ciudadano",
    points: 680,
    isPublic: true,
    seed: "Johaly",
  },
  {
    id: "u3",
    name: "Ramón Ortiz",
    cedula: "001-1122334-5",
    phone: "849-555-0110",
    email: "ramon@correo.com",
    role: "ciudadano",
    points: 140,
    isPublic: false,
    seed: "Ramon",
  },
  {
    id: "u4",
    name: "Carla Fernández",
    cedula: "031-9988776-1",
    phone: "809-555-0176",
    email: "carla@correo.com",
    role: "ciudadano",
    points: 60,
    isPublic: true,
    seed: "Carla",
  },
  {
    id: "u5",
    name: "Miguel Santos",
    cedula: "402-4455667-3",
    phone: "829-555-0155",
    email: "miguel@correo.com",
    role: "ciudadano",
    points: 260,
    isPublic: true,
    seed: "Miguel",
  },
  {
    id: "u6",
    name: "Laura Méndez",
    cedula: "402-5566778-4",
    phone: "809-555-0199",
    email: "laura@correo.com",
    role: "ciudadano",
    points: 180,
    isPublic: true,
    seed: "Laura",
  },
  {
    id: "u7",
    name: "David Peña",
    cedula: "402-6677889-5",
    phone: "829-555-0177",
    email: "david@correo.com",
    role: "ciudadano",
    points: 45,
    isPublic: true,
    seed: "David",
  },
  {
    id: "u8",
    name: "Elena Rojas",
    cedula: "402-7788990-6",
    phone: "849-555-0166",
    email: "elena@correo.com",
    role: "ciudadano",
    points: 320,
    isPublic: true,
    seed: "Elena",
  },
  {
    id: "u9",
    name: "Sofía Castro",
    cedula: "402-8899001-7",
    phone: "809-555-0155",
    email: "sofia@correo.com",
    role: "ciudadano",
    points: 90,
    isPublic: true,
    seed: "Sofia",
  },
  {
    id: "u10",
    name: "Manuel Reyes",
    cedula: "402-9900112-8",
    phone: "829-555-0144",
    email: "manuel@correo.com",
    role: "ciudadano",
    points: 550,
    isPublic: true,
    seed: "Manuel",
  },
  {
    id: "g1",
    name: "Yudelka Pérez",
    cedula: "402-1231231-1",
    phone: "809-555-0201",
    email: "yudelka.perez@adn.gob.do",
    role: "gestor",
    institutionId: "ayto-dn",
    seed: "Yudelka",
  },
  {
    id: "g2",
    name: "Franklin Reyes",
    cedula: "402-3213213-2",
    phone: "809-555-0233",
    email: "franklin.reyes@caasd.gob.do",
    role: "gestor",
    institutionId: "caasd",
    seed: "Franklin",
  },
  {
    id: "g3",
    name: "Patricia Sánchez",
    cedula: "402-4321432-3",
    phone: "809-555-0222",
    email: "patricia.sanchez@asde.gob.do",
    role: "gestor",
    institutionId: "ayto-sde",
    seed: "Patricia",
  },
  {
    id: "g4",
    name: "Roberto Jiménez",
    cedula: "402-5432543-4",
    phone: "809-555-0244",
    email: "roberto.jimenez@ede-este.do",
    role: "gestor",
    institutionId: "ede-este",
    seed: "Roberto",
  },
  {
    id: "s1",
    name: "María González",
    cedula: "402-5551234-7",
    phone: "809-555-0311",
    email: "maria.gonzalez@adn.gob.do",
    role: "supervisor",
    institutionId: "ayto-dn",
    seed: "MariaG",
  },
  {
    id: "s2",
    name: "José Almonte",
    cedula: "402-6662345-8",
    phone: "809-555-0322",
    email: "jose.almonte@caasd.gob.do",
    role: "supervisor",
    institutionId: "caasd",
    seed: "JoseAl",
  },
  {
    id: "a1",
    name: "Huáscar Frías",
    cedula: "402-0000000-0",
    phone: "809-555-0100",
    email: "admin@tureporte.do",
    role: "admin",
    seed: "Huascar",
  },
];
const getUser = (id) => MOCK_USERS.find((u) => u.id === id);

// REPORT_SEEDS con imágenes reales de Internet para cada tipo de caso
const REPORT_SEEDS = [
  // INFRAESTRUCTURA VIAL - CALLES
  {
    desc: "Bache profundo en la Av. Independencia que ya ha dañado varios vehículos.",
    category: "calles",
    subcategory: "sc-bache",
    zone: "dn",
    imgUrl:
      "https://static-live.nmas.com.mx/nmas-news/2025-09/baches-cdmx-2022-reparacion.jpg",
  },
  {
    desc: "Semáforo dañado en un cruce peligroso cerca de la escuela primaria.",
    category: "calles",
    subcategory: "sc-semaforo",
    zone: "sde",
    imgUrl:
      "https://vanguardia.com.mx/binrepository/784x588/0c0/0d0/down-right/11604/MNRX/milimg-11141-4480248-12621036-202507_1-12621572_20250728172546.jpg",
  },
  {
    desc: "Calle completamente inundada tras la lluvia; queda intransitable por horas.",
    category: "calles",
    subcategory: "sc-inundacion",
    zone: "bch",
    imgUrl:
      "https://tse1.mm.bing.net/th/id/OIP.OdUzYVRCqiKKoTvVdJVcnQHaE7?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
  },
  {
    desc: "Calle sin señalización adecuada ha provocado varios accidentes menores.",
    category: "calles",
    subcategory: "sc-senalizacion",
    zone: "sdn",
    imgUrl:
      "https://ferrol360.es/wp-content/uploads/2025/08/WhatsApp-Image-2025-08-27-at-14.47.03-e1756301375681.jpeg",
  },
  {
    desc: "Vía obstruida por escombros y materiales de construcción abandonados.",
    category: "calles",
    subcategory: "sc-via-obstruida",
    zone: "sdo",
    imgUrl:
      "https://tse2.mm.bing.net/th/id/OIP.WgoTmOjmpFIAEfVYvrmekAHaFR?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
  },
  {
    desc: "Reporte de bache en la Av. 27 de Febrero, ya ha causado varios pinchazos.",
    category: "calles",
    subcategory: "sc-bache",
    zone: "dn",
    imgUrl:
      "https://tse1.mm.bing.net/th/id/OIP.DZsAXMBC6itP42fQJnuhYQHaEK?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
  },
  {
    desc: "Señal de alto derribada en la intersección de la Máximo Gómez.",
    category: "calles",
    subcategory: "sc-senalizacion",
    zone: "sdo",
    imgUrl:
      "https://tse4.mm.bing.net/th/id/OIP.tefeevCKPm9ZaHQQxQ_REAHaEK?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
  },
  {
    desc: "Cruce sin semáforo funcional, los carros pasan a alta velocidad.",
    category: "calles",
    subcategory: "sc-semaforo",
    zone: "sdn",
    imgUrl:
      "https://static-live.nmas.com.mx/nmas-video/s3fs-public/styles/corte_16_9/cloud-storage/video-886247-snapshot.jpg",
  },

  // ALUMBRADO PÚBLICO
  {
    desc: "Poste de luz apagado desde hace dos semanas en la calle Duarte, la zona queda muy oscura.",
    category: "alumbrado",
    subcategory: "sc-luminaria-apagada",
    zone: "sde",
    imgUrl:
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhLNG0SqfxRjzA7ubSQaPk9i_j4eM-fIp0mpEej8I4o-muUHMK2_MRpmBKwdwHGnU1mpkzqTHie_NyaR6FA5Yv8AK0_7zJTpiTxxQo0T_UuY6qBlhxNXfDYsMBL7NdqV35arX4pWUgcxnVGImLFmLy4awTi6PGkuMl0PjTelAhNZQlH786m0VQMYaDU8CU/w1600/poste-luz-apagado.png",
  },
  {
    desc: "Zona sin alumbrado genera inseguridad para quienes regresan de noche.",
    category: "alumbrado",
    subcategory: "sc-luminaria-apagada",
    zone: "sdo",
    imgUrl: "https://cdn1.eldia.com/032022/1648578482156.jpeg",
  },
  {
    desc: "Cableado eléctrico expuesto cerca del mercado municipal; vecinos están preocupados.",
    category: "alumbrado",
    subcategory: "sc-cableado",
    zone: "dn",
    imgUrl:
      "https://i.pinimg.com/736x/ba/7c/f9/ba7cf93eaddacfd42c8fe5fe5772d1af.jpg",
  },
  {
    desc: "Poste de luz inclinado a punto de caer, peligro para transeúntes.",
    category: "alumbrado",
    subcategory: "sc-poste-danado",
    zone: "bch",
    imgUrl:
      "https://th.bing.com/th/id/R.1cbde30fc5bd0c030b8fde109c37982a?rik=ZB%2bWxYZVRhS7VQ&pid=ImgRaw&r=0",
  },

  // RESIDUOS Y LIMPIEZA - BASURA
  {
    desc: "Acumulación de basura en el solar baldío junto al colmado, atrae insectos y mal olor.",
    category: "basura",
    subcategory: "sc-acumulacion",
    zone: "sdn",
    imgUrl:
      "https://tse1.mm.bing.net/th/id/OIP.BYL4fxAvbn6N2OhuJEzbBgHaE8?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
  },
  {
    desc: "Basura acumulada frente al parque infantil, riesgo para los niños que juegan ahí.",
    category: "basura",
    subcategory: "sc-acumulacion",
    zone: "alc",
    imgUrl:
      "https://tse4.mm.bing.net/th/id/OIP.KrmUK9ucNaxxhDEmSDTk6wHaE8?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
  },
  {
    desc: "Contenedor de basura desbordado desde hace más de una semana.",
    category: "basura",
    subcategory: "sc-contenedor",
    zone: "dn",
    imgUrl:
      "https://tse1.mm.bing.net/th/id/OIP.9nY7XAvHpfRa1t_cIh4hwQHaEK?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
  },
  {
    desc: "La quema de basura a cielo abierto está afectando la respiración de varias familias.",
    category: "basura",
    subcategory: "sc-quema",
    zone: "pbr",
    imgUrl:
      "https://th.bing.com/th/id/R.bc49e2a5babec81a6dadb0d62f823553?rik=5Yl8nXPsU85VPw&pid=ImgRaw&r=0",
  },
  {
    desc: "Camión de basura no pasa desde hace 3 semanas, hay basura acumulada en todas las esquinas.",
    category: "basura",
    subcategory: "sc-acumulacion",
    zone: "sdn",
    imgUrl:
      "https://th.bing.com/th/id/R.841f583d7c595514ef80bd7b4b037b7d?rik=MNTmHf0D827vLA&riu=http%3a%2f%2fistmo.nvinoticias.com%2fsites%2fdefault%2ffiles%2farticulos%2f2022%2fOct%2fbasura_oaxaca.jpg&ehk=kihp2vsA8dQOIH8i4nDPRlk1RlJmI5TOJg1TGeELmYk%3d&risl=&pid=ImgRaw&r=0",
  },

  // ALCANTARILLADO
  {
    desc: "Alcantarilla destapada representa un peligro serio para los peatones y motoristas.",
    category: "alcantarillado",
    subcategory: "sc-tapa-faltante",
    zone: "sdo",
    imgUrl:
      "https://tse2.mm.bing.net/th/id/OIP.PKwGuH8Kq1tfDfyT7EGkWQHaEm?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
  },
  {
    desc: "Tapa de alcantarilla robada; ya hubo un motorista que casi cae dentro.",
    category: "alcantarillado",
    subcategory: "sc-tapa-faltante",
    zone: "dn",
    imgUrl:
      "https://tse2.mm.bing.net/th/id/OIP.8TSj0xdD0n205zRgm2KJ2gHaD4?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
  },
  {
    desc: "Alcantarilla obstruida que provoca inundaciones en la esquina cada vez que llueve.",
    category: "alcantarillado",
    subcategory: "sc-alcantarilla-obstruida",
    zone: "sde",
    imgUrl:
      "https://tse1.mm.bing.net/th/id/OIP.lQfLUDAtLCYS-F-GnJrCTAHaE7?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
  },
  {
    desc: "Fuga de aguas residuales en la cañería principal del sector.",
    category: "alcantarillado",
    subcategory: "sc-aguas-residuales",
    zone: "sdn",
    imgUrl:
      "https://s3.ppllstatics.com/todoalicante/www/multimedia/2025/08/06/aguas-residuales-k1JF-U2302574123732JSH-1200x840@TodoAlicante.jpg",
  },

  // AGUA POTABLE
  {
    desc: "Llevamos 5 días sin agua en el sector, varias familias no tienen cómo abastecerse.",
    category: "agua",
    subcategory: "sc-falta-suministro",
    zone: "alc",
    imgUrl:
      "https://tse4.mm.bing.net/th/id/OIP.Inj82z1fSe1uMBmKtws1dgHaEv?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
  },
  {
    desc: "Fuga de agua potable corriendo por la calle desde hace tres días sin atención.",
    category: "agua",
    subcategory: "sc-fuga-potable",
    zone: "sdn",
    imgUrl:
      "https://tse4.mm.bing.net/th/id/OIP.27huwObbcB_YZJNm9Oo_HAHaEV?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
  },

  {
    desc: "Fuga de agua en la cañería principal del sector, el agua corre sin control.",
    category: "agua",
    subcategory: "sc-fuga-potable",
    zone: "alc",
    imgUrl:
      "https://lider-canalizadores.pt/wp-content/uploads/2024/09/Lider-Canalizadores-fuga-de-agua-2-1536x864.jpg",
  },

  // MEDIO AMBIENTE
  {
    desc: "Árbol caído bloquea parcialmente la vía principal tras la tormenta.",
    category: "ambiente",
    subcategory: "sc-arbol-caido",
    zone: "alc",
    imgUrl:
      "https://tse1.mm.bing.net/th/id/OIP.gBGLZ5l3xd6rYNmXT4e_xAHaEK?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
  },

  // ESPACIO PÚBLICO - OCUPACIÓN
  {
    desc: "Vendedores ambulantes ocupan el espacio público sin permiso, dificultando el paso.",
    category: "ocupacion",
    subcategory: "sc-venta-ambulante",
    zone: "sag",
    imgUrl:
      "https://cwmas.com.co/wp-content/uploads/2024/06/Diseno-sin-titulo-2024-06-19T082838.293.webp",
  },
  {
    desc: "Escombros de una demolición bloquean media calle desde hace días.",
    category: "ocupacion",
    subcategory: "sc-escombros",
    zone: "pbr",
    imgUrl:
      "https://th.bing.com/th/id/R.fb72af83b7235d8c36627912273d5cc6?rik=xNChHCrJDoSorQ&pid=ImgRaw&r=0",
  },

  // MOBILIARIO URBANO
  {
    desc: "Silla de un parque infantil está rota, con bordes filosos expuestos.",
    category: "mobiliario",
    subcategory: "sc-parque-danado",
    zone: "sde",
    imgUrl:
      "https://www.hoy.com.do/resizer/v2/silla-parque-rota-peligro.jhttps://thumbs.dreamstime.com/b/sillas-rotas-de-madera-en-el-parque-251273772.jpg",
  },
  {
    desc: "Banca del parque comunitario deteriorada, con tablones rotos.",
    category: "mobiliario",
    subcategory: "sc-banca-danada",
    zone: "sag",
    imgUrl:
      "https://tse1.mm.bing.net/th/id/OIP.XycwXB8C-KOV2xpHRzYw7gHaEK?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
  },
];

function seededRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++)
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return () => {
    h = (Math.imul(1103515245, h) + 12345) | 0;
    return ((h >>> 0) % 1000) / 1000;
  };
}

/* Distribución realista a través del embudo de 15 estados: la mayoría de los
   casos activos se concentran en gestión/asignación, unos pocos en cada
   estado especial (espera/escalado/duplicado/rechazado), y un tramo grande
   ya cerrado — como se vería una bandeja institucional real. */
const STATUS_WEIGHTS = [
  ["nuevo", 8],
  ["en_revision", 6],
  ["requiere_info", 3],
  ["validado", 3],
  ["clasificado", 3],
  ["asignado", 8],
  ["en_gestion", 14],
  ["en_espera", 4],
  ["escalado", 3],
  ["pendiente_verificacion", 5],
  ["verificado", 3],
  ["resuelto", 6],
  ["cerrado", 24],
  ["rechazado", 3],
  ["duplicado", 2],
];
function pickWeightedStatus(rand) {
  const total = STATUS_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let roll = rand() * total;
  for (const [status, w] of STATUS_WEIGHTS) {
    if ((roll -= w) <= 0) return status;
  }
  return "cerrado";
}

/* Etapas del workflow en las que ya existe una asignación (institución +
   responsable) y por lo tanto pueden existir tareas de trabajo en curso. */
const STAGE_ORDER_FOR_TASKS = [
  "asignado",
  "en_gestion",
  "en_espera",
  "escalado",
  "pendiente_verificacion",
  "verificado",
  "resuelto",
  "cerrado",
];
/* Cuántas de las 5 tareas de la plantilla estándar deberían estar
   completadas según qué tan avanzado está el expediente — para que la
   demo se vea coherente con el estado real del caso. */
const TASK_PROGRESS_BY_STATUS = {
  asignado: 0,
  en_gestion: 2,
  en_espera: 1,
  escalado: 2,
  pendiente_verificacion: 4,
  verificado: 5,
  resuelto: 5,
  cerrado: 5,
};

/* Instancia la plantilla estándar de tareas (§8) para una incidencia ya
   asignada, respetando la dependencia "reparar" ← "causa" y "evidencia"/
   "verificar" ← "reparar". Nunca se comparte entre incidencias: cada tarea
   tiene un id propio con prefijo del expediente. */
function buildTasksForReport(report, rand, now) {
  if (!STAGE_ORDER_FOR_TASKS.includes(report.status)) return [];
  const completedCount = TASK_PROGRESS_BY_STATUS[report.status] ?? 0;
  const idOf = (key) => `${report.id}-tk-${key}`;
  let t = report.dueAt
    ? report.dueAt - (PRIORITY_META[report.priority]?.slaHours || 72) * 3600000
    : report.createdAt;
  return DEFAULT_TASK_TEMPLATE.map((tpl, i) => {
    t += Math.max(1, Math.floor(rand() * 6)) * 3600000;
    const dependsOn = tpl.dependsOnKey ? idOf(tpl.dependsOnKey) : null;
    const dependencyDone =
      !dependsOn ||
      i < completedCount ||
      DEFAULT_TASK_TEMPLATE.findIndex((x) => idOf(x.key) === dependsOn) <
        completedCount;
    let status;
    if (i < completedCount) status = "completada";
    else if (i === completedCount && (!dependsOn || dependencyDone))
      status = "en_progreso";
    else if (dependsOn && !dependencyDone) status = "bloqueada";
    else status = "pendiente";
    return {
      id: idOf(tpl.key),
      reportId: report.id,
      title: tpl.title,
      description: tpl.description,
      assignee: report.responsable || null,
      priority: report.priority,
      status,
      dependsOn,
      dueAt: Math.min(t + 48 * 3600000, now + 20 * 3600000),
      createdAt: Math.min(t, now),
      completedAt: status === "completada" ? Math.min(t, now) : null,
      comment: "",
    };
  });
}

/* Categorías donde una inspección física en sitio es habitual antes de
   confirmar la intervención (§18). */
const INSPECTABLE_CATEGORIES = [
  "calles",
  "alcantarillado",
  "alumbrado",
  "ambiente",
  "mobiliario",
];
function buildInspectionsForReport(report, rand, now) {
  if (!STAGE_ORDER_FOR_TASKS.includes(report.status)) return [];
  if (!INSPECTABLE_CATEGORIES.includes(report.category)) return [];
  if (rand() > 0.55) return [];
  const requestedAt = Math.min(
    (report.dueAt || now) -
      ((PRIORITY_META[report.priority]?.slaHours || 72) * 3600000) / 2,
    now,
  );
  const advanced = [
    "pendiente_verificacion",
    "verificado",
    "resuelto",
    "cerrado",
  ].includes(report.status);
  const scheduledFor = requestedAt + 24 * 3600000;
  const inspection = {
    id: `${report.id}-insp-1`,
    reportId: report.id,
    requestedBy: "Gestor de incidencias",
    requestedAt,
    assignee: report.responsable || null,
    scheduledFor,
    status: advanced ? "realizada" : "solicitada",
    result: null,
    observations: "",
    photos: [],
  };
  if (advanced) {
    const results = INSPECTION_RESULT_ORDER;
    inspection.result = results[Math.floor(rand() * results.length)];
    inspection.observations =
      inspection.result === "problema_no_encontrado"
        ? "No se localizó evidencia del problema reportado en el sitio indicado al momento de la visita."
        : "Se confirma la condición reportada; se documenta con fotografías para el expediente.";
    inspection.performedAt = scheduledFor;
    inspection.photos = [report.photos[0]];
  }
  return [inspection];
}

function buildReports() {
  const rand = seededRandom("tureporte-mvp-v4");
  const now = Date.now();
  const citizenIds = MOCK_USERS.filter((u) => u.role === "ciudadano").map(
    (u) => u.id,
  );

  return REPORT_SEEDS.map((seed, i) => {
    const status = pickWeightedStatus(rand);
    const sub = getSubcategory(seed.subcategory);
    const priorityRoll = rand();
    let priority = sub ? sub.defaultPriority : "media";
    if (priorityRoll > 0.88)
      priority =
        PRIORITY_ORDER[Math.min(PRIORITY_ORDER.indexOf(priority) + 1, 3)];
    else if (priorityRoll < 0.1)
      priority =
        PRIORITY_ORDER[Math.max(PRIORITY_ORDER.indexOf(priority) - 1, 0)];
    const isAnonymous = rand() < 0.3;
    const authorId = citizenIds[Math.floor(rand() * citizenIds.length)];

    // --- GENERACIÓN DE IMÁGENES CON URLS REALES DE INTERNET ---
    const photoCount = 1 + Math.floor(rand() * 1);
    const photos = [seed.imgUrl];

    if (photoCount > 1) {
      photos.push(seed.imgUrl + "?v=2");
    }

    if (priority === "critica" || priority === "alta") {
      photos.push(seed.imgUrl + "?v=critico");
    }

    const daysAgo = 1 + Math.floor(rand() * 26);
    const institutionId = zoneToInstitution(seed.zone, seed.category);
    const slaHours = PRIORITY_META[priority].slaHours;
    const isDuplicate = status === "duplicado" || i === 8 || i === 16;
    const satisfaction =
      status === "cerrado" && rand() > 0.4 ? 3 + Math.floor(rand() * 3) : null;
    const createdAt = now - daysAgo * 86400000 - Math.floor(rand() * 86400000);
    const responsables = getResponsablesFor(institutionId);
    const departmentIdx = Math.floor(rand() * responsables.length);
    const isAssignedStage = ![
      "nuevo",
      "en_revision",
      "requiere_info",
      "validado",
      "clasificado",
    ].includes(status);
    const department = isAssignedStage
      ? responsables[departmentIdx].department
      : null;
    const responsable = isAssignedStage
      ? responsables[departmentIdx].name
      : null;
    const dueAt = createdAt + slaHours * 3600000;

    const evidenceBefore = photos;
    const evidenceAfter =
      ["resuelto", "cerrado", "verificado"].includes(status) && rand() > 0.3
        ? [seed.imgUrl + "?after"]
        : [];

    const num = String(i + 1).padStart(6, "0");
    const code = `INC-${new Date(createdAt).getFullYear()}-${num}`;

    // Timeline / bitácora de auditoría
    const timeline = [
      {
        at: createdAt,
        label: "Reporte creado por el ciudadano",
        by: "Ciudadano",
        toStatus: "nuevo",
      },
    ];
    let t = createdAt;
    const STAGE_ORDER = [
      "nuevo",
      "en_revision",
      "validado",
      "clasificado",
      "asignado",
      "en_gestion",
      "pendiente_verificacion",
      "verificado",
      "resuelto",
      "cerrado",
    ];
    const currentIdx = STAGE_ORDER.indexOf(status);
    const passedThrough =
      currentIdx >= 0 ? STAGE_ORDER.slice(1, currentIdx + 1) : [];
    passedThrough.forEach((s) => {
      t += Math.max(1, Math.floor(rand() * 8)) * 3600000;
      const meta = STATUS_META[s];
      let label = `Estado cambiado a "${meta.label}"`;
      let by = getInstitution(institutionId).short;
      if (s === "en_revision") {
        label = "Reporte tomado en revisión";
        by = "Gestor de incidencias";
      }
      if (s === "validado") {
        label = "Reporte validado — la información es suficiente";
        by = "Gestor de incidencias";
      }
      if (s === "clasificado") {
        label = `Clasificado como ${getCategory(seed.category).label} → ${sub ? sub.label : "—"}`;
        by = "Gestor de incidencias";
      }
      if (s === "asignado") {
        label = `Asignado a ${getInstitution(institutionId).short} · ${department || ""} · Responsable: ${responsable || "—"}`;
        by = "Gestor de incidencias";
      }
      if (s === "en_gestion") {
        label = "Trabajo iniciado en sitio";
        by = responsable || by;
      }
      if (s === "pendiente_verificacion") {
        label = "Marcado como listo para verificación";
        by = responsable || by;
      }
      if (s === "verificado") {
        label = "Incidencia verificada en sitio";
        by = "Supervisor";
      }
      if (s === "resuelto") {
        label = "Incidencia marcada como resuelta";
        by = "Supervisor";
      }
      if (s === "cerrado") {
        label = "Incidencia cerrada";
        by = "Sistema";
      }
      timeline.push({ at: Math.min(t, now), label, by, toStatus: s });
    });
    if (status === "requiere_info")
      timeline.push({
        at: createdAt + 3600000 * 5,
        label: "Se solicitó información adicional al ciudadano",
        by: "Gestor de incidencias",
        toStatus: "requiere_info",
        reason: "Las fotografías no muestran claramente la ubicación exacta.",
      });
    if (status === "en_espera")
      timeline.push({
        at: t + 3600000 * 4,
        label: "Incidencia marcada en espera",
        by: "Gestor de incidencias",
        toStatus: "en_espera",
        reason: "Se espera confirmación de acceso al predio.",
      });
    if (status === "escalado")
      timeline.push({
        at: t + 3600000 * 4,
        label: `Escalado a: ${ESCALATION_TARGETS[i % ESCALATION_TARGETS.length]}`,
        by: "Gestor de incidencias",
        toStatus: "escalado",
        reason: "Excede el tiempo de atención acordado (SLA).",
      });
    if (status === "rechazado")
      timeline.push({
        at: createdAt + 3600000 * 6,
        label: "Reporte rechazado",
        by: "Gestor de incidencias",
        toStatus: "rechazado",
        reason: "No corresponde a una incidencia de infraestructura pública.",
      });
    if (status === "duplicado")
      timeline.push({
        at: createdAt + 3600000 * 6,
        label: "Marcado como posible duplicado de otro reporte activo",
        by: "Gestor de incidencias",
        toStatus: "duplicado",
        reason:
          "Ya existe un reporte activo para la misma ubicación y categoría.",
      });

    const reportBase = {
      id: `r${i + 1}`,
      code,
      desc: seed.desc,
      category: seed.category,
      subcategory: seed.subcategory,
      zone: seed.zone,
      status,
      priority,
      isAnonymous,
      authorId,
      photos,
      evidenceBefore,
      evidenceDuring: [],
      evidenceAfter,
      createdAt,
      commentsCount: Math.floor(rand() * 4) + 1,
      institutionId,
      department,
      responsable,
      slaHours,
      dueAt,
      isDuplicate,
      duplicateOf: isDuplicate && i !== 8 ? "r9" : isDuplicate ? null : null,
      satisfaction,
      distanceM: Math.floor(80 + rand() * 9000),
      reopenedCount: 0,
      timeline,
    };
    reportBase.tasks = buildTasksForReport(reportBase, rand, now);
    reportBase.inspections = buildInspectionsForReport(reportBase, rand, now);
    return reportBase;
  });
}

/* -------------------------------- HELPERS -------------------------------- */

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "hace instantes";
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `hace ${d} d`;
  return `hace ${Math.floor(d / 30)} mes(es)`;
}
function formatDateTime(ts) {
  return new Date(ts).toLocaleString("es-DO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function formatDistance(m) {
  if (m < 1000) return `a ${m} m`;
  return `a ${(m / 1000).toFixed(1)} km`;
}
function fmtMoney(n) {
  return "RD$ " + n.toLocaleString("es-DO");
}
function avatarUrl(seed) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear&fontWeight=600`;
}
function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
/** Horas restantes de SLA (negativas si venció). Solo aplica a estados activos. */
function slaRemaining(report) {
  const elapsedH = (Date.now() - report.createdAt) / 3600000;
  return Math.round(report.slaHours - elapsedH);
}
const CLOSED_STATUSES = ["resuelto", "cerrado", "rechazado", "duplicado"];
const isActiveReport = (r) => !CLOSED_STATUSES.includes(r.status);
const isOverdue = (r) => isActiveReport(r) && slaRemaining(r) < 0;
const isDueSoon = (r) =>
  isActiveReport(r) && slaRemaining(r) >= 0 && slaRemaining(r) <= 6;

/* ------------------------- CASO ESTANCADO (§13 del brief) ------------------ */
const STAGNANT_THRESHOLD_HOURS = 48;
function lastActivityAt(report) {
  const tl = report.timeline || [];
  return tl.length ? tl[tl.length - 1].at : report.createdAt;
}
function hoursSinceActivity(report) {
  return Math.round((Date.now() - lastActivityAt(report)) / 3600000);
}
const isStagnant = (r) =>
  isActiveReport(r) && hoursSinceActivity(r) >= STAGNANT_THRESHOLD_HOURS;
const NOT_YET_ASSIGNABLE_STATUSES = [
  "nuevo",
  "en_revision",
  "requiere_info",
  "rechazado",
  "duplicado",
];
const isUnassigned = (r) =>
  isActiveReport(r) &&
  !r.responsable &&
  !NOT_YET_ASSIGNABLE_STATUSES.includes(r.status);

/* ------------------------- CASE HEALTH (§11 del brief) --------------------- */
const CASE_HEALTH_META = {
  healthy: {
    label: "Healthy",
    short: "Bajo control",
    color: "#16a34a",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  at_risk: {
    label: "At risk",
    short: "Riesgo de incumplir",
    color: "#d97706",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  critical: {
    label: "Critical",
    short: "Requiere atención ya",
    color: "#dc2626",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 border border-red-200",
  },
};
function getCaseHealth(report) {
  if (!isActiveReport(report)) return null;
  const reasons = [];
  if (isOverdue(report)) reasons.push("SLA vencido");
  if (isStagnant(report))
    reasons.push(`${hoursSinceActivity(report)}h sin actividad`);
  if (
    ["asignado", "en_gestion", "en_espera"].includes(report.status) &&
    !report.responsable
  )
    reasons.push("Sin responsable asignado");
  if (report.status === "escalado") reasons.push("Escalado");
  if (reasons.length > 0)
    return { level: "critical", ...CASE_HEALTH_META.critical, reasons };

  const atRisk = [];
  if (isDueSoon(report)) atRisk.push("SLA próximo a vencer");
  if (
    (report.tasks || []).some(
      (t) => t.dueAt && t.dueAt < Date.now() && t.status !== "completada",
    )
  )
    atRisk.push("Tareas vencidas");
  if (report.priority === "critica" && report.status === "nuevo")
    atRisk.push("Crítica sin revisar");
  if (atRisk.length > 0)
    return { level: "at_risk", ...CASE_HEALTH_META.at_risk, reasons: atRisk };

  return { level: "healthy", ...CASE_HEALTH_META.healthy, reasons: [] };
}

/* -------------------------------- NOTIFICACIONES --------------------------------- */
const NOTIFY_STATUSES = new Set([
  "validado",
  "asignado",
  "requiere_info",
  "escalado",
  "pendiente_verificacion",
  "verificado",
  "resuelto",
  "cerrado",
  "en_gestion",
]);
function buildNotificationsForUser(user, reports, rules) {
  if (!user) return [];
  const relevant =
    user.role === "ciudadano"
      ? reports.filter((r) => r.authorId === user.id)
      : user.role === "admin"
        ? reports
        : reports.filter((r) => r.institutionId === user.institutionId);

  const events = [];
  const notifySla = shouldNotifySlaBreach(rules);
  relevant.forEach((r) => {
    const last = r.timeline[r.timeline.length - 1];
    if (last && last.toStatus && NOTIFY_STATUSES.has(last.toStatus)) {
      events.push({
        id: `${r.id}-${last.at}`,
        reportId: r.id,
        code: r.code,
        label:
          user.role === "ciudadano"
            ? citizenNotifLabel(last.toStatus, r)
            : last.label,
        at: last.at,
        tone: STATUS_META[last.toStatus]?.color || "#64748b",
      });
    }
    if (user.role !== "ciudadano" && notifySla) {
      if (isOverdue(r))
        events.push({
          id: `${r.id}-overdue`,
          reportId: r.id,
          code: r.code,
          label: `SLA vencido — ${r.desc.slice(0, 40)}…`,
          at: r.dueAt,
          tone: "#dc2626",
        });
      else if (isDueSoon(r))
        events.push({
          id: `${r.id}-duesoon`,
          reportId: r.id,
          code: r.code,
          label: `SLA próximo a vencer — ${r.desc.slice(0, 40)}…`,
          at: r.dueAt,
          tone: "#d97706",
        });
    }
  });
  return events.sort((a, b) => b.at - a.at).slice(0, 30);
}
function citizenNotifLabel(status, r) {
  const map = {
    validado: "Tu reporte fue validado por el gestor",
    asignado: `Tu reporte fue asignado a ${getInstitution(r.institutionId).short}`,
    requiere_info: "El gestor solicitó información adicional en tu reporte",
    en_gestion: "Tu reporte está siendo gestionado",
    escalado: "Tu reporte fue escalado a una instancia superior",
    pendiente_verificacion:
      "El trabajo en tu reporte está pendiente de verificación",
    verificado: "La solución de tu reporte fue verificada",
    resuelto:
      "Tu reporte fue marcado como resuelto — confirma si el problema fue solucionado",
    cerrado: "Tu reporte fue cerrado",
  };
  return map[status] || `Actualización: ${STATUS_META[status]?.label}`;
}

/* --------------------------- AUDITORÍA GLOBAL (§36) ------------------------ */
function buildAuditLog(reports, masterCases) {
  const entries = [];
  reports.forEach((r) => {
    let runningStatus = null;
    (r.timeline || []).forEach((t, i) => {
      const hasStatusChange = !!t.toStatus;
      const anterior = hasStatusChange
        ? runningStatus
          ? STATUS_META[runningStatus]?.label
          : "—"
        : "—";
      const nuevo = hasStatusChange
        ? STATUS_META[t.toStatus]?.label || t.toStatus
        : "—";
      if (hasStatusChange) runningStatus = t.toStatus;
      entries.push({
        id: `${r.id}-${i}`,
        at: t.at,
        by: t.by || "Sistema",
        action: t.label || "Actividad registrada",
        campo: hasStatusChange ? "Estado" : "Actividad",
        anterior,
        nuevo,
        motivo: t.reason || null,
        kind: "report",
        caseId: r.id,
        caseCode: r.code,
        institutionId: r.institutionId || null,
        category: r.category,
        zone: r.zone,
      });
    });
  });
  (masterCases || []).forEach((mc) => {
    (mc.timeline || []).forEach((t, i) => {
      entries.push({
        id: `${mc.id}-${i}`,
        at: t.at,
        by: t.by || "Sistema",
        action: t.label || "Actividad registrada",
        campo: "Caso maestro",
        anterior: "—",
        nuevo: "—",
        motivo: t.reason || null,
        kind: "masterCase",
        caseId: mc.id,
        caseCode: mc.code || mc.id,
        institutionId: null,
        category: mc.category,
        zone: mc.zone,
      });
    });
  });
  return entries.sort((a, b) => b.at - a.at);
}

function exportAuditCsv(entries, filename) {
  const header = [
    "Fecha",
    "Usuario",
    "Caso",
    "Acción",
    "Campo",
    "Valor anterior",
    "Valor nuevo",
    "Motivo",
  ];
  const rows = entries.map((e) => [
    formatDateTime(e.at),
    `"${(e.by || "").replace(/"/g, "'")}"`,
    e.caseCode,
    `"${(e.action || "").replace(/"/g, "'")}"`,
    e.campo,
    e.anterior,
    e.nuevo,
    `"${(e.motivo || "").replace(/"/g, "'")}"`,
  ]);
  const csv = [header, ...rows].map((row) => row.join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* --------------------------- DASHBOARD EJECUTIVO (§29/§30) ----------------- */
function formatKpiHours(h) {
  if (h === null || h === undefined || Number.isNaN(h)) return "—";
  if (h < 48) return `${Math.round(h)}h`;
  return `${(h / 24).toFixed(1)}d`;
}
function computeExecutiveKpis(reports) {
  const total = reports.length;
  if (!total) {
    return {
      frtHours: null,
      frtSample: 0,
      artHours: null,
      artSample: 0,
      slaCompliancePct: null,
      slaSample: 0,
      backlog: 0,
      agingHours: null,
      reopenRatePct: null,
      escalationRatePct: 0,
      resolutionRatePct: 0,
    };
  }
  const now = Date.now();

  const frtSamples = [];
  reports.forEach((r) => {
    const tl = r.timeline || [];
    if (!tl.length) return;
    const first = tl[0].at;
    const firstMove = tl
      .slice(1)
      .find((t) => t.toStatus && t.toStatus !== "nuevo");
    if (firstMove) frtSamples.push((firstMove.at - first) / 3600000);
  });
  const frtHours = frtSamples.length
    ? frtSamples.reduce((a, b) => a + b, 0) / frtSamples.length
    : null;

  const closed = reports.filter(
    (r) =>
      (r.status === "resuelto" || r.status === "cerrado") &&
      (r.timeline || []).length > 1,
  );
  const artSamples = closed.map((r) => {
    const tl = r.timeline;
    const closingEntry =
      [...tl].reverse().find((t) => t.toStatus === r.status) ||
      tl[tl.length - 1];
    return (closingEntry.at - tl[0].at) / 3600000;
  });
  const artHours = artSamples.length
    ? artSamples.reduce((a, b) => a + b, 0) / artSamples.length
    : null;

  const withSla = reports.filter((r) => r.dueAt);
  const slaCompliant = withSla.filter((r) => {
    if (r.status === "resuelto" || r.status === "cerrado") {
      const tl = r.timeline || [];
      const closingEntry =
        [...tl].reverse().find((t) => t.toStatus === r.status) ||
        tl[tl.length - 1];
      return closingEntry.at <= r.dueAt;
    }
    if (isActiveReport(r)) return !isOverdue(r);
    return true;
  }).length;
  const slaCompliancePct = withSla.length
    ? (slaCompliant / withSla.length) * 100
    : null;

  const activeReports = reports.filter(isActiveReport);
  const backlog = activeReports.length;
  const agingHours = activeReports.length
    ? activeReports.reduce((a, r) => a + (now - r.createdAt) / 3600000, 0) /
      activeReports.length
    : null;

  const closedEver = reports.filter(
    (r) =>
      r.status === "resuelto" ||
      r.status === "cerrado" ||
      (r.reopenedCount || 0) > 0,
  ).length;
  const reopened = reports.filter((r) => (r.reopenedCount || 0) > 0).length;
  const reopenRatePct = closedEver ? (reopened / closedEver) * 100 : null;

  const everEscalated = reports.filter((r) =>
    (r.timeline || []).some((t) => t.toStatus === "escalado"),
  ).length;
  const escalationRatePct = (everEscalated / total) * 100;

  const resolved = reports.filter(
    (r) => r.status === "resuelto" || r.status === "cerrado",
  ).length;
  const resolutionRatePct = (resolved / total) * 100;

  return {
    frtHours,
    frtSample: frtSamples.length,
    artHours,
    artSample: artSamples.length,
    slaCompliancePct,
    slaSample: withSla.length,
    backlog,
    agingHours,
    reopenRatePct,
    reopenSample: closedEver,
    escalationRatePct,
    resolutionRatePct,
  };
}

/* ------------------------------ UI PRIMITIVES ------------------------------ */

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
      .tr-root { font-family: 'Inter', system-ui, sans-serif; }
      .tr-display { font-family: 'Space Grotesk', 'Inter', sans-serif; }
      .tr-mono { font-family: 'JetBrains Mono', monospace; }
      .tr-scroll::-webkit-scrollbar { display: none; }
      .tr-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      @keyframes tr-pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(20,184,166,0.35); } 100% { box-shadow: 0 0 0 10px rgba(20,184,166,0); } }
      .tr-pulse { animation: tr-pulse-ring 2s infinite; }
      @keyframes tr-fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      .tr-fade-up { animation: tr-fade-up 0.35s ease both; }
    `}</style>
  );
}

function Avatar({ seed, size = 40, ring, anonymous }) {
  if (anonymous) {
    return (
      <div
        className="rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0"
        style={{ width: size, height: size }}
      >
        <UserCircle2 size={size * 0.65} />
      </div>
    );
  }
  return (
    <img
      src={avatarUrl(seed)}
      alt={seed}
      className={`rounded-full shrink-0 bg-slate-100 ${ring ? `ring-2 ${ring}` : ""}`}
      style={{ width: size, height: size }}
    />
  );
}

function LevelBadge({ points, size = "sm" }) {
  const lvl = getLevel(points);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${lvl.bg} ${lvl.text} ${size === "sm" ? "text-[11px]" : "text-xs"}`}
    >
      <Trophy size={size === "sm" ? 11 : 13} /> {lvl.label}
    </span>
  );
}

function StatusPill({ status }) {
  const meta = STATUS_META[status];
  const Icon = meta.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badge}`}
    >
      <Icon size={12} /> {meta.label}
    </span>
  );
}
function PriorityPill({ priority }) {
  const meta = PRIORITY_META[priority];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badge}`}
    >
      {meta.label}
    </span>
  );
}
function CategoryPill({ id }) {
  const cat = getCategory(id);
  const Icon = cat.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cat.badge}`}
    >
      <Icon size={12} /> {cat.label}
    </span>
  );
}
function CaseHealthBadge({ report, compact = false }) {
  const health = getCaseHealth(report);
  if (!health) return null;
  return (
    <span
      title={health.reasons.length ? health.reasons.join(" · ") : health.short}
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${compact ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"} ${health.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${health.dot}`} />{" "}
      {compact ? health.label : health.short}
    </span>
  );
}
function StarRow({ value, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={
            n <= value ? "fill-amber-400 text-amber-400" : "text-slate-300"
          }
        />
      ))}
    </div>
  );
}
function ProgressBar({ value, colorClass = "bg-teal-500" }) {
  return (
    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
      <div
        className={`h-full ${colorClass} rounded-full transition-all`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] tr-fade-up">
      <div className="flex items-center gap-2 rounded-full bg-slate-900 text-white text-sm font-medium px-4 py-2.5 shadow-xl">
        <CheckCircle2 size={16} className="text-teal-400" /> {toast}
      </div>
    </div>
  );
}
function SectionHeading({ eyebrow, title, action }) {
  return (
    <div className="flex items-end justify-between mb-3">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-600 mb-0.5">
            {eyebrow}
          </p>
        )}
        <h2 className="tr-display text-lg font-bold text-slate-900">{title}</h2>
      </div>
      {action}
    </div>
  );
}

/* --------------------------------- LOGO ---------------------------------- */

function Logo({ size = 34 }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="rounded-xl bg-gradient-to-br from-blue-800 to-teal-500 flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <MapPin size={size * 0.56} className="text-white" strokeWidth={2.4} />
      </div>
      <span
        className="tr-display font-bold text-slate-900 leading-none"
        style={{ fontSize: size * 0.5 }}
      >
        Tu<span className="text-teal-600">Reporte</span>
      </span>
    </div>
  );
}

/* ============================================================================
   AUTH FLOW
============================================================================ */

function AuthShell({ children, step, totalSteps, onHome }) {
  return (
    <div className="min-h-full bg-gradient-to-br from-blue-950 via-blue-900 to-teal-800 flex flex-col">
      <div className="px-6 pt-10 pb-8 md:pt-16">
        {onHome ? (
          <button
            onClick={onHome}
            className="inline-block hover:opacity-90 transition"
          >
            <Logo size={40} />
          </button>
        ) : (
          <Logo size={40} />
        )}
        <p className="text-teal-100 text-sm mt-2 max-w-sm">
          Tu ciudad, tu voz, tu comunidad. Reporta incidencias y da seguimiento
          en tiempo real.
        </p>
      </div>
      <div className="flex-1 bg-slate-50 rounded-t-[2.5rem] px-5 pt-7 pb-10 md:px-10">
        <div className="max-w-md mx-auto">
          {totalSteps && (
            <div className="flex items-center gap-1.5 mb-6">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-teal-500" : "bg-slate-200"}`}
                />
              ))}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

function TextField({ label, icon: Icon, ...props }) {
  return (
    <label className="block mb-4">
      <span className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}
      </span>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-teal-400 focus-within:border-teal-400">
        {Icon && <Icon size={16} className="text-slate-400 shrink-0" />}
        <input
          {...props}
          className="flex-1 outline-none text-sm text-slate-800 placeholder:text-slate-400 bg-transparent"
        />
      </div>
    </label>
  );
}

function LoginScreen({ onLogin, onGoRegister, showToast, onHome }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  return (
    <AuthShell onHome={onHome}>
      <h1 className="tr-display text-2xl font-bold text-slate-900 mb-1">
        Bienvenido de nuevo
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Ingresa a tu cuenta para reportar o gestionar incidencias.
      </p>

      <TextField
        label="Correo electrónico"
        icon={Mail}
        type="email"
        placeholder="nombre@correo.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <label className="block mb-2">
        <span className="block text-xs font-semibold text-slate-600 mb-1.5">
          Contraseña
        </span>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-teal-400">
          <Lock size={16} className="text-slate-400 shrink-0" />
          <input
            type={showPw ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-1 outline-none text-sm bg-transparent"
          />
          <button onClick={() => setShowPw((s) => !s)} type="button">
            {showPw ? (
              <EyeOff size={16} className="text-slate-400" />
            ) : (
              <Eye size={16} className="text-slate-400" />
            )}
          </button>
        </div>
      </label>
      <div className="text-right mb-5">
        <button
          className="text-xs font-semibold text-teal-700"
          onClick={() =>
            showToast(
              "Función de recuperación disponible en la versión completa",
            )
          }
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      <button
        onClick={() => {
          showToast("Modo demostración: iniciando sesión con datos de ejemplo");
          onLogin(getUser("u1"));
        }}
        className="w-full rounded-xl bg-blue-900 text-white font-semibold py-3 text-sm flex items-center justify-center gap-2 hover:bg-blue-800 transition mb-4"
      >
        Iniciar sesión <ArrowRight size={16} />
      </button>

      <div className="flex items-center gap-3 my-5">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-[11px] text-slate-400 font-semibold">
          ACCESO RÁPIDO DE DEMOSTRACIÓN
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="grid grid-cols-4 gap-2 mb-6">
        <button
          onClick={() => onLogin(getUser("u1"))}
          className="rounded-xl border border-slate-200 bg-white py-3 px-1 flex flex-col items-center gap-1 hover:border-teal-400 hover:bg-teal-50 transition"
        >
          <Users size={18} className="text-teal-600" />
          <span className="text-[11px] font-semibold text-slate-700">
            Ciudadano
          </span>
        </button>
        <button
          onClick={() => onLogin(getUser("g1"))}
          className="rounded-xl border border-slate-200 bg-white py-3 px-1 flex flex-col items-center gap-1 hover:border-teal-400 hover:bg-teal-50 transition"
        >
          <ClipboardList size={18} className="text-blue-700" />
          <span className="text-[11px] font-semibold text-slate-700">
            Gestor
          </span>
        </button>
        <button
          onClick={() => onLogin(getUser("s1"))}
          className="rounded-xl border border-slate-200 bg-white py-3 px-1 flex flex-col items-center gap-1 hover:border-teal-400 hover:bg-teal-50 transition"
        >
          <ShieldCheck size={18} className="text-fuchsia-700" />
          <span className="text-[11px] font-semibold text-slate-700">
            Supervisor
          </span>
        </button>
        <button
          onClick={() => onLogin(getUser("a1"))}
          className="rounded-xl border border-slate-200 bg-white py-3 px-1 flex flex-col items-center gap-1 hover:border-teal-400 hover:bg-teal-50 transition"
        >
          <Shield size={18} className="text-slate-700" />
          <span className="text-[11px] font-semibold text-slate-700">
            Admin
          </span>
        </button>
      </div>

      <p className="text-center text-sm text-slate-500">
        ¿No tienes cuenta?{" "}
        <button onClick={onGoRegister} className="font-semibold text-teal-700">
          Crear cuenta ciudadana
        </button>
      </p>
    </AuthShell>
  );
}

function RegisterStep1({ onNext, onBack, initial, onHome }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const canContinue =
    form.name &&
    form.cedula &&
    form.phone &&
    form.email &&
    form.password &&
    form.zone;

  return (
    <AuthShell step={1} totalSteps={2} onHome={onHome}>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs font-semibold text-slate-500 mb-4"
      >
        <ArrowLeft size={14} /> Volver
      </button>
      <h1 className="tr-display text-2xl font-bold text-slate-900 mb-1">
        Crea tu cuenta
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Paso 1 de 2 — Tus datos básicos como ciudadano.
      </p>

      <TextField
        label="Nombre completo"
        icon={User}
        placeholder="Ej. Juan Pérez"
        value={form.name}
        onChange={set("name")}
      />
      <TextField
        label="Cédula de identidad"
        icon={CreditCard}
        placeholder="000-0000000-0"
        value={form.cedula}
        onChange={set("cedula")}
      />
      <TextField
        label="Teléfono"
        icon={Phone}
        placeholder="809-000-0000"
        value={form.phone}
        onChange={set("phone")}
      />
      <TextField
        label="Correo electrónico"
        icon={Mail}
        type="email"
        placeholder="nombre@correo.com"
        value={form.email}
        onChange={set("email")}
      />
      <TextField
        label="Contraseña"
        icon={Lock}
        type="password"
        placeholder="Mínimo 8 caracteres"
        value={form.password}
        onChange={set("password")}
      />

      <label className="block mb-5">
        <span className="block text-xs font-semibold text-slate-600 mb-1.5">
          Municipio de residencia
        </span>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
          <MapPin size={16} className="text-slate-400" />
          <select
            value={form.zone}
            onChange={set("zone")}
            className="flex-1 outline-none text-sm bg-transparent text-slate-800"
          >
            <option value="">Selecciona tu municipio</option>
            {ZONES.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>
      </label>

      <label className="flex items-start gap-2 mb-6 text-xs text-slate-500">
        <input
          type="checkbox"
          checked={form.terms}
          onChange={(e) => setForm((f) => ({ ...f, terms: e.target.checked }))}
          className="mt-0.5"
        />
        Acepto los términos de uso y el tratamiento de mis datos personales
        conforme a la normativa dominicana de protección de datos.
      </label>

      <button
        disabled={!canContinue || !form.terms}
        onClick={() => onNext(form)}
        className="w-full rounded-xl bg-blue-900 disabled:bg-slate-300 text-white font-semibold py-3 text-sm flex items-center justify-center gap-2 hover:bg-blue-800 transition"
      >
        Continuar a verificación <ArrowRight size={16} />
      </button>
    </AuthShell>
  );
}

const OCR_STEPS = [
  "Detectando bordes del documento",
  "Extrayendo texto de la cédula",
  "Verificando datos con el formulario",
  "Validación completada",
];

function RegisterOcrStep({ form, onBack, onDone, showToast, onHome }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [stepIdx, setStepIdx] = useState(0);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    setFile(URL.createObjectURL(f));
    setStatus("idle");
  };

  const runOcr = () => {
    setStatus("processing");
    setStepIdx(0);
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setStepIdx(i);
      if (i >= OCR_STEPS.length - 1) {
        clearInterval(interval);
        setTimeout(() => setStatus("success"), 700);
      }
    }, 750);
  };

  return (
    <AuthShell step={2} totalSteps={2} onHome={onHome}>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs font-semibold text-slate-500 mb-4"
      >
        <ArrowLeft size={14} /> Volver
      </button>
      <h1 className="tr-display text-2xl font-bold text-slate-900 mb-1">
        Verifica tu identidad
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Paso 2 de 2 — Sube una foto de tu cédula. Nuestro sistema de OCR
        validará automáticamente tus datos.
      </p>

      {status !== "success" && (
        <div
          onClick={() => inputRef.current && inputRef.current.click()}
          className="rounded-2xl border-2 border-dashed border-slate-300 bg-white hover:border-teal-400 hover:bg-teal-50/40 transition cursor-pointer flex flex-col items-center justify-center py-10 px-4 mb-4"
        >
          {file ? (
            <img
              src={file}
              alt="Cédula"
              className="max-h-40 rounded-lg shadow mb-3 object-contain"
            />
          ) : (
            <Camera size={32} className="text-teal-500 mb-3" />
          )}
          <p className="text-sm font-semibold text-slate-700">
            {file ? "Cambiar foto" : "Toca para subir la foto de tu cédula"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Formato JPG o PNG · Frente del documento
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files && e.target.files[0])}
          />
        </div>
      )}

      {status === "idle" && file && (
        <button
          onClick={runOcr}
          className="w-full rounded-xl bg-teal-600 text-white font-semibold py-3 text-sm flex items-center justify-center gap-2 hover:bg-teal-700 transition mb-4"
        >
          <ScanLine size={16} /> Validar cédula con OCR
        </button>
      )}

      {status === "processing" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Loader2 size={18} className="text-teal-600 animate-spin" />
            <span className="text-sm font-semibold text-slate-700">
              Analizando documento…
            </span>
          </div>
          <div className="space-y-2.5">
            {OCR_STEPS.slice(0, -1).map((s, i) => (
              <div key={s} className="flex items-center gap-2 text-sm">
                {i < stepIdx ? (
                  <CheckCircle2
                    size={16}
                    className="text-emerald-500 shrink-0"
                  />
                ) : i === stepIdx ? (
                  <Loader2
                    size={16}
                    className="text-teal-500 animate-spin shrink-0"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-200 shrink-0" />
                )}
                <span
                  className={i <= stepIdx ? "text-slate-700" : "text-slate-300"}
                >
                  {s}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {status === "success" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 mb-4 tr-fade-up">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800">
                Cédula validada correctamente
              </p>
              <p className="text-[11px] text-emerald-600">
                Los datos coinciden con el formulario ingresado
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 text-xs space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span>Nombre detectado</span>
              <span className="font-semibold text-slate-800">{form.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Cédula detectada</span>
              <span className="font-semibold text-slate-800 tr-mono">
                {form.cedula}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Estado</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                <BadgeCheck size={12} /> Verificado
              </span>
            </div>
          </div>
        </div>
      )}

      <button
        disabled={status !== "success"}
        onClick={() => {
          showToast("Cuenta creada y verificada. ¡Bienvenido a TuReporte!");
          onDone();
        }}
        className="w-full rounded-xl bg-blue-900 disabled:bg-slate-300 text-white font-semibold py-3 text-sm flex items-center justify-center gap-2 hover:bg-blue-800 transition"
      >
        Finalizar registro <ArrowRight size={16} />
      </button>
      <p className="text-[10px] text-slate-400 text-center mt-3">
        Simulación de validación OCR para fines de demostración del MVP. En
        producción, este paso se procesa en el backend.
      </p>
    </AuthShell>
  );
}

// ============================================================================
// COMPONENTE DE MAPA PROFESIONAL
// ============================================================================

// Colores por categoría para marcadores
const CATEGORY_COLORS = {
  calles: "#ea580c",
  alumbrado: "#ca8a04",
  basura: "#b45309",
  alcantarillado: "#0e7490",
  agua: "#2563eb",
  ambiente: "#059669",
  ocupacion: "#7c3aed",
  mobiliario: "#e11d48",
  otro: "#475569",
};

function getMarkerIcon(category, status) {
  const color = CATEGORY_COLORS[category] || "#475569";
  const isActive = !["resuelto", "cerrado", "rechazado", "duplicado"].includes(
    status,
  );

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 40" width="30" height="40">
      <path d="M15 0 C6.7 0 0 6.7 0 15 C0 25 15 40 15 40 C15 40 30 25 30 15 C30 6.7 23.3 0 15 0 Z" 
        fill="${color}" stroke="white" stroke-width="2" opacity="${isActive ? 1 : 0.6}"/>
      <circle cx="15" cy="15" r="5" fill="white" opacity="${isActive ? 1 : 0.6}"/>
      ${isActive ? "" : '<line x1="5" y1="5" x2="25" y2="35" stroke="white" stroke-width="2" opacity="0.5"/>'}
    </svg>
  `;

  return L.icon({
    iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -40],
  });
}

// Coordenadas aproximadas por zona (Santo Domingo)
const ZONE_COORDS = {
  dn: { lat: 18.4861, lng: -69.9312 },
  sde: { lat: 18.49, lng: -69.83 },
  sdn: { lat: 18.54, lng: -69.89 },
  sdo: { lat: 18.47, lng: -69.98 },
  alc: { lat: 18.52, lng: -70.02 },
  bch: { lat: 18.45, lng: -69.6 },
  pbr: { lat: 18.56, lng: -70.08 },
  sag: { lat: 18.53, lng: -69.78 },
};

function getReportCoords(report, index) {
  const base = ZONE_COORDS[report.zone];
  if (!base) return { lat: 18.4861, lng: -69.9312 };

  const seed =
    index * 0.001 + report.id.charCodeAt(report.id.length - 1) * 0.0005;
  const latOffset = Math.sin(seed * 3.7) * 0.008;
  const lngOffset = Math.cos(seed * 2.3) * 0.008;

  return {
    lat: base.lat + latOffset,
    lng: base.lng + lngOffset,
  };
}

const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 13);
    }
  }, [center, zoom, map]);
  return null;
};

function ProfessionalMap({
  reports,
  selectedReportId,
  onSelectReport,
  height = 500,
}) {
  const [mapCenter, setMapCenter] = useState([18.4861, -69.9312]);
  const [mapZoom, setMapZoom] = useState(12);
  const mapRef = useRef(null);

  useEffect(() => {
    if (selectedReportId) {
      const report = reports.find((r) => r.id === selectedReportId);
      if (report) {
        const coords = getReportCoords(report, reports.indexOf(report));
        setMapCenter([coords.lat, coords.lng]);
        setMapZoom(15);
      }
    }
  }, [selectedReportId, reports]);

  const groupedReports = useMemo(() => {
    const groups = {};
    reports.forEach((r, i) => {
      const coords = getReportCoords(r, i);
      const key = `${coords.lat.toFixed(4)},${coords.lng.toFixed(4)}`;
      if (!groups[key]) {
        groups[key] = { coords, reports: [] };
      }
      groups[key].reports.push(r);
    });
    return Object.values(groups);
  }, [reports]);

  return (
    <div
      className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm"
      style={{ height, position: "relative" }}
    >
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="topright" />
        <MapUpdater center={mapCenter} zoom={mapZoom} />

        {groupedReports.map((group, idx) => {
          const count = group.reports.length;
          const radius = 15 + count * 5;
          const color =
            count > 3 ? "#dc2626" : count > 1 ? "#f59e0b" : "#0ea5e9";
          return (
            <CircleMarker
              key={`cluster-${idx}`}
              center={[group.coords.lat, group.coords.lng]}
              radius={Math.min(radius, 40)}
              fillColor={color}
              color="white"
              weight={2}
              opacity={0.8}
              fillOpacity={0.3}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-bold">{count} incidencias</p>
                  <button
                    className="text-xs text-blue-600 hover:underline mt-1"
                    onClick={() => {
                      const firstReport = group.reports[0];
                      const coords = getReportCoords(
                        firstReport,
                        reports.indexOf(firstReport),
                      );
                      setMapCenter([coords.lat, coords.lng]);
                      setMapZoom(14);
                    }}
                  >
                    Ver detalles
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {reports.map((report, index) => {
          const coords = getReportCoords(report, index);
          const isSelected = selectedReportId === report.id;
          const icon = getMarkerIcon(report.category, report.status);

          return (
            <Marker
              key={report.id}
              position={[coords.lat, coords.lng]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  onSelectReport(report.id);
                  setMapCenter([coords.lat, coords.lng]);
                  setMapZoom(14);
                },
              }}
            >
              <Popup>
                <div className="min-w-[200px] max-w-[280px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-slate-400">
                      {report.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_META[report.status]?.badge}`}
                    >
                      {STATUS_META[report.status]?.label}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 line-clamp-2">
                    {report.desc}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${getCategory(report.category).badge}`}
                    >
                      {getCategory(report.category).label}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {getZone(report.zone)?.name}
                    </span>
                  </div>
                  <button
                    className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 w-full text-center border-t border-slate-100 pt-1.5"
                    onClick={() => onSelectReport(report.id)}
                  >
                    Ver detalles →
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Leyenda */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-xl shadow-lg p-3 border border-slate-200 z-[1000]">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
          Categorías
        </p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(CATEGORY_COLORS)
            .slice(0, 6)
            .map(([key, color]) => (
              <div key={key} className="flex items-center gap-1">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: color }}
                />
                <span className="text-[9px] text-slate-600">
                  {getCategory(key)?.label || key}
                </span>
              </div>
            ))}
        </div>
        <div className="flex items-center gap-3 mt-1.5 pt-1.5 border-t border-slate-100">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-[9px] text-slate-500">Activa</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            <span className="text-[9px] text-slate-500">Cerrada</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500 opacity-30" />
            <span className="text-[9px] text-slate-500">Concentración</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE DE GESTIÓN DE ROLES DE USUARIO
// ============================================================================

function AdminUserRoles({ users, onUpdateUserRole, currentUser }) {
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedInstitution, setSelectedInstitution] = useState("");

  const handleStartEdit = (user) => {
    setEditingUser(user.id);
    setSelectedRole(user.role);
    setSelectedInstitution(user.institutionId || "");
  };

  const handleSaveRole = (userId) => {
    if (!selectedRole) return;
    const updateData = { role: selectedRole };
    if (selectedRole === "gestor" || selectedRole === "supervisor") {
      if (!selectedInstitution) {
        alert("Debes seleccionar una institución para este rol");
        return;
      }
      updateData.institutionId = selectedInstitution;
    } else {
      updateData.institutionId = null;
    }
    onUpdateUserRole(userId, updateData);
    setEditingUser(null);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setSelectedRole("");
    setSelectedInstitution("");
  };

  const filteredUsers = users.filter((u) => u.id !== currentUser.id);

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4 pb-8">
      <SectionHeading
        eyebrow="Gestión de permisos"
        title="Asignar roles a usuarios"
        action={
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Shield size={14} /> Administración de roles
          </div>
        }
      />

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-2.5 bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-200">
          <span>Usuario</span>
          <span>Rol actual</span>
          <span>Institución</span>
          <span className="text-right">Acciones</span>
        </div>

        {filteredUsers.map((u) => {
          const isEditing = editingUser === u.id;

          return (
            <div
              key={u.id}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-4 py-2.5 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar seed={u.seed} size={30} />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate">
                    {u.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {u.email}
                  </p>
                </div>
              </div>

              {isEditing ? (
                <div className="flex items-center gap-1.5">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="text-xs rounded-lg border border-slate-200 px-2 py-1 bg-white outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="ciudadano">Ciudadano</option>
                    <option value="gestor">Gestor</option>
                    <option value="supervisor">Supervisor</option>
                  </select>
                </div>
              ) : (
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full text-center whitespace-nowrap ${
                    u.role === "admin"
                      ? "bg-slate-800 text-white"
                      : u.role === "supervisor"
                        ? "bg-fuchsia-100 text-fuchsia-700"
                        : u.role === "gestor"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-teal-100 text-teal-700"
                  }`}
                >
                  {u.role === "admin"
                    ? "Admin"
                    : u.role === "supervisor"
                      ? "Supervisor"
                      : u.role === "gestor"
                        ? "Gestor"
                        : "Ciudadano"}
                </span>
              )}

              {isEditing ? (
                <div className="min-w-[120px]">
                  {(selectedRole === "gestor" ||
                    selectedRole === "supervisor") && (
                    <select
                      value={selectedInstitution}
                      onChange={(e) => setSelectedInstitution(e.target.value)}
                      className="text-[10px] rounded-lg border border-slate-200 px-2 py-1 bg-white w-full outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">Seleccionar institución</option>
                      {INSTITUTIONS.filter((i) => i.id !== "otra").map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.short}
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedRole === "ciudadano" && (
                    <span className="text-[10px] text-slate-400">
                      Sin institución
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-[11px] text-slate-500 truncate">
                  {u.role === "gestor" || u.role === "supervisor"
                    ? u.institutionId
                      ? getInstitution(u.institutionId).short
                      : "—"
                    : "—"}
                </span>
              )}

              <div className="flex items-center justify-end gap-1">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => handleSaveRole(u.id)}
                      className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition"
                      title="Guardar"
                    >
                      <Save size={14} />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1.5 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition"
                      title="Cancelar"
                    >
                      <XCircle size={14} />
                    </button>
                  </>
                ) : (
                  u.role !== "admin" && (
                    <button
                      onClick={() => handleStartEdit(u)}
                      className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition"
                      title="Editar rol"
                    >
                      <Edit2 size={14} />
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl bg-blue-50 border border-blue-200 p-4">
        <p className="text-[11px] font-semibold text-blue-800 flex items-center gap-1.5">
          <Info size={14} /> Gestión de roles
        </p>
        <p className="text-[11px] text-blue-700 mt-1">
          <strong>Ciudadano:</strong> Solo puede reportar y dar seguimiento a
          sus incidencias.
          <br />
          <strong>Gestor:</strong> Puede validar, clasificar, asignar y
          gestionar incidencias de su institución.
          <br />
          <strong>Supervisor:</strong> Tiene todas las capacidades del gestor
          más arbitraje de escalamientos y supervisión.
          <br />
          <strong>Admin:</strong> Control total del sistema (este rol no se
          puede modificar).
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// SHELL / NAVIGATION
// ============================================================================

const NAV_BY_ROLE = {
  ciudadano: [
    { id: "feed", label: "Inicio", Icon: Home },
    { id: "map", label: "Mapa", Icon: MapIcon },
    { id: "compose", label: "Reportar", Icon: PlusCircle, primary: true },
    { id: "notify", label: "Avisos", Icon: Bell },
    { id: "profile", label: "Perfil", Icon: User },
  ],
  gestor: [
    { id: "dashboard", label: "Bandeja", Icon: ClipboardList },
    { id: "masterCases", label: "C. maestros", Icon: Layers },
    { id: "stats", label: "Estadísticas", Icon: BarChart3 },
    { id: "map", label: "Mapa", Icon: MapIcon },
    { id: "notify", label: "Avisos", Icon: Bell },
    { id: "profile", label: "Perfil", Icon: User },
  ],
  supervisor: [
    { id: "supervisorCenter", label: "Supervisión", Icon: ShieldCheck },
    { id: "dashboard", label: "Bandeja", Icon: ClipboardList },
    { id: "masterCases", label: "C. maestros", Icon: Layers },
    { id: "stats", label: "Estadísticas", Icon: BarChart3 },
    { id: "map", label: "Mapa", Icon: MapIcon },
    { id: "audit", label: "Auditoría", Icon: History },
    { id: "notify", label: "Avisos", Icon: Bell },
    { id: "profile", label: "Perfil", Icon: User },
  ],
  admin: [
    { id: "dashboard", label: "KPIs", Icon: BarChart3 },
    { id: "masterCases", label: "C. maestros", Icon: Layers },
    { id: "map", label: "Mapa", Icon: MapIcon },
    { id: "audit", label: "Auditoría", Icon: History },
    { id: "rules", label: "Reglas", Icon: Settings2 },
    { id: "users", label: "Usuarios", Icon: Users },
    { id: "adminRoles", label: "Roles", Icon: Shield },
    { id: "notify", label: "Avisos", Icon: Bell },
    { id: "profile", label: "Perfil", Icon: User },
  ],
};

function AppShell({
  user,
  view,
  setView,
  onLogout,
  children,
  unreadCount = 0,
}) {
  const nav = NAV_BY_ROLE[user.role];
  const roleLabel = ROLE_META[user.role]?.label || user.role;
  return (
    <div className="min-h-full bg-slate-50 flex">
      <aside className="hidden md:flex flex-col w-60 border-r border-slate-200 bg-white px-4 py-6 shrink-0">
        <Logo size={32} />
        <div className="mt-8 flex-1 space-y-1">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition relative ${
                view === n.id
                  ? "bg-sky-50 text-sky-700"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <n.Icon size={18} /> {n.label}
              {n.id === "notify" && unreadCount > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center gap-2.5 mb-3">
          <Avatar seed={user.seed} size={36} />
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">
              {user.name}
            </p>
            <p className="text-[10px] text-slate-400">{roleLabel}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-red-500 px-3"
        >
          <LogOut size={14} /> Cerrar sesión
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <Logo size={28} />
          <div className="flex items-center gap-3">
            <button onClick={() => setView("notify")} className="relative">
              <Bell size={19} className="text-slate-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <button onClick={() => setView("profile")}>
              <Avatar seed={user.seed} size={30} />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto tr-scroll pb-24 md:pb-8">
          {children}
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 flex items-stretch px-2 pb-safe">
        {nav.map((n) => (
          <button
            key={n.id}
            onClick={() => setView(n.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 ${n.primary ? "" : ""}`}
          >
            {n.primary ? (
              <div className="w-11 h-11 -mt-4 rounded-2xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-600/30">
                <n.Icon size={22} className="text-white" />
              </div>
            ) : (
              <span className="relative">
                <n.Icon
                  size={20}
                  className={view === n.id ? "text-teal-600" : "text-slate-400"}
                />
                {n.id === "notify" && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-red-500" />
                )}
              </span>
            )}
            <span
              className={`text-[10px] font-semibold ${view === n.id ? "text-teal-700" : "text-slate-400"}`}
            >
              {n.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ============================================================================
   CITIZEN — FEED (COMPONENTES DEL CIUDADANO)
============================================================================ */

function AuthorLine({ report, users, onOpenProfile }) {
  if (report.isAnonymous) {
    return (
      <div className="flex items-center gap-2.5">
        <Avatar anonymous size={38} />
        <div>
          <p className="text-sm font-bold text-slate-800">Usuario anónimo</p>
          <p className="text-[11px] text-slate-400">
            {timeAgo(report.createdAt)} · {formatDistance(report.distanceM)}
          </p>
        </div>
      </div>
    );
  }
  const author = getUser(report.authorId);
  return (
    <div className="flex items-center gap-2.5">
      <button onClick={() => onOpenProfile(author)}>
        <Avatar seed={author.seed} size={38} ring="ring-teal-200" />
      </button>
      <div>
        <button
          onClick={() => onOpenProfile(author)}
          className="text-sm font-bold text-slate-800 hover:text-teal-700"
        >
          {author.name}
        </button>
        <p className="text-[11px] text-slate-400">
          {timeAgo(report.createdAt)} · {formatDistance(report.distanceM)}
        </p>
      </div>
    </div>
  );
}

function PhotoStrip({ photos }) {
  const [idx, setIdx] = useState(0);
  return (
    <div className="relative">
      <img
        src={photos[idx]}
        alt="Evidencia del reporte"
        className="w-full h-64 object-cover"
      />
      {photos.length > 1 && (
        <>
          <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            {idx + 1}/{photos.length}
          </div>
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
            {photos.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${i === idx ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
          <button
            onClick={() =>
              setIdx((i) => (i - 1 + photos.length) % photos.length)
            }
            className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % photos.length)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}
    </div>
  );
}

function FeedCard({ report, liked, onLike, onOpenProfile, onOpenDetail }) {
  return (
    <article className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <AuthorLine report={report} onOpenProfile={onOpenProfile} />
        <button onClick={() => onOpenDetail(report)}>
          <ChevronRight size={18} className="text-slate-300" />
        </button>
      </div>
      <button onClick={() => onOpenDetail(report)} className="block w-full">
        <PhotoStrip photos={report.photos} />
      </button>
      <div className="px-4 pt-3 flex items-center gap-2 flex-wrap">
        <CategoryPill id={report.category} />
        <StatusPill status={report.status} />
        {report.isDuplicate && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
            <Copy size={12} /> posible duplicado
          </span>
        )}
      </div>
      <p className="px-4 pt-2 text-sm text-slate-700 leading-relaxed">
        {report.desc}
      </p>
      <div className="px-4 pt-2 pb-1 flex items-center gap-1.5 text-[11px] text-slate-400">
        <MapPin size={12} /> {getZone(report.zone).name} · asignado a{" "}
        {getInstitution(report.institutionId).short}
      </div>
      <div className="flex items-center gap-4 px-4 py-3 border-t border-slate-50 mt-2">
        <button
          onClick={() => onLike(report.id)}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-500"
        >
          <Heart
            size={18}
            className={liked ? "fill-red-500 text-red-500" : ""}
          />{" "}
          {report.likes + (liked ? 1 : 0)}
        </button>
        <button
          onClick={() => onOpenDetail(report)}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-500"
        >
          <MessageCircle size={18} /> {report.commentsCount}
        </button>
        <span className="ml-auto text-[11px] text-slate-300">#{report.id}</span>
      </div>
    </article>
  );
}

function TopColaboradores({ users, onOpenProfile }) {
  const ranked = [...MOCK_USERS]
    .filter((u) => u.role === "ciudadano")
    .sort((a, b) => b.points - a.points);
  return (
    <div className="flex gap-4 overflow-x-auto tr-scroll px-4 pb-1 -mx-4 mb-2">
      {ranked.map((u, i) => (
        <button
          key={u.id}
          onClick={() => onOpenProfile(u)}
          className="flex flex-col items-center gap-1 shrink-0 w-16"
        >
          <div className="relative">
            <Avatar seed={u.seed} size={54} ring={getLevel(u.points).ring} />
            {i === 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 rounded-full w-5 h-5 flex items-center justify-center text-white text-[10px] font-bold shadow">
                1
              </span>
            )}
          </div>
          <span className="text-[11px] font-semibold text-slate-600 truncate w-full text-center">
            {u.name.split(" ")[0]}
          </span>
        </button>
      ))}
    </div>
  );
}

function CitizenFeed({
  reports,
  likedIds,
  onLike,
  onOpenProfile,
  onOpenDetail,
  currentUser,
}) {
  const [filter, setFilter] = useState("cerca");
  const list = useMemo(() => {
    const base =
      filter === "mias"
        ? reports.filter((r) => r.authorId === currentUser.id)
        : reports;
    const sorted = [...base].sort((a, b) =>
      filter === "cerca"
        ? a.distanceM - b.distanceM
        : filter === "mias"
          ? b.createdAt - a.createdAt
          : b.createdAt - a.createdAt,
    );
    return sorted;
  }, [reports, filter, currentUser.id]);

  return (
    <div className="max-w-xl mx-auto px-4 pt-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-slate-400">Hola,</p>
          <h1 className="tr-display text-xl font-bold text-slate-900">
            {currentUser.name.split(" ")[0]} 👋
          </h1>
        </div>
        <LevelBadge points={currentUser.points} />
      </div>

      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
        Vecinos que más colaboran
      </p>
      <TopColaboradores onOpenProfile={onOpenProfile} />

      <div className="flex rounded-full bg-slate-100 p-1 text-xs font-semibold w-fit mb-4 mt-4 flex-wrap">
        {[
          ["cerca", "Cerca de ti"],
          ["recientes", "Más recientes"],
          ["mias", "Mis incidencias"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`px-3.5 py-1.5 rounded-full transition ${filter === id ? "bg-white shadow text-slate-900" : "text-slate-500"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {list.map((r) => (
          <FeedCard
            key={r.id}
            report={r}
            liked={likedIds.has(r.id)}
            onLike={onLike}
            onOpenProfile={onOpenProfile}
            onOpenDetail={onOpenDetail}
          />
        ))}
        {list.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-12">
            {filter === "mias"
              ? "Aún no has creado ningún reporte."
              : "No hay reportes en esta vista."}
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------------------------- REPORT COMPOSER ----------------------------- */

function CitizenComposer({ onPublish, showToast }) {
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [desc, setDesc] = useState("");
  const [zone, setZone] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [photos, setPhotos] = useState([]);
  const inputRef = useRef(null);
  const subOptions = getSubcategoriesFor(category);

  const addPhotos = (files) => {
    const arr = Array.from(files || []).slice(0, 5 - photos.length);
    const urls = arr.map((f) => URL.createObjectURL(f));
    setPhotos((p) => [...p, ...urls].slice(0, 5));
  };
  const removePhoto = (i) => setPhotos((p) => p.filter((_, idx) => idx !== i));
  const canPublish =
    category &&
    subcategory &&
    desc.trim().length > 8 &&
    zone &&
    photos.length > 0;

  const submit = () => {
    onPublish({ category, subcategory, desc, zone, anonymous, photos });
    setCategory("");
    setSubcategory("");
    setDesc("");
    setZone("");
    setAnonymous(false);
    setPhotos([]);
    showToast("Reporte publicado y enrutado a la institución correspondiente");
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-4 pb-6">
      <SectionHeading
        eyebrow="Nuevo reporte"
        title="Cuéntanos qué está pasando"
      />

      <p className="text-xs font-semibold text-slate-600 mb-2">Categoría</p>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setCategory(c.id);
              setSubcategory("");
            }}
            className={`flex flex-col items-center gap-1 rounded-xl border py-3 px-1 transition ${category === c.id ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
          >
            <c.Icon
              size={18}
              className={category === c.id ? "text-teal-600" : "text-slate-400"}
            />
            <span className="text-[10px] font-semibold text-slate-600 text-center leading-tight">
              {c.label}
            </span>
          </button>
        ))}
      </div>

      {category && (
        <label className="block mb-4">
          <span className="block text-xs font-semibold text-slate-600 mb-1.5">
            Tipo específico de incidencia
          </span>
          <select
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400"
          >
            <option value="">Selecciona el tipo exacto…</option>
            {subOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400 mt-1">
            Elegir el tipo exacto acelera la asignación a la institución
            correcta.
          </p>
        </label>
      )}

      <label className="block mb-4">
        <span className="block text-xs font-semibold text-slate-600 mb-1.5">
          Descripción del problema
        </span>
        <textarea
          rows={4}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Describe qué observas, desde cuándo y por qué afecta a la comunidad…"
          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400 resize-none"
        />
      </label>

      <label className="block mb-4">
        <span className="block text-xs font-semibold text-slate-600 mb-1.5">
          Ubicación (municipio)
        </span>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
          <MapPin size={16} className="text-slate-400" />
          <select
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="flex-1 outline-none text-sm bg-transparent text-slate-800"
          >
            <option value="">Selecciona el municipio o sector</option>
            {ZONES.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          En producción se captura por GPS automáticamente.
        </p>
      </label>

      <p className="text-xs font-semibold text-slate-600 mb-2">
        Fotos de evidencia (máximo 5)
      </p>
      <div className="grid grid-cols-3 gap-2 mb-2">
        {photos.map((p, i) => (
          <div
            key={i}
            className="relative aspect-square rounded-xl overflow-hidden group"
          >
            <img src={p} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => removePhoto(i)}
              className="absolute top-1 right-1 bg-black/60 rounded-full p-1"
            >
              <X size={12} className="text-white" />
            </button>
          </div>
        ))}
        {photos.length < 5 && (
          <button
            onClick={() => inputRef.current && inputRef.current.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-teal-400 hover:text-teal-500"
          >
            <ImageIcon size={20} />
            <span className="text-[10px] font-semibold">Agregar</span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => addPhotos(e.target.files)}
        />
      </div>
      <p className="text-[10px] text-slate-400 mb-5">
        {photos.length}/5 fotos agregadas
      </p>

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 mb-6">
        <div>
          <p className="text-sm font-semibold text-slate-700">
            Publicar como anónimo
          </p>
          <p className="text-[11px] text-slate-400">
            Tu nombre no será visible para otros usuarios
          </p>
        </div>
        <button
          onClick={() => setAnonymous((a) => !a)}
          className={`w-11 h-6 rounded-full transition relative shrink-0 ${anonymous ? "bg-teal-500" : "bg-slate-200"}`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${anonymous ? "left-5" : "left-0.5"}`}
          />
        </button>
      </div>

      <button
        disabled={!canPublish}
        onClick={submit}
        className="w-full rounded-xl bg-blue-900 disabled:bg-slate-300 text-white font-semibold py-3.5 text-sm flex items-center justify-center gap-2 hover:bg-blue-800 transition"
      >
        Publicar reporte <Send size={16} />
      </button>
    </div>
  );
}

// ----------------------------- CITIZEN MAP --------------------------------

function CitizenMap({ reports }) {
  const [mapReportId, setMapReportId] = useState(null);

  return (
    <div className="max-w-5xl mx-auto px-4 pt-4 pb-6">
      <SectionHeading
        eyebrow="Mapa comunitario"
        title="Incidencias en tu ciudad"
      />
      <ProfessionalMap
        reports={reports}
        selectedReportId={mapReportId}
        onSelectReport={(id) => {
          setMapReportId(id);
        }}
        height={550}
      />
      <p className="text-[10px] text-slate-400 mt-2 text-center">
        Haz clic en cualquier marcador para ver los detalles de la incidencia
      </p>
    </div>
  );
}

// -------------------------------- PROFILE ----------------------------------

function ProfileModal({ author, reports, onClose }) {
  if (!author) return null;
  const authorReports = reports.filter(
    (r) => r.authorId === author.id && !r.isAnonymous,
  );
  const level = getLevel(author.points);
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-md max-h-[85vh] overflow-y-auto tr-scroll tr-fade-up"
      >
        <div className="p-5 text-center border-b border-slate-100">
          <Avatar seed={author.seed} size={72} ring={level.ring} />
          <h3 className="tr-display text-lg font-bold text-slate-900 mt-2">
            {author.name}
          </h3>
          <div className="flex justify-center mt-1">
            <LevelBadge points={author.points} size="md" />
          </div>
        </div>
        {author.isPublic ? (
          <div className="p-5">
            <div className="grid grid-cols-3 gap-2 mb-5">
              <div className="text-center rounded-xl bg-slate-50 py-3">
                <p className="tr-mono text-lg font-bold text-slate-800">
                  {authorReports.length}
                </p>
                <p className="text-[10px] text-slate-400">Reportes</p>
              </div>
              <div className="text-center rounded-xl bg-slate-50 py-3">
                <p className="tr-mono text-lg font-bold text-slate-800">
                  {authorReports.filter((r) => r.status === "resuelto").length}
                </p>
                <p className="text-[10px] text-slate-400">Resueltos</p>
              </div>
              <div className="text-center rounded-xl bg-slate-50 py-3">
                <p className="tr-mono text-lg font-bold text-slate-800">
                  {author.points}
                </p>
                <p className="text-[10px] text-slate-400">Puntos</p>
              </div>
            </div>
            <p className="text-xs font-bold text-slate-500 mb-2">
              Reportes publicados
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {authorReports.slice(0, 9).map((r) => (
                <img
                  key={r.id}
                  src={r.photos[0]}
                  className="aspect-square object-cover rounded-lg"
                  alt=""
                />
              ))}
              {authorReports.length === 0 && (
                <p className="col-span-3 text-xs text-slate-400 py-6 text-center">
                  Aún no ha publicado reportes visibles.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <Lock size={28} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">
              Este perfil es privado
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Solo puedes ver los reportes que este vecino decidió publicar de
              forma no anónima.
            </p>
          </div>
        )}
        <button
          onClick={onClose}
          className="w-full py-3 text-sm font-semibold text-slate-500 border-t border-slate-100"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

function NotificationsView({ notifications, onOpenReport }) {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-8">
      <SectionHeading eyebrow="Actividad" title="Notificaciones" />
      {notifications.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 py-14 text-center">
          <Bell size={26} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">
            No tienes notificaciones todavía.
          </p>
        </div>
      )}
      <div className="space-y-2">
        {notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => onOpenReport(n.reportId)}
            className="w-full text-left flex items-start gap-3 bg-white rounded-xl border border-slate-200 p-3 hover:border-sky-300 hover:shadow-sm transition"
          >
            <span
              className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
              style={{ background: n.tone }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] tr-mono text-slate-400">{n.code}</p>
              <p className="text-sm font-semibold text-slate-700">{n.label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {timeAgo(n.at)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function CitizenProfile({
  user,
  reports,
  onTogglePublic,
  onLogout,
  onGoStats,
}) {
  const mine = reports.filter((r) => r.authorId === user.id);
  const isCitizen = user.role === "ciudadano";
  const level = getLevel(user.points || 0);
  const floors = [0, 100, 300, 600];
  const nextThreshold = level.tier === 4 ? user.points : floors[level.tier];
  const floor = floors[level.tier - 1];
  const progress =
    level.tier === 4
      ? 100
      : Math.round(((user.points - floor) / (nextThreshold - floor)) * 100);

  const badges = [
    {
      id: "b1",
      label: "Primer reporte",
      got: mine.length >= 1,
      Icon: Sparkles,
    },
    { id: "b2", label: "5 reportes", got: mine.length >= 5, Icon: ListChecks },
    {
      id: "b3",
      label: "Colaborador constante",
      got: (user.points || 0) >= 200,
      Icon: TrendingUp,
    },
    {
      id: "b4",
      label: "Guardián del sector",
      got: (user.points || 0) >= 300,
      Icon: ShieldCheck,
    },
  ];

  return (
    <div className="max-w-xl mx-auto px-4 pt-4 pb-6">
      <div
        className={`rounded-2xl bg-gradient-to-br ${level.grad} p-5 text-white mb-4 relative overflow-hidden`}
      >
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -right-2 bottom-2 w-16 h-16 rounded-full bg-white/10" />
        <div className="flex items-center gap-3 relative">
          <Avatar seed={user.seed} size={58} ring="ring-white/50" />
          <div className="min-w-0">
            <h2 className="tr-display font-bold text-lg truncate">
              {user.name}
            </h2>
            {isCitizen ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold mt-1">
                <Trophy size={11} /> {level.label}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold mt-1">
                {user.role === "gestor"
                  ? "Gestor institucional"
                  : "Administrador"}
              </span>
            )}
          </div>
        </div>
        {isCitizen && (
          <div className="mt-4 relative">
            <div className="flex justify-between text-[11px] font-semibold mb-1">
              <span>{user.points || 0} pts</span>
              <span className="text-white/70">
                {level.tier === 4
                  ? "Nivel máximo"
                  : `${nextThreshold} pts para subir`}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${Math.max(6, progress)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {isCitizen && onGoStats && (
        <button
          onClick={onGoStats}
          className="w-full flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 mb-4 hover:bg-teal-100 transition"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-teal-700">
            <BarChart3 size={16} /> Ver mis estadísticas completas
          </span>
          <ChevronRight size={16} className="text-teal-500" />
        </button>
      )}

      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="text-center rounded-xl bg-white border border-slate-200 py-3">
          <p className="tr-mono text-lg font-bold text-slate-800">
            {mine.length}
          </p>
          <p className="text-[10px] text-slate-400">Mis reportes</p>
        </div>
        <div className="text-center rounded-xl bg-white border border-slate-200 py-3">
          <p className="tr-mono text-lg font-bold text-emerald-600">
            {mine.filter((r) => r.status === "resuelto").length}
          </p>
          <p className="text-[10px] text-slate-400">Resueltos</p>
        </div>
        <div className="text-center rounded-xl bg-white border border-slate-200 py-3">
          <p className="tr-mono text-lg font-bold text-amber-600">
            {
              mine.filter(
                (r) => r.status !== "resuelto" && r.status !== "cerrado",
              ).length
            }
          </p>
          <p className="text-[10px] text-slate-400">En curso</p>
        </div>
      </div>

      {isCitizen ? (
        <>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 mb-5">
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Perfil público
              </p>
              <p className="text-[11px] text-slate-400">
                Otros vecinos podrán ver tus reportes no anónimos y tus logros
              </p>
            </div>
            <button
              onClick={onTogglePublic}
              className={`w-11 h-6 rounded-full transition relative shrink-0 ${user.isPublic ? "bg-teal-500" : "bg-slate-200"}`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${user.isPublic ? "left-5" : "left-0.5"}`}
              />
            </button>
          </div>

          <p className="text-xs font-bold text-slate-500 mb-2">Logros</p>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {badges.map((b) => (
              <div
                key={b.id}
                className={`rounded-xl border p-3 flex items-center gap-2 ${b.got ? "border-teal-200 bg-teal-50" : "border-slate-200 bg-slate-50 opacity-60"}`}
              >
                <b.Icon
                  size={18}
                  className={b.got ? "text-teal-600" : "text-slate-400"}
                />
                <span className="text-xs font-semibold text-slate-700">
                  {b.label}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs font-bold text-slate-500 mb-2">Mis reportes</p>
          <div className="space-y-2 mb-6">
            {mine.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-2.5"
              >
                <img
                  src={r.photos[0]}
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                  alt=""
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-700 truncate">
                    {r.desc}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <StatusPill status={r.status} />
                    {r.satisfaction && (
                      <StarRow value={r.satisfaction} size={11} />
                    )}
                  </div>
                </div>
              </div>
            ))}
            {mine.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">
                Aún no has creado reportes.
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-4 mb-6">
          <p className="text-xs font-bold text-slate-500 mb-3">
            Datos de la cuenta
          </p>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Mail size={12} /> Correo
              </span>
              <span className="font-semibold text-slate-700">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Phone size={12} /> Teléfono
              </span>
              <span className="font-semibold text-slate-700">{user.phone}</span>
            </div>
            {user.role === "gestor" && (
              <div className="flex justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Building2 size={12} /> Institución
                </span>
                <span className="font-semibold text-slate-700 text-right">
                  {getInstitution(user.institutionId).name}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Shield size={12} /> Rol
              </span>
              <span className="font-semibold text-slate-700">
                {user.role === "gestor"
                  ? "Gestor institucional"
                  : "Administrador"}
              </span>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={onLogout}
        className="md:hidden w-full flex items-center justify-center gap-2 text-sm font-semibold text-red-500 border border-red-100 bg-red-50 rounded-xl py-3"
      >
        <LogOut size={16} /> Cerrar sesión
      </button>
    </div>
  );
}

// ============================================================================
// CITIZEN — ESTADÍSTICAS
// ============================================================================

function StatCard({ label, value, sub, Icon, tone = "teal", trend }) {
  const toneMap = {
    teal: "bg-teal-50 text-teal-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    purple: "bg-purple-50 text-purple-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4 hover:border-teal-200 hover:shadow-sm transition">
      <div className="flex items-center justify-between mb-2">
        <span
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${toneMap[tone]}`}
        >
          <Icon size={17} />
        </span>
        {trend != null && (
          <span
            className={`flex items-center gap-0.5 text-[11px] font-bold ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}
          >
            {trend >= 0 ? (
              <ArrowUpRight size={12} />
            ) : (
              <ArrowDownRight size={12} />
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="tr-mono text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs font-semibold text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function weeklyTrendOf(items) {
  const now = Date.now();
  return Array.from({ length: 8 }).map((_, i) => {
    const weekIdx = 7 - i;
    const from = now - weekIdx * 7 * 86400000;
    const to = now - (weekIdx - 1) * 7 * 86400000;
    return {
      name: `S-${weekIdx}`,
      cantidad: items.filter((r) => r.createdAt >= from && r.createdAt < to)
        .length,
    };
  });
}

function CitizenStats({ user, reports, users }) {
  const mine = reports.filter((r) => r.authorId === user.id);
  const resolved = mine.filter(
    (r) => r.status === "resuelto" || r.status === "cerrado",
  ).length;
  const resolutionRate = mine.length
    ? Math.round((resolved / mine.length) * 100)
    : 0;
  const totalLikes = mine.reduce((a, r) => a + (r.likes || 0), 0);
  const totalComments = mine.reduce((a, r) => a + (r.commentsCount || 0), 0);

  const byCategory = CATEGORIES.map((c) => ({
    name: c.label,
    value: mine.filter((r) => r.category === c.id).length,
  })).filter((d) => d.value > 0);
  const byStatus = STATUS_ORDER.map((s) => ({
    name: STATUS_META[s].label,
    value: mine.filter((r) => r.status === s).length,
  }));
  const trend = weeklyTrendOf(mine);

  const citizens = [...users]
    .filter((u) => u.role === "ciudadano")
    .sort((a, b) => b.points - a.points);
  const myRank = citizens.findIndex((u) => u.id === user.id) + 1;

  const cityTotal = reports.length;
  const cityShare = cityTotal ? Math.round((mine.length / cityTotal) * 100) : 0;

  const avgSatisfaction = (() => {
    const rated = mine.filter((r) => r.satisfaction);
    return rated.length
      ? (rated.reduce((a, r) => a + r.satisfaction, 0) / rated.length).toFixed(
          1,
        )
      : "—";
  })();

  return (
    <div className="max-w-3xl mx-auto px-4 pt-4 pb-8">
      <SectionHeading
        eyebrow="Tu impacto comunitario"
        title="Mis estadísticas"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Reportes creados"
          value={mine.length}
          Icon={FileText}
          tone="blue"
          sub={`Puesto #${myRank || "—"} en el ranking`}
        />
        <StatCard
          label="Tasa de resolución"
          value={`${resolutionRate}%`}
          Icon={CheckCircle2}
          tone="teal"
          sub={`${resolved} de ${mine.length} resueltos`}
        />
        <StatCard
          label="Puntos acumulados"
          value={user.points || 0}
          Icon={Trophy}
          tone="amber"
          sub={getLevel(user.points || 0).label}
        />
        <StatCard
          label="Satisfacción promedio"
          value={avgSatisfaction}
          Icon={Star}
          tone="purple"
          sub="De tus reportes resueltos"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-700 mb-3">
            Mis reportes por categoría
          </p>
          {byCategory.length > 0 ? (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {byCategory.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Tooltip wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-xs text-slate-400 py-16">
              Aún no tienes reportes.
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-700 mb-3">
            Estado de mis reportes
          </p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {byStatus.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4 md:col-span-2">
          <p className="text-sm font-bold text-slate-700 mb-3">
            Mi actividad — últimas 8 semanas
          </p>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="cantidad"
                  stroke="#0f766e"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-4 mb-6">
        <p className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-1.5">
          <Globe size={14} className="text-teal-600" /> Tu aporte a la comunidad
        </p>
        <p className="text-[11px] text-slate-400 mb-3">
          Porcentaje de todos los reportes de la plataforma que provienen de ti.
        </p>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex-1">
            <ProgressBar value={cityShare} colorClass="bg-teal-500" />
          </div>
          <span className="tr-mono text-sm font-bold text-teal-700 w-12 text-right">
            {cityShare}%
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div>
            <p className="tr-mono text-lg font-bold text-slate-800">
              {totalLikes}
            </p>
            <p className="text-[10px] text-slate-400">Likes recibidos</p>
          </div>
          <div>
            <p className="tr-mono text-lg font-bold text-slate-800">
              {totalComments}
            </p>
            <p className="text-[10px] text-slate-400">Comentarios</p>
          </div>
          <div>
            <p className="tr-mono text-lg font-bold text-slate-800">
              {cityTotal}
            </p>
            <p className="text-[10px] text-slate-400">Reportes en la ciudad</p>
          </div>
        </div>
      </div>

      <p className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
        <Medal size={14} /> Ranking de vecinos colaboradores
      </p>
      <div className="rounded-2xl bg-white border border-slate-200 divide-y divide-slate-100 mb-4">
        {citizens.slice(0, 5).map((u, i) => (
          <div
            key={u.id}
            className={`flex items-center gap-3 px-4 py-2.5 ${u.id === user.id ? "bg-teal-50" : ""}`}
          >
            <span
              className={`tr-mono text-xs font-bold w-5 ${i === 0 ? "text-amber-500" : "text-slate-400"}`}
            >
              {i + 1}
            </span>
            <Avatar seed={u.seed} size={30} />
            <span className="text-xs font-semibold text-slate-700 flex-1 truncate">
              {u.name}
              {u.id === user.id ? " (tú)" : ""}
            </span>
            <span className="tr-mono text-xs font-bold text-teal-700">
              {u.points} pts
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// REPORT DETAIL SHEET
// ============================================================================

const EVIDENCE_TONE_TEXT = {
  slate: "text-slate-500",
  indigo: "text-indigo-500",
  emerald: "text-emerald-600",
};

function EvidenceGroup({ title, photos, tone = "slate", onAdd, addLabel }) {
  if (!photos?.length && !onAdd) return null;
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1.5">
        <p
          className={`text-[11px] font-bold uppercase tracking-wide ${EVIDENCE_TONE_TEXT[tone] || "text-slate-500"}`}
        >
          {title}
        </p>
        {onAdd && (
          <button
            onClick={onAdd}
            className="text-[11px] font-semibold text-blue-700 flex items-center gap-1"
          >
            <Camera size={11} /> {addLabel || "Agregar"}
          </button>
        )}
      </div>
      {photos?.length ? (
        <div className="flex gap-2 overflow-x-auto tr-scroll pb-1">
          {photos.map((p, i) => (
            <img
              key={i}
              src={p}
              alt={title}
              className="w-24 h-24 rounded-lg object-cover shrink-0 border border-slate-200"
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 py-4 text-center text-[11px] text-slate-400">
          Sin evidencia registrada todavía
        </div>
      )}
    </div>
  );
}

function CitizenProgressTracker({ report }) {
  if (report.status === "rechazado" || report.status === "duplicado") {
    const entry = [...report.timeline].reverse().find((t) => t.reason);
    return (
      <div
        className={`rounded-xl border p-3 mb-4 ${report.status === "rechazado" ? "bg-red-50 border-red-200" : "bg-rose-50 border-rose-200"}`}
      >
        <p
          className={`text-xs font-bold flex items-center gap-1.5 ${report.status === "rechazado" ? "text-red-700" : "text-rose-700"}`}
        >
          {report.status === "rechazado" ? <X size={13} /> : <Copy size={13} />}{" "}
          {report.status === "rechazado"
            ? "Este reporte fue rechazado"
            : "Marcado como duplicado de otro reporte activo"}
        </p>
        {entry?.reason && (
          <p className="text-[11px] text-slate-600 mt-1">
            Motivo: {entry.reason}
          </p>
        )}
      </div>
    );
  }
  const currentStep = STATUS_META[report.status].citizenStep;
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 mb-4">
      <p className="text-[11px] font-bold text-slate-500 mb-2.5">
        ¿Qué pasó con mi reporte?
      </p>
      <div className="space-y-2">
        {CITIZEN_STEPS.map((s) => {
          const done = currentStep > s.step;
          const active = currentStep === s.step;
          return (
            <div key={s.step} className="flex items-center gap-2">
              {done ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              ) : active ? (
                <span className="w-4 h-4 rounded-full border-2 border-blue-600 shrink-0 relative">
                  <span className="absolute inset-0.5 rounded-full bg-blue-600 animate-pulse" />
                </span>
              ) : (
                <span className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
              )}
              <span
                className={`text-xs ${done ? "text-slate-500 line-through decoration-slate-300" : active ? "font-bold text-blue-700" : "text-slate-400"}`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const TONE_BTN = {
  emerald: "bg-emerald-600 hover:bg-emerald-700",
  blue: "bg-blue-600 hover:bg-blue-700",
  amber: "bg-amber-500 hover:bg-amber-600",
  red: "bg-red-600 hover:bg-red-700",
  rose: "bg-rose-600 hover:bg-rose-700",
  cyan: "bg-cyan-600 hover:bg-cyan-700",
  indigo: "bg-indigo-600 hover:bg-indigo-700",
  fuchsia: "bg-fuchsia-600 hover:bg-fuchsia-700",
  purple: "bg-purple-600 hover:bg-purple-700",
  green: "bg-green-600 hover:bg-green-700",
  slate: "bg-slate-600 hover:bg-slate-700",
};

function ReportDetailModal({
  report,
  comments,
  onAddComment,
  onClose,
  onOpenProfile,
  liked,
  onLike,
  session,
  allReports,
  onAction,
  onAddEvidence,
  onMergeDuplicate,
  onConfirmResolution,
  onAddTask,
  onUpdateTaskStatus,
  onRequestInspection,
  onRecordInspectionResult,
  rules,
}) {
  const [text, setText] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const [reason, setReason] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formSubcategory, setFormSubcategory] = useState("");
  const [formPriority, setFormPriority] = useState("media");
  const [formInstitution, setFormInstitution] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formResponsable, setFormResponsable] = useState("");
  const [formEscalation, setFormEscalation] = useState(ESCALATION_TARGETS[0]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignee: "",
    priority: "media",
    dependsOn: "",
  });
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [newInspection, setNewInspection] = useState({
    assignee: "",
    scheduledFor: "",
  });
  const [inspectionResultDraft, setInspectionResultDraft] = useState({});

  if (!report) return null;
  const author = report.isAnonymous ? null : getUser(report.authorId);
  const remaining = slaRemaining(report);
  const active = isActiveReport(report);
  const canManage = session && can(session.role, "revisar");
  const isOwnCitizenReport =
    session?.role === "ciudadano" && session.id === report.authorId;
  const actions = session ? availableActions(report, session.role) : [];
  const duplicates = canManage
    ? findPossibleDuplicates(report, allReports)
    : [];
  const responsablesForInst = getResponsablesFor(
    formInstitution || report.institutionId,
  );

  const openAction = (action) => {
    setPendingAction(action);
    setReason("");
    setFormCategory(report.category);
    setFormSubcategory(report.subcategory || "");
    setFormPriority(report.priority);
    setFormInstitution(report.institutionId);
    setFormDepartment("");
    setFormResponsable("");
    setFormEscalation(ESCALATION_TARGETS[0]);
  };

  const submitAction = () => {
    if (pendingAction.reason && !reason.trim()) return;
    const payload = { reason: reason.trim() || null };
    if (pendingAction.needsClassification) {
      payload.category = formCategory;
      payload.subcategory = formSubcategory;
      payload.priority = formPriority;
    }
    if (pendingAction.needsAssignment) {
      payload.institutionId = formInstitution;
      payload.department = formDepartment;
      payload.responsable = formResponsable;
    }
    if (pendingAction.needsEscalation) {
      payload.escalateTo = formEscalation;
    }
    onAction(report.id, pendingAction, payload);
    setPendingAction(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center">
      <div className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-xl max-h-[94vh] overflow-y-auto tr-scroll tr-fade-up">
        <div className="sticky top-0 bg-white/95 backdrop-blur flex items-center justify-between px-4 py-3 border-b border-slate-100 z-10">
          <div>
            <span className="tr-mono text-sm font-bold text-slate-800">
              {report.code || `#${report.id}`}
            </span>
            <p className="text-[10px] text-slate-400">
              Expediente digital de la incidencia
            </p>
          </div>
          <button onClick={onClose}>
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <PhotoStrip photos={report.photos} />

        <div className="p-4">
          {/* ---- Encabezado ---- */}
          <div className="flex items-center justify-between mb-3">
            {report.isAnonymous ? (
              <div className="flex items-center gap-2">
                <Avatar anonymous size={34} />
                <span className="text-sm font-bold text-slate-800">
                  Usuario anónimo
                </span>
              </div>
            ) : (
              <button
                onClick={() => onOpenProfile(author)}
                className="flex items-center gap-2"
              >
                <Avatar seed={author.seed} size={34} />
                <span className="text-sm font-bold text-slate-800">
                  {author.name}
                </span>
              </button>
            )}
            <span className="text-[11px] text-slate-400">
              {timeAgo(report.createdAt)}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            <CategoryPill id={report.category} />
            <StatusPill status={report.status} />
            <PriorityPill priority={report.priority} />
            {canManage && <CaseHealthBadge report={report} />}
            {report.isDuplicate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-700">
                <Copy size={12} /> Posible duplicado
              </span>
            )}
            {report.reopenedCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-700">
                <RefreshCw size={12} /> Reabierto {report.reopenedCount}×
              </span>
            )}
          </div>

          <p className="text-sm text-slate-700 leading-relaxed mb-3">
            {report.desc}
          </p>

          {/* ---- Información general ---- */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 mb-3 text-xs text-slate-600 space-y-1.5">
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <MapPin size={12} /> Ubicación
              </span>
              <span className="font-semibold text-slate-800">
                {getZone(report.zone).name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <ListChecks size={12} /> Subcategoría
              </span>
              <span className="font-semibold text-slate-800">
                {report.subcategory
                  ? getSubcategory(report.subcategory)?.label
                  : "Pendiente de clasificar"}
              </span>
            </div>
            {active && (
              <div className="flex justify-between">
                <span className="flex items-center gap-1">
                  <TimerReset size={12} /> SLA
                </span>
                <span
                  className={`font-semibold ${remaining < 0 ? "text-red-600" : remaining < 6 ? "text-orange-600" : "text-slate-800"}`}
                >
                  {remaining < 0
                    ? `Vencido hace ${Math.abs(remaining)}h`
                    : `${remaining}h restantes`}
                </span>
              </div>
            )}
            {report.satisfaction && (
              <div className="flex justify-between items-center">
                <span>Calificación ciudadana</span>
                <StarRow value={report.satisfaction} />
              </div>
            )}
          </div>

          {/* ---- Asignación ---- */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 mb-3 text-xs space-y-1.5">
            <p className="text-[11px] font-bold text-blue-800 mb-1 flex items-center gap-1">
              <Building2 size={12} /> Asignación
            </p>
            <div className="flex justify-between">
              <span className="text-slate-500">Institución</span>
              <span className="font-semibold text-slate-800">
                {getInstitution(report.institutionId).name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Departamento</span>
              <span className="font-semibold text-slate-800">
                {report.department || "Sin asignar aún"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Responsable</span>
              <span className="font-semibold text-slate-800">
                {report.responsable || "Sin asignar aún"}
              </span>
            </div>
            {report.escalatedTo && (
              <div className="flex justify-between">
                <span className="text-slate-500">Escalado a</span>
                <span className="font-semibold text-fuchsia-700">
                  {report.escalatedTo}
                </span>
              </div>
            )}
          </div>

          {canManage &&
            duplicates.length > 0 &&
            report.status !== "duplicado" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 mb-3">
                <p className="text-[11px] font-bold text-amber-800 mb-2 flex items-center gap-1">
                  <AlertTriangle size={12} /> Posible incidencia relacionada
                </p>
                <div className="space-y-1.5">
                  {duplicates.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between bg-white rounded-lg border border-amber-100 px-2.5 py-1.5"
                    >
                      <span className="text-[11px] text-slate-600 truncate mr-2">
                        {d.code} · {d.desc.slice(0, 40)}…
                      </span>
                      <button
                        onClick={() => onMergeDuplicate(report.id, d.id)}
                        className="shrink-0 text-[11px] font-bold text-amber-700 hover:text-amber-900"
                      >
                        Fusionar con este →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {canManage &&
            (() => {
              const recurring = findRecurringProblems(
                report,
                allReports,
                rules,
              );
              return recurring.length > 0 ? (
                <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 mb-3">
                  <p className="text-[11px] font-bold text-purple-800 flex items-center gap-1">
                    <TrendingUp size={12} /> Problema recurrente
                  </p>
                  <p className="text-[11px] text-purple-700 mt-0.5">
                    {recurring.length} incidencias de{" "}
                    {getCategory(report.category).label.toLowerCase()} en{" "}
                    {getZone(report.zone).name} en los últimos 30 días — posible
                    problema estructural.
                  </p>
                </div>
              ) : null;
            })()}

          {/* ---- Evidencias ---- */}
          <p className="text-xs font-bold text-slate-500 mb-2">Evidencias</p>
          <EvidenceGroup
            title="Antes (reporte inicial)"
            photos={report.evidenceBefore || report.photos}
            tone="slate"
          />
          <EvidenceGroup
            title="Durante (gestión)"
            photos={report.evidenceDuring}
            tone="indigo"
            onAdd={
              canManage
                ? () =>
                    onAddEvidence(
                      report.id,
                      `https://picsum.photos/seed/${uid("ev")}/640/480`,
                      "during",
                    )
                : null
            }
            addLabel="Agregar evidencia de gestión"
          />
          <EvidenceGroup
            title="Después (resolución)"
            photos={report.evidenceAfter}
            tone="emerald"
            onAdd={
              canManage
                ? () =>
                    onAddEvidence(
                      report.id,
                      `https://picsum.photos/seed/${uid("ev")}/640/480`,
                      "after",
                    )
                : null
            }
            addLabel="Agregar evidencia de resolución"
          />

          {/* ---- Tareas (§8) ---- */}
          {canManage && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Wrench size={12} /> Tareas
                  {report.tasks && report.tasks.length > 0 && (
                    <span className="text-slate-400 font-normal">
                      ·{" "}
                      {
                        report.tasks.filter((t) => t.status === "completada")
                          .length
                      }
                      /{report.tasks.length} completadas
                    </span>
                  )}
                </p>
                <button
                  onClick={() => setShowTaskForm((s) => !s)}
                  className="flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900"
                >
                  <Plus size={12} /> Agregar tarea
                </button>
              </div>

              {(!report.tasks || report.tasks.length === 0) &&
                !showTaskForm && (
                  <div className="rounded-lg border border-dashed border-slate-200 py-3 text-center text-[11px] text-slate-400">
                    Sin tareas creadas todavía
                  </div>
                )}

              <div className="space-y-1.5">
                {(report.tasks || []).map((t) => {
                  const meta = TASK_STATUS_META[t.status];
                  const dep = t.dependsOn
                    ? (report.tasks || []).find((x) => x.id === t.dependsOn)
                    : null;
                  return (
                    <div
                      key={t.id}
                      className="rounded-lg border border-slate-200 bg-white p-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <meta.Icon
                            size={14}
                            style={{ color: meta.color }}
                            className="mt-0.5 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-700">
                              {t.title}
                            </p>
                            {t.description && (
                              <p className="text-[11px] text-slate-400">
                                {t.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span
                                className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${meta.badge}`}
                              >
                                {meta.label}
                              </span>
                              {t.assignee && (
                                <span className="text-[10px] text-slate-400">
                                  {t.assignee}
                                </span>
                              )}
                              {dep && t.status === "bloqueada" && (
                                <span className="text-[10px] text-red-500">
                                  Bloqueada por: "{dep.title}"
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 flex gap-1">
                          {t.status === "pendiente" && (
                            <button
                              onClick={() =>
                                onUpdateTaskStatus(
                                  report.id,
                                  t.id,
                                  "en_progreso",
                                )
                              }
                              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 whitespace-nowrap"
                            >
                              Iniciar
                            </button>
                          )}
                          {t.status === "en_progreso" && (
                            <button
                              onClick={() =>
                                onUpdateTaskStatus(
                                  report.id,
                                  t.id,
                                  "completada",
                                )
                              }
                              className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 whitespace-nowrap"
                            >
                              Completar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {showTaskForm && (
                <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-2">
                  <input
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask((f) => ({ ...f, title: e.target.value }))
                    }
                    placeholder="Título de la tarea"
                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white outline-none focus:ring-2 focus:ring-teal-400"
                  />
                  <textarea
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask((f) => ({ ...f, description: e.target.value }))
                    }
                    placeholder="Descripción (opcional)"
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-[11px] text-slate-500">
                      Responsable
                      <select
                        value={newTask.assignee}
                        onChange={(e) =>
                          setNewTask((f) => ({
                            ...f,
                            assignee: e.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white"
                      >
                        <option value="">Sin asignar</option>
                        {responsablesForInst.map((r) => (
                          <option key={r.id} value={r.name}>
                            {r.name} · {r.department}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-[11px] text-slate-500">
                      Prioridad
                      <select
                        value={newTask.priority}
                        onChange={(e) =>
                          setNewTask((f) => ({
                            ...f,
                            priority: e.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white"
                      >
                        {PRIORITY_ORDER.map((p) => (
                          <option key={p} value={p}>
                            {PRIORITY_META[p].label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {report.tasks && report.tasks.length > 0 && (
                    <label className="text-[11px] text-slate-500 block">
                      No puede iniciar hasta completar
                      <select
                        value={newTask.dependsOn}
                        onChange={(e) =>
                          setNewTask((f) => ({
                            ...f,
                            dependsOn: e.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white"
                      >
                        <option value="">
                          Ninguna (puede iniciar de inmediato)
                        </option>
                        {report.tasks.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setShowTaskForm(false)}
                      className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-500"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        if (newTask.title.trim()) {
                          onAddTask(report.id, newTask);
                          setNewTask({
                            title: "",
                            description: "",
                            assignee: "",
                            priority: "media",
                            dependsOn: "",
                          });
                          setShowTaskForm(false);
                        }
                      }}
                      disabled={!newTask.title.trim()}
                      className="flex-1 rounded-lg py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-40"
                    >
                      Crear tarea
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---- Inspecciones (§18) ---- */}
          {canManage && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <ClipboardCheck size={12} /> Inspecciones
                </p>
                <button
                  onClick={() => setShowInspectionForm((s) => !s)}
                  className="flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900"
                >
                  <Plus size={12} /> Solicitar inspección
                </button>
              </div>

              {(!report.inspections || report.inspections.length === 0) &&
                !showInspectionForm && (
                  <div className="rounded-lg border border-dashed border-slate-200 py-3 text-center text-[11px] text-slate-400">
                    Sin inspecciones solicitadas todavía
                  </div>
                )}

              <div className="space-y-1.5">
                {(report.inspections || []).map((insp) => {
                  const resultMeta = insp.result
                    ? INSPECTION_RESULT_META[insp.result]
                    : null;
                  const draft = inspectionResultDraft[insp.id] || {
                    result: "",
                    observations: "",
                  };
                  return (
                    <div
                      key={insp.id}
                      className="rounded-lg border border-slate-200 bg-white p-2.5"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${insp.status === "realizada" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-amber-100 text-amber-700 border border-amber-200"}`}
                        >
                          {insp.status === "realizada"
                            ? "Realizada"
                            : "Solicitada"}
                        </span>
                        {insp.assignee && (
                          <span className="text-[10px] text-slate-400">
                            {insp.assignee}
                          </span>
                        )}
                      </div>
                      {insp.scheduledFor && insp.status === "solicitada" && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <CalendarClock size={11} /> Programada:{" "}
                          {formatDateTime(insp.scheduledFor)}
                        </p>
                      )}
                      {insp.status === "realizada" && (
                        <>
                          <span
                            className={`inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${resultMeta.badge}`}
                          >
                            {resultMeta.label}
                          </span>
                          {insp.observations && (
                            <p className="text-[11px] text-slate-500 mt-1">
                              {insp.observations}
                            </p>
                          )}
                        </>
                      )}
                      {insp.status === "solicitada" && (
                        <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
                          <select
                            value={draft.result}
                            onChange={(e) =>
                              setInspectionResultDraft((m) => ({
                                ...m,
                                [insp.id]: { ...draft, result: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white"
                          >
                            <option value="">Registrar resultado…</option>
                            {INSPECTION_RESULT_ORDER.map((k) => (
                              <option key={k} value={k}>
                                {INSPECTION_RESULT_META[k].label}
                              </option>
                            ))}
                          </select>
                          {draft.result && (
                            <>
                              <textarea
                                value={draft.observations}
                                onChange={(e) =>
                                  setInspectionResultDraft((m) => ({
                                    ...m,
                                    [insp.id]: {
                                      ...draft,
                                      observations: e.target.value,
                                    },
                                  }))
                                }
                                placeholder="Observaciones de la visita"
                                rows={2}
                                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white resize-none"
                              />
                              <button
                                onClick={() => {
                                  onRecordInspectionResult(
                                    report.id,
                                    insp.id,
                                    draft,
                                  );
                                  setInspectionResultDraft((m) => ({
                                    ...m,
                                    [insp.id]: { result: "", observations: "" },
                                  }));
                                }}
                                className="w-full rounded-lg py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700"
                              >
                                Guardar resultado
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {showInspectionForm && (
                <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-2">
                  <label className="text-[11px] text-slate-500 block">
                    Responsable de la inspección
                    <select
                      value={newInspection.assignee}
                      onChange={(e) =>
                        setNewInspection((f) => ({
                          ...f,
                          assignee: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white"
                    >
                      <option value="">Sin asignar</option>
                      {responsablesForInst.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name} · {r.department}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-[11px] text-slate-500 block">
                    Fecha programada
                    <input
                      type="datetime-local"
                      onChange={(e) =>
                        setNewInspection((f) => ({
                          ...f,
                          scheduledFor: e.target.value
                            ? new Date(e.target.value).getTime()
                            : null,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white"
                    />
                  </label>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setShowInspectionForm(false)}
                      className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-500"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        onRequestInspection(report.id, newInspection);
                        setNewInspection({ assignee: "", scheduledFor: "" });
                        setShowInspectionForm(false);
                      }}
                      className="flex-1 rounded-lg py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700"
                    >
                      Solicitar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---- Seguimiento del ciudadano / Timeline completa ---- */}
          {isOwnCitizenReport && <CitizenProgressTracker report={report} />}
          {isOwnCitizenReport &&
            report.status === "cerrado" &&
            !report.citizenConfirmed && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 mb-4">
                <p className="text-xs font-bold text-blue-800 mb-2">
                  ¿El problema fue solucionado?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onConfirmResolution(report.id, true)}
                    className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2"
                  >
                    Sí, está solucionado
                  </button>
                  <button
                    onClick={() => onConfirmResolution(report.id, false)}
                    className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2"
                  >
                    No, continúa el problema
                  </button>
                </div>
              </div>
            )}
          {isOwnCitizenReport && report.citizenConfirmed && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 mb-4 text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 size={13} /> Confirmaste que el problema fue
              solucionado.
            </div>
          )}

          <div className="mb-4">
            <p className="text-xs font-bold text-slate-500 mb-2">
              Línea de tiempo del expediente
            </p>
            <div className="space-y-2">
              {report.timeline.map((t, i) => (
                <div key={i} className="flex gap-2 text-xs">
                  <div className="flex flex-col items-center pt-0.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: t.toStatus
                          ? STATUS_META[t.toStatus]?.color
                          : "#0369a1",
                      }}
                    />
                    {i < report.timeline.length - 1 && (
                      <span className="w-px flex-1 bg-slate-200 mt-1" />
                    )}
                  </div>
                  <div className="pb-2">
                    <p className="font-semibold text-slate-700">{t.label}</p>
                    {t.reason && (
                      <p className="text-slate-500 italic">"{t.reason}"</p>
                    )}
                    <p className="text-slate-400">
                      {t.by} · {formatDateTime(t.at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ---- Acciones (según rol y estado) ---- */}
          {session && actions.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 mb-4">
              <p className="text-xs font-bold text-slate-600 mb-2.5 flex items-center gap-1">
                <ClipboardList size={13} /> Acciones disponibles para{" "}
                {ROLE_META[session.role].label}
              </p>
              <div className="flex flex-wrap gap-2 mb-1">
                {actions.map((a) => (
                  <button
                    key={a.to + a.label}
                    onClick={() => openAction(a)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition ${TONE_BTN[a.tone] || "bg-slate-600 hover:bg-slate-700"} ${pendingAction === a ? "ring-2 ring-offset-1 ring-slate-400" : ""}`}
                  >
                    <a.Icon size={13} /> {a.label}
                  </button>
                ))}
              </div>

              {pendingAction && (
                <div className="mt-3 rounded-lg bg-white border border-slate-200 p-3 space-y-2.5">
                  <p className="text-xs font-bold text-slate-700">
                    {pendingAction.label}
                  </p>

                  {pendingAction.needsClassification && (
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-[11px] text-slate-500">
                        Categoría
                        <select
                          value={formCategory}
                          onChange={(e) => {
                            setFormCategory(e.target.value);
                            setFormSubcategory("");
                          }}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-[11px] text-slate-500">
                        Subcategoría
                        <select
                          value={formSubcategory}
                          onChange={(e) => setFormSubcategory(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white"
                        >
                          <option value="">Selecciona…</option>
                          {getSubcategoriesFor(formCategory).map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-[11px] text-slate-500 col-span-2">
                        Prioridad
                        <select
                          value={formPriority}
                          onChange={(e) => setFormPriority(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white"
                        >
                          {PRIORITY_ORDER.map((p) => (
                            <option key={p} value={p}>
                              {PRIORITY_META[p].label} · SLA{" "}
                              {PRIORITY_META[p].slaHours}h
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}

                  {pendingAction.needsAssignment && (
                    <div className="grid grid-cols-1 gap-2">
                      <label className="text-[11px] text-slate-500">
                        Institución responsable
                        <select
                          value={formInstitution}
                          onChange={(e) => {
                            setFormInstitution(e.target.value);
                            setFormDepartment("");
                            setFormResponsable("");
                          }}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white"
                        >
                          {INSTITUTIONS.filter((i) => i.id !== "otra").map(
                            (i) => (
                              <option key={i.id} value={i.id}>
                                {i.name}
                              </option>
                            ),
                          )}
                        </select>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-[11px] text-slate-500">
                          Departamento
                          <select
                            value={formDepartment}
                            onChange={(e) => setFormDepartment(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white"
                          >
                            <option value="">Selecciona…</option>
                            {getDepartmentsFor(formInstitution).map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-[11px] text-slate-500">
                          Responsable
                          <select
                            value={formResponsable}
                            onChange={(e) => setFormResponsable(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white"
                          >
                            <option value="">Selecciona…</option>
                            {responsablesForInst.map((r) => (
                              <option key={r.id} value={r.name}>
                                {r.name} · {r.department}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  )}

                  {pendingAction.needsEscalation && (
                    <label className="text-[11px] text-slate-500 block">
                      Escalar a
                      <select
                        value={formEscalation}
                        onChange={(e) => setFormEscalation(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white"
                      >
                        {ESCALATION_TARGETS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {pendingAction.reason && (
                    <label className="text-[11px] text-slate-500 block">
                      {pendingAction.reasonLabel || "Motivo (obligatorio)"}
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={2}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Explica brevemente el motivo…"
                      />
                    </label>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setPendingAction(null)}
                      className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-500"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={submitAction}
                      disabled={pendingAction.reason && !reason.trim()}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-bold text-white ${TONE_BTN[pendingAction.tone] || "bg-slate-700"} disabled:opacity-40`}
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 mb-3">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
              <MessageCircle size={18} /> {comments.length}
            </span>
          </div>

          <div className="space-y-3 mb-3">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2">
                <Avatar seed={c.seed} size={28} anonymous={c.anonymous} />
                <div className="bg-slate-50 rounded-xl px-3 py-2 flex-1">
                  <p className="text-xs font-bold text-slate-700">
                    {c.anonymous ? "Usuario anónimo" : c.name}
                  </p>
                  <p className="text-xs text-slate-600">{c.text}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-xs text-slate-400">
                Sé el primero en comentar sobre este reporte.
              </p>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-3 flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe un comentario…"
            className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400"
          />
          <button
            onClick={() => {
              if (text.trim()) {
                onAddComment(report.id, text);
                setText("");
              }
            }}
            className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center shrink-0"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// GESTOR (asignador / clasificador)
// ============================================================================

function exportReportsCsv(reports, filename) {
  const header = [
    "ID",
    "Descripción",
    "Categoría",
    "Zona",
    "Estado",
    "Prioridad",
    "Institución",
    "Creado",
    "Satisfacción",
  ];
  const rows = reports.map((r) => [
    r.id,
    `"${(r.desc || "").replace(/"/g, "'")}"`,
    getCategory(r.category).label,
    getZone(r.zone) ? getZone(r.zone).name : "",
    STATUS_META[r.status].label,
    PRIORITY_META[r.priority].label,
    getInstitution(r.institutionId).short,
    new Date(r.createdAt).toLocaleDateString("es-DO"),
    r.satisfaction || "",
  ]);
  const csv = [header, ...rows].map((row) => row.join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function GestorDashboard({ reports, user, onOpenDetail, showToast }) {
  const [tab, setTab] = useState("nuevas");
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("todas");
  const mine = reports.filter((r) => r.institutionId === user.institutionId);

  const TABS = [
    { id: "nuevas", label: "Nuevas", test: (r) => r.status === "nuevo" },
    {
      id: "validacion",
      label: "Por validar",
      test: (r) => ["en_revision", "requiere_info"].includes(r.status),
    },
    {
      id: "asignadas",
      label: "Asignadas",
      test: (r) => ["validado", "clasificado", "asignado"].includes(r.status),
    },
    {
      id: "gestion",
      label: "En gestión",
      test: (r) => ["en_gestion", "en_espera"].includes(r.status),
    },
    {
      id: "escaladas",
      label: "Escaladas",
      test: (r) => r.status === "escalado",
    },
    {
      id: "verificacion",
      label: "Por verificar",
      test: (r) => r.status === "pendiente_verificacion",
    },
    { id: "vencidas", label: "Vencidas", test: (r) => isOverdue(r) },
    { id: "sin_asignar", label: "Sin asignar", test: (r) => isUnassigned(r) },
    { id: "estancadas", label: "Estancadas", test: (r) => isStagnant(r) },
    {
      id: "reabiertas",
      label: "Reabiertas",
      test: (r) => (r.reopenedCount || 0) > 0 && isActiveReport(r),
    },
    {
      id: "cerradas",
      label: "Cerradas",
      test: (r) => ["resuelto", "cerrado"].includes(r.status),
    },
    { id: "todos", label: "Todos", test: () => true },
  ];
  const activeTab = TABS.find((t) => t.id === tab);
  const filtered = mine
    .filter(activeTab.test)
    .filter((r) => catFilter === "todas" || r.category === catFilter)
    .filter((r) => r.desc.toLowerCase().includes(q.toLowerCase()))
    .sort(
      (a, b) =>
        (a.priority === "critica" ? -1 : 1) -
        (b.priority === "critica" ? -1 : 1),
    );

  const indicators = [
    {
      id: "vencidas",
      label: "Vencidos",
      value: mine.filter((r) => isOverdue(r)).length,
      tone: "red",
    },
    {
      id: "validacion",
      label: "SLA por vencer",
      value: mine.filter((r) => isDueSoon(r)).length,
      tone: "amber",
    },
    {
      id: "sin_asignar",
      label: "Sin asignar",
      value: mine.filter((r) => isUnassigned(r)).length,
      tone: "slate",
    },
    {
      id: "estancadas",
      label: "Estancados",
      value: mine.filter((r) => isStagnant(r)).length,
      tone: "orange",
    },
    {
      id: "escaladas",
      label: "Escalados",
      value: mine.filter((r) => r.status === "escalado").length,
      tone: "fuchsia",
    },
    {
      id: "verificacion",
      label: "Verificación",
      value: mine.filter((r) => r.status === "pendiente_verificacion").length,
      tone: "purple",
    },
    {
      id: "reabiertas",
      label: "Reabiertos",
      value: mine.filter((r) => (r.reopenedCount || 0) > 0 && isActiveReport(r))
        .length,
      tone: "indigo",
    },
    {
      id: "cerradas",
      label: "Cerrados",
      value: mine.filter((r) => ["resuelto", "cerrado"].includes(r.status))
        .length,
      tone: "emerald",
    },
  ];
  const TONE_CLASSES = {
    red: "border-red-200 bg-red-50 text-red-600 [&_.tr-ind-label]:text-red-400",
    amber:
      "border-amber-200 bg-amber-50 text-amber-600 [&_.tr-ind-label]:text-amber-500",
    slate:
      "border-slate-200 bg-white text-slate-800 [&_.tr-ind-label]:text-slate-400",
    orange:
      "border-orange-200 bg-orange-50 text-orange-600 [&_.tr-ind-label]:text-orange-500",
    fuchsia:
      "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 [&_.tr-ind-label]:text-fuchsia-500",
    purple:
      "border-purple-200 bg-purple-50 text-purple-700 [&_.tr-ind-label]:text-purple-500",
    indigo:
      "border-indigo-200 bg-indigo-50 text-indigo-700 [&_.tr-ind-label]:text-indigo-500",
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-700 [&_.tr-ind-label]:text-emerald-500",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pt-4 pb-6">
      <div className="flex items-start justify-between gap-3 mb-1">
        <SectionHeading
          eyebrow={getInstitution(user.institutionId).name}
          title="Centro de operaciones"
        />
        <button
          onClick={() => {
            exportReportsCsv(
              mine,
              `reportes-${getInstitution(user.institutionId).short}.csv`,
            );
            showToast && showToast("CSV exportado");
          }}
          className="shrink-0 mt-1 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-sky-300 hover:text-sky-700 transition"
        >
          <Download size={13} /> Exportar
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {indicators.map((ind) => (
          <button
            key={ind.id}
            onClick={() => setTab(ind.id)}
            className={`text-left rounded-xl border p-2.5 transition ${TONE_CLASSES[ind.tone]} ${tab === ind.id ? "ring-2 ring-offset-1 ring-slate-300" : "hover:shadow-sm"}`}
          >
            <p className="tr-mono text-lg font-bold leading-none">
              {ind.value}
            </p>
            <p className="tr-ind-label text-[10px] font-semibold mt-1">
              {ind.label}
            </p>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="flex rounded-full bg-slate-100 p-1 text-xs font-semibold flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-full transition whitespace-nowrap ${tab === t.id ? "bg-white shadow text-slate-900" : "text-slate-500"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="text-xs font-semibold rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 outline-none"
        >
          <option value="todas">Todas las categorías</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 flex-1 min-w-[140px]">
          <Search size={13} className="text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar…"
            className="flex-1 min-w-0 outline-none text-xs"
          />
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((r) => {
          const remaining = slaRemaining(r);
          return (
            <button
              key={r.id}
              onClick={() => onOpenDetail(r)}
              className="w-full text-left flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-3 hover:border-sky-300 hover:shadow-sm transition"
            >
              <img
                src={r.photos[0]}
                className="w-14 h-14 rounded-lg object-cover shrink-0"
                alt=""
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] tr-mono text-slate-400">{r.code}</p>
                <p className="text-sm font-semibold text-slate-700 truncate">
                  {r.desc}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <CategoryPill id={r.category} />
                  <StatusPill status={r.status} />
                  <PriorityPill priority={r.priority} />
                  <CaseHealthBadge report={r} compact />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <MapPin size={10} /> {getZone(r.zone).name} ·{" "}
                  {timeAgo(r.createdAt)}
                </p>
              </div>
              <div className="text-right shrink-0">
                {isActiveReport(r) && (
                  <p
                    className={`text-[11px] font-bold ${remaining < 0 ? "text-red-600" : remaining < 24 ? "text-orange-500" : "text-slate-400"}`}
                  >
                    {remaining < 0 ? "Vencido" : `${remaining}h`}
                  </p>
                )}
                <ChevronRight
                  size={16}
                  className="text-slate-300 ml-auto mt-1"
                />
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-10">
            No hay incidencias en esta vista.
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SUPERVISOR CONTROL CENTER
// ============================================================================

function SupervisorSection({ title, count, tone = "slate", children, empty }) {
  const TONE = {
    slate: "text-slate-700",
    red: "text-red-600",
    amber: "text-amber-600",
    orange: "text-orange-600",
    fuchsia: "text-fuchsia-600",
    indigo: "text-indigo-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        <span className={`tr-mono text-sm font-bold ${TONE[tone]}`}>
          {count}
        </span>
      </div>
      {count === 0 ? (
        <p className="text-xs text-slate-400 py-2">{empty}</p>
      ) : (
        <div className="space-y-1.5">{children}</div>
      )}
    </div>
  );
}

function SupervisorCaseRow({ r, onOpenDetail, extra }) {
  return (
    <button
      onClick={() => onOpenDetail(r)}
      className="w-full text-left flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-50 transition"
    >
      <img
        src={r.photos[0]}
        className="w-9 h-9 rounded-lg object-cover shrink-0"
        alt=""
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-700 truncate">
          {r.code} · {r.desc}
        </p>
        <p className="text-[10px] text-slate-400">
          {getZone(r.zone).name} · {r.responsable || "Sin responsable"}
        </p>
      </div>
      {extra}
      <ChevronRight size={14} className="text-slate-300 shrink-0" />
    </button>
  );
}

function SupervisorControlCenter({
  reports,
  user,
  onOpenDetail,
  masterCases,
  onCreateMasterCase,
  onOpenMasterCase,
}) {
  const mine = reports.filter((r) => r.institutionId === user.institutionId);
  const critical = mine.filter((r) => getCaseHealth(r)?.level === "critical");
  const overdue = mine.filter((r) => isOverdue(r));
  const unassigned = mine.filter((r) => isUnassigned(r));
  const stagnant = mine.filter((r) => isStagnant(r));
  const escalated = mine.filter((r) => r.status === "escalado");
  const reopened = mine.filter(
    (r) => (r.reopenedCount || 0) > 0 && isActiveReport(r),
  );

  const responsables = getResponsablesFor(user.institutionId);
  const workload = responsables
    .map((resp) => {
      const assigned = mine.filter(
        (r) => r.responsable === resp.name && isActiveReport(r),
      );
      return {
        ...resp,
        active: assigned.length,
        critical: assigned.filter((r) => getCaseHealth(r)?.level === "critical")
          .length,
        overdue: assigned.filter((r) => isOverdue(r)).length,
      };
    })
    .sort((a, b) => b.active - a.active);
  const maxLoad = Math.max(1, ...workload.map((w) => w.active));

  const recurringGroups = useMemo(() => {
    const WINDOW = 30 * 86400000;
    const now = Date.now();
    const recent = mine.filter((r) => now - r.createdAt < WINDOW);
    const groups = {};
    recent.forEach((r) => {
      const key = `${r.category}__${r.zone}`;
      (groups[key] = groups[key] || []).push(r);
    });
    return Object.entries(groups)
      .filter(([, list]) => list.length >= 3)
      .map(([key, list]) => {
        const [category, zone] = key.split("__");
        return { category, zone, list };
      })
      .sort((a, b) => b.list.length - a.list.length);
  }, [mine]);

  return (
    <div className="max-w-3xl mx-auto px-4 pt-4 pb-6">
      <SectionHeading
        eyebrow={getInstitution(user.institutionId).name}
        title="Centro de supervisión"
      />

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-2.5">
          <p className="tr-mono text-lg font-bold text-red-600">
            {critical.length}
          </p>
          <p className="text-[10px] text-red-400 font-semibold">Críticos</p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-2.5">
          <p className="tr-mono text-lg font-bold text-orange-600">
            {stagnant.length}
          </p>
          <p className="text-[10px] text-orange-400 font-semibold">
            Estancados
          </p>
        </div>
        <div className="rounded-xl border border-fuchsia-200 bg-fuchsia-50 p-2.5">
          <p className="tr-mono text-lg font-bold text-fuchsia-700">
            {escalated.length}
          </p>
          <p className="text-[10px] text-fuchsia-500 font-semibold">
            Escalados
          </p>
        </div>
      </div>

      <SupervisorSection
        title="Casos críticos"
        count={critical.length}
        tone="red"
        empty="No hay casos críticos en este momento."
      >
        {critical.slice(0, 8).map((r) => (
          <SupervisorCaseRow
            key={r.id}
            r={r}
            onOpenDetail={onOpenDetail}
            extra={<CaseHealthBadge report={r} compact />}
          />
        ))}
      </SupervisorSection>

      <SupervisorSection
        title="SLA vencidos"
        count={overdue.length}
        tone="red"
        empty="No hay SLA vencidos."
      >
        {overdue.slice(0, 8).map((r) => (
          <SupervisorCaseRow
            key={r.id}
            r={r}
            onOpenDetail={onOpenDetail}
            extra={
              <span className="text-[10px] font-bold text-red-600 shrink-0">
                {Math.abs(slaRemaining(r))}h vencido
              </span>
            }
          />
        ))}
      </SupervisorSection>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Users size={15} className="text-slate-400" /> Carga de trabajo por
          responsable
        </h3>
        <div className="space-y-2.5">
          {workload.map((w) => (
            <div key={w.id} className="flex items-center gap-3">
              <div className="w-28 shrink-0">
                <p className="text-xs font-semibold text-slate-700 truncate">
                  {w.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {w.department}
                </p>
              </div>
              <div className="flex-1">
                <ProgressBar
                  value={(w.active / maxLoad) * 100}
                  colorClass={
                    w.overdue > 0
                      ? "bg-red-500"
                      : w.active >= maxLoad * 0.8
                        ? "bg-amber-500"
                        : "bg-teal-500"
                  }
                />
              </div>
              <div className="text-right shrink-0 w-24 text-[10px] font-semibold text-slate-500">
                {w.active} activos{" "}
                {w.critical > 0 && (
                  <span className="text-red-500">· {w.critical} crít.</span>
                )}{" "}
                {w.overdue > 0 && (
                  <span className="text-red-500">· {w.overdue} venc.</span>
                )}
              </div>
            </div>
          ))}
          {workload.length === 0 && (
            <p className="text-xs text-slate-400">
              No hay responsables configurados para esta institución.
            </p>
          )}
        </div>
      </div>

      <SupervisorSection
        title="Casos sin responsable"
        count={unassigned.length}
        tone="slate"
        empty="Todos los casos asignables tienen responsable."
      >
        {unassigned.slice(0, 8).map((r) => (
          <SupervisorCaseRow key={r.id} r={r} onOpenDetail={onOpenDetail} />
        ))}
      </SupervisorSection>

      <SupervisorSection
        title="Casos estancados"
        count={stagnant.length}
        tone="orange"
        empty="No hay casos sin actividad reciente."
      >
        {stagnant.slice(0, 8).map((r) => (
          <SupervisorCaseRow
            key={r.id}
            r={r}
            onOpenDetail={onOpenDetail}
            extra={
              <span className="text-[10px] font-bold text-orange-600 shrink-0">
                {hoursSinceActivity(r)}h sin actividad
              </span>
            }
          />
        ))}
      </SupervisorSection>

      <SupervisorSection
        title="Escalaciones activas"
        count={escalated.length}
        tone="fuchsia"
        empty="No hay casos escalados."
      >
        {escalated.slice(0, 8).map((r) => (
          <SupervisorCaseRow
            key={r.id}
            r={r}
            onOpenDetail={onOpenDetail}
            extra={
              <span className="text-[10px] font-semibold text-fuchsia-600 shrink-0">
                {r.escalatedTo || "—"}
              </span>
            }
          />
        ))}
      </SupervisorSection>

      <SupervisorSection
        title="Reaperturas"
        count={reopened.length}
        tone="indigo"
        empty="No hay casos reabiertos activos."
      >
        {reopened.slice(0, 8).map((r) => (
          <SupervisorCaseRow
            key={r.id}
            r={r}
            onOpenDetail={onOpenDetail}
            extra={
              <span className="text-[10px] font-semibold text-indigo-600 shrink-0">
                {r.reopenedCount}× reabierto
              </span>
            }
          />
        ))}
      </SupervisorSection>

      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <TrendingUp size={15} className="text-purple-500" /> Problemas
          recurrentes detectados
        </h3>
        {recurringGroups.length === 0 && (
          <p className="text-xs text-slate-400 py-2">
            No se detectaron patrones recurrentes en los últimos 30 días.
          </p>
        )}
        <div className="space-y-2">
          {recurringGroups.map((g) => {
            const existing = masterCases.find(
              (mc) =>
                mc.category === g.category &&
                mc.zone === g.zone &&
                mc.status !== "cerrado",
            );
            return (
              <div
                key={`${g.category}-${g.zone}`}
                className="rounded-xl border border-purple-200 bg-purple-50 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-purple-800">
                      {g.list.length} incidencias de{" "}
                      {getCategory(g.category).label} · {getZone(g.zone).name}
                    </p>
                    <p className="text-[11px] text-purple-600 mt-0.5">
                      Últimos 30 días — posible problema de infraestructura, no
                      casos aislados.
                    </p>
                  </div>
                  {existing ? (
                    <button
                      onClick={() => onOpenMasterCase(existing.id)}
                      className="shrink-0 text-[10px] font-bold bg-purple-600 text-white rounded-full px-2.5 py-1 hover:bg-purple-700"
                    >
                      Ver {existing.code}
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        onCreateMasterCase(
                          g.category,
                          g.zone,
                          g.list.map((r) => r.id),
                        )
                      }
                      className="shrink-0 text-[10px] font-bold bg-white border border-purple-300 text-purple-700 rounded-full px-2.5 py-1 hover:bg-purple-100"
                    >
                      Crear caso maestro
                    </button>
                  )}
                </div>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {g.list.slice(0, 5).map((r) => (
                    <button
                      key={r.id}
                      onClick={() => onOpenDetail(r)}
                      className="text-[10px] tr-mono font-semibold bg-white border border-purple-200 text-purple-700 rounded-full px-2 py-0.5 hover:bg-purple-100"
                    >
                      {r.code}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CASOS MAESTROS Y PLAN DE INTERVENCIÓN
// ============================================================================

const MASTER_CASE_STATUS_META = {
  abierto: {
    label: "Abierto",
    badge: "bg-slate-100 text-slate-700 border border-slate-200",
  },
  en_intervencion: {
    label: "En intervención",
    badge: "bg-indigo-100 text-indigo-700 border border-indigo-200",
  },
  cerrado: {
    label: "Cerrado",
    badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  },
};

const INTERVENTION_ACTION_TEMPLATE = [
  "Inspección",
  "Limpieza",
  "Reparación",
  "Mantenimiento",
  "Verificación",
];

function MasterCasesView({ masterCases, onOpen }) {
  return (
    <div className="max-w-3xl mx-auto px-4 pt-4 pb-6">
      <SectionHeading
        eyebrow="Problemas comunitarios agrupados"
        title="Casos maestros"
      />
      {masterCases.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
          <Layers size={28} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">
            Aún no hay casos maestros creados.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Se crean desde "Problemas recurrentes detectados" en el Centro de
            supervisión.
          </p>
        </div>
      )}
      <div className="space-y-2.5">
        {masterCases.map((mc) => {
          const plan = mc.interventionPlan;
          const doneActions = plan
            ? plan.actions.filter((a) => a.done).length
            : 0;
          return (
            <button
              key={mc.id}
              onClick={() => onOpen(mc.id)}
              className="w-full text-left bg-white rounded-2xl border border-slate-200 p-4 hover:border-purple-300 hover:shadow-sm transition"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="tr-mono text-xs font-bold text-slate-800">
                  {mc.code}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${MASTER_CASE_STATUS_META[mc.status].badge}`}
                >
                  {MASTER_CASE_STATUS_META[mc.status].label}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {getCategory(mc.category).label} · {getZone(mc.zone).name}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {mc.reportIds.length} incidencias agrupadas
              </p>
              {plan && (
                <div className="mt-2.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                    <span>Plan de intervención</span>
                    <span>
                      {doneActions}/{plan.actions.length} acciones
                    </span>
                  </div>
                  <ProgressBar
                    value={(doneActions / plan.actions.length) * 100}
                    colorClass="bg-indigo-500"
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InterventionPlanForm({ masterCase, onCreate }) {
  const [problem, setProblem] = useState(
    `${getCategory(masterCase.category).label} recurrente en ${getZone(masterCase.zone).name}`,
  );
  const [objective, setObjective] = useState(
    `Reducir las incidencias de ${getCategory(masterCase.category).label.toLowerCase()} en la zona`,
  );
  const [actions, setActions] = useState([...INTERVENTION_ACTION_TEMPLATE]);
  const [institutionIds, setInstitutionIds] = useState([
    zoneToInstitution(masterCase.zone, masterCase.category),
  ]);
  const [days, setDays] = useState(30);

  const toggleInstitution = (id) =>
    setInstitutionIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
  const updateAction = (i, val) =>
    setActions((a) => a.map((x, idx) => (idx === i ? val : x)));
  const removeAction = (i) =>
    setActions((a) => a.filter((_, idx) => idx !== i));

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3.5 space-y-3">
      <p className="text-[11px] font-bold text-indigo-800 flex items-center gap-1">
        <Wrench size={13} /> Nuevo plan de intervención
      </p>
      <div>
        <label className="text-[11px] font-semibold text-slate-500">
          Problema
        </label>
        <textarea
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          rows={2}
          className="w-full mt-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400"
        />
      </div>
      <div>
        <label className="text-[11px] font-semibold text-slate-500">
          Objetivo
        </label>
        <textarea
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          rows={2}
          className="w-full mt-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400"
        />
      </div>
      <div>
        <label className="text-[11px] font-semibold text-slate-500">
          Acciones
        </label>
        <div className="space-y-1.5 mt-1">
          {actions.map((a, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                value={a}
                onChange={(e) => updateAction(i, e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400"
              />
              <button
                onClick={() => removeAction(i)}
                className="text-slate-400 hover:text-red-500"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <button
            onClick={() => setActions((a) => [...a, ""])}
            className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1"
          >
            <Plus size={12} /> Agregar acción
          </button>
        </div>
      </div>
      <div>
        <label className="text-[11px] font-semibold text-slate-500">
          Instituciones involucradas
        </label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {INSTITUTIONS.filter((i) => i.id !== "otra").map((inst) => (
            <button
              key={inst.id}
              onClick={() => toggleInstitution(inst.id)}
              className={`text-[11px] font-semibold rounded-full px-2.5 py-1 border transition ${institutionIds.includes(inst.id) ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-200 text-slate-500"}`}
            >
              {inst.short}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <CalendarClock size={14} className="text-slate-400" />
        <label className="text-[11px] font-semibold text-slate-500">
          Fecha objetivo:
        </label>
        <input
          type="number"
          min={1}
          value={days}
          onChange={(e) => setDays(Number(e.target.value) || 1)}
          className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none"
        />
        <span className="text-[11px] text-slate-500">días</span>
      </div>
      <button
        onClick={() =>
          onCreate({
            problem,
            objective,
            actions: actions.filter((a) => a.trim()),
            institutionIds,
            targetDate: Date.now() + days * 86400000,
          })
        }
        disabled={
          !problem.trim() ||
          !objective.trim() ||
          actions.filter((a) => a.trim()).length === 0
        }
        className="w-full rounded-xl bg-indigo-600 text-white text-sm font-bold py-2.5 disabled:opacity-40"
      >
        Crear plan de intervención
      </button>
    </div>
  );
}

function MasterCaseDetailModal({
  masterCase,
  reports,
  onClose,
  onCreatePlan,
  onToggleAction,
  onMeasure,
  onCloseCase,
  onOpenReport,
}) {
  if (!masterCase) return null;
  const groupedReports = reports.filter((r) =>
    masterCase.reportIds.includes(r.id),
  );
  const plan = masterCase.interventionPlan;
  const doneActions = plan ? plan.actions.filter((a) => a.done).length : 0;
  const allActionsDone = plan && doneActions === plan.actions.length;
  const overdueTarget = plan && Date.now() > plan.targetDate;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center">
      <div className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-xl max-h-[94vh] overflow-y-auto tr-scroll tr-fade-up">
        <div className="sticky top-0 bg-white/95 backdrop-blur flex items-center justify-between px-4 py-3 border-b border-slate-100 z-10">
          <div>
            <span className="tr-mono text-sm font-bold text-slate-800">
              {masterCase.code}
            </span>
            <p className="text-[10px] text-slate-400">
              Caso maestro — problema recurrente
            </p>
          </div>
          <button onClick={onClose}>
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <CategoryPill id={masterCase.category} />
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${MASTER_CASE_STATUS_META[masterCase.status].badge}`}
            >
              {MASTER_CASE_STATUS_META[masterCase.status].label}
            </span>
          </div>
          <p className="text-sm font-bold text-slate-800">
            {getZone(masterCase.zone).name}
          </p>
          <p className="text-xs text-slate-400 mb-3">
            {groupedReports.length} incidencias agrupadas · creado{" "}
            {timeAgo(masterCase.createdAt)}
          </p>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 mb-4">
            <p className="text-[11px] font-bold text-slate-600 mb-2">
              Incidencias que forman este caso maestro
            </p>
            <div className="space-y-1.5">
              {groupedReports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onOpenReport(r.id)}
                  className="w-full flex items-center gap-2 text-left hover:bg-white rounded-lg px-1.5 py-1 transition"
                >
                  <img
                    src={r.photos[0]}
                    className="w-8 h-8 rounded object-cover shrink-0"
                    alt=""
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-700 truncate">
                      {r.code} · {r.desc}
                    </p>
                  </div>
                  <StatusPill status={r.status} />
                </button>
              ))}
            </div>
          </div>

          {!plan && (
            <InterventionPlanForm
              masterCase={masterCase}
              onCreate={(data) => onCreatePlan(masterCase.id, data)}
            />
          )}

          {plan && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3.5 space-y-3">
              <p className="text-[11px] font-bold text-indigo-800 flex items-center gap-1">
                <Wrench size={13} /> Plan de intervención
              </p>
              <div>
                <p className="text-[11px] font-semibold text-slate-500">
                  Problema
                </p>
                <p className="text-xs text-slate-700">{plan.problem}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500">
                  Objetivo
                </p>
                <p className="text-xs text-slate-700">{plan.objective}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 mb-1.5">
                  Acciones ({doneActions}/{plan.actions.length})
                </p>
                <div className="space-y-1.5">
                  {plan.actions.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => onToggleAction(masterCase.id, a.id)}
                      className="w-full flex items-center gap-2 text-left bg-white rounded-lg border border-slate-200 px-2.5 py-1.5 hover:border-indigo-300"
                    >
                      {a.done ? (
                        <CheckSquare
                          size={15}
                          className="text-emerald-500 shrink-0"
                        />
                      ) : (
                        <Square size={15} className="text-slate-300 shrink-0" />
                      )}
                      <span
                        className={`text-xs font-medium ${a.done ? "text-slate-400 line-through" : "text-slate-700"}`}
                      >
                        {a.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-[11px] font-semibold text-slate-500">
                  Instituciones:
                </p>
                {plan.institutionIds.map((id) => (
                  <span
                    key={id}
                    className="text-[10px] font-semibold bg-white border border-indigo-200 text-indigo-700 rounded-full px-2 py-0.5"
                  >
                    {getInstitution(id).short}
                  </span>
                ))}
              </div>
              <p
                className={`text-[11px] font-semibold flex items-center gap-1 ${overdueTarget ? "text-red-600" : "text-slate-500"}`}
              >
                <CalendarClock size={12} /> Fecha objetivo:{" "}
                {new Date(plan.targetDate).toLocaleDateString("es-DO")}{" "}
                {overdueTarget && "· vencida"}
              </p>

              {plan.measuredAt ? (
                <div
                  className={`rounded-lg p-2.5 flex items-center gap-2 ${plan.reduced ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}
                >
                  {plan.reduced ? (
                    <ArrowDownRight size={16} className="text-emerald-600" />
                  ) : (
                    <ArrowUpRight size={16} className="text-amber-600" />
                  )}
                  <p
                    className={`text-xs font-semibold ${plan.reduced ? "text-emerald-700" : "text-amber-700"}`}
                  >
                    {plan.resultCount} incidencias nuevas desde el plan (línea
                    base: {plan.baselineCount}) —{" "}
                    {plan.reduced
                      ? "el problema disminuyó"
                      : "sin mejora medible aún"}
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => onMeasure(masterCase.id)}
                  className="w-full rounded-xl border border-indigo-300 text-indigo-700 text-xs font-bold py-2 hover:bg-indigo-100"
                >
                  ¿Disminuyeron las incidencias? Medir resultado
                </button>
              )}

              {masterCase.status !== "cerrado" && (
                <button
                  onClick={() => onCloseCase(masterCase.id)}
                  disabled={!allActionsDone}
                  className="w-full rounded-xl bg-slate-800 text-white text-xs font-bold py-2 disabled:opacity-30"
                >
                  {allActionsDone
                    ? "Cerrar caso maestro"
                    : `Completa las ${plan.actions.length - doneActions} acciones restantes para cerrar`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// GESTOR — ESTADÍSTICAS
// ============================================================================

function GestorStats({ reports, user }) {
  const mine = reports.filter((r) => r.institutionId === user.institutionId);
  const resolved = mine.filter(
    (r) => r.status === "resuelto" || r.status === "cerrado",
  ).length;
  const resolutionRate = mine.length
    ? Math.round((resolved / mine.length) * 100)
    : 0;
  const overdue = mine.filter(
    (r) =>
      r.status !== "resuelto" && r.status !== "cerrado" && slaRemaining(r) < 0,
  ).length;
  const withinSla = mine.length
    ? Math.round(((mine.length - overdue) / mine.length) * 100)
    : 0;

  const avgResponseDays = (() => {
    const closed = mine.filter(
      (r) =>
        (r.status === "resuelto" || r.status === "cerrado") &&
        r.timeline?.length > 1,
    );
    if (!closed.length) return "—";
    const totalH = closed.reduce(
      (a, r) =>
        a + (r.timeline[r.timeline.length - 1].at - r.timeline[0].at) / 3600000,
      0,
    );
    return (totalH / closed.length / 24).toFixed(1);
  })();

  const byCategory = CATEGORIES.map((c) => ({
    name: c.label,
    value: mine.filter((r) => r.category === c.id).length,
  })).filter((d) => d.value > 0);
  const byStatus = STATUS_ORDER.map((s) => ({
    name: STATUS_META[s].label,
    value: mine.filter((r) => r.status === s).length,
  }));
  const byPriority = Object.keys(PRIORITY_META).map((p) => ({
    name: PRIORITY_META[p].label,
    value: mine.filter((r) => r.priority === p).length,
  }));
  const trend = weeklyTrendOf(mine);
  const byZone = ZONES.map((z) => ({
    name: z.name,
    value: mine.filter((r) => r.zone === z.id).length,
  }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4 pb-8">
      <SectionHeading
        eyebrow={getInstitution(user.institutionId).name}
        title="Estadísticas de la institución"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Reportes recibidos"
          value={mine.length}
          Icon={FileText}
          tone="blue"
        />
        <StatCard
          label="Tasa de resolución"
          value={`${resolutionRate}%`}
          Icon={CheckCircle2}
          tone="teal"
          sub={`${resolved} de ${mine.length}`}
        />
        <StatCard
          label="Cumplimiento SLA"
          value={`${withinSla}%`}
          Icon={Gauge}
          tone={withinSla > 70 ? "teal" : withinSla > 40 ? "amber" : "red"}
          sub={`${overdue} fuera de tiempo`}
        />
        <StatCard
          label="Tiempo prom. de cierre"
          value={avgResponseDays === "—" ? "—" : `${avgResponseDays}d`}
          Icon={TimerReset}
          tone="purple"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-700 mb-3">
            Reportes por categoría
          </p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byCategory}
                layout="vertical"
                margin={{ left: 10, right: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10 }}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  width={90}
                />
                <Tooltip wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {byCategory.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-700 mb-3">
            Distribución por estado
          </p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byStatus}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {byStatus.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Tooltip wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-700 mb-3">
            Tendencia semanal
          </p>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="cantidad"
                  stroke="#0f766e"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-700 mb-3">
            Reportes por prioridad
          </p>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byPriority}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {byPriority.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-4">
        <p className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-1.5">
          <MapPinned size={14} className="text-teal-600" /> Zonas con más
          reportes
        </p>
        <p className="text-[11px] text-slate-400 mb-3">
          Sectores que más incidencias generan dentro de tu cobertura.
        </p>
        <div className="space-y-3">
          {byZone.map((d) => {
            const pct = mine.length
              ? Math.round((d.value / mine.length) * 100)
              : 0;
            return (
              <div key={d.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-600">{d.name}</span>
                  <span className="tr-mono text-slate-500">
                    {d.value} ({pct}%)
                  </span>
                </div>
                <ProgressBar value={pct} colorClass="bg-blue-500" />
              </div>
            );
          })}
          {byZone.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">
              Sin datos suficientes.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ADMIN
// ============================================================================

const CHART_COLORS = [
  "#0f766e",
  "#f59e0b",
  "#1d4ed8",
  "#dc2626",
  "#7c3aed",
  "#059669",
];

function KpiCard({ label, value, sub, Icon, tone = "teal" }) {
  const toneMap = {
    teal: "bg-teal-50 text-teal-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${toneMap[tone]}`}
        >
          <Icon size={17} />
        </span>
      </div>
      <p className="tr-mono text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs font-semibold text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function AdminDashboard({ reports }) {
  const total = reports.length;
  const resolved = reports.filter((r) =>
    ["resuelto", "cerrado"].includes(r.status),
  ).length;
  const overdue = reports.filter((r) => isOverdue(r)).length;
  const escalated = reports.filter((r) => r.status === "escalado").length;
  const avgSat = (() => {
    const rated = reports.filter((r) => r.satisfaction);
    return rated.length
      ? (rated.reduce((a, r) => a + r.satisfaction, 0) / rated.length).toFixed(
          1,
        )
      : "—";
  })();

  const kpis = useMemo(() => computeExecutiveKpis(reports), [reports]);

  const byStatus = STATUS_ORDER.map((s) => ({
    name: STATUS_META[s].label,
    value: reports.filter((r) => r.status === s).length,
  })).filter((d) => d.value > 0);
  const byInstitution = INSTITUTIONS.filter((i) => i.id !== "otra")
    .map((inst) => ({
      name: inst.short,
      reportes: reports.filter((r) => r.institutionId === inst.id).length,
      resueltos: reports.filter(
        (r) =>
          r.institutionId === inst.id &&
          ["resuelto", "cerrado"].includes(r.status),
      ).length,
    }))
    .filter((d) => d.reportes > 0)
    .sort((a, b) => b.reportes - a.reportes)
    .slice(0, 8);

  const byCategory = CATEGORIES.map((c) => ({
    name: c.label,
    value: reports.filter((r) => r.category === c.id).length,
  })).filter((d) => d.value > 0);
  const byPriority = PRIORITY_ORDER.map((p) => ({
    name: PRIORITY_META[p].label,
    value: reports.filter((r) => r.priority === p).length,
  }));

  const trend = Array.from({ length: 8 }).map((_, i) => {
    const weekAgo = 7 - i;
    return {
      name: `S-${weekAgo}`,
      reportes: 4 + Math.floor(Math.abs(Math.sin(i * 1.3)) * 8),
    };
  });

  const criticalActive = reports
    .filter((r) => r.priority === "critica" && isActiveReport(r))
    .sort((a, b) => slaRemaining(a) - slaRemaining(b))
    .slice(0, 5);
  const topCitizens = [...MOCK_USERS]
    .filter((u) => u.role === "ciudadano")
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto px-4 pt-4 pb-8">
      <div className="flex items-start justify-between gap-3">
        <SectionHeading
          eyebrow="Panel organizacional"
          title="KPIs de cumplimiento y métricas"
        />
        <button
          onClick={() => exportReportsCsv(reports, "reportes-tureporte.csv")}
          className="shrink-0 mt-1 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-sky-300 hover:text-sky-700 transition"
        >
          <Download size={13} /> Exportar todo (CSV)
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <KpiCard
          label="Incidencias totales"
          value={total}
          Icon={FileText}
          tone="blue"
          sub="Últimos 26 días"
        />
        <KpiCard
          label="Tasa de resolución"
          value={`${Math.round((resolved / total) * 100)}%`}
          Icon={CheckCircle2}
          tone="teal"
          sub={`${resolved} de ${total} incidencias`}
        />
        <KpiCard
          label="Escaladas"
          value={escalated}
          Icon={TrendingUp}
          tone="amber"
          sub="Requieren arbitraje de supervisor"
        />
        <KpiCard
          label="Fuera de SLA"
          value={overdue}
          Icon={AlertTriangle}
          tone="red"
          sub="Requieren atención inmediata"
        />
        <KpiCard
          label="Satisfacción ciudadana"
          value={avgSat}
          Icon={Star}
          tone="amber"
          sub="Promedio de calificaciones"
        />
      </div>

      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2.5 mt-2">
        Dashboard ejecutivo — KPIs de gestión
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="First Response Time"
          value={formatKpiHours(kpis.frtHours)}
          Icon={Clock}
          tone="blue"
          sub={
            kpis.frtSample
              ? `Promedio sobre ${kpis.frtSample} casos`
              : "Sin datos aún"
          }
        />
        <KpiCard
          label="Average Resolution Time"
          value={formatKpiHours(kpis.artHours)}
          Icon={CheckCircle2}
          tone="teal"
          sub={
            kpis.artSample
              ? `Promedio sobre ${kpis.artSample} casos cerrados`
              : "Sin casos cerrados"
          }
        />
        <KpiCard
          label="SLA Compliance"
          value={
            kpis.slaCompliancePct == null
              ? "—"
              : `${Math.round(kpis.slaCompliancePct)}%`
          }
          Icon={Gauge}
          tone={
            kpis.slaCompliancePct != null && kpis.slaCompliancePct < 80
              ? "red"
              : "teal"
          }
          sub={
            kpis.slaSample
              ? `${kpis.slaSample} expedientes con SLA`
              : "Ningún expediente con SLA aún"
          }
        />
        <KpiCard
          label="Backlog"
          value={kpis.backlog}
          Icon={ClipboardList}
          tone="amber"
          sub="Expedientes activos ahora mismo"
        />
        <KpiCard
          label="Aging promedio"
          value={formatKpiHours(kpis.agingHours)}
          Icon={TimerReset}
          tone="amber"
          sub="Antigüedad de los casos activos"
        />
        <KpiCard
          label="Reopen Rate"
          value={
            kpis.reopenRatePct == null
              ? "—"
              : `${Math.round(kpis.reopenRatePct)}%`
          }
          Icon={RefreshCw}
          tone={kpis.reopenRatePct > 15 ? "red" : "blue"}
          sub="Sobre expedientes cerrados alguna vez"
        />
        <KpiCard
          label="Escalation Rate"
          value={`${Math.round(kpis.escalationRatePct)}%`}
          Icon={TrendingUp}
          tone={kpis.escalationRatePct > 20 ? "red" : "blue"}
          sub="Expedientes escalados sobre el total"
        />
        <KpiCard
          label="Resolution Rate"
          value={`${Math.round(kpis.resolutionRatePct)}%`}
          Icon={BadgeCheck}
          tone="teal"
          sub="Resuelto o cerrado sobre el total"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-700 mb-3">
            Reportes por institución (top 8)
          </p>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byInstitution}
                layout="vertical"
                margin={{ left: 10, right: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#f1f5f9"
                />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  width={70}
                />
                <Tooltip wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="reportes" fill="#0f766e" radius={[0, 4, 4, 0]} />
                <Bar dataKey="resueltos" fill="#5eead4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-700 mb-3">
            Distribución por estado
          </p>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byStatus}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {byStatus.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-700 mb-3">
            Tendencia semanal de reportes
          </p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="reportes"
                  stroke="#0f766e"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-700 mb-3">
            Reportes por categoría
          </p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9 }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {byCategory.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-700 mb-3">
            Incidencias por prioridad
          </p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byPriority}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {byPriority.map((d, i) => (
                    <Cell
                      key={i}
                      fill={PRIORITY_META[PRIORITY_ORDER[i]].color}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-4 mb-6">
        <p className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-1.5">
          <Info size={14} className="text-teal-600" /> Cumplimiento
          institucional (SLA)
        </p>
        <p className="text-[11px] text-slate-400 mb-3">
          Porcentaje de reportes atendidos dentro del tiempo de respuesta
          acordado por institución.
        </p>
        <div className="space-y-3">
          {byInstitution.map((d) => {
            const pct = d.reportes
              ? Math.round((d.resueltos / d.reportes) * 100)
              : 0;
            return (
              <div key={d.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-600">{d.name}</span>
                  <span className="tr-mono text-slate-500">{pct}%</span>
                </div>
                <ProgressBar
                  value={pct}
                  colorClass={
                    pct > 70
                      ? "bg-emerald-500"
                      : pct > 40
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white border border-red-100 p-4">
          <p className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-red-500" /> Incidencias
            críticas activas
          </p>
          <p className="text-[11px] text-slate-400 mb-3">
            Casos de prioridad crítica que aún no se han resuelto, ordenados por
            tiempo restante.
          </p>
          <div className="space-y-2">
            {criticalActive.map((r) => {
              const remaining = slaRemaining(r);
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-100 p-2.5"
                >
                  <img
                    src={r.photos[0]}
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                    alt=""
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] tr-mono text-slate-400">
                      {r.code}
                    </p>
                    <p className="text-xs font-semibold text-slate-700 truncate">
                      {r.desc}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {getInstitution(r.institutionId).short} ·{" "}
                      {getZone(r.zone).name}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-bold shrink-0 ${remaining < 0 ? "text-red-600" : "text-orange-500"}`}
                  >
                    {remaining < 0 ? "Vencido" : `${remaining}h`}
                  </span>
                </div>
              );
            })}
            {criticalActive.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">
                No hay incidencias críticas pendientes ahora mismo.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <Medal size={14} className="text-amber-500" /> Vecinos más
            colaboradores
          </p>
          <p className="text-[11px] text-slate-400 mb-3">
            Ciudadanos con mayor participación cívica en la plataforma.
          </p>
          <div className="space-y-2">
            {topCitizens.map((u, i) => (
              <div key={u.id} className="flex items-center gap-2.5">
                <span
                  className={`tr-mono text-xs font-bold w-5 ${i === 0 ? "text-amber-500" : "text-slate-400"}`}
                >
                  {i + 1}
                </span>
                <Avatar seed={u.seed} size={28} />
                <span className="text-xs font-semibold text-slate-700 flex-1 truncate">
                  {u.name}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700">
                  <Trophy size={11} /> {u.points} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminUsers({ users, onCreate }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    cedula: "",
    phone: "",
    email: "",
    role: "gestor",
    institutionId: "ayto-dn",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="max-w-3xl mx-auto px-4 pt-4 pb-8">
      <SectionHeading
        eyebrow="Gestión organizacional"
        title="Usuarios del sistema"
        action={
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1.5 rounded-full bg-blue-900 text-white text-xs font-semibold px-3.5 py-2"
          >
            <UserPlus size={14} /> Nuevo usuario
          </button>
        }
      />

      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 mb-5 tr-fade-up">
          <p className="text-sm font-bold text-slate-700 mb-3">
            Crear usuario que asigna y clasifica reportes
          </p>
          <div className="grid md:grid-cols-2 gap-3 mb-3">
            <TextField
              label="Nombre completo"
              icon={User}
              placeholder="Nombre y apellido"
              value={form.name}
              onChange={set("name")}
            />
            <TextField
              label="Cédula"
              icon={CreditCard}
              placeholder="000-0000000-0"
              value={form.cedula}
              onChange={set("cedula")}
            />
            <TextField
              label="Teléfono"
              icon={Phone}
              placeholder="809-000-0000"
              value={form.phone}
              onChange={set("phone")}
            />
            <TextField
              label="Correo institucional"
              icon={Mail}
              placeholder="nombre@institucion.gob.do"
              value={form.email}
              onChange={set("email")}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-3 mb-4">
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1.5">
                Rol
              </span>
              <select
                value={form.role}
                onChange={set("role")}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
              >
                <option value="gestor">
                  Gestor (clasifica y asigna reportes)
                </option>
                <option value="admin">Administrador</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1.5">
                Institución asociada
              </span>
              <select
                value={form.institutionId}
                onChange={set("institutionId")}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                disabled={form.role !== "gestor"}
              >
                {INSTITUTIONS.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (form.name && form.email) {
                  onCreate({
                    ...form,
                    id: uid("u"),
                    seed: form.name.split(" ")[0],
                    points: 0,
                  });
                  setForm({
                    name: "",
                    cedula: "",
                    phone: "",
                    email: "",
                    role: "gestor",
                    institutionId: "ayto-dn",
                  });
                  setShowForm(false);
                }
              }}
              className="flex-1 rounded-xl bg-teal-600 text-white text-sm font-semibold py-2.5"
            >
              Crear usuario
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-slate-200 text-sm font-semibold text-slate-500 px-4"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-2.5 bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
          <span>Usuario</span>
          <span>Rol</span>
          <span className="text-right">Institución</span>
        </div>
        {users.map((u) => (
          <div
            key={u.id}
            className="grid grid-cols-[1fr_auto_auto] gap-2 items-center px-4 py-2.5 border-t border-slate-100"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar seed={u.seed} size={30} />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-700 truncate">
                  {u.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
              </div>
            </div>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full text-center ${u.role === "admin" ? "bg-slate-800 text-white" : u.role === "gestor" ? "bg-blue-100 text-blue-700" : "bg-teal-100 text-teal-700"}`}
            >
              {u.role === "admin"
                ? "Admin"
                : u.role === "gestor"
                  ? "Gestor"
                  : "Ciudadano"}
            </span>
            <span className="text-[11px] text-slate-500 text-right truncate">
              {u.institutionId ? getInstitution(u.institutionId).short : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// AUDITORÍA GLOBAL
// ============================================================================

const AUDIT_RANGE_OPTIONS = [
  { id: "todo", label: "Todo el histórico", ms: null },
  { id: "24h", label: "Últimas 24 horas", ms: 24 * 3600000 },
  { id: "7d", label: "Últimos 7 días", ms: 7 * 24 * 3600000 },
  { id: "30d", label: "Últimos 30 días", ms: 30 * 24 * 3600000 },
];
const AUDIT_CAMPO_OPTIONS = ["Todos", "Estado", "Actividad", "Caso maestro"];

function AuditLogView({
  reports,
  masterCases,
  institutionScope,
  onOpenReport,
  onOpenMasterCase,
}) {
  const [q, setQ] = useState("");
  const [userFilter, setUserFilter] = useState("todos");
  const [campoFilter, setCampoFilter] = useState("Todos");
  const [range, setRange] = useState("todo");

  const allEntries = useMemo(
    () => buildAuditLog(reports, masterCases),
    [reports, masterCases],
  );
  const scoped = useMemo(
    () =>
      institutionScope
        ? allEntries.filter(
            (e) =>
              e.kind === "masterCase" || e.institutionId === institutionScope,
          )
        : allEntries,
    [allEntries, institutionScope],
  );
  const users = useMemo(
    () => Array.from(new Set(scoped.map((e) => e.by))).sort(),
    [scoped],
  );

  const filtered = useMemo(() => {
    const rangeMs = AUDIT_RANGE_OPTIONS.find((r) => r.id === range)?.ms;
    const now = Date.now();
    const query = q.trim().toLowerCase();
    return scoped.filter((e) => {
      if (rangeMs && now - e.at > rangeMs) return false;
      if (userFilter !== "todos" && e.by !== userFilter) return false;
      if (campoFilter !== "Todos" && e.campo !== campoFilter) return false;
      if (query) {
        const hay =
          `${e.caseCode} ${e.by} ${e.action} ${e.motivo || ""} ${e.anterior} ${e.nuevo}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [scoped, range, userFilter, campoFilter, q]);

  return (
    <div className="max-w-5xl mx-auto px-4 pt-4 pb-8">
      <SectionHeading
        eyebrow="Trazabilidad completa"
        title="Auditoría global"
        action={
          <button
            onClick={() =>
              exportAuditCsv(
                filtered,
                `auditoria-tureporte-${new Date().toISOString().slice(0, 10)}.csv`,
              )
            }
            className="flex items-center gap-1.5 rounded-full bg-slate-800 text-white text-xs font-semibold px-3.5 py-2"
          >
            <Download size={14} /> Exportar CSV
          </button>
        }
      />
      <p className="text-xs text-slate-400 -mt-3 mb-4">
        {filtered.length} de {scoped.length} registros · bitácora de solo
        lectura, ningún rol puede eliminar auditoría.
      </p>

      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 mb-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por caso, usuario, motivo…"
            className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs bg-white outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="todos">Todos los usuarios</option>
          {users.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <select
          value={campoFilter}
          onChange={(e) => setCampoFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs bg-white outline-none focus:ring-2 focus:ring-blue-400"
        >
          {AUDIT_CAMPO_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs bg-white outline-none focus:ring-2 focus:ring-blue-400"
        >
          {AUDIT_RANGE_OPTIONS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="hidden md:grid grid-cols-[110px_120px_90px_1fr_170px_90px] gap-2 px-4 py-2.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
          <span>Fecha</span>
          <span>Usuario</span>
          <span>Caso</span>
          <span>Acción</span>
          <span>Cambio</span>
          <span>Motivo</span>
        </div>
        <div className="max-h-[65vh] overflow-y-auto tr-scroll divide-y divide-slate-100">
          {filtered.map((e) => (
            <button
              key={e.id}
              onClick={() =>
                e.kind === "masterCase"
                  ? onOpenMasterCase?.(e.caseId)
                  : onOpenReport?.(e.caseId)
              }
              className="w-full text-left grid grid-cols-2 md:grid-cols-[110px_120px_90px_1fr_170px_90px] gap-1.5 md:gap-2 px-4 py-2.5 hover:bg-slate-50 transition"
            >
              <span className="text-[10px] tr-mono text-slate-400 col-span-2 md:col-span-1">
                {formatDateTime(e.at)}
              </span>
              <span className="text-xs font-semibold text-slate-700 truncate">
                {e.by}
              </span>
              <span className="text-[10px] tr-mono text-blue-700 truncate">
                {e.caseCode}
              </span>
              <span className="text-xs text-slate-600 truncate">
                {e.action}
              </span>
              <span className="text-[11px] text-slate-500 truncate">
                {e.campo === "Estado" ? (
                  <>
                    <span className="text-slate-400">{e.anterior}</span> →{" "}
                    <span className="font-semibold text-slate-700">
                      {e.nuevo}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-400">{e.campo}</span>
                )}
              </span>
              <span
                className="text-[11px] text-slate-400 truncate"
                title={e.motivo || ""}
              >
                {e.motivo || "—"}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-10">
              No hay registros de auditoría con estos filtros.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MOTOR DE REGLAS — UI
// ============================================================================

function RuleToggle({ on, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-9 h-5 rounded-full transition relative shrink-0 ${on ? "bg-teal-500" : "bg-slate-200"}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition ${on ? "left-4.5" : "left-0.5"}`}
        style={{ left: on ? "18px" : "2px" }}
      />
    </button>
  );
}

function AdminRulesView({ rules, setRules }) {
  const [newRoutingCategory, setNewRoutingCategory] = useState("");
  const [newRoutingSubcategory, setNewRoutingSubcategory] = useState("");
  const [newRoutingInstitution, setNewRoutingInstitution] = useState("");
  const [newSlaPriority, setNewSlaPriority] = useState("critica");
  const [newSlaHours, setNewSlaHours] = useState(4);

  const addRoutingRule = () => {
    if (!newRoutingCategory || !newRoutingInstitution) return;
    const rule = {
      id: uid("rule-rt"),
      enabled: true,
      categoryId: newRoutingCategory,
      subcategoryId: newRoutingSubcategory || null,
      institutionId: newRoutingInstitution,
    };
    setRules((r) => ({ ...r, routing: [...r.routing, rule] }));
    setNewRoutingCategory("");
    setNewRoutingSubcategory("");
    setNewRoutingInstitution("");
  };
  const toggleRoutingRule = (id) =>
    setRules((r) => ({
      ...r,
      routing: r.routing.map((x) =>
        x.id === id ? { ...x, enabled: !x.enabled } : x,
      ),
    }));
  const removeRoutingRule = (id) =>
    setRules((r) => ({ ...r, routing: r.routing.filter((x) => x.id !== id) }));

  const addSlaRule = () => {
    const hours = Number(newSlaHours);
    if (!newSlaPriority || !hours || hours <= 0) return;
    const rule = {
      id: uid("rule-sla"),
      enabled: true,
      priority: newSlaPriority,
      slaHours: hours,
    };
    setRules((r) => ({ ...r, sla: [...r.sla, rule] }));
  };
  const toggleSlaRule = (id) =>
    setRules((r) => ({
      ...r,
      sla: r.sla.map((x) => (x.id === id ? { ...x, enabled: !x.enabled } : x)),
    }));
  const removeSlaRule = (id) =>
    setRules((r) => ({ ...r, sla: r.sla.filter((x) => x.id !== id) }));

  const totalActive =
    rules.routing.filter((r) => r.enabled).length +
    rules.sla.filter((r) => r.enabled).length +
    (rules.notifySlaBreach ? 1 : 0) +
    1;

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4 pb-10">
      <SectionHeading
        eyebrow="Automatización y enrutamiento"
        title="Motor de reglas"
      />
      <p className="text-xs text-slate-400 -mt-3 mb-5">
        {totalActive} reglas activas · se aplican automáticamente al crear un
        reporte y al clasificar/asignar una incidencia. Mientras no agregues una
        regla, el sistema usa su comportamiento por defecto.
      </p>

      {/* ------- Enrutamiento ------- */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 mb-5">
        <p className="text-sm font-bold text-slate-700 mb-1">
          Reglas de enrutamiento
        </p>
        <p className="text-[11px] text-slate-400 mb-3">
          IF categoría [+ subcategoría] THEN institución responsable. La primera
          regla habilitada que coincida gana; si ninguna aplica, se usa el
          enrutamiento automático por zona.
        </p>

        <div className="space-y-2 mb-3">
          {rules.routing.length === 0 && (
            <p className="text-xs text-slate-400 py-2">
              Aún no hay reglas de enrutamiento — se usa el enrutamiento
              automático por zona/categoría.
            </p>
          )}
          {rules.routing.map((rule) => (
            <div
              key={rule.id}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 ${rule.enabled ? "border-slate-200" : "border-slate-100 opacity-50"}`}
            >
              <RuleToggle
                on={rule.enabled}
                onClick={() => toggleRoutingRule(rule.id)}
              />
              <span className="text-xs text-slate-600 flex-1 min-w-0 truncate">
                <span className="font-semibold text-slate-700">IF</span>{" "}
                {getCategory(rule.categoryId).label}
                {rule.subcategoryId
                  ? ` → ${getSubcategory(rule.subcategoryId)?.label}`
                  : ""}
                <span className="font-semibold text-slate-700"> THEN</span>{" "}
                {getInstitution(rule.institutionId).short}
              </span>
              <button
                onClick={() => removeRoutingRule(rule.id)}
                className="shrink-0 text-slate-300 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-2">
          <select
            value={newRoutingCategory}
            onChange={(e) => {
              setNewRoutingCategory(e.target.value);
              setNewRoutingSubcategory("");
            }}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white"
          >
            <option value="">Categoría…</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={newRoutingSubcategory}
            onChange={(e) => setNewRoutingSubcategory(e.target.value)}
            disabled={!newRoutingCategory}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white disabled:bg-slate-50"
          >
            <option value="">Cualquier subcategoría</option>
            {getSubcategoriesFor(newRoutingCategory).map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={newRoutingInstitution}
            onChange={(e) => setNewRoutingInstitution(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white"
          >
            <option value="">Institución…</option>
            {INSTITUTIONS.map((i) => (
              <option key={i.id} value={i.id}>
                {i.short}
              </option>
            ))}
          </select>
          <button
            onClick={addRoutingRule}
            disabled={!newRoutingCategory || !newRoutingInstitution}
            className="flex items-center justify-center gap-1 rounded-lg bg-blue-900 text-white text-xs font-semibold px-3 py-1.5 disabled:opacity-40"
          >
            <Plus size={13} /> Agregar
          </button>
        </div>
      </div>

      {/* ------- SLA ------- */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 mb-5">
        <p className="text-sm font-bold text-slate-700 mb-1">Reglas de SLA</p>
        <p className="text-[11px] text-slate-400 mb-3">
          IF prioridad THEN horas de SLA. Por defecto:{" "}
          {PRIORITY_ORDER.map(
            (p) => `${PRIORITY_META[p].label} ${PRIORITY_META[p].slaHours}h`,
          ).join(" · ")}
          .
        </p>

        <div className="space-y-2 mb-3">
          {rules.sla.length === 0 && (
            <p className="text-xs text-slate-400 py-2">
              Aún no hay reglas de SLA — se usan los valores por defecto de cada
              prioridad.
            </p>
          )}
          {rules.sla.map((rule) => (
            <div
              key={rule.id}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 ${rule.enabled ? "border-slate-200" : "border-slate-100 opacity-50"}`}
            >
              <RuleToggle
                on={rule.enabled}
                onClick={() => toggleSlaRule(rule.id)}
              />
              <span className="text-xs text-slate-600 flex-1 min-w-0 truncate">
                <span className="font-semibold text-slate-700">IF</span>{" "}
                prioridad = {PRIORITY_META[rule.priority].label}
                <span className="font-semibold text-slate-700"> THEN</span> SLA
                = {rule.slaHours}h
              </span>
              <button
                onClick={() => removeSlaRule(rule.id)}
                className="shrink-0 text-slate-300 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
          <select
            value={newSlaPriority}
            onChange={(e) => setNewSlaPriority(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white"
          >
            {PRIORITY_ORDER.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_META[p].label}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            value={newSlaHours}
            onChange={(e) => setNewSlaHours(e.target.value)}
            placeholder="Horas"
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
          />
          <button
            onClick={addSlaRule}
            className="flex items-center justify-center gap-1 rounded-lg bg-blue-900 text-white text-xs font-semibold px-3 py-1.5"
          >
            <Plus size={13} /> Agregar
          </button>
        </div>
      </div>

      {/* ------- Notificación de SLA vencido y umbral de recurrencia ------- */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-bold text-slate-700 mb-1">
            Alertas de SLA
          </p>
          <p className="text-[11px] text-slate-400 mb-3">
            IF SLA vencido THEN notificar al supervisor.
          </p>
          <div className="flex items-center gap-2.5">
            <RuleToggle
              on={rules.notifySlaBreach}
              onClick={() =>
                setRules((r) => ({ ...r, notifySlaBreach: !r.notifySlaBreach }))
              }
            />
            <span className="text-xs text-slate-600">
              {rules.notifySlaBreach
                ? "Activado — los vencimientos aparecen en Avisos de gestores/supervisores"
                : "Desactivado — los vencimientos no generan notificación"}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-bold text-slate-700 mb-1">
            Problemas recurrentes
          </p>
          <p className="text-[11px] text-slate-400 mb-3">
            IF múltiples casos en misma zona/categoría THEN sugerir problema
            recurrente.
          </p>
          <div className="flex items-center gap-3">
            <label className="text-[11px] text-slate-500 flex items-center gap-1.5">
              Mínimo
              <input
                type="number"
                min="2"
                value={rules.recurringMinCount}
                onChange={(e) =>
                  setRules((r) => ({
                    ...r,
                    recurringMinCount:
                      Number(e.target.value) || r.recurringMinCount,
                  }))
                }
                className="w-14 rounded-lg border border-slate-200 px-2 py-1 text-xs"
              />
              casos
            </label>
            <label className="text-[11px] text-slate-500 flex items-center gap-1.5">
              en
              <input
                type="number"
                min="1"
                value={rules.recurringWindowDays}
                onChange={(e) =>
                  setRules((r) => ({
                    ...r,
                    recurringWindowDays:
                      Number(e.target.value) || r.recurringWindowDays,
                  }))
                }
                className="w-14 rounded-lg border border-slate-200 px-2 py-1 text-xs"
              />
              días
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ROOT APP
// ============================================================================

export default function App() {
  const [session, setSession] = useState(null);
  const [screen, setScreen] = useState("landing");
  const [authScreen, setAuthScreen] = useState("login");
  const [regForm, setRegForm] = useState({
    name: "",
    cedula: "",
    phone: "",
    email: "",
    password: "",
    zone: "",
    terms: false,
  });

  const [reports, setReports] = useState(() => buildReports());
  const [users, setUsers] = useState(MOCK_USERS);
  const [masterCases, setMasterCases] = useState([]);
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [likedIds, setLikedIds] = useState(new Set());
  const [commentsMap, setCommentsMap] = useState({
    r1: [
      {
        id: "c1",
        name: "Miguel Santos",
        seed: "Miguel",
        text: "Yo también he tenido problemas con ese bache, ¡ojalá lo resuelvan pronto!",
        anonymous: false,
      },
    ],
  });
  const [toast, setToast] = useState(null);
  const [view, setView] = useState("feed");
  const [profileModal, setProfileModal] = useState(null);
  const [detailReportId, setDetailReportId] = useState(null);
  const setDetailReport = (r) => setDetailReportId(r ? r.id : null);
  const [detailMasterCaseId, setDetailMasterCaseId] = useState(null);
  const [mapMode, setMapMode] = useState("city");
  const [mapReportId, setMapReportId] = useState(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }, []);

  const notifications = useMemo(
    () => buildNotificationsForUser(session, reports, rules),
    [session, reports, rules],
  );

  const handleLogin = (user) => {
    setSession(user);
    setView(
      user.role === "ciudadano"
        ? "feed"
        : user.role === "supervisor"
          ? "supervisorCenter"
          : "dashboard",
    );
  };

  const handleLogout = () => {
    setSession(null);
    setAuthScreen("login");
    setScreen("landing");
  };

  const handleUpdateUserRole = (userId, updateData) => {
    setUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.id === userId
          ? {
              ...u,
              role: updateData.role,
              institutionId: updateData.institutionId || null,
            }
          : u,
      ),
    );
    if (session && session.id === userId) {
      setSession((s) => ({
        ...s,
        role: updateData.role,
        institutionId: updateData.institutionId || null,
      }));
    }
    showToast(`Rol actualizado correctamente`);
  };

  const handleLike = (id) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handlePublish = ({
    category,
    subcategory,
    desc,
    zone,
    anonymous,
    photos,
  }) => {
    const num = String(reports.length + 1).padStart(6, "0");
    const now = Date.now();
    const sub = getSubcategory(subcategory);
    const suggestedPriority = sub ? sub.defaultPriority : "media";
    const routedInstitutionId = applyRoutingRule(
      rules,
      category,
      subcategory,
      zoneToInstitution(zone, category),
    );
    const slaHours = applySlaHours(
      rules,
      suggestedPriority,
      PRIORITY_META[suggestedPriority].slaHours,
    );
    const newReport = {
      id: uid("r"),
      code: `INC-${new Date(now).getFullYear()}-${num}`,
      desc,
      category,
      zone,
      subcategory,
      isAnonymous: anonymous,
      status: "nuevo",
      priority: suggestedPriority,
      authorId: session.id,
      photos,
      evidenceBefore: photos,
      evidenceDuring: [],
      evidenceAfter: [],
      createdAt: now,
      commentsCount: 0,
      institutionId: routedInstitutionId,
      department: null,
      responsable: null,
      slaHours,
      dueAt: now + slaHours * 3600000,
      isDuplicate: false,
      duplicateOf: null,
      satisfaction: null,
      reopenedCount: 0,
      distanceM: 40,
      tasks: [],
      inspections: [],
      timeline: [
        {
          at: now,
          label: "Reporte creado por el ciudadano",
          by: session.isAnonymous ? "Usuario anónimo" : session.name,
          toStatus: "nuevo",
        },
      ],
    };
    setReports((r) => [newReport, ...r]);
    setUsers((us) =>
      us.map((u) =>
        u.id === session.id ? { ...u, points: u.points + 15 } : u,
      ),
    );
    setSession((s) => ({ ...s, points: s.points + 15 }));
    setView("feed");
    showToast(`Reporte ${newReport.code} creado — te avisaremos en cada etapa`);
  };

  const handleReportAction = (reportId, action, payload = {}) => {
    setReports((rs) =>
      rs.map((r) => {
        if (r.id !== reportId) return r;
        const updated = { ...r, status: action.to };
        const entry = {
          at: Date.now(),
          by: session.name,
          toStatus: action.to,
          reason: payload.reason || null,
        };

        if (action.needsClassification) {
          updated.category = payload.category || r.category;
          updated.subcategory = payload.subcategory || r.subcategory;
          updated.priority = payload.priority || r.priority;
          const sub = getSubcategory(updated.subcategory);
          entry.label = `Clasificado como ${getCategory(updated.category).label} → ${sub ? sub.label : "—"}`;
        } else if (action.needsAssignment) {
          updated.institutionId =
            payload.institutionId ||
            applyRoutingRule(rules, r.category, r.subcategory, r.institutionId);
          updated.department = payload.department || null;
          updated.responsable = payload.responsable || null;
          updated.dueAt =
            Date.now() +
            applySlaHours(
              rules,
              updated.priority,
              PRIORITY_META[updated.priority]?.slaHours || r.slaHours,
            ) *
              3600000;
          entry.label = `Asignado a ${getInstitution(updated.institutionId).short} · ${updated.department || "—"} · Responsable: ${updated.responsable || "—"}`;
        } else if (action.needsEscalation) {
          updated.escalatedTo = payload.escalateTo || ESCALATION_TARGETS[0];
          entry.label = `Escalado a: ${updated.escalatedTo}`;
        } else if (action.to === "en_gestion" && r.status === "cerrado") {
          updated.reopenedCount = (r.reopenedCount || 0) + 1;
          entry.label = "Incidencia reabierta";
        } else {
          entry.label = action.label;
        }

        updated.timeline = [...r.timeline, entry];
        return updated;
      }),
    );
    showToast(`${action.label} — ${STATUS_META[action.to].label}`);
  };

  const handleAddEvidence = (reportId, url, phase) => {
    setReports((rs) =>
      rs.map((r) => {
        if (r.id !== reportId) return r;
        const key =
          phase === "after"
            ? "evidenceAfter"
            : phase === "during"
              ? "evidenceDuring"
              : "evidenceBefore";
        const updated = { ...r, [key]: [...(r[key] || []), url] };
        updated.timeline = [
          ...r.timeline,
          {
            at: Date.now(),
            by: session.name,
            label: `Evidencia de ${phase === "after" ? "resolución" : phase === "during" ? "gestión" : "reporte"} agregada`,
          },
        ];
        return updated;
      }),
    );
    showToast("Evidencia agregada al expediente");
  };

  const handleAddTask = (reportId, taskData) => {
    setReports((rs) =>
      rs.map((r) => {
        if (r.id !== reportId) return r;
        const dependsOn = taskData.dependsOn || null;
        const blocking = dependsOn
          ? (r.tasks || []).find((t) => t.id === dependsOn)
          : null;
        const status =
          blocking && blocking.status !== "completada"
            ? "bloqueada"
            : "pendiente";
        const task = {
          id: uid("tk"),
          reportId,
          title: taskData.title,
          description: taskData.description || "",
          assignee: taskData.assignee || null,
          priority: taskData.priority || r.priority,
          status,
          dependsOn,
          dueAt: taskData.dueAt || null,
          createdAt: Date.now(),
          completedAt: null,
          comment: "",
        };
        const updated = { ...r, tasks: [...(r.tasks || []), task] };
        updated.timeline = [
          ...r.timeline,
          {
            at: Date.now(),
            by: session.name,
            label: `Tarea creada: "${task.title}"${task.assignee ? ` · Responsable: ${task.assignee}` : ""}`,
          },
        ];
        return updated;
      }),
    );
    showToast("Tarea agregada al expediente");
  };

  const handleUpdateTaskStatus = (reportId, taskId, newStatus) => {
    setReports((rs) =>
      rs.map((r) => {
        if (r.id !== reportId) return r;
        const tasks = (r.tasks || []).map((t) => {
          if (t.id !== taskId) return t;
          if (t.dependsOn) {
            const dep = (r.tasks || []).find((x) => x.id === t.dependsOn);
            if (dep && dep.status !== "completada" && newStatus !== "bloqueada")
              return t;
          }
          return {
            ...t,
            status: newStatus,
            completedAt:
              newStatus === "completada" ? Date.now() : t.completedAt,
          };
        });
        const unblocked = tasks.map((t) => {
          if (t.status !== "bloqueada" || !t.dependsOn) return t;
          const dep = tasks.find((x) => x.id === t.dependsOn);
          return dep && dep.status === "completada"
            ? { ...t, status: "pendiente" }
            : t;
        });
        const changedTask = unblocked.find((t) => t.id === taskId);
        const updated = { ...r, tasks: unblocked };
        if (changedTask) {
          updated.timeline = [
            ...r.timeline,
            {
              at: Date.now(),
              by: session.name,
              label: `Tarea "${changedTask.title}" → ${TASK_STATUS_META[changedTask.status].label}`,
            },
          ];
        }
        return updated;
      }),
    );
    showToast("Tarea actualizada");
  };

  const handleRequestInspection = (reportId, data) => {
    setReports((rs) =>
      rs.map((r) => {
        if (r.id !== reportId) return r;
        const inspection = {
          id: uid("insp"),
          reportId,
          requestedBy: session.name,
          requestedAt: Date.now(),
          assignee: data.assignee || r.responsable || null,
          scheduledFor: data.scheduledFor || null,
          status: "solicitada",
          result: null,
          observations: "",
          photos: [],
        };
        const updated = {
          ...r,
          inspections: [...(r.inspections || []), inspection],
        };
        updated.timeline = [
          ...r.timeline,
          {
            at: Date.now(),
            by: session.name,
            label: `Inspección solicitada${inspection.assignee ? ` · Responsable: ${inspection.assignee}` : ""}`,
          },
        ];
        return updated;
      }),
    );
    showToast("Inspección solicitada");
  };

  const handleRecordInspectionResult = (reportId, inspectionId, data) => {
    setReports((rs) =>
      rs.map((r) => {
        if (r.id !== reportId) return r;
        const inspections = (r.inspections || []).map((insp) =>
          insp.id === inspectionId
            ? {
                ...insp,
                status: "realizada",
                result: data.result,
                observations: data.observations || "",
                performedAt: Date.now(),
                photos: data.photoUrl
                  ? [...(insp.photos || []), data.photoUrl]
                  : insp.photos,
              }
            : insp,
        );
        const updated = { ...r, inspections };
        updated.timeline = [
          ...r.timeline,
          {
            at: Date.now(),
            by: session.name,
            label: `Resultado de inspección registrado: ${INSPECTION_RESULT_META[data.result]?.label || data.result}`,
          },
        ];
        return updated;
      }),
    );
    showToast("Resultado de inspección registrado");
  };

  const handleMergeDuplicate = (reportId, targetId) => {
    setReports((rs) =>
      rs.map((r) => {
        if (r.id !== reportId) return r;
        const updated = {
          ...r,
          status: "duplicado",
          duplicateOf: targetId,
          isDuplicate: true,
        };
        updated.timeline = [
          ...r.timeline,
          {
            at: Date.now(),
            by: session.name,
            toStatus: "duplicado",
            label: `Fusionado con el reporte ${rs.find((x) => x.id === targetId)?.code || targetId}`,
            reason: "Mismo problema, misma zona y fecha cercana.",
          },
        ];
        return updated;
      }),
    );
    setDetailReport(null);
    showToast("Reportes fusionados — la trazabilidad original se conserva");
  };

  const handleConfirmResolution = (reportId, solved) => {
    if (solved) {
      setReports((rs) =>
        rs.map((r) => {
          if (r.id !== reportId) return r;
          const updated = { ...r, citizenConfirmed: true };
          updated.timeline = [
            ...r.timeline,
            {
              at: Date.now(),
              by: session.name,
              label: "El ciudadano confirmó que el problema fue solucionado",
            },
          ];
          return updated;
        }),
      );
      showToast("Gracias por confirmar la resolución");
    } else {
      handleReportAction(reportId, TRANSITIONS.cerrado[0], {
        reason: "El ciudadano indica que el problema continúa presente.",
      });
    }
  };

  const handleAddComment = (reportId, text) => {
    setCommentsMap((m) => ({
      ...m,
      [reportId]: [
        ...(m[reportId] || []),
        {
          id: uid("c"),
          name: session.name,
          seed: session.seed,
          text,
          anonymous: false,
        },
      ],
    }));
    setReports((rs) =>
      rs.map((r) =>
        r.id === reportId ? { ...r, commentsCount: r.commentsCount + 1 } : r,
      ),
    );
  };

  const handleCreateMasterCase = (category, zone, reportIds) => {
    const num = String(masterCases.length + 1).padStart(4, "0");
    const now = Date.now();
    const newCase = {
      id: uid("mc"),
      code: `CM-${new Date(now).getFullYear()}-${num}`,
      category,
      zone,
      reportIds,
      status: "abierto",
      createdAt: now,
      createdBy: session.name,
      interventionPlan: null,
      timeline: [
        {
          at: now,
          by: session.name,
          label: `Caso maestro creado agrupando ${reportIds.length} incidencias`,
        },
      ],
    };
    setMasterCases((mc) => [newCase, ...mc]);
    showToast(`Caso maestro ${newCase.code} creado`);
    return newCase.id;
  };

  const handleCreateInterventionPlan = (masterCaseId, planData) => {
    setMasterCases((list) =>
      list.map((mc) => {
        if (mc.id !== masterCaseId) return mc;
        const plan = {
          problem: planData.problem,
          objective: planData.objective,
          actions: planData.actions.map((label) => ({
            id: uid("act"),
            label,
            done: false,
          })),
          institutionIds: planData.institutionIds,
          targetDate: planData.targetDate,
          createdAt: Date.now(),
          baselineCount: mc.reportIds.length,
          measuredAt: null,
          resultCount: null,
          reduced: null,
        };
        const updated = {
          ...mc,
          status: "en_intervencion",
          interventionPlan: plan,
        };
        updated.timeline = [
          ...mc.timeline,
          {
            at: Date.now(),
            by: session.name,
            label: "Plan de intervención creado",
          },
        ];
        return updated;
      }),
    );
    showToast("Plan de intervención creado");
  };

  const handleToggleInterventionAction = (masterCaseId, actionId) => {
    setMasterCases((list) =>
      list.map((mc) => {
        if (mc.id !== masterCaseId || !mc.interventionPlan) return mc;
        const actions = mc.interventionPlan.actions.map((a) =>
          a.id === actionId ? { ...a, done: !a.done } : a,
        );
        return { ...mc, interventionPlan: { ...mc.interventionPlan, actions } };
      }),
    );
  };

  const handleMeasureIntervention = (masterCaseId) => {
    setMasterCases((list) =>
      list.map((mc) => {
        if (mc.id !== masterCaseId || !mc.interventionPlan) return mc;
        const since = mc.interventionPlan.createdAt;
        const newIncidents = reports.filter(
          (r) =>
            r.category === mc.category &&
            r.zone === mc.zone &&
            r.createdAt > since,
        ).length;
        const reduced = newIncidents < mc.interventionPlan.baselineCount;
        const updated = {
          ...mc,
          interventionPlan: {
            ...mc.interventionPlan,
            measuredAt: Date.now(),
            resultCount: newIncidents,
            reduced,
          },
        };
        updated.timeline = [
          ...mc.timeline,
          {
            at: Date.now(),
            by: session.name,
            label: `Resultado medido: ${newIncidents} incidencias nuevas (línea base: ${mc.interventionPlan.baselineCount}) — ${reduced ? "mejoró" : "sin mejora"}`,
          },
        ];
        return updated;
      }),
    );
    showToast("Resultado del plan de intervención medido");
  };

  const handleCloseMasterCase = (masterCaseId) => {
    setMasterCases((list) =>
      list.map((mc) => {
        if (mc.id !== masterCaseId) return mc;
        const updated = { ...mc, status: "cerrado" };
        updated.timeline = [
          ...mc.timeline,
          { at: Date.now(), by: session.name, label: "Caso maestro cerrado" },
        ];
        return updated;
      }),
    );
    showToast("Caso maestro cerrado");
  };

  const handleCreateUser = (u) => {
    setUsers((us) => [...us, u]);
    showToast(
      `Usuario ${u.name} creado como ${u.role === "gestor" ? "gestor de reportes" : "administrador"}`,
    );
  };

  /* ------------------------------ LANDING VIEW ------------------------------ */
  if (!session && screen === "landing") {
    return (
      <LandingPage
        onLogin={() => {
          setAuthScreen("login");
          setScreen("auth");
        }}
        onRegister={() => {
          setAuthScreen("register1");
          setScreen("auth");
        }}
      />
    );
  }

  /* ------------------------------- AUTH VIEW ------------------------------- */
  if (!session) {
    const goHome = () => setScreen("landing");
    return (
      <div className="tr-root h-full">
        <GlobalStyle />
        {authScreen === "login" && (
          <LoginScreen
            onLogin={handleLogin}
            onGoRegister={() => setAuthScreen("register1")}
            showToast={showToast}
            onHome={goHome}
          />
        )}
        {authScreen === "register1" && (
          <RegisterStep1
            initial={regForm}
            onBack={() => setAuthScreen("login")}
            onNext={(f) => {
              setRegForm(f);
              setAuthScreen("register2");
            }}
            onHome={goHome}
          />
        )}
        {authScreen === "register2" && (
          <RegisterOcrStep
            form={regForm}
            onBack={() => setAuthScreen("register1")}
            showToast={showToast}
            onHome={goHome}
            onDone={() => {
              const newUser = {
                id: uid("u"),
                name: regForm.name,
                cedula: regForm.cedula,
                phone: regForm.phone,
                email: regForm.email,
                role: "ciudadano",
                points: 10,
                isPublic: true,
                seed: regForm.name.split(" ")[0] || "Nuevo",
                zone: regForm.zone,
              };
              setUsers((us) => [...us, newUser]);
              handleLogin(newUser);
            }}
          />
        )}
        <Toast toast={toast} />
      </div>
    );
  }

  /* ------------------------------- MAIN APP -------------------------------- */
  const canManage = ["gestor", "supervisor", "admin"].includes(session.role);
  const unreadCount = notifications.length;
  const openReportById = (id) => setDetailReportId(id);
  const detailReport = reports.find((r) => r.id === detailReportId) || null;
  const openMasterCaseById = (id) => setDetailMasterCaseId(id);
  const detailMasterCase =
    masterCases.find((mc) => mc.id === detailMasterCaseId) || null;

  return (
    <div className="tr-root h-full">
      <GlobalStyle />
      <AppShell
        user={session}
        view={view}
        setView={setView}
        onLogout={handleLogout}
        unreadCount={unreadCount}
      >
        {session.role === "ciudadano" && view === "feed" && (
          <CitizenFeed
            reports={reports}
            likedIds={likedIds}
            onLike={handleLike}
            onOpenProfile={setProfileModal}
            onOpenDetail={setDetailReport}
            currentUser={session}
          />
        )}
        {session.role === "ciudadano" && view === "map" && (
          <CitizenMap reports={reports} />
        )}
        {session.role === "ciudadano" && view === "compose" && (
          <CitizenComposer onPublish={handlePublish} showToast={showToast} />
        )}
        {session.role === "ciudadano" && view === "stats" && (
          <CitizenStats user={session} reports={reports} users={users} />
        )}
        {session.role === "ciudadano" && view === "notify" && (
          <NotificationsView
            notifications={notifications}
            onOpenReport={openReportById}
          />
        )}
        {session.role === "ciudadano" && view === "profile" && (
          <CitizenProfile
            user={session}
            reports={reports}
            onLogout={handleLogout}
            onGoStats={() => setView("stats")}
            onTogglePublic={() => {
              setSession((s) => ({ ...s, isPublic: !s.isPublic }));
              setUsers((us) =>
                us.map((u) =>
                  u.id === session.id ? { ...u, isPublic: !u.isPublic } : u,
                ),
              );
            }}
          />
        )}

        {session.role === "supervisor" && view === "supervisorCenter" && (
          <SupervisorControlCenter
            reports={reports}
            user={session}
            onOpenDetail={setDetailReport}
            masterCases={masterCases}
            onCreateMasterCase={(cat, zone, ids) => {
              const mcId = handleCreateMasterCase(cat, zone, ids);
              openMasterCaseById(mcId);
            }}
            onOpenMasterCase={openMasterCaseById}
          />
        )}
        {(session.role === "gestor" || session.role === "supervisor") &&
          view === "dashboard" && (
            <GestorDashboard
              reports={reports}
              user={session}
              onOpenDetail={setDetailReport}
              showToast={showToast}
            />
          )}
        {(session.role === "gestor" ||
          session.role === "supervisor" ||
          session.role === "admin") &&
          view === "masterCases" && (
            <MasterCasesView
              masterCases={masterCases}
              onOpen={openMasterCaseById}
            />
          )}
        {(session.role === "gestor" || session.role === "supervisor") &&
          view === "stats" && <GestorStats reports={reports} user={session} />}
        {(session.role === "gestor" || session.role === "supervisor") &&
          view === "map" && (
            <div className="max-w-5xl mx-auto px-4 pt-4 pb-6">
              <SectionHeading
                eyebrow="Mapa operativo"
                title="Incidencias en tu área"
              />
              <ProfessionalMap
                reports={reports.filter(
                  (r) => r.institutionId === session.institutionId,
                )}
                selectedReportId={mapReportId}
                onSelectReport={(id) => {
                  setMapReportId(id);
                  setDetailReportId(id);
                }}
                height={550}
              />
            </div>
          )}
        {session.role === "supervisor" && view === "audit" && (
          <AuditLogView
            reports={reports}
            masterCases={masterCases}
            institutionScope={session.institutionId}
            onOpenReport={openReportById}
            onOpenMasterCase={openMasterCaseById}
          />
        )}
        {(session.role === "gestor" || session.role === "supervisor") &&
          view === "notify" && (
            <NotificationsView
              notifications={notifications}
              onOpenReport={openReportById}
            />
          )}
        {(session.role === "gestor" || session.role === "supervisor") &&
          view === "profile" && (
            <CitizenProfile
              user={session}
              reports={reports}
              onLogout={handleLogout}
              onTogglePublic={() => {}}
            />
          )}

        {session.role === "admin" && view === "dashboard" && (
          <AdminDashboard reports={reports} />
        )}
        {session.role === "admin" && view === "map" && (
          <div className="max-w-5xl mx-auto px-4 pt-4 pb-6">
            <SectionHeading
              eyebrow="Control nacional"
              title="Mapa de reportes"
            />
            <ProfessionalMap
              reports={reports}
              selectedReportId={mapReportId}
              onSelectReport={(id) => {
                setMapReportId(id);
                setDetailReportId(id);
              }}
              height={550}
            />
          </div>
        )}
        {session.role === "admin" && view === "audit" && (
          <AuditLogView
            reports={reports}
            masterCases={masterCases}
            institutionScope={null}
            onOpenReport={openReportById}
            onOpenMasterCase={openMasterCaseById}
          />
        )}
        {session.role === "admin" && view === "rules" && (
          <AdminRulesView rules={rules} setRules={setRules} />
        )}
        {session.role === "admin" && view === "users" && (
          <AdminUsers users={users} onCreate={handleCreateUser} />
        )}
        {session.role === "admin" && view === "adminRoles" && (
          <AdminUserRoles
            users={users}
            onUpdateUserRole={handleUpdateUserRole}
            currentUser={session}
          />
        )}
        {session.role === "admin" && view === "notify" && (
          <NotificationsView
            notifications={notifications}
            onOpenReport={openReportById}
          />
        )}
        {session.role === "admin" && view === "profile" && (
          <CitizenProfile
            user={session}
            reports={reports}
            onLogout={handleLogout}
            onTogglePublic={() => {}}
          />
        )}
      </AppShell>

      <ProfileModal
        author={profileModal}
        reports={reports}
        onClose={() => setProfileModal(null)}
      />
      <ReportDetailModal
        report={detailReport}
        comments={detailReport ? commentsMap[detailReport.id] || [] : []}
        onAddComment={handleAddComment}
        onClose={() => setDetailReport(null)}
        onOpenProfile={(author) => {
          setDetailReport(null);
          setProfileModal(author);
        }}
        liked={detailReport ? likedIds.has(detailReport.id) : false}
        onLike={handleLike}
        session={session}
        allReports={reports}
        onAction={handleReportAction}
        onAddEvidence={handleAddEvidence}
        onMergeDuplicate={handleMergeDuplicate}
        onConfirmResolution={handleConfirmResolution}
        onAddTask={handleAddTask}
        onUpdateTaskStatus={handleUpdateTaskStatus}
        onRequestInspection={handleRequestInspection}
        onRecordInspectionResult={handleRecordInspectionResult}
        rules={rules}
      />
      <MasterCaseDetailModal
        masterCase={detailMasterCase}
        reports={reports}
        onClose={() => setDetailMasterCaseId(null)}
        onCreatePlan={handleCreateInterventionPlan}
        onToggleAction={handleToggleInterventionAction}
        onMeasure={handleMeasureIntervention}
        onCloseCase={handleCloseMasterCase}
        onOpenReport={(id) => {
          setDetailMasterCaseId(null);
          openReportById(id);
        }}
      />
      <Toast toast={toast} />
    </div>
  );
}
