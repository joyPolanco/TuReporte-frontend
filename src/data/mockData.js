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
  ZONES, getZone, getInstitution, getCategory, routeToInstitution,
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

/* ---------------------------------------------------------------------------
   reports — hecho central, con contenido base realista por semilla
--------------------------------------------------------------------------- */
const REPORT_SEEDS = [
  { desc: "Bache profundo en la Av. Independencia que ya ha dañado varios vehículos.", category: "calles", zone: "dn" },
  { desc: "Poste de luz apagado desde hace dos semanas en la calle Duarte; la zona queda muy oscura de noche.", category: "alumbrado", zone: "sde" },
  { desc: "Acumulación de basura en el solar baldío junto al colmado; atrae insectos y mal olor.", category: "basura", zone: "sdn" },
  { desc: "Alcantarilla destapada representa un peligro serio para peatones y motoristas.", category: "alcantarillado", zone: "sdo" },
  { desc: "Llevamos 5 días sin agua en el sector; varias familias no tienen cómo abastecerse.", category: "agua", zone: "alc" },
  { desc: "Vertido de aguas residuales está contaminando la cañada cercana al parque.", category: "ambiente", zone: "bch" },
  { desc: "Un colmado ha invadido la acera con mesas y sillas, obligando a los peatones a caminar por la calle.", category: "ocupacion", zone: "dn" },
  { desc: "Semáforo dañado en un cruce peligroso cerca de la escuela primaria.", category: "calles", zone: "sde" },
  { desc: "Tapa de alcantarilla robada; ya hubo un motorista que casi cae dentro.", category: "alcantarillado", zone: "dn" },
  { desc: "Fuga de agua potable corriendo por la calle desde hace tres días sin atención.", category: "agua", zone: "sdn" },
  { desc: "Zona sin alumbrado genera inseguridad para quienes regresan de noche del trabajo.", category: "alumbrado", zone: "sdo" },
  { desc: "Basura acumulada frente al parque infantil, riesgo para los niños que juegan ahí.", category: "basura", zone: "alc" },
  { desc: "La quema de basura a cielo abierto está afectando la respiración de varias familias.", category: "ambiente", zone: "pbr" },
  { desc: "Vendedores ambulantes ocupan el espacio público sin permiso, dificultando el paso de sillas de ruedas.", category: "ocupacion", zone: "sag" },
  { desc: "Calle completamente inundada tras la lluvia; queda intransitable por horas.", category: "calles", zone: "bch" },
  { desc: "Cables eléctricos sueltos y a baja altura representan riesgo de incendio.", category: "otro", zone: "sde" },
  { desc: "Contenedor de basura desbordado desde hace más de una semana sin recolección.", category: "basura", zone: "dn" },
  { desc: "Falta de presión de agua afecta a todo el residencial desde el fin de semana.", category: "agua", zone: "sdo" },
  { desc: "Árbol caído bloquea parcialmente la vía principal tras la tormenta.", category: "ambiente", zone: "alc" },
  { desc: "Parque comunitario con equipos dañados y vidrios rotos en el área de juegos.", category: "otro", zone: "sag" },
  { desc: "Calle sin señalización adecuada ha provocado varios accidentes menores.", category: "calles", zone: "sdn" },
  { desc: "Fuerte olor a gas cerca del mercado municipal; los vecinos están preocupados.", category: "otro", zone: "dn" },
  { desc: "Cañada acumula desechos plásticos y genera criaderos de mosquitos.", category: "ambiente", zone: "sde" },
  { desc: "Bomba de agua comunitaria dañada; el sector completo se queda sin servicio.", category: "agua", zone: "pbr" },
  { desc: "Poste inclinado a punto de caer sobre la acera tras las últimas lluvias.", category: "alumbrado", zone: "bch" },
  { desc: "Depósito de escombros de construcción abandonado ocupa media calle.", category: "ocupacion", zone: "sdo" },
];

function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }

export const REPORTS = REPORT_SEEDS.map((seed, i) => {
  const statusRoll = rand();
  const status = statusRoll < 0.30 ? "recibido" : statusRoll < 0.58 ? "en_proceso" : statusRoll < 0.85 ? "resuelto" : "cerrado";
  const priorityRoll = rand();
  const priority = priorityRoll < 0.35 ? "media" : priorityRoll < 0.60 ? "alta" : priorityRoll < 0.80 ? "baja" : "urgente";
  const slaHours = { baja: 168, media: 120, alta: 72, urgente: 24 }[priority];
  const daysAgo = 1 + Math.floor(rand() * 25);
  const createdAt = now - daysAgo * DAY - Math.floor(rand() * DAY);
  const zone = getZone(seed.zone);
  const institutionId = routeToInstitution(seed.zone, seed.category);
  const isDuplicate = i === 8 || i === 16;

  return {
    id: `r${i + 1}`,
    authorId: pick(CITIZEN_IDS),
    isAnonymous: rand() < 0.25,
    categoryId: seed.category,
    zoneId: seed.zone,
    institutionId,
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
  return {
    ...report,
    category: getCategory(report.categoryId),
    zone: getZone(report.zoneId),
    institution: getInstitution(report.institutionId),
    author,
    authorName: report.isAnonymous ? "Ciudadano anónimo" : author?.name ?? "Ciudadano",
    photos: getPhotosForReport(report.id).map((p) => p.url),
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
  const institutionId = routeToInstitution(zoneId, categoryId);
  const priority = "media";
  const report = {
    id: uid("r"),
    authorId, isAnonymous, categoryId, zoneId, institutionId, description,
    lat, lng,
    status: "recibido",
    priority,
    slaHours: 120,
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
