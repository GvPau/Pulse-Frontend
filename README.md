# Pulse Frontend

Dashboard web para [Pulse](https://github.com/GvPau/Pulse) — monitorización de
disponibilidad: gestionar monitores, ver estado, métricas e incidentes en tiempo
real.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | React + TypeScript (Vite) |
| Build | Vite |
| UI | shadcn/ui (Radix + Tailwind CSS) |
| Routing | React Router |
| Data / estado | TanStack Query |
| Tiempo real | EventSource (SSE) + hook propio |
| Charts | Recharts |

## Cómo se conecta con el backend

- **Proxy de Vite**: el frontend llama a `/api/*`; Vite lo reenvía al backend
  (`http://localhost:8080`) quitando el prefijo. Si se ejecuta desde WSL y el
  backend es un proceso de Windows (`go.exe`), el target se detecta solo usando
  la IP del host (o se fuerza con `VITE_PROXY_TARGET`).
- **API**: REST en `/api` (auth, monitores, checks, incidentes, métricas).
- **Auth**: JWT en header `Authorization: Bearer <token>` para REST.
- **SSE en vivo**: `EventSource` a `/api/stream` con el token vía `?token=`
  (el navegador no permite cabeceras en EventSource). Envía `check.completed`,
  `incident.opened`/`resolved` y eventos CRUD de monitores.

## Setup

- [x] Scaffold con `create-vite` (React + TS)
- [x] Tailwind + `shadcn@init` con componentes base
- [x] Estructura de carpetas (hooks, components, pages, api)
- [x] Cliente API + hook de SSE
- [ ] Primer commit

Para desarrollo hay que tener el backend arriba: `docker compose up -d db` y
arrancar la API con `DATABASE_URL` en `:8080`.

## Comandos

```sh
npm run dev      # dev server
npm run build    # typecheck + build
npm run lint     # oxlint
```