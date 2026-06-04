# Conversación técnica — Sistema de Paquetería UCT (PMN-INFO1163)

> Registro de consultas técnicas entre el desarrollador y el asistente IA durante el desarrollo del proyecto.

---

## Índice

1. [Arquitectura general](#1-arquitectura-general)
2. [Máquina de estados y reglas de negocio](#2-máquina-de-estados-y-reglas-de-negocio)
3. [Autenticación y roles](#3-autenticación-y-roles)
4. [Persistencia y base de datos](#4-persistencia-y-base-de-datos)
5. [El flujo OTP y el widget TOTP](#5-el-flujo-otp-y-el-widget-totp)
6. [Correcciones y decisiones de diseño](#6-correcciones-y-decisiones-de-diseño)
7. [Problemas con Turbopack y memoria](#7-problemas-con-turbopack-y-memoria)
8. [Recomendaciones del desarrollador](#8-recomendaciones-del-desarrollador)

---

## 1. Arquitectura general

**Yo:** Quiero que me expliques cómo organizamos la arquitectura del proyecto. ¿Por qué elegimos FastAPI para el backend y Next.js para el frontend? ¿No podríamos haber usado algo más simple como Flask o un monolito?

**IA:** Buena pregunta. La decisión fue principalmente por separación de responsabilidades y rendimiento. FastAPI nos da:

- **Validación automática** de datos con Pydantic — cualquier campo mal tipado es rechazado antes de llegar a la lógica de negocio.
- **Documentación Swagger** automática en `/docs` sin escribir una línea extra.
- **Rendimiento asíncrono** — ideal para un sistema que podría tener múltiples agentes reportando estado simultáneamente.

Flask habría funcionado, pero tendríamos que escribir la validación y la documentación a mano.

Para Next.js, la razón fue el **App Router** con Server Components, que permite pre-renderizar partes de la UI sin JavaScript en el cliente — esto mejora el tiempo de carga inicial del panel de cada rol.

**Yo:** Correcto, pero aclaremos algo: en este proyecto no estamos usando Server Components realmente. Todo nuestro código tiene `"use client"` al inicio. Así que la ventaja de SSR de Next.js no la estamos aprovechando del todo.

**IA:** Tiene toda la razón. En la implementación actual, todos los dashboards son puramente client-side por la naturaleza dinámica de los datos (polling, estado de formularios, animaciones con Framer Motion). Usamos Next.js principalmente por:

1. **Enrutamiento automático** basado en carpetas (`/dashboard/remitente`, `/dashboard/agente`, etc.) sin configuración adicional.
2. **TypeScript** integrado desde el inicio.
3. **Hot reload** en desarrollo.

Si el proyecto creciera y hubiera páginas estáticas (como una landing o reportes), SSR sería valioso. Por ahora, la arquitectura SPA tiene más sentido para este contexto.

**Yo:** Exacto. Y la separación backend/frontend también facilita que en el futuro alguien haga una app móvil consumiendo la misma API, sin cambiar nada en el backend.

**IA:** Precisamente. La API REST de FastAPI es agnóstica al cliente — podría consumirse desde React Native, Flutter, o cualquier cliente HTTP. El sistema de autenticación con JWT también está preparado para eso, ya que el token viaja en el header `Authorization: Bearer <token>` en todas las peticiones.

---

## 2. Máquina de estados y reglas de negocio

**Yo:** Explícame el flujo completo de un paquete desde que se crea hasta que se entrega. Quiero ver si lo tienes claro.

**IA:** El flujo nominal (sin errores ni disputas) es:

```
PENDIENTE_RECOLECCION
       ↓  (Agente verifica caja sellada — D1 OK)
HANDSHAKE_ORIGEN
       ↓  (Agente firma, asume custodia — 1er Handshake)
EN_TRANSITO
       ↓  (Agente llega al destino — Match GPS)
LLEGADA_GEOCERCA
       ↓  (Agente registra contacto)
PRESENCIA_DESTINATARIO
       ↓  (Destinatario está presente — D2 OK)
INSPECCION_ACTIVO
       ↓  (Destinatario inspecciona físicamente — D3 OK)
SOLICITAR_OTP
       ↓  (Agente ingresa el OTP de 6 dígitos del destinatario — 2do Handshake)
ENTREGADO
```

Los caminos alternativos son:
- **E1:** Caja abierta en origen → `RECHAZO_ORIGEN`
- **E2:** Destino inválido → error al crear el paquete (validado en backend)
- **D2 negativo:** Destinatario ausente → `INTENTO_FALLIDO_ESPERA` → proxy o retorno
- **D3 negativo:** Activo dañado → `FLUJO_RETORNO` → `CUARENTENA` → Supervisor resuelve

**Yo:** Bien, pero falta el 3er Handshake. ¿Dónde queda?

**IA:** Cierto, lo omití. El **3er Handshake** ocurre en el flujo de retorno:

```
FLUJO_RETORNO
       ↓  (Supervisor/Remitente firma aceptación)
DEVUELTO_ORIGEN   ← 3er Handshake aceptado
       — o —
DISPUTA_CUSTODIA  ← Remitente rechaza devolución (Ajuste 3)
       ↓
CUARENTENA        ← Agente deposita en bodega
       ↓  (Supervisor interviene)
CERRADO_INCIDENCIA
```

El 3er Handshake es la firma formal de que el remitente acepta recibir el activo de vuelta, cerrando la cadena de custodia.

**Yo:** Perfecto. Ahora dime: ¿por qué el Supervisor solo ve paquetes en disputa en su vista por defecto, y no todos?

**IA:** Porque el Supervisor de Bodega tiene un rol reactivo: solo debe intervenir cuando hay una excepción. Mostrarle todos los paquetes del sistema por defecto sería ruido innecesario. Sin embargo, implementamos el botón "Vista global" para que pueda ver todos los paquetes si lo necesita. Es una decisión UX: **contexto por defecto limpio, con acceso a más datos cuando se requiere**.

**Yo:** Correcto. Y fíjate que en el backend, el endpoint `/api/packages` para el Supervisor está mal. Devuelve solo los que están en CUARENTENA, DISPUTA_CUSTODIA o CERRADO_INCIDENCIA. Pero FLUJO_RETORNO también debería incluirse porque el Supervisor firma el 3er Handshake.

**IA:** Tiene razón, eso es un bug de cobertura. El query actual en `packages.py` es:

```python
rows = db.execute("""SELECT * FROM packages WHERE estado IN 
    ('CUARENTENA','DISPUTA_CUSTODIA','CERRADO_INCIDENCIA') 
    ORDER BY updated_at DESC""").fetchall()
```

Debería incluir `'FLUJO_RETORNO'`:

```python
rows = db.execute("""SELECT * FROM packages WHERE estado IN 
    ('CUARENTENA','DISPUTA_CUSTODIA','CERRADO_INCIDENCIA','FLUJO_RETORNO') 
    ORDER BY updated_at DESC""").fetchall()
```

Sin eso, el Supervisor no ve los paquetes en retorno en su lista principal, solo en la "Vista global".

---

## 3. Autenticación y roles

**Yo:** ¿Cómo funciona exactamente el sistema de autenticación? Explícame desde el login hasta la validación del token en cada request.

**IA:** El flujo completo es:

**1. Login (`POST /api/auth/login`)**
```
Usuario envía → { username, password }
Backend verifica contra SQLite (hash bcrypt)
Si OK → genera JWT con payload: { sub: username, rol: "AGENTE", id: 3 }
Retorna → { access_token, user: { id, nombre, rol } }
```

**2. Frontend guarda el token**
```typescript
localStorage.setItem("pmn_token", access_token);
localStorage.setItem("pmn_user", JSON.stringify(user));
```

**3. Cada request posterior**
```
Frontend inyecta → Authorization: Bearer <token>
Backend (deps.py) → verifica firma del JWT con SECRET_KEY
Extrae → current_user = { id, nombre, rol }
Si inválido/expirado → 401 → frontend redirige a /login
```

**4. Autorización por rol**
Cada endpoint verifica `current_user["rol"]`:
```python
if current_user["rol"] != "REMITENTE":
    raise HTTPException(403, "Solo el Remitente puede crear paquetes")
```

**Yo:** Bien explicado. Una cosa: estamos guardando el token en `localStorage`, lo cual tiene implicaciones de seguridad — es vulnerable a XSS. ¿Lo sabías?

**IA:** Sí. La alternativa más segura es usar **httpOnly cookies**, que no son accesibles desde JavaScript y por tanto inmunes a XSX. La razón por la que usamos `localStorage` aquí es la simplicidad del contexto académico — es más fácil de depurar y no requiere configurar CORS con credenciales en cookies. En producción real, la recomendación es:

```
Cookies httpOnly + SameSite=Strict + Secure (HTTPS)
```

Adicionalmente, el JWT debería tener un tiempo de expiración corto (15–30 min) y usar refresh tokens para renovarlo, lo cual tampoco implementamos en esta versión.

**Yo:** Exacto. Para el contexto del proyecto está bien, pero es importante documentarlo. ¿Cuáles son los 4 roles y qué puede hacer cada uno?

**IA:**

| Rol | Credenciales | Capacidades |
|-----|-------------|-------------|
| **REMITENTE** | `informatica / uct2026` | Crear paquetes, ver sus propios paquetes, ver OTP generado |
| **AGENTE** | `juan / estafeta123` | Ejecutar todas las transiciones de entrega, ingresar OTP del destinatario |
| **DESTINATARIO** | `profesor / lab_redes` | Ver paquetes asignados, inspeccionar activo (D3), mostrar código OTP |
| **SUPERVISOR** | `supervisor / bodega_uct` | Ver disputas/cuarentenas, firmar 3er Handshake, cerrar incidencias |

---

## 4. Persistencia y base de datos

**Yo:** ¿Por qué SQLite y no PostgreSQL o MySQL? Para un sistema empresarial real, SQLite no escalaría.

**IA:** Correcto — SQLite tiene limitaciones importantes para producción:

- **Concurrencia limitada:** Solo permite un escritor a la vez. Con múltiples agentes escribiendo simultáneamente habría contención.
- **Sin servidor:** No hay conexiones remotas nativas, replicación, ni clustering.
- **Tamaño:** Tiene un límite práctico de algunos GB.

Para este proyecto académico, SQLite es ideal porque:
- **Cero configuración** — el archivo `data/pmn.db` se crea automáticamente al iniciar.
- **Portabilidad total** — cualquier PC con Python puede correr el backend sin instalar nada más.
- **Suficiente para la carga esperada** — pocos usuarios concurrentes, datos de demo.

En producción migrar a **PostgreSQL** sería directo — SQLAlchemy (o incluso el raw sqlite3 que usamos) se reemplaza por `psycopg2` y se cambia la connection string.

**Yo:** ¿Cómo está estructurada la base de datos? Dime las tablas y sus relaciones.

**IA:** Tenemos 3 tablas principales:

```sql
-- Usuarios del sistema
CREATE TABLE users (
    id       INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,          -- bcrypt hash
    nombre   TEXT NOT NULL,
    rol      TEXT NOT NULL           -- REMITENTE|AGENTE|DESTINATARIO|SUPERVISOR
);

-- Paquetes (entidad central)
CREATE TABLE packages (
    id                INTEGER PRIMARY KEY,
    titulo            TEXT NOT NULL,
    descripcion       TEXT,
    origen            TEXT NOT NULL,
    destino           TEXT NOT NULL,
    estado            TEXT NOT NULL,  -- máquina de estados
    remitente_id      INTEGER REFERENCES users(id),
    agente_id         INTEGER REFERENCES users(id),
    destinatario_id   INTEGER REFERENCES users(id),
    otp_code          TEXT,           -- 6 dígitos generados al crear
    otp_used          INTEGER DEFAULT 0,
    proxy_nombre      TEXT,
    proxy_id          TEXT,
    created_at        TEXT,
    updated_at        TEXT
);

-- Eventos de trazabilidad (append-only)
CREATE TABLE events (
    id              INTEGER PRIMARY KEY,
    package_id      INTEGER REFERENCES packages(id),
    actor_id        INTEGER REFERENCES users(id),
    actor_nombre    TEXT,
    estado_anterior TEXT,
    estado_nuevo    TEXT,
    notas           TEXT,
    timestamp       TEXT
);
```

La tabla `events` es **append-only** — nunca se borra ni se modifica. Cada transición genera un nuevo evento, creando el historial de trazabilidad completo e inmutable del paquete.

**Yo:** Bien. Noto que no tienes FK con `ON DELETE CASCADE` ni índices en `package_id` de events. Para un sistema con muchos paquetes eso podría volverse lento en consultas de historial.

**IA:** Correcto en ambos puntos. Las mejoras serían:

```sql
-- Índice para acelerar consultas de historial
CREATE INDEX idx_events_package_id ON events(package_id);
CREATE INDEX idx_packages_estado ON packages(estado);
CREATE INDEX idx_packages_agente ON packages(agente_id);

-- FK con cascada para limpieza
FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
```

Sin el índice en `package_id`, cada consulta de historial hace un full-scan de la tabla events — aceptable con 100 registros, catastrófico con 100,000. Es una deuda técnica que debería resolverse antes de un deploy real.

---

## 5. El flujo OTP y el widget TOTP

**Yo:** Explícame cómo funciona el OTP. ¿Cuándo se genera, quién lo ve y cómo se valida?

**IA:** El ciclo completo del OTP:

**Generación — al crear el paquete:**
```python
otp = generate_otp()  # random.randint(100000, 999999) → "800012"
# Se guarda en packages.otp_code, otp_used = 0
```

**Visibilidad:**
- El **Remitente** lo ve en el banner de confirmación al crear el paquete.
- El **Destinatario** lo ve en su widget "Mi Código de Verificación" al seleccionar el paquete.
- El **Agente** lo ve como referencia en el panel del paquete (con nota "para verificación").

**Validación — al transicionar a ENTREGADO:**
```python
if current_state == "SOLICITAR_OTP" and new_state == "ENTREGADO":
    if pkg["otp_code"] != body.otp_code.strip():
        raise HTTPException(422, "Código OTP incorrecto")
    db.execute("UPDATE packages SET otp_used=1 WHERE id=?", (pkg_id,))
```

Una vez usado, `otp_used=1` y no puede volver a usarse.

**Yo:** El widget visual que implementamos en el Destinatario simula un TOTP como Google Authenticator, pero no es un TOTP real. ¿Cuál es la diferencia?

**IA:** Diferencia importante:

| | Nuestro widget | TOTP real (RFC 6238) |
|--|--|--|
| **Código** | OTP fijo generado al crear el paquete | Derivado de `HMAC-SHA1(secret, floor(time/30))` |
| **Cambio cada 30s** | Visual/countdown solo — el código no cambia | El código realmente cambia cada 30s |
| **Secreto** | Guardado en texto plano en SQLite | Secreto compartido cifrado (QR de configuración) |
| **Sincronización** | No requiere — es estático | Requiere que servidor y cliente tengan el mismo reloj |

Nuestro widget da la **experiencia visual** de un autenticador sin la complejidad criptográfica. Para el contexto del sistema de paquetería UCT es suficiente — el código no necesita cambiar porque la sesión de entrega es corta y presencial.

**Yo:** Exactamente. Y hay una ventaja adicional: como el código es fijo para el paquete, si el agente llega y el destinatario no tiene señal para ver su panel, el remitente también puede comunicarle el código por otro medio. ¿Lo habías considerado?

**IA:** Es un punto de diseño válido que no había mencionado explícitamente. El hecho de que el OTP sea persistente (no rotativo) lo hace más resiliente en entornos con conectividad limitada — un campus universitario con zonas de mala señal, por ejemplo. El destinatario puede anotar su código antes de ir al laboratorio. Esto es un tradeoff consciente: **disponibilidad sobre seguridad perfecta**, lo que tiene sentido para activos institucionales de bajo riesgo como equipos de laboratorio.

---

## 6. Correcciones y decisiones de diseño

**Yo:** Hubo un bug importante con las tarjetas de paquetes que aparecían en blanco. Explícame qué causaba eso y cómo lo solucionamos.

**IA:** El bug era sutil y tenía que ver con `useCallback` y sus dependencias en React.

**El problema:**
```typescript
// ❌ ANTES — useCallback con `selected` en dependencias
const load = useCallback(async () => {
    const data = await apiGetPackages();
    setPackages(data);
    if (selected) {          // ← selected en closure
        const upd = data.find(p => p.id === selected.id);
        if (upd) setSelected(upd);
    }
}, [selected]);  // ← cada vez que cambiaba `selected`, `load` se recreaba

useEffect(() => { load(); }, [load]);  // ← y esto disparaba un nuevo fetch
```

Cada vez que el usuario seleccionaba un paquete, `selected` cambiaba → `load` se recreaba → `useEffect` corría de nuevo → `setPackages` actualizaba → React re-renderizaba → las tarjetas aparecían brevemente en estado "loading" (shimmer gris) antes de mostrarse.

**La solución:**
```typescript
// ✅ DESPUÉS — useRef para trackear el ID sin crear dependencias reactivas
const selectedIdRef = useRef<number | null>(null);

async function load() {      // función normal, sin useCallback
    const data = await apiGetPackages();
    setPackages(data);
    if (selectedIdRef.current !== null) {
        const upd = data.find(p => p.id === selectedIdRef.current);
        if (upd) setSelected(upd);
    }
}

useEffect(() => { load(); }, []);  // ← solo corre al montar
```

`useRef` guarda el ID del paquete seleccionado sin ser parte del grafo de dependencias reactivas de React.

**Yo:** Correcto. Y ese patrón lo aplicamos en los 4 dashboards, no solo en uno, ¿verdad?

**IA:** Así es — el mismo patrón se aplicó en **Remitente**, **Agente**, **Destinatario** y **Supervisor**. Los cuatro tenían el mismo antipatrón de `useCallback + selected` en dependencias. Una vez identificado el problema en uno, fue straightforward aplicarlo a todos.

**Yo:** ¿Y por qué elegimos emojis inicialmente y por qué los eliminamos?

**IA:** Los emojis entraron en la primera iteración rápida como marcadores visuales de contexto (ej. `🔐` para autenticación, `📦` para paquetes). El problema con emojis en interfaces profesionales es:

1. **Renderizado inconsistente** entre sistemas operativos — un emoji en Windows 10 puede verse distinto en macOS o Linux.
2. **Accesibilidad** — los screen readers leen los emojis literalmente ("cara sonriente con ojos grandes"), lo que rompe la experiencia para usuarios con discapacidad visual.
3. **Estética profesional** — en un sistema empresarial universitario, los emojis dan una percepción de informalidad.

Los reemplazamos con **Lucide React** — una librería de íconos SVG que tiene renderizado pixel-perfect, tamaño controlable, color parametrizable y semántica clara.

---

## 7. Problemas con Turbopack y memoria

**Yo:** Tuvimos un crash de Windows muy específico. Recuérdame qué pasó exactamente con el error de paginación.

**IA:** El error exacto fue:

```
thread 'tokio-runtime-worker' panicked at tokio/src/io/blocking.rs:124
OS can't spawn worker thread: El archivo de paginación es demasiado pequeño 
para completar la operación. (os error 1455)
```

**Qué pasó:** Next.js 16 usa **Turbopack** como bundler por defecto. Turbopack está escrito en **Rust** y usa el runtime **Tokio** para manejar workers asíncronos. En Windows, cuando el archivo de paginación virtual (swap) es demasiado pequeño, el OS no puede asignar memoria para crear nuevos threads — y Tokio lanza un panic en lugar de degradarse gracefully.

**La solución:** Cambiar el script `dev` en `package.json` para forzar webpack:

```json
// ❌ ANTES
"dev": "next dev"           // usa Turbopack por defecto en Next.js 16

// ✅ DESPUÉS  
"dev": "next dev --webpack"  // usa webpack (Node.js, sin workers Rust)
```

Webpack consume significativamente menos memoria virtual que Turbopack en Windows, especialmente en máquinas con RAM limitada o página de intercambio pequeña.

**Yo:** Y antes de encontrar `--webpack`, probaste `--no-turbopack` que no existía. ¿Cómo verificaste cuál era el flag correcto?

**IA:** Con `npx next dev --help`, que listó todos los flags disponibles:

```
--turbo      Starts development mode using Turbopack.
--turbopack  Starts development mode using Turbopack.
--webpack    Starts development mode using webpack.     ← este
```

El flag `--no-turbopack` nunca existió — intenté inferirlo por convención de CLI Unix pero Next.js no sigue ese patrón para esta opción.

---

## 8. Recomendaciones del desarrollador

**Yo:** Tengo varias recomendaciones para mejorar el proyecto. Primera: el campo `otp_visible` debería calcularse desde el backend siempre que el rol sea DESTINATARIO, no solo en el endpoint individual. ¿Por qué no lo hiciste así desde el inicio?

**IA:** Honestamente, fue un descuido de diseño. La lógica de `otp_visible` estaba pensada inicialmente solo para el Agente (que necesita ver el código para verificarlo). Al agregar el Destinatario a la lista de roles con acceso, no actualicé el endpoint de lista — solo el individual. El fix correcto hubiera sido incluirlo en `_package_to_dict()`, la función helper que construye el objeto para ambos endpoints:

```python
def _package_to_dict(row, db, current_rol=None):
    pkg = dict(row)
    # ...
    if current_rol in ("AGENTE", "SUPERVISOR", "REMITENTE", "DESTINATARIO"):
        pkg["otp_visible"] = row["otp_code"] if not row["otp_used"] else "YA USADO"
    return pkg
```

Así, tanto la lista como el endpoint individual devolverían `otp_visible` sin necesidad de hacer dos fetches en el frontend.

**Yo:** Exacto. Eso habría evitado todo el problema del widget que no aparecía. Segunda recomendación: el sistema de notificaciones está marcado como "PRONTO" en el sidebar. ¿Qué implementarías ahí?

**IA:** Para un sistema de paquetería, las notificaciones más valiosas serían:

1. **WebSockets en tiempo real** — cuando el agente llega al geocerca, el destinatario recibe una push notification sin necesidad de refrescar.
2. **Notificaciones de cambio de estado** — "Tu paquete #4 pasó a EN TRÁNSITO".
3. **Alerta de OTP próximo a expirar** — aunque en nuestra implementación el OTP no expira por tiempo, en un sistema real habría un TTL.

La implementación usaría **Server-Sent Events** (más simple que WebSockets, suficiente para notificaciones unidireccionales) con FastAPI:

```python
from sse_starlette.sse import EventSourceResponse

@router.get("/stream/{user_id}")
async def stream_notifications(user_id: int):
    async def generator():
        while True:
            events = get_new_events_for_user(user_id)
            for ev in events:
                yield {"data": json.dumps(ev)}
            await asyncio.sleep(2)
    return EventSourceResponse(generator())
```

**Yo:** Tercera: ¿por qué usamos `localStorage` para la sesión pero no implementamos expiración del token en el frontend? Si cierro el browser y lo abro días después, sigo autenticado.

**IA:** Tienes razón — hay una inconsistencia. El JWT tiene una expiración definida en el backend (en `auth.py`), pero el frontend nunca verifica si el token expiró localmente. Solo descubre la expiración cuando el backend devuelve un 401.

La corrección sería verificar el `exp` del JWT al cargar la app:

```typescript
function isTokenExpired(token: string): boolean {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
}

// En el layout o middleware
if (isTokenExpired(token)) {
    localStorage.clear();
    router.push('/login');
}
```

Esto evita que el usuario esté "logueado" en el frontend pero reciba 401 en el primer request de datos — lo cual genera una experiencia confusa.

**Yo:** Bien. Última recomendación: el proxy en el flujo del agente pide "nombre" e "ID universitario" pero no valida el formato del ID. Cualquier texto pasa. ¿Cómo lo mejorarías?

**IA:** La validación debería ser en dos niveles:

**Frontend — regex básico:**
```typescript
const UCT_ID_REGEX = /^\d{4}-UCT-\d{3,6}$/;

if (!UCT_ID_REGEX.test(proxyId)) {
    setError("ID universitario inválido. Formato esperado: 2024-UCT-001");
    return;
}
```

**Backend — validación de negocio:**
```python
class TransitionRequest(BaseModel):
    proxy_nombre: Optional[str] = None
    proxy_id: Optional[str] = Field(
        None, 
        pattern=r"^\d{4}-UCT-\d{3,6}$",
        description="Formato: YYYY-UCT-NNNN"
    )
```

Adicionalmente, en un sistema real el proxy debería verificarse contra la **base de datos de funcionarios UCT** — si el ID no existe en el sistema de Recursos Humanos, el proxy no es válido aunque el formato sea correcto.

**Yo:** Perfecto. Creo que el proyecto está bien construido para el alcance del curso, pero es importante conocer estas limitaciones para poder justificarlas en la defensa. ¿Tienes algo que agregar como conclusión?

**IA:** Solo que la arquitectura elegida — FastAPI + SQLite + Next.js — cumple con todos los requisitos del enunciado:

- **Autenticación real** con JWT y hashing bcrypt.
- **Persistencia real** en base de datos relacional.
- **Separación de roles** con autorización por endpoint.
- **Flujo operacional coherente** con una máquina de estados que refleja un proceso logístico real (handshakes, OTP, cuarentena).
- **Validaciones en backend y frontend**.
- **Trazabilidad inmutable** mediante una tabla de eventos append-only.

Las limitaciones que mencionaste (localStorage, SQLite, sin WebSockets, sin expiración de token en cliente, sin validación de ID proxy) son deuda técnica documentada y justificable en el contexto académico. Conocerlas y poder argumentarlas demuestra un entendimiento profundo del sistema — que es exactamente lo que se evalúa en una defensa.

---

*Documento generado durante el desarrollo del proyecto PMN-INFO1163 — Semestre 5, Desarrollo de Aplicaciones Empresariales, Universidad Católica de Temuco.*
