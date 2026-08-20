# TuReporte — Frontend MVP (React + Vite)

Plataforma digital de gestión de incidencias comunitarias para el Distrito Nacional
y la provincia Santo Domingo (proyecto ITLA — Grupo 45). Este paquete es **solo
frontend**: todos los datos (usuarios, reportes, OCR de cédula, mapa) están
simulados en memoria para poder demostrar el flujo completo sin backend.

## Requisitos

- Node.js 18 o superior
- npm 9 o superior

## Instalación

```bash
npm install
```

## Ejecutar en modo desarrollo

```bash
npm run dev
```

Esto abre la app en `http://localhost:5173`.

## Compilar para producción

```bash
npm run build
npm run preview   # sirve el build de dist/ localmente
```

## Estructura del proyecto

```
tureporte-frontend/
├─ index.html
├─ package.json
├─ vite.config.js
├─ tailwind.config.js
├─ postcss.config.js
└─ src/
   ├─ main.jsx      # punto de entrada de React
   ├─ index.css     # directivas de Tailwind
   └─ App.jsx        # toda la aplicación (auth, ciudadano, gestor, admin)
```

## Qué incluye el MVP

- **Autenticación simulada**: login + registro en 2 pasos (datos personales →
  validación OCR simulada de cédula) con accesos rápidos de demostración para
  los 3 roles (Ciudadano, Gestor, Administrador).
- **Ciudadano**: feed comunitario tipo red social (fotos, likes, comentarios,
  autor visible o anónimo), creación de reportes con hasta 5 fotos, mapa de
  zonas, perfil con gamificación (puntos, niveles, logros) y control de
  perfil público/privado.
- **Gestor** (clasifica y asigna reportes a una institución): bandeja de
  reportes, prioridad y SLA, detalle con línea de tiempo, mapa de su
  cobertura.
- **Administrador**: dashboard de KPIs y métricas organizacionales (gráficas
  con Recharts), cumplimiento de SLA por institución, gestión de usuarios,
  mapa a nivel de Gran Santo Domingo y nacional.

## Conectar con un backend real

Todo el estado mock vive en el componente raíz `App` dentro de `src/App.jsx`
(`reports`, `users`, `commentsMap`, el flujo de OCR en `RegisterOcrStep`,
etc.). Para integrar un backend real, sustituye esos `useState` iniciales por
llamadas a tu API (fetch/axios) y reemplaza la simulación de OCR por la
llamada real al servicio de reconocimiento de documentos.

## Dependencias principales

- [React 18](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [lucide-react](https://lucide.dev/) — iconografía
- [Recharts](https://recharts.org/) — gráficas del panel de administración
"# TuReporte-frontend" 
