import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  Home, Map as MapIcon, PlusCircle, User, Bell, Search, Heart, MessageCircle,
  Camera, X, Check, CheckCircle2, Clock, AlertTriangle, MapPin, Shield, Users,
  BarChart3, LogOut, ChevronRight, ChevronLeft, ChevronDown, Lock, Eye, EyeOff,
  Award, TrendingUp, Building2, Trash2, Droplet, Droplets, Lightbulb, Leaf,
  Construction, HelpCircle, FileText, UserPlus, Filter, Star, Flag, Loader2,
  ScanLine, CreditCard, Phone, Mail, ArrowRight, ArrowLeft, Trophy, ThumbsUp,
  Send, Image as ImageIcon, Layers, Activity, Globe, ShieldCheck, ClipboardList,
  BadgeCheck, RefreshCw, Sparkles, ListChecks, TimerReset, Copy, UserCircle2,
  ChevronsUpDown, Info, Download, Gauge, Medal, MapPinned, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import LandingPage from "./LandingPage.jsx";

/* ============================================================================
   TuReporte — MVP de frontend (React + Tailwind)
   Todo el contenido (usuarios, reportes, OCR, mapa) es simulado en memoria.
   No hay backend real: sirve para validar flujo, UX y arquitectura de pantallas.
============================================================================ */

/* ---------------------------------- DATA --------------------------------- */

const INSTITUTIONS = [
  { id: "ayto-dn", name: "Ayuntamiento del Distrito Nacional", short: "ADN" },
  { id: "ayto-sde", name: "Ayuntamiento Santo Domingo Este", short: "ASDE" },
  { id: "ayto-sdn", name: "Ayuntamiento Santo Domingo Norte", short: "ASDN" },
  { id: "ayto-sdo", name: "Ayuntamiento Santo Domingo Oeste", short: "ASDO" },
  { id: "ayto-alc", name: "Ayuntamiento Los Alcarrizos", short: "A. Alcarrizos" },
  { id: "ayto-bch", name: "Ayuntamiento Boca Chica", short: "A. Boca Chica" },
  { id: "ayto-pbr", name: "Ayuntamiento Pedro Brand", short: "A. Pedro Brand" },
  { id: "ayto-sag", name: "Ayuntamiento San Antonio de Guerra", short: "A. San Antonio" },
  { id: "caasd", name: "CAASD — Acueducto y Alcantarillado de Santo Domingo", short: "CAASD" },
  { id: "inapa", name: "INAPA — Instituto Nacional de Aguas Potables", short: "INAPA" },
  { id: "mopc", name: "MOPC — Obras Públicas y Comunicaciones", short: "MOPC" },
  { id: "medioambiente", name: "Ministerio de Medio Ambiente y Recursos Naturales", short: "Medio Amb." },
  { id: "ede-este", name: "EDE-Este", short: "EDE-Este" },
  { id: "ede-norte", name: "EDE-Norte", short: "EDE-Norte" },
  { id: "ede-sur", name: "EDE-Sur", short: "EDE-Sur" },
  { id: "otra", name: "Otra institución (especificar)", short: "Otra" },
];
const getInstitution = (id) => INSTITUTIONS.find((i) => i.id === id) || INSTITUTIONS[INSTITUTIONS.length - 1];

const ZONES = [
  { id: "dn", name: "Distrito Nacional", top: "36%", left: "40%", size: 130, aytoId: "ayto-dn" },
  { id: "sdn", name: "Santo Domingo Norte", top: "6%", left: "34%", size: 118, aytoId: "ayto-sdn" },
  { id: "sdo", name: "Santo Domingo Oeste", top: "40%", left: "12%", size: 104, aytoId: "ayto-sdo" },
  { id: "sde", name: "Santo Domingo Este", top: "38%", left: "66%", size: 142, aytoId: "ayto-sde" },
  { id: "alc", name: "Los Alcarrizos", top: "50%", left: "-4%", size: 92, aytoId: "ayto-alc" },
  { id: "bch", name: "Boca Chica", top: "66%", left: "86%", size: 92, aytoId: "ayto-bch" },
  { id: "pbr", name: "Pedro Brand", top: "68%", left: "2%", size: 82, aytoId: "ayto-pbr" },
  { id: "sag", name: "San Antonio de Guerra", top: "74%", left: "48%", size: 88, aytoId: "ayto-sag" },
];
const getZone = (id) => ZONES.find((z) => z.id === id);

const NATIONAL_REGIONS = [
  { id: "cibao", name: "Región Norte (Cibao)", top: "4%", left: "26%", size: 150, active: false },
  { id: "sur", name: "Región Sur", top: "52%", left: "4%", size: 138, active: false },
  { id: "este-region", name: "Región Este", top: "40%", left: "70%", size: 148, active: false },
  { id: "sd", name: "Gran Santo Domingo", top: "66%", left: "40%", size: 128, active: true },
];

const CATEGORIES = [
  { id: "calles", label: "Calles y vías", Icon: Construction, badge: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
  { id: "alumbrado", label: "Alumbrado público", Icon: Lightbulb, badge: "bg-yellow-100 text-yellow-800", dot: "bg-yellow-500" },
  { id: "basura", label: "Basura y vertederos", Icon: Trash2, badge: "bg-amber-100 text-amber-800", dot: "bg-amber-600" },
  { id: "alcantarillado", label: "Alcantarillado", Icon: Droplet, badge: "bg-cyan-100 text-cyan-700", dot: "bg-cyan-600" },
  { id: "agua", label: "Falta de agua", Icon: Droplets, badge: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  { id: "ambiente", label: "Medio ambiente", Icon: Leaf, badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-600" },
  { id: "ocupacion", label: "Ocupación ilegal", Icon: AlertTriangle, badge: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
  { id: "otro", label: "Otro", Icon: HelpCircle, badge: "bg-slate-100 text-slate-700", dot: "bg-slate-500" },
];
const getCategory = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

const zoneToInstitution = (zoneId, categoryId) => {
  const z = getZone(zoneId);
  if (categoryId === "alcantarillado" || categoryId === "agua") return Math.random() > 0.5 ? "caasd" : "inapa";
  if (categoryId === "ambiente") return "medioambiente";
  return z ? z.aytoId : "otra";
};

const STATUS_META = {
  recibido: { label: "Recibido", badge: "bg-amber-100 text-amber-700 border border-amber-200", Icon: Clock },
  en_proceso: { label: "En proceso", badge: "bg-blue-100 text-blue-700 border border-blue-200", Icon: RefreshCw },
  resuelto: { label: "Resuelto", badge: "bg-emerald-100 text-emerald-700 border border-emerald-200", Icon: CheckCircle2 },
  cerrado: { label: "Cerrado", badge: "bg-slate-100 text-slate-600 border border-slate-200", Icon: Flag },
};
const STATUS_ORDER = ["recibido", "en_proceso", "resuelto", "cerrado"];

const PRIORITY_META = {
  baja: { label: "Baja", badge: "bg-slate-100 text-slate-600" },
  media: { label: "Media", badge: "bg-amber-100 text-amber-700" },
  alta: { label: "Alta", badge: "bg-orange-100 text-orange-700" },
  urgente: { label: "Urgente", badge: "bg-red-100 text-red-700" },
};

function getLevel(points) {
  if (points >= 600) return { tier: 4, label: "Guardián cívico", bg: "bg-purple-100", text: "text-purple-700", ring: "ring-purple-400", dot: "bg-purple-500", grad: "from-purple-600 to-fuchsia-500" };
  if (points >= 300) return { tier: 3, label: "Vecino experto", bg: "bg-blue-100", text: "text-blue-700", ring: "ring-blue-400", dot: "bg-blue-500", grad: "from-blue-600 to-teal-500" };
  if (points >= 100) return { tier: 2, label: "Colaborador activo", bg: "bg-teal-100", text: "text-teal-700", ring: "ring-teal-400", dot: "bg-teal-500", grad: "from-teal-600 to-emerald-500" };
  return { tier: 1, label: "Nuevo vecino", bg: "bg-slate-100", text: "text-slate-600", ring: "ring-slate-300", dot: "bg-slate-400", grad: "from-slate-400 to-slate-500" };
}

const MOCK_USERS = [
  { id: "u1", name: "Awilka Jerome", cedula: "402-1234567-8", phone: "809-555-0142", email: "awilka@correo.com", role: "ciudadano", points: 420, isPublic: true, seed: "Awilka" },
  { id: "u2", name: "Johaly Concepción", cedula: "402-7654321-0", phone: "829-555-0198", email: "johaly@correo.com", role: "ciudadano", points: 680, isPublic: true, seed: "Johaly" },
  { id: "u3", name: "Ramón Ortiz", cedula: "001-1122334-5", phone: "849-555-0110", email: "ramon@correo.com", role: "ciudadano", points: 140, isPublic: false, seed: "Ramon" },
  { id: "u4", name: "Carla Fernández", cedula: "031-9988776-1", phone: "809-555-0176", email: "carla@correo.com", role: "ciudadano", points: 60, isPublic: true, seed: "Carla" },
  { id: "u5", name: "Miguel Santos", cedula: "402-4455667-3", phone: "829-555-0155", email: "miguel@correo.com", role: "ciudadano", points: 260, isPublic: true, seed: "Miguel" },
  { id: "g1", name: "Yudelka Pérez", cedula: "402-1231231-1", phone: "809-555-0201", email: "yudelka.perez@adn.gob.do", role: "gestor", institutionId: "ayto-dn", seed: "Yudelka" },
  { id: "g2", name: "Franklin Reyes", cedula: "402-3213213-2", phone: "809-555-0233", email: "franklin.reyes@caasd.gob.do", role: "gestor", institutionId: "caasd", seed: "Franklin" },
  { id: "a1", name: "Huáscar Frías", cedula: "402-0000000-0", phone: "809-555-0100", email: "admin@tureporte.do", role: "admin", seed: "Huascar" },
];
const getUser = (id) => MOCK_USERS.find((u) => u.id === id);

const REPORT_SEEDS = [
  { desc: "Bache profundo en la Av. Independencia que ya ha dañado varios vehículos.", category: "calles", zone: "dn" },
  { desc: "Poste de luz apagado desde hace dos semanas en la calle Duarte, la zona queda muy oscura.", category: "alumbrado", zone: "sde" },
  { desc: "Acumulación de basura en el solar baldío junto al colmado, atrae insectos y mal olor.", category: "basura", zone: "sdn" },
  { desc: "Alcantarilla destapada representa un peligro serio para los peatones y motoristas.", category: "alcantarillado", zone: "sdo" },
  { desc: "Llevamos 5 días sin agua en el sector, varias familias no tienen cómo abastecerse.", category: "agua", zone: "alc" },
  { desc: "Vertido de aguas residuales está contaminando la cañada cercana al parque.", category: "ambiente", zone: "bch" },
  { desc: "Un colmado ha invadido la acera con mesas y sillas, obligando a peatones a caminar por la calle.", category: "ocupacion", zone: "dn" },
  { desc: "Semáforo dañado en un cruce peligroso cerca de la escuela primaria.", category: "calles", zone: "sde" },
  { desc: "Tapa de alcantarilla robada; ya hubo un motorista que casi cae dentro.", category: "alcantarillado", zone: "dn" },
  { desc: "Fuga de agua potable corriendo por la calle desde hace tres días sin atención.", category: "agua", zone: "sdn" },
  { desc: "Zona sin alumbrado genera inseguridad para quienes regresan de noche.", category: "alumbrado", zone: "sdo" },
  { desc: "Basura acumulada frente al parque infantil, riesgo para los niños que juegan ahí.", category: "basura", zone: "alc" },
  { desc: "La quema de basura a cielo abierto está afectando la respiración de varias familias.", category: "ambiente", zone: "pbr" },
  { desc: "Vendedores ambulantes ocupan el espacio público sin permiso, dificultando el paso.", category: "ocupacion", zone: "sag" },
  { desc: "Calle completamente inundada tras la lluvia; queda intransitable por horas.", category: "calles", zone: "bch" },
  { desc: "Cables eléctricos sueltos y a baja altura representan riesgo de incendio.", category: "otro", zone: "sde" },
  { desc: "Contenedor de basura desbordado desde hace más de una semana.", category: "basura", zone: "dn" },
  { desc: "Falta de presión de agua afecta a todo el residencial desde el fin de semana.", category: "agua", zone: "sdo" },
  { desc: "Árbol caído bloquea parcialmente la vía principal tras la tormenta.", category: "ambiente", zone: "alc" },
  { desc: "Parque comunitario con equipos dañados y vidrios rotos en el área de juegos.", category: "otro", zone: "sag" },
  { desc: "Calle sin señalización adecuada ha provocado varios accidentes menores.", category: "calles", zone: "sdn" },
  { desc: "Fuerte olor a gas cerca del mercado municipal, vecinos están preocupados.", category: "otro", zone: "dn" },
  { desc: "Cañada acumula desechos plásticos y genera criaderos de mosquitos.", category: "ambiente", zone: "sde" },
  { desc: "Bomba de agua comunitaria dañada, el sector completo se queda sin servicio.", category: "agua", zone: "pbr" },
];

function seededRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return () => {
    h = (Math.imul(1103515245, h) + 12345) | 0;
    return ((h >>> 0) % 1000) / 1000;
  };
}

function buildReports() {
  const rand = seededRandom("tureporte-mvp");
  const now = Date.now();
  const citizenIds = MOCK_USERS.filter((u) => u.role === "ciudadano").map((u) => u.id);
  return REPORT_SEEDS.map((seed, i) => {
    const statusRoll = rand();
    const status = statusRoll < 0.32 ? "recibido" : statusRoll < 0.6 ? "en_proceso" : statusRoll < 0.85 ? "resuelto" : "cerrado";
    const priorityRoll = rand();
    const priority = priorityRoll < 0.35 ? "media" : priorityRoll < 0.6 ? "alta" : priorityRoll < 0.78 ? "baja" : "urgente";
    const isAnonymous = rand() < 0.3;
    const authorId = citizenIds[Math.floor(rand() * citizenIds.length)];
    const photoCount = 1 + Math.floor(rand() * 4);
    const photos = Array.from({ length: photoCount }, (_, p) => `https://picsum.photos/seed/tureporte-${i}-${p}/640/480`);
    const daysAgo = Math.floor(rand() * 21);
    const institutionId = zoneToInstitution(seed.zone, seed.category);
    const likes = Math.floor(rand() * 48);
    const commentsCount = Math.floor(rand() * 6);
    const slaHours = priority === "urgente" ? 24 : priority === "alta" ? 72 : priority === "media" ? 120 : 168;
    const isDuplicate = i === 8 || i === 16;
    const satisfaction = status === "resuelto" && rand() > 0.4 ? 3 + Math.floor(rand() * 3) : null;
    return {
      id: `r${i + 1}`,
      ...seed,
      status,
      priority,
      isAnonymous,
      authorId,
      photos,
      createdAt: now - daysAgo * 86400000 - Math.floor(rand() * 86400000),
      likes,
      commentsCount,
      institutionId,
      slaHours,
      isDuplicate,
      duplicateOf: isDuplicate ? "r9" : null,
      satisfaction,
      distanceM: Math.floor(80 + rand() * 9000),
      timeline: [
        { at: now - daysAgo * 86400000, label: "Reporte creado", by: "Ciudadano" },
        ...(status !== "recibido" ? [{ at: now - Math.max(0, daysAgo - 1) * 86400000, label: `Asignado a ${getInstitution(institutionId).short}`, by: "Sistema de asignación" }] : []),
        ...(status === "resuelto" || status === "cerrado" ? [{ at: now - Math.max(0, daysAgo - 3) * 86400000, label: "Marcado como resuelto", by: getInstitution(institutionId).short }] : []),
      ],
    };
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
function slaRemaining(report) {
  const elapsedH = (Date.now() - report.createdAt) / 3600000;
  return Math.round(report.slaHours - elapsedH);
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
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${lvl.bg} ${lvl.text} ${size === "sm" ? "text-[11px]" : "text-xs"}`}>
      <Trophy size={size === "sm" ? 11 : 13} /> {lvl.label}
    </span>
  );
}

function StatusPill({ status }) {
  const meta = STATUS_META[status];
  const Icon = meta.Icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badge}`}>
      <Icon size={12} /> {meta.label}
    </span>
  );
}
function PriorityPill({ priority }) {
  const meta = PRIORITY_META[priority];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badge}`}>{meta.label}</span>;
}
function CategoryPill({ id }) {
  const cat = getCategory(id);
  const Icon = cat.Icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cat.badge}`}>
      <Icon size={12} /> {cat.label}
    </span>
  );
}
function StarRow({ value, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= value ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
      ))}
    </div>
  );
}
function ProgressBar({ value, colorClass = "bg-teal-500" }) {
  return (
    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
      <div className={`h-full ${colorClass} rounded-full transition-all`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
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
        {eyebrow && <p className="text-[11px] font-bold uppercase tracking-wider text-teal-600 mb-0.5">{eyebrow}</p>}
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
      <span className="tr-display font-bold text-slate-900 leading-none" style={{ fontSize: size * 0.5 }}>
        Tu<span className="text-teal-600">Reporte</span>
      </span>
    </div>
  );
}

/* ------------------------------- ZONE MAP -------------------------------- */

function densityStyle(count) {
  if (count === 0) return { bg: "bg-slate-100", text: "text-slate-400", border: "border-2 border-dashed border-slate-300" };
  if (count <= 2) return { bg: "bg-teal-100", text: "text-teal-800", border: "border border-teal-300" };
  if (count <= 4) return { bg: "bg-teal-300", text: "text-teal-950", border: "border border-teal-400" };
  if (count <= 6) return { bg: "bg-orange-400", text: "text-white", border: "border border-orange-500" };
  return { bg: "bg-red-500", text: "text-white", border: "border border-red-600" };
}

function hashOffset(id, mod) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
  return h % mod;
}

function ZoneMap({ reports, selectedZone, onSelectZone, height = 380, mode, onModeChange, institutionFilter }) {
  const filtered = institutionFilter ? reports.filter((r) => r.institutionId === institutionFilter) : reports;
  const counts = useMemo(() => {
    const c = {};
    ZONES.forEach((z) => (c[z.id] = 0));
    filtered.forEach((r) => { if (c[r.zone] !== undefined) c[r.zone]++; });
    return c;
  }, [filtered]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2 text-slate-700">
          <Layers size={16} className="text-teal-600" />
          <span className="text-sm font-semibold">Mapa de concentración de reportes</span>
        </div>
        {onModeChange && (
          <div className="flex rounded-full bg-slate-100 p-0.5 text-xs font-semibold">
            <button onClick={() => onModeChange("city")} className={`px-3 py-1 rounded-full transition ${mode === "city" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}>Gran Santo Domingo</button>
            <button onClick={() => onModeChange("national")} className={`px-3 py-1 rounded-full transition ${mode === "national" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}>Nivel nacional</button>
          </div>
        )}
      </div>

      {mode === "national" ? (
        <div className="relative bg-gradient-to-b from-sky-50 to-teal-50" style={{ height }}>
          {NATIONAL_REGIONS.map((r) => (
            <button
              key={r.id}
              onClick={() => r.active && onModeChange && onModeChange("city")}
              className={`absolute rounded-[40%] flex flex-col items-center justify-center text-center px-2 transition hover:scale-105 ${
                r.active ? "bg-teal-400 text-white shadow-lg" : "bg-slate-200 text-slate-500 border-2 border-dashed border-slate-300"
              }`}
              style={{ top: r.top, left: r.left, width: r.size, height: r.size * 0.75 }}
            >
              <span className="text-[11px] font-bold leading-tight">{r.name}</span>
              <span className="text-[10px] mt-0.5 opacity-90">{r.active ? `${filtered.length} reportes` : "Fase 2 · próximamente"}</span>
            </button>
          ))}
          <p className="absolute bottom-2 left-3 text-[10px] text-slate-400">Mapa esquemático ilustrativo · no a escala geográfica</p>
        </div>
      ) : (
        <div className="relative" style={{ height }}>
          <div className="absolute inset-0 bg-gradient-to-b from-sky-50 via-teal-50/60 to-white" />
          {ZONES.map((z) => {
            const count = counts[z.id] || 0;
            const style = densityStyle(count);
            const isSelected = selectedZone === z.id;
            const zoneReports = filtered.filter((r) => r.zone === z.id).slice(0, 8);
            return (
              <div
                key={z.id}
                className="absolute"
                style={{ top: z.top, left: z.left, width: z.size, height: z.size * 0.8 }}
              >
                <button
                  onClick={() => onSelectZone(isSelected ? null : z.id)}
                  className={`relative w-full h-full rounded-[38%] flex flex-col items-center justify-center transition-all hover:scale-105 ${style.bg} ${style.text} ${style.border} ${
                    isSelected ? "ring-4 ring-blue-500 ring-offset-2" : ""
                  }`}
                >
                  <span className="text-[11px] font-bold leading-tight px-1 text-center">{z.name}</span>
                  <span className="tr-mono text-lg font-bold leading-none mt-1">{count}</span>
                  <span className="text-[9px] opacity-80">reportes</span>
                  {zoneReports.map((r, idx) => (
                    <span
                      key={r.id}
                      className={`absolute w-2 h-2 rounded-full ${getCategory(r.category).dot} border border-white`}
                      style={{
                        top: `${15 + hashOffset(r.id, 60)}%`,
                        left: `${15 + hashOffset(r.id + "x", 60)}%`,
                      }}
                    />
                  ))}
                </button>
              </div>
            );
          })}
          <p className="absolute bottom-2 left-3 text-[10px] text-slate-400">Mapa esquemático por municipio · el tamaño de color indica densidad de reportes</p>
        </div>
      )}

      <div className="flex items-center gap-3 px-4 py-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex-wrap">
        <span className="font-semibold text-slate-600">Densidad:</span>
        <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-full bg-teal-100 border border-teal-300 inline-block" /> Baja</span>
        <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-full bg-teal-300 inline-block" /> Media</span>
        <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" /> Alta</span>
        <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Crítica</span>
      </div>
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
          <button onClick={onHome} className="inline-block hover:opacity-90 transition"><Logo size={40} /></button>
        ) : (
          <Logo size={40} />
        )}
        <p className="text-teal-100 text-sm mt-2 max-w-sm">Tu ciudad, tu voz, tu comunidad. Reporta incidencias y da seguimiento en tiempo real.</p>
      </div>
      <div className="flex-1 bg-slate-50 rounded-t-[2.5rem] px-5 pt-7 pb-10 md:px-10">
        <div className="max-w-md mx-auto">
          {totalSteps && (
            <div className="flex items-center gap-1.5 mb-6">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-teal-500" : "bg-slate-200"}`} />
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
      <span className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-teal-400 focus-within:border-teal-400">
        {Icon && <Icon size={16} className="text-slate-400 shrink-0" />}
        <input {...props} className="flex-1 outline-none text-sm text-slate-800 placeholder:text-slate-400 bg-transparent" />
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
      <h1 className="tr-display text-2xl font-bold text-slate-900 mb-1">Bienvenido de nuevo</h1>
      <p className="text-sm text-slate-500 mb-6">Ingresa a tu cuenta para reportar o gestionar incidencias.</p>

      <TextField label="Correo electrónico" icon={Mail} type="email" placeholder="nombre@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <label className="block mb-2">
        <span className="block text-xs font-semibold text-slate-600 mb-1.5">Contraseña</span>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-teal-400">
          <Lock size={16} className="text-slate-400 shrink-0" />
          <input type={showPw ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="flex-1 outline-none text-sm bg-transparent" />
          <button onClick={() => setShowPw((s) => !s)} type="button">{showPw ? <EyeOff size={16} className="text-slate-400" /> : <Eye size={16} className="text-slate-400" />}</button>
        </div>
      </label>
      <div className="text-right mb-5"><button className="text-xs font-semibold text-teal-700" onClick={() => showToast("Función de recuperación disponible en la versión completa")}>¿Olvidaste tu contraseña?</button></div>

      <button
        onClick={() => { showToast("Modo demostración: iniciando sesión con datos de ejemplo"); onLogin(getUser("u1")); }}
        className="w-full rounded-xl bg-blue-900 text-white font-semibold py-3 text-sm flex items-center justify-center gap-2 hover:bg-blue-800 transition mb-4"
      >
        Iniciar sesión <ArrowRight size={16} />
      </button>

      <div className="flex items-center gap-3 my-5">
        <div className="h-px flex-1 bg-slate-200" /><span className="text-[11px] text-slate-400 font-semibold">ACCESO RÁPIDO DE DEMOSTRACIÓN</span><div className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="grid grid-cols-3 gap-2 mb-6">
        <button onClick={() => onLogin(getUser("u1"))} className="rounded-xl border border-slate-200 bg-white py-3 px-1 flex flex-col items-center gap-1 hover:border-teal-400 hover:bg-teal-50 transition">
          <Users size={18} className="text-teal-600" /><span className="text-[11px] font-semibold text-slate-700">Ciudadano</span>
        </button>
        <button onClick={() => onLogin(getUser("g1"))} className="rounded-xl border border-slate-200 bg-white py-3 px-1 flex flex-col items-center gap-1 hover:border-teal-400 hover:bg-teal-50 transition">
          <ClipboardList size={18} className="text-blue-700" /><span className="text-[11px] font-semibold text-slate-700">Gestor</span>
        </button>
        <button onClick={() => onLogin(getUser("a1"))} className="rounded-xl border border-slate-200 bg-white py-3 px-1 flex flex-col items-center gap-1 hover:border-teal-400 hover:bg-teal-50 transition">
          <Shield size={18} className="text-slate-700" /><span className="text-[11px] font-semibold text-slate-700">Admin</span>
        </button>
      </div>

      <p className="text-center text-sm text-slate-500">
        ¿No tienes cuenta?{" "}
        <button onClick={onGoRegister} className="font-semibold text-teal-700">Crear cuenta ciudadana</button>
      </p>
    </AuthShell>
  );
}

function RegisterStep1({ onNext, onBack, initial, onHome }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const canContinue = form.name && form.cedula && form.phone && form.email && form.password && form.zone;

  return (
    <AuthShell step={1} totalSteps={2} onHome={onHome}>
      <button onClick={onBack} className="flex items-center gap-1 text-xs font-semibold text-slate-500 mb-4"><ArrowLeft size={14} /> Volver</button>
      <h1 className="tr-display text-2xl font-bold text-slate-900 mb-1">Crea tu cuenta</h1>
      <p className="text-sm text-slate-500 mb-6">Paso 1 de 2 — Tus datos básicos como ciudadano.</p>

      <TextField label="Nombre completo" icon={User} placeholder="Ej. Juan Pérez" value={form.name} onChange={set("name")} />
      <TextField label="Cédula de identidad" icon={CreditCard} placeholder="000-0000000-0" value={form.cedula} onChange={set("cedula")} />
      <TextField label="Teléfono" icon={Phone} placeholder="809-000-0000" value={form.phone} onChange={set("phone")} />
      <TextField label="Correo electrónico" icon={Mail} type="email" placeholder="nombre@correo.com" value={form.email} onChange={set("email")} />
      <TextField label="Contraseña" icon={Lock} type="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={set("password")} />

      <label className="block mb-5">
        <span className="block text-xs font-semibold text-slate-600 mb-1.5">Municipio de residencia</span>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
          <MapPin size={16} className="text-slate-400" />
          <select value={form.zone} onChange={set("zone")} className="flex-1 outline-none text-sm bg-transparent text-slate-800">
            <option value="">Selecciona tu municipio</option>
            {ZONES.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
        </div>
      </label>

      <label className="flex items-start gap-2 mb-6 text-xs text-slate-500">
        <input type="checkbox" checked={form.terms} onChange={(e) => setForm((f) => ({ ...f, terms: e.target.checked }))} className="mt-0.5" />
        Acepto los términos de uso y el tratamiento de mis datos personales conforme a la normativa dominicana de protección de datos.
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

const OCR_STEPS = ["Detectando bordes del documento", "Extrayendo texto de la cédula", "Verificando datos con el formulario", "Validación completada"];

function RegisterOcrStep({ form, onBack, onDone, showToast, onHome }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | processing | success | error
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
      <button onClick={onBack} className="flex items-center gap-1 text-xs font-semibold text-slate-500 mb-4"><ArrowLeft size={14} /> Volver</button>
      <h1 className="tr-display text-2xl font-bold text-slate-900 mb-1">Verifica tu identidad</h1>
      <p className="text-sm text-slate-500 mb-6">Paso 2 de 2 — Sube una foto de tu cédula. Nuestro sistema de OCR validará automáticamente tus datos.</p>

      {status !== "success" && (
        <div
          onClick={() => inputRef.current && inputRef.current.click()}
          className="rounded-2xl border-2 border-dashed border-slate-300 bg-white hover:border-teal-400 hover:bg-teal-50/40 transition cursor-pointer flex flex-col items-center justify-center py-10 px-4 mb-4"
        >
          {file ? (
            <img src={file} alt="Cédula" className="max-h-40 rounded-lg shadow mb-3 object-contain" />
          ) : (
            <Camera size={32} className="text-teal-500 mb-3" />
          )}
          <p className="text-sm font-semibold text-slate-700">{file ? "Cambiar foto" : "Toca para subir la foto de tu cédula"}</p>
          <p className="text-xs text-slate-400 mt-1">Formato JPG o PNG · Frente del documento</p>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files && e.target.files[0])} />
        </div>
      )}

      {status === "idle" && file && (
        <button onClick={runOcr} className="w-full rounded-xl bg-teal-600 text-white font-semibold py-3 text-sm flex items-center justify-center gap-2 hover:bg-teal-700 transition mb-4">
          <ScanLine size={16} /> Validar cédula con OCR
        </button>
      )}

      {status === "processing" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Loader2 size={18} className="text-teal-600 animate-spin" />
            <span className="text-sm font-semibold text-slate-700">Analizando documento…</span>
          </div>
          <div className="space-y-2.5">
            {OCR_STEPS.slice(0, -1).map((s, i) => (
              <div key={s} className="flex items-center gap-2 text-sm">
                {i < stepIdx ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> : i === stepIdx ? <Loader2 size={16} className="text-teal-500 animate-spin shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200 shrink-0" />}
                <span className={i <= stepIdx ? "text-slate-700" : "text-slate-300"}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {status === "success" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 mb-4 tr-fade-up">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center"><Check size={18} className="text-white" /></div>
            <div>
              <p className="text-sm font-bold text-emerald-800">Cédula validada correctamente</p>
              <p className="text-[11px] text-emerald-600">Los datos coinciden con el formulario ingresado</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 text-xs space-y-1.5 text-slate-600">
            <div className="flex justify-between"><span>Nombre detectado</span><span className="font-semibold text-slate-800">{form.name}</span></div>
            <div className="flex justify-between"><span>Cédula detectada</span><span className="font-semibold text-slate-800 tr-mono">{form.cedula}</span></div>
            <div className="flex justify-between"><span>Estado</span><span className="inline-flex items-center gap-1 font-semibold text-emerald-600"><BadgeCheck size={12} /> Verificado</span></div>
          </div>
        </div>
      )}

      <button
        disabled={status !== "success"}
        onClick={() => { showToast("Cuenta creada y verificada. ¡Bienvenido a TuReporte!"); onDone(); }}
        className="w-full rounded-xl bg-blue-900 disabled:bg-slate-300 text-white font-semibold py-3 text-sm flex items-center justify-center gap-2 hover:bg-blue-800 transition"
      >
        Finalizar registro <ArrowRight size={16} />
      </button>
      <p className="text-[10px] text-slate-400 text-center mt-3">Simulación de validación OCR para fines de demostración del MVP. En producción, este paso se procesa en el backend.</p>
    </AuthShell>
  );
}

/* ============================================================================
   SHELL / NAVIGATION
============================================================================ */

const NAV_BY_ROLE = {
  ciudadano: [
    { id: "feed", label: "Inicio", Icon: Home },
    { id: "map", label: "Mapa", Icon: MapIcon },
    { id: "compose", label: "Reportar", Icon: PlusCircle, primary: true },
    { id: "stats", label: "Estadísticas", Icon: BarChart3 },
    { id: "profile", label: "Perfil", Icon: User },
  ],
  gestor: [
    { id: "dashboard", label: "Bandeja", Icon: ClipboardList },
    { id: "stats", label: "Estadísticas", Icon: BarChart3 },
    { id: "map", label: "Mapa", Icon: MapIcon },
    { id: "profile", label: "Perfil", Icon: User },
  ],
  admin: [
    { id: "dashboard", label: "KPIs", Icon: BarChart3 },
    { id: "map", label: "Mapa", Icon: MapIcon },
    { id: "users", label: "Usuarios", Icon: Users },
    { id: "profile", label: "Perfil", Icon: User },
  ],
};

function AppShell({ user, view, setView, onLogout, children }) {
  const nav = NAV_BY_ROLE[user.role];
  const roleLabel = user.role === "ciudadano" ? "Ciudadano" : user.role === "gestor" ? "Gestor de reportes" : "Administrador";
  return (
    <div className="min-h-full bg-slate-50 flex">
      <aside className="hidden md:flex flex-col w-60 border-r border-slate-200 bg-white px-4 py-6 shrink-0">
        <Logo size={32} />
        <div className="mt-8 flex-1 space-y-1">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                view === n.id ? "bg-teal-50 text-teal-700" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <n.Icon size={18} /> {n.label}
            </button>
          ))}
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center gap-2.5 mb-3">
          <Avatar seed={user.seed} size={36} />
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
            <p className="text-[10px] text-slate-400">{roleLabel}</p>
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-red-500 px-3"><LogOut size={14} /> Cerrar sesión</button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <Logo size={28} />
          <div className="flex items-center gap-3">
            <Bell size={19} className="text-slate-500" />
            <button onClick={() => setView("profile")}><Avatar seed={user.seed} size={30} /></button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto tr-scroll pb-24 md:pb-8">{children}</main>
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
              <n.Icon size={20} className={view === n.id ? "text-teal-600" : "text-slate-400"} />
            )}
            <span className={`text-[10px] font-semibold ${view === n.id ? "text-teal-700" : "text-slate-400"}`}>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ============================================================================
   CITIZEN — FEED
============================================================================ */

function AuthorLine({ report, users, onOpenProfile }) {
  if (report.isAnonymous) {
    return (
      <div className="flex items-center gap-2.5">
        <Avatar anonymous size={38} />
        <div>
          <p className="text-sm font-bold text-slate-800">Vecino anónimo</p>
          <p className="text-[11px] text-slate-400">{timeAgo(report.createdAt)} · {formatDistance(report.distanceM)}</p>
        </div>
      </div>
    );
  }
  const author = getUser(report.authorId);
  return (
    <div className="flex items-center gap-2.5">
      <button onClick={() => onOpenProfile(author)}><Avatar seed={author.seed} size={38} ring="ring-teal-200" /></button>
      <div>
        <button onClick={() => onOpenProfile(author)} className="text-sm font-bold text-slate-800 hover:text-teal-700">{author.name}</button>
        <p className="text-[11px] text-slate-400">{timeAgo(report.createdAt)} · {formatDistance(report.distanceM)}</p>
      </div>
    </div>
  );
}

function PhotoStrip({ photos }) {
  const [idx, setIdx] = useState(0);
  return (
    <div className="relative">
      <img src={photos[idx]} alt="Evidencia del reporte" className="w-full h-64 object-cover" />
      {photos.length > 1 && (
        <>
          <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">{idx + 1}/{photos.length}</div>
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
            {photos.map((_, i) => <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === idx ? "bg-white" : "bg-white/40"}`} />)}
          </div>
          <button onClick={() => setIdx((i) => (i - 1 + photos.length) % photos.length)} className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1"><ChevronLeft size={16} /></button>
          <button onClick={() => setIdx((i) => (i + 1) % photos.length)} className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1"><ChevronRight size={16} /></button>
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
        <button onClick={() => onOpenDetail(report)}><ChevronRight size={18} className="text-slate-300" /></button>
      </div>
      <button onClick={() => onOpenDetail(report)} className="block w-full"><PhotoStrip photos={report.photos} /></button>
      <div className="px-4 pt-3 flex items-center gap-2 flex-wrap">
        <CategoryPill id={report.category} />
        <StatusPill status={report.status} />
        {report.isDuplicate && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600"><Copy size={12} /> posible duplicado</span>}
      </div>
      <p className="px-4 pt-2 text-sm text-slate-700 leading-relaxed">{report.desc}</p>
      <div className="px-4 pt-2 pb-1 flex items-center gap-1.5 text-[11px] text-slate-400">
        <MapPin size={12} /> {getZone(report.zone).name} · asignado a {getInstitution(report.institutionId).short}
      </div>
      <div className="flex items-center gap-4 px-4 py-3 border-t border-slate-50 mt-2">
        <button onClick={() => onLike(report.id)} className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
          <Heart size={18} className={liked ? "fill-red-500 text-red-500" : ""} /> {report.likes + (liked ? 1 : 0)}
        </button>
        <button onClick={() => onOpenDetail(report)} className="flex items-center gap-1.5 text-sm font-semibold text-slate-500"><MessageCircle size={18} /> {report.commentsCount}</button>
        <span className="ml-auto text-[11px] text-slate-300">#{report.id}</span>
      </div>
    </article>
  );
}

function TopColaboradores({ users, onOpenProfile }) {
  const ranked = [...MOCK_USERS].filter((u) => u.role === "ciudadano").sort((a, b) => b.points - a.points);
  return (
    <div className="flex gap-4 overflow-x-auto tr-scroll px-4 pb-1 -mx-4 mb-2">
      {ranked.map((u, i) => (
        <button key={u.id} onClick={() => onOpenProfile(u)} className="flex flex-col items-center gap-1 shrink-0 w-16">
          <div className="relative">
            <Avatar seed={u.seed} size={54} ring={getLevel(u.points).ring} />
            {i === 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 rounded-full w-5 h-5 flex items-center justify-center text-white text-[10px] font-bold shadow">1</span>}
          </div>
          <span className="text-[11px] font-semibold text-slate-600 truncate w-full text-center">{u.name.split(" ")[0]}</span>
        </button>
      ))}
    </div>
  );
}

function CitizenFeed({ reports, likedIds, onLike, onOpenProfile, onOpenDetail, currentUser }) {
  const [filter, setFilter] = useState("cerca");
  const list = useMemo(() => {
    const sorted = [...reports].sort((a, b) => (filter === "cerca" ? a.distanceM - b.distanceM : b.createdAt - a.createdAt));
    return sorted;
  }, [reports, filter]);

  return (
    <div className="max-w-xl mx-auto px-4 pt-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-slate-400">Hola,</p>
          <h1 className="tr-display text-xl font-bold text-slate-900">{currentUser.name.split(" ")[0]} 👋</h1>
        </div>
        <LevelBadge points={currentUser.points} />
      </div>

      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Vecinos que más colaboran</p>
      <TopColaboradores onOpenProfile={onOpenProfile} />

      <div className="flex rounded-full bg-slate-100 p-1 text-xs font-semibold w-fit mb-4">
        {[["cerca", "Cerca de ti"], ["recientes", "Más recientes"]].map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)} className={`px-3.5 py-1.5 rounded-full transition ${filter === id ? "bg-white shadow text-slate-900" : "text-slate-500"}`}>{label}</button>
        ))}
      </div>

      <div className="space-y-4">
        {list.map((r) => (
          <FeedCard key={r.id} report={r} liked={likedIds.has(r.id)} onLike={onLike} onOpenProfile={onOpenProfile} onOpenDetail={onOpenDetail} />
        ))}
      </div>
    </div>
  );
}

/* ---------------------------- REPORT COMPOSER ----------------------------- */

function CitizenComposer({ onPublish, showToast }) {
  const [category, setCategory] = useState("");
  const [desc, setDesc] = useState("");
  const [zone, setZone] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [photos, setPhotos] = useState([]);
  const inputRef = useRef(null);

  const addPhotos = (files) => {
    const arr = Array.from(files || []).slice(0, 5 - photos.length);
    const urls = arr.map((f) => URL.createObjectURL(f));
    setPhotos((p) => [...p, ...urls].slice(0, 5));
  };
  const removePhoto = (i) => setPhotos((p) => p.filter((_, idx) => idx !== i));
  const canPublish = category && desc.trim().length > 8 && zone && photos.length > 0;

  const submit = () => {
    onPublish({ category, desc, zone, anonymous, photos });
    setCategory(""); setDesc(""); setZone(""); setAnonymous(false); setPhotos([]);
    showToast("Reporte publicado y enrutado a la institución correspondiente");
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-4 pb-6">
      <SectionHeading eyebrow="Nuevo reporte" title="Cuéntanos qué está pasando" />

      <p className="text-xs font-semibold text-slate-600 mb-2">Categoría</p>
      <div className="grid grid-cols-4 gap-2 mb-5">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`flex flex-col items-center gap-1 rounded-xl border py-3 px-1 transition ${category === c.id ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
          >
            <c.Icon size={18} className={category === c.id ? "text-teal-600" : "text-slate-400"} />
            <span className="text-[10px] font-semibold text-slate-600 text-center leading-tight">{c.label}</span>
          </button>
        ))}
      </div>

      <label className="block mb-4">
        <span className="block text-xs font-semibold text-slate-600 mb-1.5">Descripción del problema</span>
        <textarea rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Describe qué observas, desde cuándo y por qué afecta a la comunidad…" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
      </label>

      <label className="block mb-4">
        <span className="block text-xs font-semibold text-slate-600 mb-1.5">Ubicación (municipio)</span>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
          <MapPin size={16} className="text-slate-400" />
          <select value={zone} onChange={(e) => setZone(e.target.value)} className="flex-1 outline-none text-sm bg-transparent text-slate-800">
            <option value="">Selecciona el municipio o sector</option>
            {ZONES.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">En producción se captura por GPS automáticamente.</p>
      </label>

      <p className="text-xs font-semibold text-slate-600 mb-2">Fotos de evidencia (máximo 5)</p>
      <div className="grid grid-cols-3 gap-2 mb-2">
        {photos.map((p, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
            <img src={p} alt="" className="w-full h-full object-cover" />
            <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-black/60 rounded-full p-1"><X size={12} className="text-white" /></button>
          </div>
        ))}
        {photos.length < 5 && (
          <button onClick={() => inputRef.current && inputRef.current.click()} className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-teal-400 hover:text-teal-500">
            <ImageIcon size={20} /><span className="text-[10px] font-semibold">Agregar</span>
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
      </div>
      <p className="text-[10px] text-slate-400 mb-5">{photos.length}/5 fotos agregadas</p>

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 mb-6">
        <div>
          <p className="text-sm font-semibold text-slate-700">Publicar como anónimo</p>
          <p className="text-[11px] text-slate-400">Tu nombre no será visible para otros usuarios</p>
        </div>
        <button onClick={() => setAnonymous((a) => !a)} className={`w-11 h-6 rounded-full transition relative shrink-0 ${anonymous ? "bg-teal-500" : "bg-slate-200"}`}>
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${anonymous ? "left-5" : "left-0.5"}`} />
        </button>
      </div>

      <button disabled={!canPublish} onClick={submit} className="w-full rounded-xl bg-blue-900 disabled:bg-slate-300 text-white font-semibold py-3.5 text-sm flex items-center justify-center gap-2 hover:bg-blue-800 transition">
        Publicar reporte <Send size={16} />
      </button>
    </div>
  );
}

/* ------------------------------ CITIZEN MAP -------------------------------- */

function CitizenMap({ reports }) {
  const [zone, setZone] = useState(null);
  const filtered = zone ? reports.filter((r) => r.zone === zone) : reports;
  return (
    <div className="max-w-xl mx-auto px-4 pt-4 pb-6">
      <SectionHeading eyebrow="Mapa comunitario" title="¿Dónde están los reportes?" />
      <ZoneMap reports={reports} selectedZone={zone} onSelectZone={setZone} height={340} />
      {zone && (
        <div className="mt-4">
          <p className="text-xs font-bold text-slate-500 mb-2">{getZone(zone).name} · {filtered.length} reportes</p>
          <div className="space-y-2">
            {filtered.slice(0, 6).map((r) => (
              <div key={r.id} className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-2.5">
                <img src={r.photos[0]} className="w-12 h-12 rounded-lg object-cover shrink-0" alt="" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-700 truncate">{r.desc}</p>
                  <div className="flex items-center gap-1.5 mt-1"><CategoryPill id={r.category} /><StatusPill status={r.status} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- PROFILE ---------------------------------- */

function ProfileModal({ author, reports, onClose }) {
  if (!author) return null;
  const authorReports = reports.filter((r) => r.authorId === author.id && !r.isAnonymous);
  const level = getLevel(author.points);
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-md max-h-[85vh] overflow-y-auto tr-scroll tr-fade-up">
        <div className="p-5 text-center border-b border-slate-100">
          <Avatar seed={author.seed} size={72} ring={level.ring} />
          <h3 className="tr-display text-lg font-bold text-slate-900 mt-2">{author.name}</h3>
          <div className="flex justify-center mt-1"><LevelBadge points={author.points} size="md" /></div>
        </div>
        {author.isPublic ? (
          <div className="p-5">
            <div className="grid grid-cols-3 gap-2 mb-5">
              <div className="text-center rounded-xl bg-slate-50 py-3"><p className="tr-mono text-lg font-bold text-slate-800">{authorReports.length}</p><p className="text-[10px] text-slate-400">Reportes</p></div>
              <div className="text-center rounded-xl bg-slate-50 py-3"><p className="tr-mono text-lg font-bold text-slate-800">{authorReports.filter((r) => r.status === "resuelto").length}</p><p className="text-[10px] text-slate-400">Resueltos</p></div>
              <div className="text-center rounded-xl bg-slate-50 py-3"><p className="tr-mono text-lg font-bold text-slate-800">{author.points}</p><p className="text-[10px] text-slate-400">Puntos</p></div>
            </div>
            <p className="text-xs font-bold text-slate-500 mb-2">Reportes publicados</p>
            <div className="grid grid-cols-3 gap-1.5">
              {authorReports.slice(0, 9).map((r) => (
                <img key={r.id} src={r.photos[0]} className="aspect-square object-cover rounded-lg" alt="" />
              ))}
              {authorReports.length === 0 && <p className="col-span-3 text-xs text-slate-400 py-6 text-center">Aún no ha publicado reportes visibles.</p>}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <Lock size={28} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">Este perfil es privado</p>
            <p className="text-xs text-slate-400 mt-1">Solo puedes ver los reportes que este vecino decidió publicar de forma no anónima.</p>
          </div>
        )}
        <button onClick={onClose} className="w-full py-3 text-sm font-semibold text-slate-500 border-t border-slate-100">Cerrar</button>
      </div>
    </div>
  );
}

function CitizenProfile({ user, reports, onTogglePublic, onLogout, onGoStats }) {
  const mine = reports.filter((r) => r.authorId === user.id);
  const isCitizen = user.role === "ciudadano";
  const level = getLevel(user.points || 0);
  const floors = [0, 100, 300, 600];
  const nextThreshold = level.tier === 4 ? user.points : floors[level.tier];
  const floor = floors[level.tier - 1];
  const progress = level.tier === 4 ? 100 : Math.round(((user.points - floor) / (nextThreshold - floor)) * 100);

  const badges = [
    { id: "b1", label: "Primer reporte", got: mine.length >= 1, Icon: Sparkles },
    { id: "b2", label: "5 reportes", got: mine.length >= 5, Icon: ListChecks },
    { id: "b3", label: "Colaborador constante", got: (user.points || 0) >= 200, Icon: TrendingUp },
    { id: "b4", label: "Guardián del sector", got: (user.points || 0) >= 300, Icon: ShieldCheck },
  ];

  return (
    <div className="max-w-xl mx-auto px-4 pt-4 pb-6">
      <div className={`rounded-2xl bg-gradient-to-br ${level.grad} p-5 text-white mb-4 relative overflow-hidden`}>
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -right-2 bottom-2 w-16 h-16 rounded-full bg-white/10" />
        <div className="flex items-center gap-3 relative">
          <Avatar seed={user.seed} size={58} ring="ring-white/50" />
          <div className="min-w-0">
            <h2 className="tr-display font-bold text-lg truncate">{user.name}</h2>
            {isCitizen ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold mt-1"><Trophy size={11} /> {level.label}</span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold mt-1">{user.role === "gestor" ? "Gestor institucional" : "Administrador"}</span>
            )}
          </div>
        </div>
        {isCitizen && (
          <div className="mt-4 relative">
            <div className="flex justify-between text-[11px] font-semibold mb-1">
              <span>{user.points || 0} pts</span>
              <span className="text-white/70">{level.tier === 4 ? "Nivel máximo" : `${nextThreshold} pts para subir`}</span>
            </div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${Math.max(6, progress)}%` }} />
            </div>
          </div>
        )}
      </div>

      {isCitizen && onGoStats && (
        <button onClick={onGoStats} className="w-full flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 mb-4 hover:bg-teal-100 transition">
          <span className="flex items-center gap-2 text-sm font-semibold text-teal-700"><BarChart3 size={16} /> Ver mis estadísticas completas</span>
          <ChevronRight size={16} className="text-teal-500" />
        </button>
      )}

      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="text-center rounded-xl bg-white border border-slate-200 py-3"><p className="tr-mono text-lg font-bold text-slate-800">{mine.length}</p><p className="text-[10px] text-slate-400">Mis reportes</p></div>
        <div className="text-center rounded-xl bg-white border border-slate-200 py-3"><p className="tr-mono text-lg font-bold text-emerald-600">{mine.filter((r) => r.status === "resuelto").length}</p><p className="text-[10px] text-slate-400">Resueltos</p></div>
        <div className="text-center rounded-xl bg-white border border-slate-200 py-3"><p className="tr-mono text-lg font-bold text-amber-600">{mine.filter((r) => r.status !== "resuelto" && r.status !== "cerrado").length}</p><p className="text-[10px] text-slate-400">En curso</p></div>
      </div>

      {isCitizen ? (
        <>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 mb-5">
            <div>
              <p className="text-sm font-semibold text-slate-700">Perfil público</p>
              <p className="text-[11px] text-slate-400">Otros vecinos podrán ver tus reportes no anónimos y tus logros</p>
            </div>
            <button onClick={onTogglePublic} className={`w-11 h-6 rounded-full transition relative shrink-0 ${user.isPublic ? "bg-teal-500" : "bg-slate-200"}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${user.isPublic ? "left-5" : "left-0.5"}`} />
            </button>
          </div>

          <p className="text-xs font-bold text-slate-500 mb-2">Logros</p>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {badges.map((b) => (
              <div key={b.id} className={`rounded-xl border p-3 flex items-center gap-2 ${b.got ? "border-teal-200 bg-teal-50" : "border-slate-200 bg-slate-50 opacity-60"}`}>
                <b.Icon size={18} className={b.got ? "text-teal-600" : "text-slate-400"} />
                <span className="text-xs font-semibold text-slate-700">{b.label}</span>
              </div>
            ))}
          </div>

          <p className="text-xs font-bold text-slate-500 mb-2">Mis reportes</p>
          <div className="space-y-2 mb-6">
            {mine.map((r) => (
              <div key={r.id} className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-2.5">
                <img src={r.photos[0]} className="w-12 h-12 rounded-lg object-cover shrink-0" alt="" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-700 truncate">{r.desc}</p>
                  <div className="flex items-center gap-1.5 mt-1"><StatusPill status={r.status} />{r.satisfaction && <StarRow value={r.satisfaction} size={11} />}</div>
                </div>
              </div>
            ))}
            {mine.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Aún no has creado reportes.</p>}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-4 mb-6">
          <p className="text-xs font-bold text-slate-500 mb-3">Datos de la cuenta</p>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between"><span className="text-slate-400 flex items-center gap-1.5"><Mail size={12} /> Correo</span><span className="font-semibold text-slate-700">{user.email}</span></div>
            <div className="flex justify-between"><span className="text-slate-400 flex items-center gap-1.5"><Phone size={12} /> Teléfono</span><span className="font-semibold text-slate-700">{user.phone}</span></div>
            {user.role === "gestor" && (
              <div className="flex justify-between"><span className="text-slate-400 flex items-center gap-1.5"><Building2 size={12} /> Institución</span><span className="font-semibold text-slate-700 text-right">{getInstitution(user.institutionId).name}</span></div>
            )}
            <div className="flex justify-between"><span className="text-slate-400 flex items-center gap-1.5"><Shield size={12} /> Rol</span><span className="font-semibold text-slate-700">{user.role === "gestor" ? "Gestor institucional" : "Administrador"}</span></div>
          </div>
        </div>
      )}

      <button onClick={onLogout} className="md:hidden w-full flex items-center justify-center gap-2 text-sm font-semibold text-red-500 border border-red-100 bg-red-50 rounded-xl py-3"><LogOut size={16} /> Cerrar sesión</button>
    </div>
  );
}

/* ============================================================================
   CITIZEN — ESTADÍSTICAS
============================================================================ */

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
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${toneMap[tone]}`}><Icon size={17} /></span>
        {trend != null && (
          <span className={`flex items-center gap-0.5 text-[11px] font-bold ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{Math.abs(trend)}%
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
    return { name: `S-${weekIdx}`, cantidad: items.filter((r) => r.createdAt >= from && r.createdAt < to).length };
  });
}

function CitizenStats({ user, reports, users }) {
  const mine = reports.filter((r) => r.authorId === user.id);
  const resolved = mine.filter((r) => r.status === "resuelto" || r.status === "cerrado").length;
  const resolutionRate = mine.length ? Math.round((resolved / mine.length) * 100) : 0;
  const totalLikes = mine.reduce((a, r) => a + (r.likes || 0), 0);
  const totalComments = mine.reduce((a, r) => a + (r.commentsCount || 0), 0);

  const byCategory = CATEGORIES.map((c) => ({ name: c.label, value: mine.filter((r) => r.category === c.id).length })).filter((d) => d.value > 0);
  const byStatus = STATUS_ORDER.map((s) => ({ name: STATUS_META[s].label, value: mine.filter((r) => r.status === s).length }));
  const trend = weeklyTrendOf(mine);

  const citizens = [...users].filter((u) => u.role === "ciudadano").sort((a, b) => b.points - a.points);
  const myRank = citizens.findIndex((u) => u.id === user.id) + 1;

  const cityTotal = reports.length;
  const cityShare = cityTotal ? Math.round((mine.length / cityTotal) * 100) : 0;

  const avgSatisfaction = (() => {
    const rated = mine.filter((r) => r.satisfaction);
    return rated.length ? (rated.reduce((a, r) => a + r.satisfaction, 0) / rated.length).toFixed(1) : "—";
  })();

  return (
    <div className="max-w-3xl mx-auto px-4 pt-4 pb-8">
      <SectionHeading eyebrow="Tu impacto comunitario" title="Mis estadísticas" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Reportes creados" value={mine.length} Icon={FileText} tone="blue" sub={`Puesto #${myRank || "—"} en el ranking`} />
        <StatCard label="Tasa de resolución" value={`${resolutionRate}%`} Icon={CheckCircle2} tone="teal" sub={`${resolved} de ${mine.length} resueltos`} />
        <StatCard label="Puntos acumulados" value={user.points || 0} Icon={Trophy} tone="amber" sub={getLevel(user.points || 0).label} />
        <StatCard label="Satisfacción promedio" value={avgSatisfaction} Icon={Star} tone="purple" sub="De tus reportes resueltos" />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-700 mb-3">Mis reportes por categoría</p>
          {byCategory.length > 0 ? (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {byCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Tooltip wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-center text-xs text-slate-400 py-16">Aún no tienes reportes.</p>}
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-700 mb-3">Estado de mis reportes</p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {byStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4 md:col-span-2">
          <p className="text-sm font-bold text-slate-700 mb-3">Mi actividad — últimas 8 semanas</p>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="cantidad" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-4 mb-6">
        <p className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-1.5"><Globe size={14} className="text-teal-600" /> Tu aporte a la comunidad</p>
        <p className="text-[11px] text-slate-400 mb-3">Porcentaje de todos los reportes de la plataforma que provienen de ti.</p>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex-1"><ProgressBar value={cityShare} colorClass="bg-teal-500" /></div>
          <span className="tr-mono text-sm font-bold text-teal-700 w-12 text-right">{cityShare}%</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div><p className="tr-mono text-lg font-bold text-slate-800">{totalLikes}</p><p className="text-[10px] text-slate-400">Likes recibidos</p></div>
          <div><p className="tr-mono text-lg font-bold text-slate-800">{totalComments}</p><p className="text-[10px] text-slate-400">Comentarios</p></div>
          <div><p className="tr-mono text-lg font-bold text-slate-800">{cityTotal}</p><p className="text-[10px] text-slate-400">Reportes en la ciudad</p></div>
        </div>
      </div>

      <p className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5"><Medal size={14} /> Ranking de vecinos colaboradores</p>
      <div className="rounded-2xl bg-white border border-slate-200 divide-y divide-slate-100 mb-4">
        {citizens.slice(0, 5).map((u, i) => (
          <div key={u.id} className={`flex items-center gap-3 px-4 py-2.5 ${u.id === user.id ? "bg-teal-50" : ""}`}>
            <span className={`tr-mono text-xs font-bold w-5 ${i === 0 ? "text-amber-500" : "text-slate-400"}`}>{i + 1}</span>
            <Avatar seed={u.seed} size={30} />
            <span className="text-xs font-semibold text-slate-700 flex-1 truncate">{u.name}{u.id === user.id ? " (tú)" : ""}</span>
            <span className="tr-mono text-xs font-bold text-teal-700">{u.points} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------- REPORT DETAIL SHEET -------------------------- */

function ReportDetailModal({ report, comments, onAddComment, onClose, onOpenProfile, liked, onLike, canManage, onUpdate, allowInstitutionChange }) {
  const [text, setText] = useState("");
  if (!report) return null;
  const author = report.isAnonymous ? null : getUser(report.authorId);
  const remaining = slaRemaining(report);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center">
      <div className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-lg max-h-[92vh] overflow-y-auto tr-scroll tr-fade-up">
        <div className="sticky top-0 bg-white/95 backdrop-blur flex items-center justify-between px-4 py-3 border-b border-slate-100 z-10">
          <span className="text-sm font-bold text-slate-800">Reporte #{report.id}</span>
          <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>

        <PhotoStrip photos={report.photos} />

        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            {report.isAnonymous ? (
              <div className="flex items-center gap-2"><Avatar anonymous size={34} /><span className="text-sm font-bold text-slate-800">Vecino anónimo</span></div>
            ) : (
              <button onClick={() => onOpenProfile(author)} className="flex items-center gap-2"><Avatar seed={author.seed} size={34} /><span className="text-sm font-bold text-slate-800">{author.name}</span></button>
            )}
            <span className="text-[11px] text-slate-400">{timeAgo(report.createdAt)}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            <CategoryPill id={report.category} /><StatusPill status={report.status} /><PriorityPill priority={report.priority} />
            {report.isDuplicate && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-700"><Copy size={12} /> Posible duplicado</span>}
          </div>

          <p className="text-sm text-slate-700 leading-relaxed mb-3">{report.desc}</p>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 mb-3 text-xs text-slate-600 space-y-1.5">
            <div className="flex justify-between"><span className="flex items-center gap-1"><MapPin size={12} /> Ubicación</span><span className="font-semibold text-slate-800">{getZone(report.zone).name}</span></div>
            <div className="flex justify-between"><span className="flex items-center gap-1"><Building2 size={12} /> Institución asignada</span><span className="font-semibold text-slate-800">{getInstitution(report.institutionId).short}</span></div>
            <div className="flex justify-between"><span className="flex items-center gap-1"><TimerReset size={12} /> Tiempo de respuesta (SLA)</span><span className={`font-semibold ${remaining < 0 ? "text-red-600" : remaining < 24 ? "text-orange-600" : "text-slate-800"}`}>{remaining < 0 ? `Vencido hace ${Math.abs(remaining)}h` : `${remaining}h restantes`}</span></div>
            {report.satisfaction && <div className="flex justify-between items-center"><span>Calificación ciudadana</span><StarRow value={report.satisfaction} /></div>}
          </div>

          <div className="mb-4">
            <p className="text-xs font-bold text-slate-500 mb-2">Línea de tiempo</p>
            <div className="space-y-2">
              {report.timeline.map((t, i) => (
                <div key={i} className="flex gap-2 text-xs">
                  <div className="flex flex-col items-center pt-0.5">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    {i < report.timeline.length - 1 && <span className="w-px flex-1 bg-slate-200 mt-1" />}
                  </div>
                  <div className="pb-2">
                    <p className="font-semibold text-slate-700">{t.label}</p>
                    <p className="text-slate-400">{t.by} · {timeAgo(t.at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {canManage && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 mb-4">
              <p className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1"><ClipboardList size={13} /> Gestión del reporte</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <label className="text-[11px] text-slate-500">
                  Estado
                  <select value={report.status} onChange={(e) => onUpdate(report.id, { status: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white">
                    {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                  </select>
                </label>
                <label className="text-[11px] text-slate-500">
                  Prioridad
                  <select value={report.priority} onChange={(e) => onUpdate(report.id, { priority: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white">
                    {Object.keys(PRIORITY_META).map((p) => <option key={p} value={p}>{PRIORITY_META[p].label}</option>)}
                  </select>
                </label>
              </div>
              {allowInstitutionChange && (
                <label className="text-[11px] text-slate-500 block">
                  Institución asignada
                  <select value={report.institutionId} onChange={(e) => onUpdate(report.id, { institutionId: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white">
                    {INSTITUTIONS.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </label>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 mb-3">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-500"><MessageCircle size={18} /> {comments.length}</span>
          </div>

          <div className="space-y-3 mb-3">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2">
                <Avatar seed={c.seed} size={28} anonymous={c.anonymous} />
                <div className="bg-slate-50 rounded-xl px-3 py-2 flex-1">
                  <p className="text-xs font-bold text-slate-700">{c.anonymous ? "Vecino anónimo" : c.name}</p>
                  <p className="text-xs text-slate-600">{c.text}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && <p className="text-xs text-slate-400">Sé el primero en comentar sobre este reporte.</p>}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-3 flex items-center gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe un comentario…" className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400" />
          <button onClick={() => { if (text.trim()) { onAddComment(report.id, text); setText(""); } }} className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center shrink-0"><Send size={16} className="text-white" /></button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   GESTOR (asignador / clasificador)
============================================================================ */

function exportReportsCsv(reports, filename) {
  const header = ["ID", "Descripción", "Categoría", "Zona", "Estado", "Prioridad", "Institución", "Creado", "Satisfacción"];
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
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function GestorDashboard({ reports, user, onOpenDetail, showToast }) {
  const [tab, setTab] = useState("pendientes");
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("todas");
  const mine = reports.filter((r) => r.institutionId === user.institutionId);
  const filtered = mine
    .filter((r) => (tab === "pendientes" ? r.status === "recibido" || r.status === "en_proceso" : tab === "resueltos" ? r.status === "resuelto" || r.status === "cerrado" : true))
    .filter((r) => catFilter === "todas" || r.category === catFilter)
    .filter((r) => r.desc.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a.priority === "urgente" ? -1 : 1) - (b.priority === "urgente" ? -1 : 1));

  const overdue = mine.filter((r) => r.status !== "resuelto" && r.status !== "cerrado" && slaRemaining(r) < 0).length;
  const resolved = mine.filter((r) => r.status === "resuelto" || r.status === "cerrado").length;

  return (
    <div className="max-w-3xl mx-auto px-4 pt-4 pb-6">
      <div className="flex items-start justify-between gap-3 mb-1">
        <SectionHeading eyebrow={getInstitution(user.institutionId).name} title="Bandeja de reportes" />
        <button
          onClick={() => { exportReportsCsv(mine, `reportes-${getInstitution(user.institutionId).short}.csv`); showToast && showToast("CSV exportado"); }}
          className="shrink-0 mt-1 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-teal-300 hover:text-teal-700 transition"
        >
          <Download size={13} /> Exportar
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <div className="rounded-xl bg-white border border-slate-200 p-3"><p className="tr-mono text-xl font-bold text-slate-800">{mine.filter((r) => r.status === "recibido").length}</p><p className="text-[11px] text-slate-400">Sin asignar</p></div>
        <div className="rounded-xl bg-white border border-slate-200 p-3"><p className="tr-mono text-xl font-bold text-blue-700">{mine.filter((r) => r.status === "en_proceso").length}</p><p className="text-[11px] text-slate-400">En proceso</p></div>
        <div className="rounded-xl bg-white border border-emerald-200 bg-emerald-50 p-3"><p className="tr-mono text-xl font-bold text-emerald-700">{resolved}</p><p className="text-[11px] text-emerald-500">Resueltos</p></div>
        <div className="rounded-xl bg-white border border-red-200 bg-red-50 p-3"><p className="tr-mono text-xl font-bold text-red-600">{overdue}</p><p className="text-[11px] text-red-400">Fuera de SLA</p></div>
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="flex rounded-full bg-slate-100 p-1 text-xs font-semibold">
          {[["pendientes", "Pendientes"], ["resueltos", "Resueltos"], ["todos", "Todos"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`px-3 py-1.5 rounded-full transition ${tab === id ? "bg-white shadow text-slate-900" : "text-slate-500"}`}>{label}</button>
          ))}
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="text-xs font-semibold rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 outline-none">
          <option value="todas">Todas las categorías</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 flex-1 min-w-[140px]">
          <Search size={13} className="text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className="flex-1 min-w-0 outline-none text-xs" />
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((r) => {
          const remaining = slaRemaining(r);
          return (
            <button key={r.id} onClick={() => onOpenDetail(r)} className="w-full text-left flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-3 hover:border-teal-300 hover:shadow-sm transition">
              <img src={r.photos[0]} className="w-14 h-14 rounded-lg object-cover shrink-0" alt="" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-700 truncate">{r.desc}</p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap"><CategoryPill id={r.category} /><StatusPill status={r.status} /><PriorityPill priority={r.priority} /></div>
                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><MapPin size={10} /> {getZone(r.zone).name} · {timeAgo(r.createdAt)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-[11px] font-bold ${remaining < 0 ? "text-red-600" : remaining < 24 ? "text-orange-500" : "text-slate-400"}`}>{remaining < 0 ? "Vencido" : `${remaining}h`}</p>
                <ChevronRight size={16} className="text-slate-300 ml-auto mt-1" />
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-sm text-slate-400 py-10">No hay reportes en esta vista.</p>}
      </div>
    </div>
  );
}

/* ---------------------------- GESTOR — ESTADÍSTICAS ------------------------ */

function GestorStats({ reports, user }) {
  const mine = reports.filter((r) => r.institutionId === user.institutionId);
  const resolved = mine.filter((r) => r.status === "resuelto" || r.status === "cerrado").length;
  const resolutionRate = mine.length ? Math.round((resolved / mine.length) * 100) : 0;
  const overdue = mine.filter((r) => r.status !== "resuelto" && r.status !== "cerrado" && slaRemaining(r) < 0).length;
  const withinSla = mine.length ? Math.round(((mine.length - overdue) / mine.length) * 100) : 0;

  const avgResponseDays = (() => {
    const closed = mine.filter((r) => (r.status === "resuelto" || r.status === "cerrado") && r.timeline?.length > 1);
    if (!closed.length) return "—";
    const totalH = closed.reduce((a, r) => a + (r.timeline[r.timeline.length - 1].at - r.timeline[0].at) / 3600000, 0);
    return (totalH / closed.length / 24).toFixed(1);
  })();

  const byCategory = CATEGORIES.map((c) => ({ name: c.label, value: mine.filter((r) => r.category === c.id).length })).filter((d) => d.value > 0);
  const byStatus = STATUS_ORDER.map((s) => ({ name: STATUS_META[s].label, value: mine.filter((r) => r.status === s).length }));
  const byPriority = Object.keys(PRIORITY_META).map((p) => ({ name: PRIORITY_META[p].label, value: mine.filter((r) => r.priority === p).length }));
  const trend = weeklyTrendOf(mine);
  const byZone = ZONES.map((z) => ({ name: z.name, value: mine.filter((r) => r.zone === z.id).length })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 6);

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4 pb-8">
      <SectionHeading eyebrow={getInstitution(user.institutionId).name} title="Estadísticas de la institución" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Reportes recibidos" value={mine.length} Icon={FileText} tone="blue" />
        <StatCard label="Tasa de resolución" value={`${resolutionRate}%`} Icon={CheckCircle2} tone="teal" sub={`${resolved} de ${mine.length}`} />
        <StatCard label="Cumplimiento SLA" value={`${withinSla}%`} Icon={Gauge} tone={withinSla > 70 ? "teal" : withinSla > 40 ? "amber" : "red"} sub={`${overdue} fuera de tiempo`} />
        <StatCard label="Tiempo prom. de cierre" value={avgResponseDays === "—" ? "—" : `${avgResponseDays}d`} Icon={TimerReset} tone="purple" />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-700 mb-3">Reportes por categoría</p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                <Tooltip wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {byCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-700 mb-3">Distribución por estado</p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {byStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Tooltip wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-700 mb-3">Tendencia semanal</p>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="cantidad" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-700 mb-3">Reportes por prioridad</p>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byPriority}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {byPriority.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-4">
        <p className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-1.5"><MapPinned size={14} className="text-teal-600" /> Zonas con más reportes</p>
        <p className="text-[11px] text-slate-400 mb-3">Sectores que más incidencias generan dentro de tu cobertura.</p>
        <div className="space-y-3">
          {byZone.map((d) => {
            const pct = mine.length ? Math.round((d.value / mine.length) * 100) : 0;
            return (
              <div key={d.name}>
                <div className="flex justify-between text-xs mb-1"><span className="font-semibold text-slate-600">{d.name}</span><span className="tr-mono text-slate-500">{d.value} ({pct}%)</span></div>
                <ProgressBar value={pct} colorClass="bg-blue-500" />
              </div>
            );
          })}
          {byZone.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Sin datos suficientes.</p>}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   ADMIN
============================================================================ */

const CHART_COLORS = ["#0f766e", "#f59e0b", "#1d4ed8", "#dc2626", "#7c3aed", "#059669"];

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
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${toneMap[tone]}`}><Icon size={17} /></span>
      </div>
      <p className="tr-mono text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs font-semibold text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function AdminDashboard({ reports }) {
  const total = reports.length;
  const resolved = reports.filter((r) => r.status === "resuelto" || r.status === "cerrado").length;
  const overdue = reports.filter((r) => r.status !== "resuelto" && r.status !== "cerrado" && slaRemaining(r) < 0).length;
  const avgSat = (() => {
    const rated = reports.filter((r) => r.satisfaction);
    return rated.length ? (rated.reduce((a, r) => a + r.satisfaction, 0) / rated.length).toFixed(1) : "—";
  })();

  const byStatus = STATUS_ORDER.map((s) => ({ name: STATUS_META[s].label, value: reports.filter((r) => r.status === s).length }));
  const byInstitution = INSTITUTIONS.filter((i) => i.id !== "otra").map((inst) => ({
    name: inst.short,
    reportes: reports.filter((r) => r.institutionId === inst.id).length,
    resueltos: reports.filter((r) => r.institutionId === inst.id && (r.status === "resuelto" || r.status === "cerrado")).length,
  })).filter((d) => d.reportes > 0).sort((a, b) => b.reportes - a.reportes).slice(0, 8);

  const byCategory = CATEGORIES.map((c) => ({ name: c.label, value: reports.filter((r) => r.category === c.id).length })).filter((d) => d.value > 0);

  const trend = Array.from({ length: 8 }).map((_, i) => {
    const weekAgo = 7 - i;
    return { name: `S-${weekAgo}`, reportes: 4 + Math.floor(Math.abs(Math.sin(i * 1.3)) * 8) };
  });

  const urgentActive = reports.filter((r) => r.priority === "urgente" && r.status !== "resuelto" && r.status !== "cerrado").sort((a, b) => slaRemaining(a) - slaRemaining(b)).slice(0, 5);
  const topCitizens = [...MOCK_USERS].filter((u) => u.role === "ciudadano").sort((a, b) => b.points - a.points).slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto px-4 pt-4 pb-8">
      <div className="flex items-start justify-between gap-3">
        <SectionHeading eyebrow="Panel organizacional" title="KPIs de cumplimiento y métricas" />
        <button
          onClick={() => exportReportsCsv(reports, "reportes-tureporte.csv")}
          className="shrink-0 mt-1 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-teal-300 hover:text-teal-700 transition"
        >
          <Download size={13} /> Exportar todo (CSV)
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Reportes totales" value={total} Icon={FileText} tone="blue" sub="Últimos 21 días" />
        <KpiCard label="Tasa de resolución" value={`${Math.round((resolved / total) * 100)}%`} Icon={CheckCircle2} tone="teal" sub={`${resolved} de ${total} reportes`} />
        <KpiCard label="Fuera de SLA" value={overdue} Icon={AlertTriangle} tone="red" sub="Requieren atención inmediata" />
        <KpiCard label="Satisfacción ciudadana" value={avgSat} Icon={Star} tone="amber" sub="Promedio de calificaciones" />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-700 mb-3">Reportes por institución (top 8)</p>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byInstitution} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={70} />
                <Tooltip wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="reportes" fill="#0f766e" radius={[0, 4, 4, 0]} />
                <Bar dataKey="resueltos" fill="#5eead4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-700 mb-3">Distribución por estado</p>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {byStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-700 mb-3">Tendencia semanal de reportes</p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="reportes" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-700 mb-3">Reportes por categoría</p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {byCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-4 mb-6">
        <p className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-1.5"><Info size={14} className="text-teal-600" /> Cumplimiento institucional (SLA)</p>
        <p className="text-[11px] text-slate-400 mb-3">Porcentaje de reportes atendidos dentro del tiempo de respuesta acordado por institución.</p>
        <div className="space-y-3">
          {byInstitution.map((d) => {
            const pct = d.reportes ? Math.round((d.resueltos / d.reportes) * 100) : 0;
            return (
              <div key={d.name}>
                <div className="flex justify-between text-xs mb-1"><span className="font-semibold text-slate-600">{d.name}</span><span className="tr-mono text-slate-500">{pct}%</span></div>
                <ProgressBar value={pct} colorClass={pct > 70 ? "bg-emerald-500" : pct > 40 ? "bg-amber-500" : "bg-red-500"} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white border border-red-100 p-4">
          <p className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-1.5"><AlertTriangle size={14} className="text-red-500" /> Reportes urgentes activos</p>
          <p className="text-[11px] text-slate-400 mb-3">Casos de máxima prioridad que aún no se han resuelto, ordenados por tiempo restante.</p>
          <div className="space-y-2">
            {urgentActive.map((r) => {
              const remaining = slaRemaining(r);
              return (
                <div key={r.id} className="flex items-center gap-2.5 rounded-xl border border-slate-100 p-2.5">
                  <img src={r.photos[0]} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-700 truncate">{r.desc}</p>
                    <p className="text-[10px] text-slate-400">{getInstitution(r.institutionId).short} · {getZone(r.zone).name}</p>
                  </div>
                  <span className={`text-[11px] font-bold shrink-0 ${remaining < 0 ? "text-red-600" : "text-orange-500"}`}>{remaining < 0 ? "Vencido" : `${remaining}h`}</span>
                </div>
              );
            })}
            {urgentActive.length === 0 && <p className="text-xs text-slate-400 text-center py-6">No hay reportes urgentes pendientes ahora mismo.</p>}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-1.5"><Medal size={14} className="text-amber-500" /> Vecinos más colaboradores</p>
          <p className="text-[11px] text-slate-400 mb-3">Ciudadanos con mayor participación cívica en la plataforma.</p>
          <div className="space-y-2">
            {topCitizens.map((u, i) => (
              <div key={u.id} className="flex items-center gap-2.5">
                <span className={`tr-mono text-xs font-bold w-5 ${i === 0 ? "text-amber-500" : "text-slate-400"}`}>{i + 1}</span>
                <Avatar seed={u.seed} size={28} />
                <span className="text-xs font-semibold text-slate-700 flex-1 truncate">{u.name}</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700"><Trophy size={11} /> {u.points} pts</span>
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
  const [form, setForm] = useState({ name: "", cedula: "", phone: "", email: "", role: "gestor", institutionId: "ayto-dn" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="max-w-3xl mx-auto px-4 pt-4 pb-8">
      <SectionHeading
        eyebrow="Gestión organizacional"
        title="Usuarios del sistema"
        action={<button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5 rounded-full bg-blue-900 text-white text-xs font-semibold px-3.5 py-2"><UserPlus size={14} /> Nuevo usuario</button>}
      />

      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 mb-5 tr-fade-up">
          <p className="text-sm font-bold text-slate-700 mb-3">Crear usuario que asigna y clasifica reportes</p>
          <div className="grid md:grid-cols-2 gap-3 mb-3">
            <TextField label="Nombre completo" icon={User} placeholder="Nombre y apellido" value={form.name} onChange={set("name")} />
            <TextField label="Cédula" icon={CreditCard} placeholder="000-0000000-0" value={form.cedula} onChange={set("cedula")} />
            <TextField label="Teléfono" icon={Phone} placeholder="809-000-0000" value={form.phone} onChange={set("phone")} />
            <TextField label="Correo institucional" icon={Mail} placeholder="nombre@institucion.gob.do" value={form.email} onChange={set("email")} />
          </div>
          <div className="grid md:grid-cols-2 gap-3 mb-4">
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1.5">Rol</span>
              <select value={form.role} onChange={set("role")} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm">
                <option value="gestor">Gestor (clasifica y asigna reportes)</option>
                <option value="admin">Administrador</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1.5">Institución asociada</span>
              <select value={form.institutionId} onChange={set("institutionId")} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm" disabled={form.role !== "gestor"}>
                {INSTITUTIONS.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { if (form.name && form.email) { onCreate({ ...form, id: uid("u"), seed: form.name.split(" ")[0], points: 0 }); setForm({ name: "", cedula: "", phone: "", email: "", role: "gestor", institutionId: "ayto-dn" }); setShowForm(false); } }}
              className="flex-1 rounded-xl bg-teal-600 text-white text-sm font-semibold py-2.5"
            >
              Crear usuario
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-xl border border-slate-200 text-sm font-semibold text-slate-500 px-4">Cancelar</button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-2.5 bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
          <span>Usuario</span><span>Rol</span><span className="text-right">Institución</span>
        </div>
        {users.map((u) => (
          <div key={u.id} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center px-4 py-2.5 border-t border-slate-100">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar seed={u.seed} size={30} />
              <div className="min-w-0"><p className="text-xs font-bold text-slate-700 truncate">{u.name}</p><p className="text-[10px] text-slate-400 truncate">{u.email}</p></div>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full text-center ${u.role === "admin" ? "bg-slate-800 text-white" : u.role === "gestor" ? "bg-blue-100 text-blue-700" : "bg-teal-100 text-teal-700"}`}>
              {u.role === "admin" ? "Admin" : u.role === "gestor" ? "Gestor" : "Ciudadano"}
            </span>
            <span className="text-[11px] text-slate-500 text-right truncate">{u.institutionId ? getInstitution(u.institutionId).short : "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   ROOT APP
============================================================================ */

export default function App() {
  const [session, setSession] = useState(null);
  const [screen, setScreen] = useState("landing"); // landing | auth
  const [authScreen, setAuthScreen] = useState("login"); // login | register1 | register2
  const [regForm, setRegForm] = useState({ name: "", cedula: "", phone: "", email: "", password: "", zone: "", terms: false });

  const [reports, setReports] = useState(() => buildReports());
  const [users, setUsers] = useState(MOCK_USERS);
  const [likedIds, setLikedIds] = useState(new Set());
  const [commentsMap, setCommentsMap] = useState({
    r1: [{ id: "c1", name: "Miguel Santos", seed: "Miguel", text: "Yo también he tenido problemas con ese bache, ¡ojalá lo resuelvan pronto!", anonymous: false }],
  });
  const [toast, setToast] = useState(null);
  const [view, setView] = useState("feed");
  const [profileModal, setProfileModal] = useState(null);
  const [detailReport, setDetailReport] = useState(null);
  const [mapMode, setMapMode] = useState("city");

  const showToast = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(null), 2800); }, []);

  const handleLogin = (user) => {
    setSession(user);
    setView(user.role === "ciudadano" ? "feed" : "dashboard");
  };
  const handleLogout = () => { setSession(null); setAuthScreen("login"); setScreen("landing"); };

  const handleLike = (id) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handlePublish = ({ category, desc, zone, anonymous, photos }) => {
    const newReport = {
      id: uid("r"),
      desc, category, zone, isAnonymous: anonymous,
      status: "recibido", priority: "media",
      authorId: session.id, photos,
      createdAt: Date.now(), likes: 0, commentsCount: 0,
      institutionId: zoneToInstitution(zone, category),
      slaHours: 120, isDuplicate: false, duplicateOf: null, satisfaction: null,
      distanceM: 40,
      timeline: [{ at: Date.now(), label: "Reporte creado", by: "Ciudadano" }],
    };
    setReports((r) => [newReport, ...r]);
    setUsers((us) => us.map((u) => (u.id === session.id ? { ...u, points: u.points + 15 } : u)));
    setSession((s) => ({ ...s, points: s.points + 15 }));
    setView("feed");
  };

  const handleUpdateReport = (id, patch) => {
    setReports((rs) => rs.map((r) => {
      if (r.id !== id) return r;
      const updated = { ...r, ...patch };
      if (patch.status && patch.status !== r.status) {
        updated.timeline = [...r.timeline, { at: Date.now(), label: `Estado cambiado a "${STATUS_META[patch.status].label}"`, by: session.name }];
      }
      if (patch.institutionId && patch.institutionId !== r.institutionId) {
        updated.timeline = [...updated.timeline, { at: Date.now(), label: `Reasignado a ${getInstitution(patch.institutionId).short}`, by: session.name }];
      }
      return updated;
    }));
    setDetailReport((d) => (d && d.id === id ? { ...d, ...patch } : d));
    showToast("Reporte actualizado");
  };

  const handleAddComment = (reportId, text) => {
    setCommentsMap((m) => ({
      ...m,
      [reportId]: [...(m[reportId] || []), { id: uid("c"), name: session.name, seed: session.seed, text, anonymous: false }],
    }));
    setReports((rs) => rs.map((r) => (r.id === reportId ? { ...r, commentsCount: r.commentsCount + 1 } : r)));
  };

  const handleCreateUser = (u) => {
    setUsers((us) => [...us, u]);
    showToast(`Usuario ${u.name} creado como ${u.role === "gestor" ? "gestor de reportes" : "administrador"}`);
  };

  /* ------------------------------ LANDING VIEW ------------------------------ */
  if (!session && screen === "landing") {
    return (
      <LandingPage
        onLogin={() => { setAuthScreen("login"); setScreen("auth"); }}
        onRegister={() => { setAuthScreen("register1"); setScreen("auth"); }}
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
          <LoginScreen onLogin={handleLogin} onGoRegister={() => setAuthScreen("register1")} showToast={showToast} onHome={goHome} />
        )}
        {authScreen === "register1" && (
          <RegisterStep1 initial={regForm} onBack={() => setAuthScreen("login")} onNext={(f) => { setRegForm(f); setAuthScreen("register2"); }} onHome={goHome} />
        )}
        {authScreen === "register2" && (
          <RegisterOcrStep
            form={regForm}
            onBack={() => setAuthScreen("register1")}
            showToast={showToast}
            onHome={goHome}
            onDone={() => {
              const newUser = { id: uid("u"), name: regForm.name, cedula: regForm.cedula, phone: regForm.phone, email: regForm.email, role: "ciudadano", points: 10, isPublic: true, seed: regForm.name.split(" ")[0] || "Nuevo", zone: regForm.zone };
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
  const canManage = session.role === "gestor" || session.role === "admin";
  const currentReports = session.role === "gestor" ? reports : reports;

  return (
    <div className="tr-root h-full">
      <GlobalStyle />
      <AppShell user={session} view={view} setView={setView} onLogout={handleLogout}>
        {session.role === "ciudadano" && view === "feed" && (
          <CitizenFeed reports={reports} likedIds={likedIds} onLike={handleLike} onOpenProfile={setProfileModal} onOpenDetail={setDetailReport} currentUser={session} />
        )}
        {session.role === "ciudadano" && view === "map" && <CitizenMap reports={reports} />}
        {session.role === "ciudadano" && view === "compose" && <CitizenComposer onPublish={handlePublish} showToast={showToast} />}
        {session.role === "ciudadano" && view === "stats" && <CitizenStats user={session} reports={reports} users={users} />}
        {session.role === "ciudadano" && view === "profile" && (
          <CitizenProfile user={session} reports={reports} onLogout={handleLogout} onGoStats={() => setView("stats")} onTogglePublic={() => { setSession((s) => ({ ...s, isPublic: !s.isPublic })); setUsers((us) => us.map((u) => (u.id === session.id ? { ...u, isPublic: !u.isPublic } : u))); }} />
        )}

        {session.role === "gestor" && view === "dashboard" && <GestorDashboard reports={reports} user={session} onOpenDetail={setDetailReport} showToast={showToast} />}
        {session.role === "gestor" && view === "stats" && <GestorStats reports={reports} user={session} />}
        {session.role === "gestor" && view === "map" && (
          <div className="max-w-3xl mx-auto px-4 pt-4 pb-6">
            <SectionHeading eyebrow="Cobertura territorial" title="Mapa de incidencias" />
            <ZoneMap reports={reports} selectedZone={null} onSelectZone={() => {}} mode={mapMode} onModeChange={setMapMode} institutionFilter={session.institutionId} height={360} />
          </div>
        )}
        {session.role === "gestor" && view === "profile" && (
          <CitizenProfile user={session} reports={reports} onLogout={handleLogout} onTogglePublic={() => {}} />
        )}

        {session.role === "admin" && view === "dashboard" && <AdminDashboard reports={reports} />}
        {session.role === "admin" && view === "map" && (
          <div className="max-w-3xl mx-auto px-4 pt-4 pb-6">
            <SectionHeading eyebrow="Control nacional" title="Mapa de reportes" />
            <ZoneMap reports={reports} selectedZone={null} onSelectZone={() => {}} mode={mapMode} onModeChange={setMapMode} height={380} />
          </div>
        )}
        {session.role === "admin" && view === "users" && <AdminUsers users={users} onCreate={handleCreateUser} />}
        {session.role === "admin" && view === "profile" && (
          <CitizenProfile user={session} reports={reports} onLogout={handleLogout} onTogglePublic={() => {}} />
        )}
      </AppShell>

      <ProfileModal author={profileModal} reports={reports} onClose={() => setProfileModal(null)} />
      <ReportDetailModal
        report={detailReport}
        comments={detailReport ? commentsMap[detailReport.id] || [] : []}
        onAddComment={handleAddComment}
        onClose={() => setDetailReport(null)}
        onOpenProfile={(author) => { setDetailReport(null); setProfileModal(author); }}
        liked={detailReport ? likedIds.has(detailReport.id) : false}
        onLike={handleLike}
        canManage={canManage}
        onUpdate={handleUpdateReport}
        allowInstitutionChange={session.role === "admin"}
      />
      <Toast toast={toast} />
    </div>
  );
}
