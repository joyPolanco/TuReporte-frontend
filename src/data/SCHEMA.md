# TuReporte — Modelo de Datos

Este documento describe el diseño de base de datos que el `mockData.js` simula.
No hay backend todavía: cada "tabla" es un arreglo en memoria con claves primarias
(`id`) y claves foráneas (`*Id`) exactamente como se guardarían en Postgres. El
objetivo es que migrar a una base de datos real sea un cambio de capa de acceso
a datos, no un rediseño del modelo.

## Diagrama de entidades

```
institutions ──┬───────────────────────────────< institution_routing_rules >── categories
               │ 1:N                                       │
zones ─────────┼──< reports >──┐ 1:N          1:N           │ resuelve institución
  │            │       │       ├──< report_photos           │ + prioridad + SLA
  │ 1:N        │       │ 1:N   │                             ▼
  └─< users    │       ├──< report_status_history      (reports.routingRuleId)
      (ciudadano)      │       │
users(gestor) ─┘       ├──< assignments >── users(gestor)
  │                    │
  └───────────────────>│
                        └──< satisfaction_ratings >── users(ciudadano)

categories ─────< reports
```

## Tablas

### `institutions`
Entidades gubernamentales que reciben y resuelven reportes (ayuntamientos,
CAASD, INAPA, MOPC, Medio Ambiente, distribuidoras eléctricas).
| campo | tipo | descripción |
|---|---|---|
| id | PK string | slug estable, ej. `caasd` |
| name | string | nombre completo |
| short | string | nombre corto para UI |
| kind | enum | `ayuntamiento` \| `institucion_nacional` \| `distribuidora` |
| active | bool | si puede recibir casos nuevos hoy (soft delete, nunca DELETE) |
| isSeed | bool | `true` = precargada al lanzar; `false` = creada por un admin |
| createdAt | timestamp | |

### `institution_routing_rules`
Motor de asignación: qué institución recibe cada tipo de incidencia, y con
qué urgencia por defecto. Es la tabla que un panel de administración editaría
en producción — reemplaza cualquier `if/else` fijo en código. Un admin la
alimenta creando reglas (`addRoutingRule`) o retirando una institución
(`deactivateInstitution`, que desactiva en cascada sus reglas).
| campo | tipo | descripción |
|---|---|---|
| id | PK string | |
| categoryId | FK → categories | |
| zoneId | FK → zones (nullable) | `null` = regla nacional, aplica a cualquier zona sin regla más específica |
| institutionId | FK → institutions | |
| priority | enum (nullable) | si se omite, usa `categories.basePriority` |
| slaHoursOverride | int (nullable) | horas de SLA específicas para esta regla, si difieren del SLA estándar de la prioridad |
| description | string | justificación legible (ej. "CAASD es el operador único de acueducto…") |
| active | bool | soft delete |
| isSeed | bool | precargada vs. creada por un admin |
| createdAt | timestamp | |

**Resolución** (`resolveRouting(zoneId, categoryId)`, la única función que
debe llamar la UI): 1) regla activa de esa categoría+zona exacta → 2) regla
activa nacional de esa categoría (`zoneId = null`) → 3) si ninguna aplica,
cae al ayuntamiento dueño de la zona con la prioridad base de la categoría.
Cada reporte generado guarda `routingRuleId` y `routingSource`, así queda
trazable *por qué* terminó en tal institución — como lo haría un log de
auditoría real.

### `zones`
Municipios/distritos del Gran Santo Domingo, con coordenadas reales para el mapa.
| campo | tipo | descripción |
|---|---|---|
| id | PK string | ej. `dn` |
| name | string | nombre del municipio |
| lat, lng | float | centro geográfico real |
| institutionId | FK → institutions | ayuntamiento responsable de la zona |
| population | int | referencia demográfica (censo aproximado) |

### `categories`
Diccionario cerrado de tipos de incidencia (enum de negocio).
| campo | tipo | descripción |
|---|---|---|
| id | PK string | |
| label | string | |
| defaultInstitutionKind | enum | tipo de institución al que suele enrutar (referencial) |
| basePriority | enum | urgencia de referencia cuando ninguna regla de `institution_routing_rules` la especifica |

### `users`
Tabla única con discriminador `role` (`ciudadano` \| `gestor` \| `admin`), como
en un sistema de auth real con roles.
| campo | tipo | aplica a | descripción |
|---|---|---|---|
| id | PK string | todos | |
| role | enum | todos | `ciudadano` \| `gestor` \| `admin` |
| name | string | todos | |
| cedula | string | todos | documento de identidad (formato RD) |
| phone, email | string | todos | |
| isPublic | bool | ciudadano | perfil visible en reportes no anónimos |
| zoneId | FK → zones | ciudadano | zona de residencia declarada |
| institutionId | FK → institutions | gestor | institución para la que trabaja |
| createdAt | timestamp | todos | alta en el sistema |

### `reports`
Tabla central (hecho). Un reporte ciudadano de una incidencia.
| campo | tipo | descripción |
|---|---|---|
| id | PK string | |
| authorId | FK → users | autor real (aunque sea anónimo de cara al público) |
| isAnonymous | bool | oculta autor en la UI pública |
| categoryId | FK → categories | |
| zoneId | FK → zones | |
| institutionId | FK → institutions | asignación calculada por zona+categoría |
| description | string | |
| lat, lng | float | ubicación real del incidente (para el mapa) |
| status | enum | `recibido` → `en_proceso` → `resuelto` → `cerrado` |
| priority | enum | `baja` \| `media` \| `alta` \| `urgente` (resultado del motor de reglas + triage) |
| slaHours | int | plazo de atención (de la regla aplicada, o de la prioridad si no hay override) |
| routingRuleId | FK → institution_routing_rules (nullable) | qué regla asignó institución/prioridad; `null` si fue el fallback por defecto |
| routingSource | enum | `regla_especifica_de_zona` \| `regla_nacional_por_categoria` \| `ayuntamiento_de_la_zona_por_defecto` — trazabilidad de la asignación |
| isDuplicate | bool | |
| duplicateOfReportId | FK → reports (nullable, self) | |
| createdAt, updatedAt | timestamp | |

### `report_photos` (1:N con `reports`)
Antes vivía como `report.photos = [urls]`. Se normaliza para reflejar cómo se
guardaría en almacenamiento real (una fila por archivo subido).
| campo | tipo |
|---|---|
| id | PK string |
| reportId | FK → reports |
| url | string |
| position | int |

### `report_status_history` (1:N con `reports`)
Reemplaza el `timeline` embebido: ahora es una bitácora auditable, como una
tabla de eventos que un backend real generaría en cada cambio de estado.
| campo | tipo |
|---|---|
| id | PK string |
| reportId | FK → reports |
| status | enum |
| changedAt | timestamp |
| actorType | enum | `sistema` \| `institucion` \| `ciudadano` |
| actorLabel | string | nombre a mostrar (institución o "Sistema de asignación") |
| note | string (nullable) |

### `assignments` (1:1 activa por reporte, historial N)
Qué gestor de la institución quedó a cargo del reporte.
| campo | tipo |
|---|---|
| id | PK string |
| reportId | FK → reports |
| institutionId | FK → institutions |
| gestorUserId | FK → users (nullable hasta que se asigna una persona) |
| assignedAt | timestamp |

### `satisfaction_ratings` (0..1 por reporte resuelto)
Encuesta de cierre que el ciudadano autor completa — no es un "comentario"
social, es una fila de evaluación de servicio.
| campo | tipo |
|---|---|
| id | PK string |
| reportId | FK → reports |
| citizenUserId | FK → users |
| score | int 1–5 |
| submittedAt | timestamp |

## Funciones de acceso (simulan consultas/joins de una API)

`mockData.js` no solo expone las tablas crudas: también expone funciones que
hacen el "join" que normalmente haría una API (`GET /reports/:id` devolvería
el reporte con su categoría, zona, institución, fotos e historial embebidos).
Los componentes de UI consumen esas funciones, nunca las tablas crudas
directamente — así el día que exista un backend real, solo cambia la
implementación de estas funciones, no los componentes.

- `getReportFeed()` → reportes + categoría + zona + institución + autor (join denormalizado para tarjetas de feed)
- `getReportDetail(id)` → lo anterior + fotos + historial + asignación + rating
- `getReportsForInstitution(institutionId)`
- `getReportsForCitizen(userId)`
- `getKpisForInstitution(institutionId)` → agregados (conteos por estado, SLA vencido, etc.)
- `resolveRouting(zoneId, categoryId)` → institución + prioridad + SLA + qué regla se usó (el motor de asignación)
- `createReport(datos)` → inserta el reporte ya enrutado con `resolveRouting`, sus fotos y su primer evento de historial

### Operaciones de administrador (simulan INSERT/UPDATE sobre las tablas de arriba)
- `addInstitution({ name, short, kind })` — da de alta una institución nueva
- `deactivateInstitution(institutionId)` — soft delete; desactiva en cascada sus reglas de enrutamiento
- `addRoutingRule({ categoryId, zoneId, institutionId, priority, slaHoursOverride, description })` — crea una regla de asignación
- `deactivateRoutingRule(ruleId)` — retira una regla sin borrar su historial
