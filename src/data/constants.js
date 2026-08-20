/* ============================================================================
   TuReporte — Diccionarios de negocio (ver SCHEMA.md para el modelo completo)
   ============================================================================ */

import {
  Construction, Lightbulb, Trash2, Droplet, Droplets,
  Leaf, AlertTriangle, HelpCircle, Clock, RefreshCw,
  CheckCircle2, Flag, Landmark, Building2, Zap,
} from "lucide-react";

/* ---------------------------------------------------------------------------
   institutions — entidades que reciben y resuelven reportes
--------------------------------------------------------------------------- */
/* `isSeed: true` marca instituciones precargadas al lanzar la plataforma.
   `isSeed: false` simula instituciones que un administrador agregó después
   (ver ADMIN_ADDED_INSTITUTIONS en mockData.js). `active` permite que un
   admin retire una institución del enrutamiento sin borrar su historial de
   casos — así se haría en una tabla real (soft delete), nunca un DELETE. */
export const INSTITUTIONS = [
  { id: "ayto-dn",  name: "Ayuntamiento del Distrito Nacional",              short: "ADN",           kind: "ayuntamiento",        active: true, isSeed: true },
  { id: "ayto-sde", name: "Ayuntamiento Santo Domingo Este",                  short: "ASDE",          kind: "ayuntamiento",        active: true, isSeed: true },
  { id: "ayto-sdn", name: "Ayuntamiento Santo Domingo Norte",                 short: "ASDN",          kind: "ayuntamiento",        active: true, isSeed: true },
  { id: "ayto-sdo", name: "Ayuntamiento Santo Domingo Oeste",                 short: "ASDO",          kind: "ayuntamiento",        active: true, isSeed: true },
  { id: "ayto-alc", name: "Ayuntamiento Los Alcarrizos",                      short: "A. Alcarrizos", kind: "ayuntamiento",        active: true, isSeed: true },
  { id: "ayto-bch", name: "Ayuntamiento Boca Chica",                          short: "A. Boca Chica", kind: "ayuntamiento",        active: true, isSeed: true },
  { id: "ayto-pbr", name: "Ayuntamiento Pedro Brand",                         short: "A. Pedro Brand",kind: "ayuntamiento",        active: true, isSeed: true },
  { id: "ayto-sag", name: "Ayuntamiento San Antonio de Guerra",               short: "A. San Antonio",kind: "ayuntamiento",        active: true, isSeed: true },
  { id: "caasd",    name: "CAASD — Acueducto y Alcantarillado de Sto. Dgo.",  short: "CAASD",         kind: "institucion_nacional",active: true, isSeed: true },
  { id: "inapa",    name: "INAPA — Instituto Nacional de Aguas Potables",     short: "INAPA",         kind: "institucion_nacional",active: true, isSeed: true },
  { id: "mopc",     name: "MOPC — Obras Públicas y Comunicaciones",           short: "MOPC",          kind: "institucion_nacional",active: true, isSeed: true },
  { id: "medioambiente", name: "Ministerio de Medio Ambiente y Recursos Naturales", short: "Medio Amb.", kind: "institucion_nacional", active: true, isSeed: true },
  { id: "ede-este", name: "EDE-Este",  short: "EDE-Este",  kind: "distribuidora", active: true, isSeed: true },
  { id: "ede-norte",name: "EDE-Norte", short: "EDE-Norte", kind: "distribuidora", active: true, isSeed: true },
  { id: "ede-sur",  name: "EDE-Sur",   short: "EDE-Sur",   kind: "distribuidora", active: true, isSeed: true },
  { id: "otra",     name: "Otra institución (especificar)", short: "Otra", kind: "institucion_nacional", active: true, isSeed: true },
];

export const getInstitution = (id) =>
  INSTITUTIONS.find((i) => i.id === id) || INSTITUTIONS[INSTITUTIONS.length - 1];

/** Instituciones activas que pueden recibir un caso nuevo — lo que un
    formulario de asignación (manual o automática) debe listar. */
export const getAssignableInstitutions = () => INSTITUTIONS.filter((i) => i.active && i.id !== "otra");

export const INSTITUTION_ICONS = { ayuntamiento: Landmark, institucion_nacional: Building2, distribuidora: Zap };

/* ---------------------------------------------------------------------------
   zones — municipios del Gran Santo Domingo con coordenadas reales (mapa)
--------------------------------------------------------------------------- */
export const ZONES = [
  { id: "dn",  name: "Distrito Nacional",     lat: 18.4861, lng: -69.9312, institutionId: "ayto-dn",  population: 965040 },
  { id: "sdn", name: "Santo Domingo Norte",   lat: 18.5520, lng: -69.9500, institutionId: "ayto-sdn", population: 617293 },
  { id: "sdo", name: "Santo Domingo Oeste",   lat: 18.4900, lng: -69.9800, institutionId: "ayto-sdo", population: 419490 },
  { id: "sde", name: "Santo Domingo Este",    lat: 18.4880, lng: -69.8500, institutionId: "ayto-sde", population: 1043849 },
  { id: "alc", name: "Los Alcarrizos",        lat: 18.5100, lng: -70.0300, institutionId: "ayto-alc", population: 261660 },
  { id: "bch", name: "Boca Chica",            lat: 18.4550, lng: -69.6100, institutionId: "ayto-bch", population: 178112 },
  { id: "pbr", name: "Pedro Brand",           lat: 18.4700, lng: -70.0900, institutionId: "ayto-pbr", population: 122074 },
  { id: "sag", name: "San Antonio de Guerra", lat: 18.3800, lng: -69.7400, institutionId: "ayto-sag", population: 62618 },
];

export const getZone = (id) => ZONES.find((z) => z.id === id);

/* Regiones a nivel nacional — solo Gran Santo Domingo tiene datos operativos hoy */
export const NATIONAL_REGIONS = [
  { id: "cibao",       name: "Región Norte (Cibao)", lat: 19.45, lng: -70.69, active: false },
  { id: "sur",         name: "Región Sur",           lat: 18.20, lng: -71.10, active: false },
  { id: "este-region", name: "Región Este",          lat: 18.60, lng: -68.95, active: false },
  { id: "sd",          name: "Gran Santo Domingo",   lat: 18.49, lng: -69.93, active: true },
];

/* ---------------------------------------------------------------------------
   categories — tipos de incidencia (enum cerrado de negocio)
--------------------------------------------------------------------------- */
/* `basePriority` es la urgencia de referencia de ese tipo de incidencia
   cuando ninguna regla de enrutamiento especifica lo contrario (ver
   RUTEO_REGLAS en mockData.js). Un daño en el suministro de agua o una
   alcantarilla abierta parte de "alta" por ser riesgos a la salud/seguridad;
   una ocupación de acera parte de "baja". */
export const CATEGORIES = [
  { id: "calles",         label: "Calles y vías",       Icon: Construction,  color: "#f97316", markerColor: "#ea580c", defaultInstitutionKind: "ayuntamiento",        basePriority: "media" },
  { id: "alumbrado",      label: "Alumbrado público",   Icon: Lightbulb,     color: "#eab308", markerColor: "#ca8a04", defaultInstitutionKind: "distribuidora",       basePriority: "media" },
  { id: "basura",         label: "Basura y vertederos", Icon: Trash2,        color: "#d97706", markerColor: "#b45309", defaultInstitutionKind: "ayuntamiento",        basePriority: "baja" },
  { id: "alcantarillado", label: "Alcantarillado",      Icon: Droplet,       color: "#0891b2", markerColor: "#0e7490", defaultInstitutionKind: "institucion_nacional",basePriority: "alta" },
  { id: "agua",           label: "Falta de agua",       Icon: Droplets,      color: "#3b82f6", markerColor: "#2563eb", defaultInstitutionKind: "institucion_nacional",basePriority: "alta" },
  { id: "ambiente",       label: "Medio ambiente",      Icon: Leaf,          color: "#10b981", markerColor: "#059669", defaultInstitutionKind: "institucion_nacional",basePriority: "media" },
  { id: "ocupacion",      label: "Ocupación ilegal",    Icon: AlertTriangle, color: "#8b5cf6", markerColor: "#7c3aed", defaultInstitutionKind: "ayuntamiento",        basePriority: "baja" },
  { id: "otro",           label: "Otro",                Icon: HelpCircle,    color: "#64748b", markerColor: "#475569", defaultInstitutionKind: "ayuntamiento",        basePriority: "media" },
];

export const getCategory = (id) =>
  CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

/* ---------------------------------------------------------------------------
   report status / priority — enums de ciclo de vida
--------------------------------------------------------------------------- */
export const STATUS_META = {
  recibido:   { label: "Recibido",   Icon: Clock,        color: "#d97706" },
  en_proceso: { label: "En proceso", Icon: RefreshCw,    color: "#2563eb" },
  resuelto:   { label: "Resuelto",   Icon: CheckCircle2, color: "#059669" },
  cerrado:    { label: "Cerrado",    Icon: Flag,         color: "#64748b" },
};

export const STATUS_ORDER = ["recibido", "en_proceso", "resuelto", "cerrado"];

export const PRIORITY_META = {
  baja:    { label: "Baja",    color: "#64748b", slaHours: 168 },
  media:   { label: "Media",   color: "#d97706", slaHours: 120 },
  alta:    { label: "Alta",    color: "#ea580c", slaHours: 72 },
  urgente: { label: "Urgente", color: "#dc2626", slaHours: 24 },
};

/* Orden de severidad — usado para subir/bajar un nivel al recalcular
   prioridad (triage), nunca para saltar directo a un extremo. */
export const PRIORITY_ORDER = ["baja", "media", "alta", "urgente"];
export const escalatePriority = (p) => PRIORITY_ORDER[Math.min(PRIORITY_ORDER.indexOf(p) + 1, PRIORITY_ORDER.length - 1)];
export const deescalatePriority = (p) => PRIORITY_ORDER[Math.max(PRIORITY_ORDER.indexOf(p) - 1, 0)];

export const USER_ROLES = {
  ciudadano: { label: "Ciudadano" },
  gestor:    { label: "Gestor institucional" },
  admin:     { label: "Administrador" },
};

/* NOTA: el enrutamiento de un reporte a su institución responsable ya NO es
   un if/else fijo aquí. Se resuelve con un motor de reglas declarativo
   (tabla ROUTING_RULES + función resolveRouting) en mockData.js, porque
   institución/prioridad/SLA son datos operativos que un administrador debe
   poder editar sin tocar código — no dictionarios estáticos de negocio. */
