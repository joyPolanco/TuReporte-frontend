/* ============================================================================
   TuReporte — Mock data (base de datos simulada, sin backend)

   Ver SCHEMA.md para el diagrama de entidades. Cada export en mayúsculas es
   una "tabla": un arreglo con `id` como llave primaria y campos `*Id` como
   llaves foráneas, tal como se modelaría en Postgres. Las funciones al final
   del archivo (`getReportFeed`, `getReportDetail`, ...) son la única forma en
   que el resto de la app debe leer estos datos: simulan el join que haría una
   API real, así que cuando exista un backend solo cambia su implementación.
   ============================================================================ */

import {
  ZONES, getZone, getInstitution, getCategory, INSTITUTIONS,
  PRIORITY_META, escalatePriority, deescalatePriority,
} from "./constants.js";
import { seededRandom, uid } from "./helpers.js";

const rand = seededRandom("tureporte-mvp-v2");
const now = Date.now();
const DAY = 86_400_000;

/* ---------------------------------------------------------------------------
   users — ciudadanos, gestores institucionales y administradores
--------------------------------------------------------------------------- */
export const USERS = [
  // ciudadanos
  { id: "u1", role: "ciudadano", name: "Awilka Jerome",     cedula: "402-1234567-8", phone: "809-555-0142", email: "awilka.jerome@correo.com", isPublic: true,  zoneId: "dn",  seed: "Awilka",  createdAt: now - 210 * DAY },
  { id: "u2", role: "ciudadano", name: "Johaly Concepción", cedula: "402-7654321-0", phone: "829-555-0198", email: "johaly.concepcion@correo.com", isPublic: true,  zoneId: "sde", seed: "Johaly",  createdAt: now - 178 * DAY },
  { id: "u3", role: "ciudadano", name: "Ramón Ortiz",       cedula: "001-1122334-5", phone: "849-555-0110", email: "ramon.ortiz@correo.com", isPublic: false, zoneId: "sdn", seed: "Ramon",   createdAt: now - 95 * DAY },
  { id: "u4", role: "ciudadano", name: "Carla Fernández",   cedula: "031-9988776-1", phone: "809-555-0176", email: "carla.fernandez@correo.com", isPublic: true,  zoneId: "sdo", seed: "Carla",   createdAt: now - 62 * DAY },
  { id: "u5", role: "ciudadano", name: "Miguel Santos",     cedula: "402-4455667-3", phone: "829-555-0155", email: "miguel.santos@correo.com", isPublic: true,  zoneId: "alc", seed: "Miguel",  createdAt: now - 340 * DAY },
  { id: "u6", role: "ciudadano", name: "Yésica Batista",    cedula: "402-2233445-9", phone: "809-555-0189", email: "yesica.batista@correo.com", isPublic: true,  zoneId: "bch", seed: "Yesica",  createdAt: now - 40 * DAY },
  { id: "u7", role: "ciudadano", name: "Elvis Marte",       cedula: "402-6677889-2", phone: "829-555-0121", email: "elvis.marte@correo.com", isPublic: false, zoneId: "pbr", seed: "Elvis",   createdAt: now - 18 * DAY },
  // gestores institucionales (uno o dos por institución con carga operativa)
  { id: "g1", role: "gestor", name: "Yudelka Pérez",  cedula: "402-1231231-1", phone: "809-555-0201", email: "yudelka.perez@adn.gob.do",   institutionId: "ayto-dn",  seed: "Yudelka",  createdAt: now - 400 * DAY },
  { id: "g2", role: "gestor", name: "Franklin Reyes", cedula: "402-3213213-2", phone: "809-555-0233", email: "franklin.reyes@caasd.gob.do", institutionId: "caasd",   seed: "Franklin", createdAt: now - 400 * DAY },
  { id: "g3", role: "gestor", name: "Rosanna Cabrera",cedula: "402-4564564-3", phone: "809-555-0244", email: "rosanna.cabrera@asde.gob.do", institutionId: "ayto-sde", seed: "Rosanna",  createdAt: now - 250 * DAY },
  { id: "g4", role: "gestor", name: "Wander Objío",   cedula: "402-7897897-4", phone: "809-555-0255", email: "wander.objio@edeeste.com.do", institutionId: "ede-este", seed: "Wander",   createdAt: now - 250 * DAY },
  // administrador de plataforma
  { id: "a1", role: "admin", name: "Huáscar Frías", cedula: "402-0000000-0", phone: "809-555-0100", email: "admin@tureporte.gob.do", seed: "Huascar", createdAt: now - 400 * DAY },
];

export const getUser = (id) => USERS.find((u) => u.id === id);
export const CITIZEN_IDS = USERS.filter((u) => u.role === "ciudadano").map((u) => u.id);
export const GESTOR_IDS = USERS.filter((u) => u.role === "gestor").map((u) => u.id);

/* =============================================================================
   institution_routing_rules — motor de asignación de casos a institución

   Reemplaza el if/else fijo que existía antes. Es la tabla que un panel de
   administración editaría en producción: qué institución recibe qué tipo de
   incidencia, en qué zona, y con qué urgencia/SLA por defecto. Las funciones
   `addRoutingRule` / `deactivateRoutingRule` / `addInstitution` de más abajo
   simulan exactamente esas operaciones de administrador, sin backend real.

   Resolución en 3 niveles, del más al menos específico (como resolvería un
   motor de reglas o un `ORDER BY specificity` en SQL):
     1) regla activa para esa CATEGORÍA + esa ZONA exacta
     2) regla activa para esa CATEGORÍA a nivel NACIONAL (zoneId = null)
     3) si no hay regla, cae al ayuntamiento dueño de la zona (fallback)
============================================================================= */
export const ROUTING_RULES = [
  // -- Alumbrado público: cada distribuidora eléctrica cubre un grupo de zonas.
  { id: "rt-1",  categoryId: "alumbrado", zoneId: "sde", institutionId: "ede-este",  priority: null, slaHoursOverride: null, description: "Cobertura eléctrica de EDE-Este en Santo Domingo Este", active: true, isSeed: true, createdAt: now - 400 * DAY },
  { id: "rt-2",  categoryId: "alumbrado", zoneId: "bch", institutionId: "ede-este",  priority: null, slaHoursOverride: null, description: "Cobertura eléctrica de EDE-Este en Boca Chica",          active: true, isSeed: true, createdAt: now - 400 * DAY },
  { id: "rt-3",  categoryId: "alumbrado", zoneId: "sag", institutionId: "ede-este",  priority: null, slaHoursOverride: null, description: "Cobertura eléctrica de EDE-Este en San Antonio de Guerra", active: true, isSeed: true, createdAt: now - 400 * DAY },
  { id: "rt-4",  categoryId: "alumbrado", zoneId: "sdn", institutionId: "ede-norte", priority: null, slaHoursOverride: null, description: "Cobertura eléctrica de EDE-Norte en Santo Domingo Norte", active: true, isSeed: true, createdAt: now - 400 * DAY },
  { id: "rt-5",  categoryId: "alumbrado", zoneId: "dn",  institutionId: "ede-sur",   priority: null, slaHoursOverride: null, description: "Cobertura eléctrica de EDE-Sur en el Distrito Nacional", active: true, isSeed: true, createdAt: now - 400 * DAY },
  { id: "rt-6",  categoryId: "alumbrado", zoneId: "sdo", institutionId: "ede-sur",   priority: null, slaHoursOverride: null, description: "Cobertura eléctrica de EDE-Sur en Santo Domingo Oeste",  active: true, isSeed: true, createdAt: now - 400 * DAY },
  { id: "rt-7",  categoryId: "alumbrado", zoneId: "alc", institutionId: "ede-sur",   priority: null, slaHoursOverride: null, description: "Cobertura eléctrica de EDE-Sur en Los Alcarrizos",       active: true, isSeed: true, createdAt: now - 400 * DAY },
  { id: "rt-8",  categoryId: "alumbrado", zoneId: "pbr", institutionId: "ede-sur",   priority: null, slaHoursOverride: null, description: "Cobertura eléctrica de EDE-Sur en Pedro Brand",          active: true, isSeed: true, createdAt: now - 400 * DAY },

  // -- Agua y alcantarillado: operador único (CAASD) para todo el Gran Santo
  //    Domingo. Se marcan "alta" con SLA reducido porque son riesgos sanitarios.
  { id: "rt-9",  categoryId: "agua",           zoneId: null, institutionId: "caasd", priority: "alta", slaHoursOverride: 48, description: "CAASD es el operador único de acueducto en el Gran Santo Domingo; fallas de suministro se tratan como riesgo a la salud pública.", active: true, isSeed: true, createdAt: now - 400 * DAY },
  { id: "rt-10", categoryId: "alcantarillado", zoneId: null, institutionId: "caasd", priority: "alta", slaHoursOverride: 48, description: "Alcantarillas destapadas u obstruidas son peligro vial y sanitario inmediato.", active: true, isSeed: true, createdAt: now - 400 * DAY },

  // -- Medio ambiente: ministerio nacional.
  { id: "rt-11", categoryId: "ambiente", zoneId: null, institutionId: "medioambiente", priority: null, slaHoursOverride: null, description: "Denuncias ambientales escalan directo al Ministerio de Medio Ambiente, sin importar el municipio.", active: true, isSeed: true, createdAt: now - 400 * DAY },

  // -- Calles y vías: por defecto cae al ayuntamiento de la zona (sin regla
  //    explícita), EXCEPTO corredores de circunscripción nacional que
  //    mantiene Obras Públicas en vez del ayuntamiento local.
  { id: "rt-12", categoryId: "calles", zoneId: "sag", institutionId: "mopc", priority: "alta", slaHoursOverride: null, description: "San Antonio de Guerra: la vía principal es carretera nacional bajo mantenimiento de MOPC, no del ayuntamiento municipal.", active: true, isSeed: true, createdAt: now - 210 * DAY },
];

export const getRoutingRulesForInstitution = (institutionId) =>
  ROUTING_RULES.filter((r) => r.institutionId === institutionId && r.active);

/** Resuelve institución + prioridad + SLA para un (zona, categoría) dado,
    aplicando la regla más específica disponible. Devuelve también `source`
    para que la UI pueda explicar por qué se asignó así (transparencia). */
export function resolveRouting(zoneId, categoryId) {
  const category = getCategory(categoryId);
  const zoneRule = ROUTING_RULES.find((r) => r.active && r.categoryId === categoryId && r.zoneId === zoneId);
  const nationalRule = !zoneRule && ROUTING_RULES.find((r) => r.active && r.categoryId === categoryId && r.zoneId === null);
  const rule = zoneRule || nationalRule;

  if (rule) {
    const priority = rule.priority || category.basePriority;
    return {
      institutionId: rule.institutionId,
      priority,
      slaHours: rule.slaHoursOverride || PRIORITY_META[priority].slaHours,
      matchedRuleId: rule.id,
      source: zoneRule ? "regla_especifica_de_zona" : "regla_nacional_por_categoria",
    };
  }

  const zone = getZone(zoneId);
  return {
    institutionId: zone ? zone.institutionId : "otra",
    priority: category.basePriority,
    slaHours: PRIORITY_META[category.basePriority].slaHours,
    matchedRuleId: null,
    source: "ayuntamiento_de_la_zona_por_defecto",
  };
}

/* --- Operaciones de administrador sobre el motor de reglas (mock in-memory,
       simulan lo que en producción serían INSERT/UPDATE en Postgres) --- */

/** Un admin da de alta una institución nueva (ej. una nueva distribuidora o
    un ayuntamiento que se incorpora a la plataforma). */
export function addInstitution({ name, short, kind }) {
  const institution = { id: uid("inst"), name, short, kind, active: true, isSeed: false, createdAt: Date.now() };
  INSTITUTIONS.push(institution);
  return institution;
}

export function deactivateInstitution(institutionId) {
  const inst = getInstitution(institutionId);
  if (inst) inst.active = false;
  // Las reglas que apuntaban a esa institución se desactivan con ella —
  // así nunca queda un caso nuevo enrutado a una institución inactiva.
  ROUTING_RULES.filter((r) => r.institutionId === institutionId).forEach((r) => { r.active = false; });
  return inst;
}

/** Un admin crea una regla de enrutamiento nueva (por categoría, opcionalmente
    limitada a una zona) — esto es exactamente el flujo de "asignar
    institución" que pediste que fuera más profesional e inteligente. */
export function addRoutingRule({ categoryId, zoneId = null, institutionId, priority = null, slaHoursOverride = null, description }) {
  const rule = {
    id: uid("rt"), categoryId, zoneId, institutionId, priority, slaHoursOverride,
    description, active: true, isSeed: false, createdAt: Date.now(),
  };
  ROUTING_RULES.push(rule);
  return rule;
}

export function deactivateRoutingRule(ruleId) {
  const rule = ROUTING_RULES.find((r) => r.id === ruleId);
  if (rule) rule.active = false;
  return rule;
}

/* ---------------------------------------------------------------------------
   reports — hecho central, con contenido base realista por semilla
--------------------------------------------------------------------------- */

function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }

export const REPORTS = REPORT_SEEDS.map((seed, i) => {
  const statusRoll = rand();
  const status = statusRoll < 0.30 ? "recibido" : statusRoll < 0.58 ? "en_proceso" : statusRoll < 0.85 ? "resuelto" : "cerrado";
  const daysAgo = 1 + Math.floor(rand() * 25);
  const createdAt = now - daysAgo * DAY - Math.floor(rand() * DAY);
  const zone = getZone(seed.zone);
  const isDuplicate = i === 8 || i === 16;

  // Enrutamiento por reglas: institución + prioridad + SLA base según
  // categoría y zona (ver ROUTING_RULES). Luego se simula el triage humano
  // que ocurriría al recibir el caso: ~12% se degrada un nivel (parece menor
  // al inspeccionarlo) y ~15% se escala un nivel (evidencia de mayor riesgo
  // en la descripción/fotos) — nunca salta más de un nivel de golpe.
  const routing = resolveRouting(seed.zone, seed.category);
  const triageRoll = rand();
  const priority = triageRoll > 0.85 ? escalatePriority(routing.priority) : triageRoll < 0.12 ? deescalatePriority(routing.priority) : routing.priority;
  const slaHours = PRIORITY_META[priority].slaHours;

  return {
    id: `r${i + 1}`,
    authorId: pick(CITIZEN_IDS),
    isAnonymous: rand() < 0.25,
    categoryId: seed.category,
    zoneId: seed.zone,
    institutionId: routing.institutionId,
    routingRuleId: routing.matchedRuleId,
    routingSource: routing.source,
    description: seed.desc,
    lat: zone.lat + (rand() - 0.5) * 0.03,
    lng: zone.lng + (rand() - 0.5) * 0.03,
    status,
    priority,
    slaHours,
    isDuplicate,
    duplicateOfReportId: isDuplicate ? "r9" : null,
    distanceM: Math.floor(80 + rand() * 9000),
    createdAt,
    updatedAt: status === "recibido" ? createdAt : now - Math.floor(rand() * daysAgo) * DAY,
  };
});

export const getReportById = (id) => REPORTS.find((r) => r.id === id);

/* ---------------------------------------------------------------------------
   report_photos — 1:N con reports (normalizado, una fila por archivo)
--------------------------------------------------------------------------- */
export const REPORT_PHOTOS = REPORTS.flatMap((r, i) => {
  const count = 1 + Math.floor(rand() * 4);
  return Array.from({ length: count }, (_, p) => ({
    id: `ph-${r.id}-${p}`,
    reportId: r.id,
    url: `https://picsum.photos/seed/tureporte-${i}-${p}/640/480`,
    position: p,
  }));
});

export const getPhotosForReport = (reportId) =>
  REPORT_PHOTOS.filter((p) => p.reportId === reportId).sort((a, b) => a.position - b.position);

/* ---------------------------------------------------------------------------
   report_status_history — bitácora auditable de cambios de estado
--------------------------------------------------------------------------- */
export const REPORT_STATUS_HISTORY = REPORTS.flatMap((r) => {
  const institution = getInstitution(r.institutionId);
  const daysSinceCreated = Math.floor((now - r.createdAt) / DAY);
  const events = [
    { id: `sh-${r.id}-1`, reportId: r.id, status: "recibido", changedAt: r.createdAt, actorType: "ciudadano", actorLabel: "Ciudadano", note: null },
  ];
  if (r.status !== "recibido") {
    events.push({
      id: `sh-${r.id}-2`, reportId: r.id, status: "en_proceso",
      changedAt: r.createdAt + Math.min(1, daysSinceCreated) * DAY,
      actorType: "sistema", actorLabel: "Sistema de asignación",
      note: `Asignado a ${institution.short}`,
    });
  }
  if (r.status === "resuelto" || r.status === "cerrado") {
    events.push({
      id: `sh-${r.id}-3`, reportId: r.id, status: "resuelto",
      changedAt: r.updatedAt,
      actorType: "institucion", actorLabel: institution.short,
      note: "Trabajo completado en sitio",
    });
  }
  if (r.status === "cerrado") {
    events.push({
      id: `sh-${r.id}-4`, reportId: r.id, status: "cerrado",
      changedAt: Math.min(now, r.updatedAt + DAY),
      actorType: "sistema", actorLabel: "Sistema",
      note: "Caso cerrado tras confirmación del ciudadano",
    });
  }
  return events;
});

export const getHistoryForReport = (reportId) =>
  REPORT_STATUS_HISTORY.filter((h) => h.reportId === reportId).sort((a, b) => a.changedAt - b.changedAt);

/* ---------------------------------------------------------------------------
   assignments — gestor institucional responsable de cada reporte
--------------------------------------------------------------------------- */
export const ASSIGNMENTS = REPORTS.filter((r) => r.status !== "recibido").map((r) => {
  const candidateGestores = USERS.filter((u) => u.role === "gestor" && u.institutionId === r.institutionId);
  const gestor = candidateGestores.length ? pick(candidateGestores) : null;
  return {
    id: `as-${r.id}`,
    reportId: r.id,
    institutionId: r.institutionId,
    gestorUserId: gestor ? gestor.id : null,
    assignedAt: r.createdAt + DAY,
  };
});

export const getAssignmentForReport = (reportId) =>
  ASSIGNMENTS.find((a) => a.reportId === reportId) || null;

/* ---------------------------------------------------------------------------
   satisfaction_ratings — encuesta de cierre (0..1 por reporte resuelto)
--------------------------------------------------------------------------- */
export const SATISFACTION_RATINGS = REPORTS
  .filter((r) => r.status === "resuelto" && rand() > 0.35)
  .map((r) => ({
    id: `sr-${r.id}`,
    reportId: r.id,
    citizenUserId: r.authorId,
    score: 3 + Math.floor(rand() * 3), // 3..5
    submittedAt: r.updatedAt + Math.floor(rand() * 2) * DAY,
  }));

export const getRatingForReport = (reportId) =>
  SATISFACTION_RATINGS.find((s) => s.reportId === reportId) || null;

/* ---------------------------------------------------------------------------
   Funciones de lectura — el "join" que haría una API real.
   La UI SIEMPRE debe leer a través de estas funciones, nunca de las tablas
   crudas de arriba directamente.
--------------------------------------------------------------------------- */

function denormalize(report) {
  const author = getUser(report.authorId);
  const rule = report.routingRuleId ? ROUTING_RULES.find((r) => r.id === report.routingRuleId) : null;
  return {
    ...report,
    category: getCategory(report.categoryId),
    zone: getZone(report.zoneId),
    institution: getInstitution(report.institutionId),
    author,
    authorName: report.isAnonymous ? "Usuario anónimo" : author?.name ?? "Ciudadano",
    photos: getPhotosForReport(report.id).map((p) => p.url),
    routingExplanation: rule?.description ?? "Asignado al ayuntamiento del municipio donde ocurrió la incidencia.",
  };
}

/** Feed público — reportes denormalizados con lo mínimo para una tarjeta. */
export function getReportFeed() {
  return [...REPORTS].sort((a, b) => b.createdAt - a.createdAt).map(denormalize);
}

/** Detalle completo de un reporte: fotos, historial, asignación y rating. */
export function getReportDetail(reportId) {
  const report = getReportById(reportId);
  if (!report) return null;
  const assignment = getAssignmentForReport(reportId);
  return {
    ...denormalize(report),
    history: getHistoryForReport(reportId),
    assignment: assignment && {
      ...assignment,
      gestor: assignment.gestorUserId ? getUser(assignment.gestorUserId) : null,
    },
    rating: getRatingForReport(reportId),
  };
}

export function getReportsForCitizen(userId) {
  return REPORTS.filter((r) => r.authorId === userId).map(denormalize);
}

export function getReportsForInstitution(institutionId) {
  return REPORTS.filter((r) => r.institutionId === institutionId).map(denormalize);
}

/** Agregados operativos para el dashboard de una institución. */
export function getKpisForInstitution(institutionId) {
  const reports = REPORTS.filter((r) => r.institutionId === institutionId);
  const overdue = reports.filter((r) => {
    if (r.status === "resuelto" || r.status === "cerrado") return false;
    const elapsedH = (now - r.createdAt) / 3600000;
    return elapsedH > r.slaHours;
  });
  return {
    total: reports.length,
    recibido: reports.filter((r) => r.status === "recibido").length,
    en_proceso: reports.filter((r) => r.status === "en_proceso").length,
    resuelto: reports.filter((r) => r.status === "resuelto").length,
    cerrado: reports.filter((r) => r.status === "cerrado").length,
    vencidos: overdue.length,
  };
}

/** Agregados globales para el dashboard de administración de plataforma. */
export function getPlatformKpis() {
  return {
    totalReports: REPORTS.length,
    totalCitizens: CITIZEN_IDS.length,
    totalGestores: GESTOR_IDS.length,
    resolvedRate: Math.round((REPORTS.filter((r) => r.status === "resuelto" || r.status === "cerrado").length / REPORTS.length) * 100),
    avgSatisfaction: (
      SATISFACTION_RATINGS.reduce((sum, s) => sum + s.score, 0) / (SATISFACTION_RATINGS.length || 1)
    ).toFixed(1),
  };
}

/** Crea un nuevo reporte (simula un INSERT + las filas dependientes). */
export function createReport({ authorId, isAnonymous, categoryId, zoneId, description, lat, lng, photos = [] }) {
  const routing = resolveRouting(zoneId, categoryId);
  const report = {
    id: uid("r"),
    authorId, isAnonymous, categoryId, zoneId,
    institutionId: routing.institutionId,
    routingRuleId: routing.matchedRuleId,
    routingSource: routing.source,
    description,
    lat, lng,
    status: "recibido",
    priority: routing.priority,
    slaHours: routing.slaHours,
    isDuplicate: false,
    duplicateOfReportId: null,
    distanceM: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  REPORTS.unshift(report);
  photos.forEach((url, p) => REPORT_PHOTOS.push({ id: uid("ph"), reportId: report.id, url, position: p }));
  REPORT_STATUS_HISTORY.push({
    id: uid("sh"), reportId: report.id, status: "recibido",
    changedAt: report.createdAt, actorType: "ciudadano", actorLabel: "Ciudadano", note: null,
  });
  return denormalize(report);
}
