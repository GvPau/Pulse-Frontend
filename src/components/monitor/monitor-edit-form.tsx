import { useMemo, useState } from 'react'
import { cn } from 'cn'
import { CircleAlertIcon, Loader2Icon } from 'lucide-react'
import type { MonitorRequest, MonitorWithStatus } from '@/api/types'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { toRequest } from '@/components/dashboard/utils'

const PROTOCOLS = ['https://', 'http://']
const METODOS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const INTERVALOS = [30, 60, 300, 900]
const ESPERAS = [5, 10, 30]
const UMBRALES = [1, 2, 3, 5]
const ESTATUS = [
  { code: '200', label: '200 · OK' },
  { code: '201', label: '201 · Creado' },
  { code: '204', label: '204 · Sin contenido' },
  { code: '301', label: '301 · Movido permanentemente' },
  { code: '302', label: '302 · Movido temporalmente' },
  { code: '401', label: '401 · No autorizado' },
  { code: '404', label: '404 · No encontrado' },
]

function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
  className,
}: {
  label: React.ReactNode
  htmlFor?: string
  required?: boolean
  error?: React.ReactNode
  hint?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-4 last:mb-0', className)}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-[13px] font-medium tracking-[-0.005em] text-foreground"
      >
        {label}
        {required && (
          <span className="ml-1 font-normal text-muted-foreground">· obligatorio</span>
        )}
      </label>
      {children}
      {hint != null && (
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{hint}</p>
      )}
      {error != null && (
        <p
          role="alert"
          className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-down"
        >
          <CircleAlertIcon className="size-3 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  )
}

export function MonitorEditForm({
  monitor,
  isSaving,
  onSave,
  onCancel,
}: {
  monitor: MonitorWithStatus
  isSaving: boolean
  onSave: (body: MonitorRequest) => void
  onCancel: () => void
}) {
  const initial = useMemo(() => {
    const body = toRequest(monitor)
    const parsed = /^(https?:\/\/)/i.exec(body.url)
    return {
      ...body,
      proto: parsed?.[1] ?? 'https://',
      hostless: parsed ? body.url.slice(parsed[1].length) : body.url,
    }
  }, [monitor])

  const [proto, setProto] = useState<string>(initial.proto)
  const [url, setUrl] = useState<string>(initial.hostless)
  const [nombre, setNombre] = useState<string>(initial.name)
  const [metodo, setMetodo] = useState<string>(initial.method)
  const [intervalo, setIntervalo] = useState<number>(initial.interval_seconds)
  const [espera, setEspera] = useState<number>(initial.timeout_seconds)
  const [estatus, setEstatus] = useState<string>(String(initial.expected_status))
  const [umbral, setUmbral] = useState<number>(initial.failure_threshold)
  const [activo, setActivo] = useState<boolean>(initial.active)

  const [touched, setTouched] = useState<{ url?: boolean; nombre?: boolean }>({})

  const host = useMemo(() => `${proto}${url.trim()}`, [proto, url])
  const hasSpace = url.includes(' ')
  const urlOk = /^[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/\S*)?$/i.test(url.trim())
  const nameOk = nombre.trim().length > 0
  const timeOk = espera < intervalo
  const valid = urlOk && nameOk && timeOk

  const urlError = touched.url && !urlOk
  const nombreError = touched.nombre && !nameOk

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ url: true, nombre: true })
    if (!valid || isSaving) return
    onSave({
      name: nombre.trim(),
      url: host,
      method: metodo,
      expected_status: Number(estatus),
      interval_seconds: intervalo,
      timeout_seconds: espera,
      active: activo,
      failure_threshold: umbral,
    })
  }

  return (
    <form noValidate onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
          <CardDescription>
            Los cambios se aplican de inmediato; la próxima comprobación se reprograma
            con el nuevo intervalo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field
            label="URL de destino"
            htmlFor="url"
            required
            error={
              urlError
                ? hasSpace
                  ? 'La URL no puede llevar espacios.'
                  : 'Escribe un dominio válido, por ejemplo example.com/health.'
                : null
            }
          >
            <div
              className={cn(
                'flex h-8 w-full items-stretch overflow-hidden rounded-lg border border-input bg-transparent transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
                urlError &&
                  'border-destructive/60 focus-within:border-destructive/60 focus-within:ring-destructive/15'
              )}
            >
              <Select value={proto} onValueChange={(v) => v != null && setProto(v)}>
                <SelectTrigger
                  aria-label="Protocolo"
                  className="h-8 w-auto min-w-0 shrink-0 rounded-none border-0 border-r border-input bg-muted px-1.5 pl-2.5 text-[13px] font-medium text-muted-foreground focus-visible:ring-0 data-[selected=true]:text-foreground dark:bg-muted dark:hover:bg-muted"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  align="start"
                  className="min-w-24"
                >
                  {PROTOCOLS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="url"
                type="text"
                spellCheck={false}
                autoComplete="off"
                placeholder="example.com/health"
                value={url}
                aria-invalid={urlError || undefined}
                onChange={(e) => {
                  setUrl(e.target.value)
                  setTouched((t) => ({ ...t, url: true }))
                }}
                className="h-8 min-w-0 flex-1 rounded-none border-0 bg-transparent px-2.5 font-mono text-[13px] shadow-none focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent"
              />
            </div>
          </Field>

          <div className="grid gap-4 min-[420px]:grid-cols-[minmax(0,1fr)_160px]">
            <Field
              label="Nombre"
              htmlFor="nombre"
              required
              error={nombreError ? 'Ponle un nombre para reconocerlo.' : null}
              className="mb-0"
            >
              <Input
                id="nombre"
                type="text"
                placeholder="API de pagos"
                value={nombre}
                aria-invalid={nombreError || undefined}
                onChange={(e) => {
                  setNombre(e.target.value)
                  setTouched((t) => ({ ...t, nombre: true }))
                }}
                className="h-8"
              />
            </Field>

            <Field label="Método" htmlFor="metodo" className="mb-0">
              <Select value={metodo} onValueChange={(v) => v != null && setMetodo(v)}>
                <SelectTrigger id="metodo" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METODOS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="mt-4 grid gap-4 min-[420px]:grid-cols-2">
            <Field
              label="Intervalo entre comprobaciones"
              error={!timeOk ? 'Debe ser mayor que la espera.' : null}
            >
              <ToggleGroup
                aria-label="Intervalo entre comprobaciones"
                spacing={0.5}
                value={[String(intervalo)]}
                onValueChange={(v) => {
                  const n = v[0]
                  if (n) setIntervalo(Number(n))
                }}
                className="w-fit flex-wrap rounded-[9px] bg-muted p-[3px]"
              >
                {INTERVALOS.map((s) => (
                  <ToggleGroupItem
                    key={s}
                    value={String(s)}
                    className="h-8 rounded-[6px] px-2.5 text-[13px] font-medium tabular-nums text-muted-foreground hover:bg-transparent hover:text-foreground aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-sm data-[pressed]:bg-card data-[pressed]:text-foreground"
                  >
                    {s <= 60 ? `${s} s` : `${s / 60} min`}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>

            <Field
              label="Tiempo máximo de espera"
              error={
                !timeOk
                  ? 'La espera debe ser menor que el intervalo: baja la espera o comprueba cada más tiempo.'
                  : null
              }
            >
              <ToggleGroup
                aria-label="Tiempo máximo de espera"
                spacing={0.5}
                value={[String(espera)]}
                onValueChange={(v) => {
                  const n = v[0]
                  if (n) setEspera(Number(n))
                }}
                className="flex-wrap rounded-[9px] bg-muted p-[3px]"
              >
                {ESPERAS.map((s) => (
                  <ToggleGroupItem
                    key={s}
                    value={String(s)}
                    className="h-8 rounded-[6px] px-2.5 text-[13px] font-medium tabular-nums text-muted-foreground hover:bg-transparent hover:text-foreground aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-sm data-[pressed]:bg-card data-[pressed]:text-foreground"
                  >
                    {s} s
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
          </div>

          <div className="mt-4 grid gap-4 min-[420px]:grid-cols-2">
            <Field label="Estatus HTTP esperado" htmlFor="estatus">
              <Select value={estatus} onValueChange={(v) => v != null && setEstatus(v)}>
                <SelectTrigger id="estatus" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTATUS.map((s) => (
                    <SelectItem key={s.code} value={s.code}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Fallos seguidos para abrir incidente"
              hint={
                umbral === 1
                  ? 'Avisaremos al primer fallo.'
                  : `Toleramos ${umbral - 1} fallo${
                      umbral - 1 === 1 ? '' : 's'
                    } suelto${umbral - 1 === 1 ? '' : 's'} antes de avisar.`
              }
            >
              <ToggleGroup
                aria-label="Fallos seguidos para abrir incidente"
                spacing={0.5}
                value={[String(umbral)]}
                onValueChange={(v) => {
                  const n = v[0]
                  if (n) setUmbral(Number(n))
                }}
                className="flex-wrap rounded-[9px] bg-muted p-[3px]"
              >
                {UMBRALES.map((n) => (
                  <ToggleGroupItem
                    key={n}
                    value={String(n)}
                    className="h-8 rounded-[6px] px-2.5 text-[13px] font-medium tabular-nums text-muted-foreground hover:bg-transparent hover:text-foreground aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-sm data-[pressed]:bg-card data-[pressed]:text-foreground"
                  >
                    {n}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <Label className="cursor-pointer">
            <Switch
              checked={activo}
              onCheckedChange={setActivo}
              disabled={isSaving}
              aria-label="Monitor activo"
            />
            <span className="text-[13px] font-medium">
              {activo ? 'Activo' : 'En pausa'}
              <span className="block text-[11.5px] font-normal leading-snug text-muted-foreground">
                {activo
                  ? 'Se seguirán programando comprobaciones.'
                  : 'No se comprobará hasta que lo reanudes.'}
              </span>
            </span>
          </Label>
          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!valid || isSaving} className="min-w-[132px]">
              {isSaving ? (
                <>
                  <Loader2Icon className="animate-spin" aria-hidden />
                  Guardando…
                </>
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  )
}