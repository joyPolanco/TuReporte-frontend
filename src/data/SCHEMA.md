# TuReporte — Modelo de Datos

Este documento describe el diseño de base de datos que el `mockData.js` simula.
No hay backend todavía: cada "tabla" es un arreglo en memoria con claves primarias
(`id`) y claves foráneas (`*Id`) exactamente como se guardarían en Postgres. El
objetivo es que migrar a una base de datos real sea un cambio de capa de acceso
a datos, no un rediseño del modelo.

## Diagrama de entidades

```
institutions ──┐
               │ 1:N
zones ─────────┼──< reports >──┐ 1:N          1:N
  │            │       │       ├──< report_photos
  │ 1:N        │       │ 1:N   │
  └─< users    │       ├──< report_status_history
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
| campo | tipo |
|---|---|
| id | PK string |
| label | string |
| defaultInstitutionKind | enum | a qué tipo de institución se enruta por defecto |

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
| priority | enum | `baja` \| `media` \| `alta` \| `urgente` |
| slaHours | int | plazo de atención según prioridad |
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
