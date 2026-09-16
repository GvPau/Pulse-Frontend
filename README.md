# Pulse Frontend

Dashboard web para [Pulse](https://github.com/GvPau/Pulse) — monitorización de
disponibilidad: gestionar monitores, ver estado, métricas e incidentes en tiempo
real.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| UI | shadcn/ui (Radix + Tailwind CSS) |
| Routing | React Router |
| Data / estado | TanStack Query |
| Tiempo real | EventSource (SSE) + hook propio |
| Charts | Recharts |

## Cómo se conecta con el backend

- **API**: REST en `http://localhost:8080` (auth, monitores, checks, incidentes, métricas).
- **Auth**: JWT en header `Authorization: Bearer <token>` para REST.
- **SSE en vivo**: `EventSource` a `/stream` con el token vía `?token=`
  (el navegador no permite cabeceras en EventSource). Envía `check.completed`,
  `incident.opened`/`resolved` y eventos CRUD de monitores.

## Setup pendiente

- [ ] Scaffold con `create-vite` (React + TS)
- [ ] Tailwind + `shadcn@init` con componentes base
- [ ] Estructura de carpetas (hooks, components, pages, api)
- [ ] Cliente API + hook de SSE
- [ ] Primer commit