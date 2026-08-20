/* ============================================================================
   TuReporte — Utilidades genéricas (sin conocimiento del dominio)
   ============================================================================ */

export function timeAgo(ts) {
  const diff = Date.now() - ts;
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "hace instantes";
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `hace ${d} d`;
  return `hace ${Math.floor(d / 30)} mes(es)`;
}

export function formatDate(ts) {
  return new Date(ts).toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDistance(m) {
  if (m < 1000) return `a ${m} m`;
  return `a ${(m / 1000).toFixed(1)} km`;
}

export function avatarUrl(seed) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear&fontWeight=600`;
}

export function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Horas restantes (negativas si ya venció) respecto al SLA de un reporte. */
export function slaRemaining(report) {
  const elapsedH = (Date.now() - report.createdAt) / 3600000;
  return Math.round(report.slaHours - elapsedH);
}

/** Generador pseudoaleatorio determinista — la data mock siempre es igual
    entre recargas, en vez de cambiar aleatoriamente en cada render. */
export function seededRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++)
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return () => {
    h = (Math.imul(1103515245, h) + 12345) | 0;
    return ((h >>> 0) % 1000) / 1000;
  };
}

/** Agrupa un arreglo por el resultado de keyFn — para KPIs y agregados. */
export function groupBy(arr, keyFn) {
  return arr.reduce((acc, item) => {
    const k = keyFn(item);
    (acc[k] ||= []).push(item);
    return acc;
  }, {});
}
