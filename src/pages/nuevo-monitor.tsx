import { useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router"
import { cn } from "cn"
import { CheckIcon, CircleAlertIcon, Loader2Icon } from "lucide-react"
import { ApiError } from "@/api/client"
import { createMonitor } from "@/api/monitors"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { toast } from "sonner"

const PROTOCOLS = ["https://", "http://"]
const METODOS = ["GET", "POST", "PUT", "PATCH", "DELETE"]
const INTERVALOS = [30, 60, 300, 900]
const ESPERAS = [5, 10, 30]
const UMBRALES = [1, 2, 3, 5]
const ESTATUS = [
  { code: "200", label: "200 · OK" },
  { code: "201", label: "201 · Creado" },
  { code: "204", label: "204 · Sin contenido" },
  { code: "301", label: "301 · Movido permanentemente" },
  { code: "302", label: "302 · Movido temporalmente" },
  { code: "401", label: "401 · No autorizado" },
  { code: "404", label: "404 · No encontrado" },
]

const fmtInterval = (s: number) => (s <= 60 ? `${s} s` : `${s / 60} min`)

const DEFAULTS = {
  proto: "https://",
  url: "",
  nombre: "",
  metodo: "GET",
  intervalo: 60,
  espera: 10,
  estatus: "200",
  umbral: 1,
  activo: true,
} as const

function Emphasis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "border-b-[1.5px] border-primary/35 pb-px font-semibold",
        className
      )}
      {...props}
    />
  )
}

function Muted({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span className={cn("text-muted-foreground", className)} {...props} />
  )
}

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
    <div className={cn("mb-4 last:mb-0", className)}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-[13px] font-medium tracking-[-0.005em] text-foreground"
      >
        {label}
        {required && (
          <span className="ml-1 font-normal text-muted-foreground">
            · obligatorio
          </span>
        )}
      </label>
      {children}
      {hint != null && (
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
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

function Section({
  check,
  title,
  desc,
  last,
  children,
}: {
  check: boolean
  title: string
  desc: string
  last?: boolean
  children: React.ReactNode
}) {
  return (
    <section className="grid grid-cols-[22px_minmax(0,1fr)] gap-x-3.5">
      <div className="flex flex-col items-center gap-1.5">
        <span
          className={cn(
            "grid size-5 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors duration-200",
            check ? "border-ok/45 bg-ok/10" : "border-border bg-card"
          )}
        >
          <CheckIcon
            strokeWidth={3}
            aria-hidden
            className={cn(
              "size-3 text-ok transition-[opacity,transform] duration-200",
              check ? "opacity-100" : "scale-50 opacity-0"
            )}
          />
        </span>
        {!last && (
          <span
            aria-hidden
            className="-mb-1.5 w-[1.5px] flex-1 rounded-full bg-border"
          />
        )}
      </div>
      <div className="min-w-0 pb-7">
        <h2 className="text-[14.5px] font-semibold tracking-[-0.01em] text-foreground">
          {title}
        </h2>
        <p className="mt-0.5 mb-3.5 max-w-[62ch] text-[12.5px] leading-relaxed text-muted-foreground">
          {desc}
        </p>
        {children}
      </div>
    </section>
  )
}

export function NuevoMonitorPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [proto, setProto] = useState<string>(DEFAULTS.proto)
  const [url, setUrl] = useState<string>(DEFAULTS.url)
  const [nombre, setNombre] = useState<string>(DEFAULTS.nombre)
  const [metodo, setMetodo] = useState<string>(DEFAULTS.metodo)
  const [intervalo, setIntervalo] = useState<number>(DEFAULTS.intervalo)
  const [espera, setEspera] = useState<number>(DEFAULTS.espera)
  const [estatus, setEstatus] = useState<string>(DEFAULTS.estatus)
  const [umbral, setUmbral] = useState<number>(DEFAULTS.umbral)
  const [activo, setActivo] = useState<boolean>(DEFAULTS.activo)

  const [touched, setTouched] = useState({ url: false, nombre: false })
  const [apiError, setApiError] = useState<React.ReactNode>(null)
  const [discardOpen, setDiscardOpen] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)

  const host = useMemo(() => `${proto}${url.trim()}`, [proto, url])
  const hasSpace = url.includes(" ")
  const urlOk = /^[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/\S*)?$/i.test(url.trim())
  const nameOk = nombre.trim().length > 0
  const timeOk = espera < intervalo

  const urlError = touched.url && !urlOk
  const nombreError = touched.nombre && !nameOk
  const todasOk = urlOk && nameOk && timeOk

  const checklist = [
    { ok: urlOk, label: "Una URL válida a la que llamar" },
    { ok: nameOk, label: "Un nombre para reconocerlo" },
    { ok: timeOk, label: "Espera menor que el intervalo" },
  ]
  const doneCount = checklist.filter((c) => c.ok).length

  const dirty =
    proto !== DEFAULTS.proto ||
    url !== DEFAULTS.url ||
    nombre !== DEFAULTS.nombre ||
    metodo !== DEFAULTS.metodo ||
    intervalo !== DEFAULTS.intervalo ||
    espera !== DEFAULTS.espera ||
    estatus !== DEFAULTS.estatus ||
    umbral !== DEFAULTS.umbral ||
    activo !== DEFAULTS.activo

  const create = useMutation({
    mutationFn: () =>
      createMonitor({
        name: nombre.trim(),
        url: `${proto}${url.trim()}`,
        method: metodo,
        expected_status: Number(estatus),
        interval_seconds: intervalo,
        timeout_seconds: espera,
        active: activo,
        failure_threshold: umbral,
      }),
    onSuccess: async (m) => {
      await queryClient.invalidateQueries({ queryKey: ["monitors"] })
      toast.success("Monitor creado")
      navigate(`/monitores/${m.id}`)
    },
    onError: (e: unknown) => {
      const err = e instanceof ApiError ? e : null
      const code = err?.body?.code
      let content: React.ReactNode =
        "No hemos podido crear el monitor. Inténtalo de nuevo en unos segundos."
      if (code === "conflict" || err?.status === 409) {
        const mid = err?.body?.details?.monitor_id
        content =
          typeof mid === "string" ? (
            <>
              Ya tienes un monitor con esta URL y este método.{" "}
              <Link
                to={`/monitores/${mid}`}
                className="font-medium text-down underline underline-offset-2 hover:text-foreground"
              >
                Abre el monitor existente.
              </Link>
            </>
          ) : (
            "Ya tienes un monitor con esta URL y este método."
          )
      } else if (err?.body?.message) {
        content = err.body.message
      }
      setApiError(content)
    },
  })

  useEffect(() => {
    if (apiError) {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [apiError])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ url: true, nombre: true })
    if (!todasOk || create.isPending) return
    setApiError(null)
    create.mutate()
  }

  const handleCancel = () => {
    if (dirty) setDiscardOpen(true)
    else navigate("/monitores")
  }

  const targetElement = (() => {
    if (urlOk) {
      return (
        <Emphasis className="font-mono tabular-nums">{host}</Emphasis>
      )
    }
    return <Muted>tu URL</Muted>
  })()

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex flex-col gap-1">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground">
          Nuevo monitor
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Dinos qué URL vigilar y cada cuánto. Puedes cambiarlo todo después.
        </p>
      </header>

      <form noValidate onSubmit={onSubmit} className="mt-6 flex flex-1 flex-col">
        <div className="grid flex-1 gap-7 pb-24 min-[901px]:grid-cols-[minmax(0,1fr)_300px] min-[1101px]:grid-cols-[minmax(0,1fr)_340px]">
          <fieldset
            disabled={create.isPending}
            className="flex min-w-0 flex-col gap-1.5"
          >
            {apiError != null && (
              <div
                ref={errorRef}
                role="alert"
                className="border-down/30 mb-3 rounded-xl border bg-down/7 p-3.5"
              >
                <div className="flex items-start gap-2.5">
                  <CircleAlertIcon
                    className="size-4 shrink-0 text-down"
                    aria-hidden
                  />
                  <div className="min-w-0 text-[13px] leading-relaxed">
                    <p className="font-semibold text-down">
                      No se pudo crear el monitor
                    </p>
                    <div className="mt-0.5 text-muted-foreground">
                      {apiError}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Section
              check={urlOk && nameOk}
              title="Qué vigilar"
              desc="La dirección a la que llamaremos y cómo la llamaremos."
            >
              <Field
                label="URL de destino"
                htmlFor="url"
                required
                error={
                  urlError
                    ? hasSpace
                      ? "La URL no puede llevar espacios."
                      : "Escribe un dominio válido, por ejemplo example.com/health."
                    : null
                }
                hint="Usa la ruta más barata que confirme que el servicio vive, por ejemplo /health."
              >
                <div
                  className={cn(
                    "flex h-8 w-full items-stretch overflow-hidden rounded-lg border border-input bg-transparent transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
                    urlError &&
                      "border-destructive/60 focus-within:border-destructive/60 focus-within:ring-destructive/15"
                  )}
                >
                  <Select value={proto} onValueChange={(v) => v != null && setProto(v)}>
                    <SelectTrigger
                      aria-label="Protocolo"
                      aria-describedby={urlError ? "url-error" : undefined}
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
                    autoFocus
                    spellCheck={false}
                    autoComplete="off"
                    placeholder="example.com/health"
                    value={url}
                    aria-describedby={urlError ? "url-error" : undefined}
                    aria-invalid={urlError || undefined}
                    onChange={(e) => {
                      setUrl(e.target.value)
                      setTouched((t) => ({ ...t, url: true }))
                    }}
                    className="h-8 min-w-0 flex-1 rounded-none border-0 bg-transparent px-2.5 font-mono text-[13px] shadow-none focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent"
                  />
                </div>
                {urlError && (
                  <p
                    id="url-error"
                    role="alert"
                    className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-down"
                  >
                    <CircleAlertIcon className="size-3 shrink-0" aria-hidden />
                    {hasSpace
                      ? "La URL no puede llevar espacios."
                      : "Escribe un dominio válido, por ejemplo example.com/health."}
                  </p>
                )}
              </Field>

              <Field
                label="Nombre"
                htmlFor="nombre"
                required
                error={
                  nombreError ? "Ponle un nombre para reconocerlo." : null
                }
                hint="Lo verás en la lista y en las alertas."
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

              <Field
                label="Método"
                htmlFor="metodo"
                hint="GET sirve para casi todo."
              >
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
            </Section>

            <Section
              check={timeOk}
              title="Cada cuánto"
              desc="Más frecuencia detecta antes las caídas y consume más cuota."
            >
              <Field label="Intervalo entre comprobaciones">
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
                    ? "La espera debe ser menor que el intervalo: baja la espera o comprueba cada más tiempo."
                    : null
                }
                hint="Si no responde en ese tiempo, la comprobación cuenta como fallo."
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
            </Section>

            <Section
              check
              last
              title="Qué cuenta como caída"
              desc="Una respuesta distinta a la esperada es un fallo. Varios fallos seguidos abren un incidente."
            >
              <div className="grid gap-3.5 min-[901px]:grid-cols-2">
                <Field
                  label="Estatus HTTP esperado"
                  htmlFor="estatus"
                  hint="Una respuesta distinta cuenta como fallo."
                >
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
                      ? "Avisaremos al primer fallo."
                      : `Toleramos ${umbral - 1} fallo${
                          umbral - 1 === 1 ? "" : "s"
                        } suelto${umbral - 1 === 1 ? "" : "s"} antes de avisar.`
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
            </Section>
          </fieldset>

          <aside className="flex flex-col gap-3 self-start min-[901px]:sticky min-[901px]:top-6">
            <div className="flex flex-col rounded-xl bg-card ring-1 ring-foreground/10">
              <div className="min-w-0 p-4">
                <p className="text-[14px] leading-[1.55] tracking-[-0.005em] text-foreground">
                  Llamaremos a {targetElement} con{" "}
                  <Emphasis>{metodo}</Emphasis> cada{" "}
                  <Emphasis>{fmtInterval(intervalo)}</Emphasis> y esperaremos un{" "}
                  <Emphasis>{estatus}</Emphasis> en menos de{" "}
                  <Emphasis>{espera} s</Emphasis>.{" "}
                  {umbral === 1 ? (
                    <>Al primer fallo abriremos un incidente.</>
                  ) : (
                    <>
                      Tras <Emphasis>{umbral}</Emphasis> fallos seguidos
                      abriremos un incidente.
                    </>
                  )}{" "}
                  {!activo && <Muted>El monitor se creará pausado.</Muted>}
                </p>
              </div>
              <div className="flex items-center gap-2.5 border-t border-border px-3.5 py-3">
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full bg-muted-foreground/55"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-medium text-foreground">
                    {nombre.trim() ? (
                      nombre.trim()
                    ) : (
                      <span className="text-muted-foreground">Sin nombre</span>
                    )}
                  </div>
                  <div className="truncate font-mono text-[11.5px] tabular-nums text-muted-foreground">
                    {urlOk ? host : proto}
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {activo ? "Sin datos" : "Pausado"}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-card ring-1 ring-foreground/10">
              <div className="flex items-baseline justify-between px-3.5 pb-1 pt-3.5">
                <h2 className="text-[13px] font-semibold text-foreground">
                  Antes de crear
                </h2>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {doneCount} de 3
                </span>
              </div>
              <ul className="px-3.5 pb-3.5">
                {checklist.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2.5 py-1.5 text-[13px] font-medium"
                  >
                    <span
                      className={cn(
                        "grid size-[15px] shrink-0 place-items-center rounded-[5px] border-[1.5px] transition-colors duration-200",
                        item.ok ? "border-ok bg-ok" : "border-border bg-card"
                      )}
                    >
                      <CheckIcon
                        strokeWidth={4}
                        aria-hidden
                        className={cn(
                          "size-2.5 text-white transition-opacity duration-200",
                          item.ok ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </span>
                    <span
                      className={cn(
                        item.ok ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        <div className="sticky bottom-0 z-30 -mx-4 -mb-4 mt-auto border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 lg:px-6">
            <Label className="cursor-pointer">
              <Switch
                checked={activo}
                onCheckedChange={setActivo}
                disabled={create.isPending}
                aria-label="Empezar a comprobar al crearlo"
              />
              <span className="text-[13px] font-medium text-foreground">
                Empezar a comprobar al crearlo
                <span className="block text-[11.5px] font-normal leading-snug text-muted-foreground">
                  {activo
                    ? "La primera comprobación se lanza al instante."
                    : "Se creará pausado; podrás activarlo cuando quieras."}
                </span>
              </span>
            </Label>
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={create.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!todasOk || create.isPending}
                className="min-w-[132px]"
              >
                {create.isPending ? (
                  <>
                    <Loader2Icon className="animate-spin" aria-hidden />
                    Enviando…
                  </>
                ) : (
                  "Crear monitor"
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar este monitor?</AlertDialogTitle>
            <AlertDialogDescription>
              Aún no se ha creado nada. Perderás lo que has escrito.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={create.isPending}>
              Seguir editando
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDiscardOpen(false)
                navigate("/monitores")
              }}
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}