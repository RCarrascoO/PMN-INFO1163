# Informe Técnico — Sistema de Paquetería UCT (PMN-INFO1163)

**Proyecto:** PMN-INFO1163 — Sistema de Gestión de Distribución Institucional  
**Asignatura:** Desarrollo de Aplicaciones Empresariales  
**Institución:** Universidad Católica de Temuco  
**Semestre:** 5° — Fase 2  

---

## Tabla de contenidos

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura general del sistema](#2-arquitectura-general-del-sistema)
3. [Tecnologías utilizadas](#3-tecnologías-utilizadas)
4. [Funcionalidades implementadas](#4-funcionalidades-implementadas)
5. [Dificultades encontradas](#5-dificultades-encontradas)
6. [Decisiones de diseño importantes](#6-decisiones-de-diseño-importantes)
7. [Limitaciones actuales](#7-limitaciones-actuales)
8. [Posibles mejoras y trabajo futuro](#8-posibles-mejoras-y-trabajo-futuro)

---

## 1. Resumen ejecutivo

El sistema PMN-INFO1163 es una plataforma web multi-rol para la gestión y trazabilidad de distribución de activos institucionales en la Universidad Católica de Temuco. Permite registrar, rastrear y confirmar la entrega de equipamiento desde unidades de origen (Remitente) hasta unidades de destino (Destinatario), con intervención de agentes de despacho y supervisión de bodega.

El sistema implementa un protocolo de **handshakes digitales**, **validación OTP de 6 dígitos** y una **máquina de estados** con 16 estados posibles, cubriendo flujos nominales de entrega, retornos, disputas de custodia y resolución de incidencias.

---

## 2. Arquitectura general del sistema

El sistema adopta una arquitectura **cliente-servidor desacoplada** en dos capas:

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENTE (Browser)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Next.js 16 (React 19 + TypeScript)          │   │
│  │  /login   /dashboard/remitente   /dashboard/agente    │   │
│  │           /dashboard/destinatario  /dashboard/supervisor│ │
│  └──────────────────────┬───────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTP REST (JSON) + JWT Bearer Token
                          │ Puerto 8000
┌─────────────────────────┴───────────────────────────────────┐
│                     SERVIDOR (FastAPI)                        │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │  /api/auth  │  │/api/packages │  │  business_rules.py │ │
│  │  JWT + bcrypt│  │  REST CRUD  │  │  Máquina de estados│ │
│  └─────────────┘  └──────────────┘  └────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              SQLite — pmn.db                             ││
│  │   users | packages | events                              ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 2.1 Backend — FastAPI

El backend expone una API REST bajo el prefijo `/api`. Está organizado en módulos:

- **`main.py`** — Punto de entrada, configuración CORS, lifespan (inicialización de BD y usuarios de prueba).
- **`api/auth.py`** — Endpoints de autenticación (`/login`). Genera JWT firmado.
- **`api/packages.py`** — CRUD de paquetes y endpoint de transición de estados.
- **`api/deps.py`** — Dependencias compartidas: conexión SQLite, extracción de usuario del token.
- **`core/auth.py`** — Lógica de JWT (creación, verificación, extracción).
- **`core/business_rules.py`** — Máquina de estados: define qué transiciones son válidas desde cada estado y para cada rol.
- **`db/database.py`** — Inicialización del esquema SQLite, generación de OTP, helpers de fecha.

### 2.2 Frontend — Next.js

El frontend utiliza el App Router de Next.js con páginas exclusivamente client-side (`"use client"`). La estructura de rutas refleja directamente los roles del sistema:

```
src/app/
├── login/page.tsx              ← Autenticación
├── dashboard/
│   ├── layout.tsx              ← Sidebar compartido, guard de sesión
│   ├── remitente/page.tsx      ← Panel Remitente
│   ├── agente/page.tsx         ← Panel Agente (flujo de entrega)
│   ├── destinatario/page.tsx   ← Panel Destinatario + Widget TOTP
│   └── supervisor/page.tsx     ← Panel Supervisor (disputas/cuarentena)
src/components/ui/
└── DashboardComponents.tsx     ← PackageCard, StatCard, EventTimeline, StatusBadge
src/lib/
├── api.ts                      ← Cliente HTTP centralizado
└── auth.ts                     ← Helpers de sesión (localStorage)
```

### 2.3 Comunicación y seguridad

Toda comunicación entre cliente y servidor usa **JSON sobre HTTP**. La autenticación se implementa con **JWT (JSON Web Tokens)** transmitidos en el header `Authorization: Bearer <token>`. El backend valida el token en cada request mediante una dependencia FastAPI inyectada (`get_current_user`). Las contraseñas se almacenan con hash **bcrypt**.

---

## 3. Tecnologías utilizadas

### Backend

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Python | 3.13 | Lenguaje base del servidor |
| FastAPI | 0.115.x | Framework REST API |
| Uvicorn | 0.34.x | Servidor ASGI |
| Pydantic v2 | 2.x | Validación y serialización de modelos |
| python-jose | 3.x | Creación y verificación de JWT |
| passlib + bcrypt | 1.7.x | Hashing de contraseñas |
| SQLite (stdlib) | 3.x | Persistencia relacional |

### Frontend

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Next.js | 16.2.6 | Framework React con App Router |
| React | 19.2.4 | Librería de UI |
| TypeScript | 5.x | Tipado estático |
| Tailwind CSS | 4.x | Utilidades CSS de apoyo |
| Framer Motion | 12.x | Animaciones (transiciones de página, alerts) |
| Lucide React | 1.x | Iconografía SVG consistente |

### Infraestructura de desarrollo

| Herramienta | Uso |
|------------|-----|
| npm (Node.js v24) | Gestión de dependencias frontend |
| pip (Python) | Gestión de dependencias backend |
| SQLite Browser | Inspección de datos en desarrollo |
| PowerShell | Ejecución de comandos en Windows 10 |

---

## 4. Funcionalidades implementadas

### 4.1 Autenticación multi-rol

- Login con usuario y contraseña validados contra SQLite.
- Generación de JWT con payload `{ sub, id, rol }`.
- Guard de ruta en el layout del dashboard — redirige a `/login` si no hay token válido.
- Redirección automática al panel del rol correspondiente tras autenticación.
- Logout con limpieza de `localStorage`.

### 4.2 Gestión de paquetes (Remitente)

- Formulario de creación con validaciones: título, descripción, origen, destino, agente, destinatario.
- Validación de destinos inválidos en el backend (Error E2: "sala 404", "fuera de servicio").
- Generación automática de OTP de 6 dígitos al crear el paquete.
- Visualización del OTP generado en banner de confirmación.
- Listado de paquetes propios con estado, participantes y contador de eventos.
- Detalle del paquete con historial de trazabilidad completo.

### 4.3 Flujo de entrega del Agente

El Agente ejecuta todas las transiciones de la máquina de estados durante el proceso de entrega:

| Acción | Transición |
|--------|------------|
| Verificar caja sellada (D1 OK) | `PENDIENTE_RECOLECCION → HANDSHAKE_ORIGEN` |
| Rechazar caja abierta (E1) | `PENDIENTE_RECOLECCION → RECHAZO_ORIGEN` |
| Firmar 1er Handshake | `HANDSHAKE_ORIGEN → EN_TRANSITO` |
| Match GPS (llegada) | `EN_TRANSITO → LLEGADA_GEOCERCA` |
| Registrar contacto | `LLEGADA_GEOCERCA → PRESENCIA_DESTINATARIO` |
| Destinatario presente (D2 OK) | `PRESENCIA_DESTINATARIO → INSPECCION_ACTIVO` |
| Destinatario ausente | `PRESENCIA_DESTINATARIO → INTENTO_FALLIDO_ESPERA` |
| Validar proxy | `INTENTO_FALLIDO_ESPERA → INSPECCION_ACTIVO` |
| Tolerancia expirada | `INTENTO_FALLIDO_ESPERA → FLUJO_RETORNO` |
| Validar OTP (2do Handshake) | `SOLICITAR_OTP → ENTREGADO` |
| Depositar en cuarentena | `FLUJO_RETORNO / DISPUTA_CUSTODIA → CUARENTENA` |

Incluye entrada de OTP mediante 6 campos numéricos individuales con autoavance del foco.

### 4.4 Panel del Destinatario con Widget TOTP

- Listado de paquetes asignados organizados por prioridad (OTP pendiente → Inspección → En camino → Historial).
- Widget **"Mi Código de Verificación"** con:
  - Anillo de cuenta regresiva circular (SVG animado, 30 segundos).
  - Visualización del código OTP digit por digit (6 cajas individuales).
  - Cambio de color a rojo en los últimos 6 segundos.
  - Indicador textual de tiempo restante.
- Acciones de inspección D3: "Activo conforme" o "Rechazar activo".
- Auto-refresh del paquete cada 15 segundos cuando está en estado activo.
- Alertas contextuales al tope de la vista cuando hay acciones pendientes.

### 4.5 Panel del Supervisor

- Vista de disputas activas por defecto (CUARENTENA, DISPUTA_CUSTODIA, FLUJO_RETORNO).
- Toggle a vista global de todos los paquetes del sistema.
- Formulario de resolución de cuarentena con campo de notas.
- Firma del 3er Handshake: aceptar devolución (`DEVUELTO_ORIGEN`) o abrir disputa (`DISPUTA_CUSTODIA`).
- Estadísticas globales: total, entregados, en tránsito, disputas.

### 4.6 Trazabilidad

- Cada transición de estado genera un evento inmutable en la tabla `events`.
- El historial se muestra en todas las vistas de detalle como timeline visual invertido (más reciente primero).
- Cada evento incluye: estado anterior, estado nuevo, actor, notas y timestamp.

### 4.7 Validaciones de negocio

- Solo el REMITENTE puede crear paquetes.
- Las transiciones de estado validan rol + estado actual en `business_rules.py`.
- El OTP solo puede usarse una vez (`otp_used = 1` tras validación).
- El OTP incorrecto devuelve error 422 con mensaje descriptivo.
- Los destinos inválidos son rechazados en la creación.

---

## 5. Dificultades encontradas

### 5.1 Incompatibilidad de Pydantic con Python 3.13

Al iniciar el proyecto, la versión de Pydantic instalada no era compatible con Python 3.13 por cambios en la introspección de tipos. El error era:

```
AttributeError: module 'typing' has no attribute '_GenericAlias'
```

**Solución:** Actualizar Pydantic a la versión 2.x que incluye soporte nativo para Python 3.13 con el nuevo motor de validación (`pydantic-core`).

### 5.2 Error 500 en el frontend por orden de imports CSS

Next.js con Tailwind CSS v4 requiere que el `@import` de fuentes Google Fonts esté **antes** del `@import "tailwindcss"` en el archivo `globals.css`. El orden incorrecto causaba un error 500 en compilación.

```css
/* ❌ Incorrecto */
@import "tailwindcss";
@import url('https://fonts.googleapis.com/...');

/* ✅ Correcto */
@import url('https://fonts.googleapis.com/...');
@import "tailwindcss";
```

### 5.3 Crash de memoria con Turbopack en Windows

Next.js 16 usa Turbopack (escrito en Rust) como bundler por defecto. En el entorno de desarrollo (Windows 10, archivo de paginación pequeño), el runtime Tokio de Rust no podía crear los worker threads necesarios, produciendo un panic irrecuperable (OS error 1455).

**Solución:** Usar el flag `--webpack` en el script de desarrollo, que instruye a Next.js a usar el bundler basado en Node.js (mucho menos demandante de memoria virtual).

### 5.4 Tarjetas de paquetes en blanco (bug de renderizado)

Un antipatrón en el uso de `useCallback` causaba que las tarjetas de paquetes mostraran el estado "cargando" (shimmer gris) repetidamente. El problema era que `selected` estaba como dependencia del callback, creando un ciclo de re-renders.

**Solución:** Migrar a `useRef<number | null>` para rastrear el ID del paquete seleccionado sin introducir dependencias reactivas.

### 5.5 OTP no visible en el widget del Destinatario

El campo `otp_visible` solo era devuelto por el endpoint individual (`GET /packages/{id}`), no por el endpoint de lista (`GET /packages`). El widget TOTP cargaba el paquete desde la lista y encontraba `otp_visible = undefined`.

**Solución:** La función `selectPkg` del Destinatario siempre hace un fetch al endpoint individual inmediatamente al seleccionar un paquete, asegurando que `otp_visible` esté disponible.

---

## 6. Decisiones de diseño importantes

### 6.1 SQLite sobre PostgreSQL

Se eligió SQLite por su cero-configuración y portabilidad total. Cualquier entorno con Python puede ejecutar el sistema sin infraestructura adicional. Es una decisión consciente válida para el alcance académico del proyecto; en producción, la migración a PostgreSQL sería straightforward.

### 6.2 Tabla de eventos append-only

La trazabilidad se implementa como una tabla de eventos que **nunca se modifica ni elimina**. Esto garantiza un historial inmutable y auditable — fundamental para sistemas de custodia de activos donde la responsabilidad legal importa.

### 6.3 JWT en localStorage vs cookies httpOnly

Se optó por `localStorage` por simplicidad de implementación y depuración. La alternativa más segura son cookies `httpOnly` que no son accesibles desde JavaScript, inmunes a ataques XSS. Esta limitación está documentada como deuda técnica aceptada para el contexto académico.

### 6.4 OTP fijo vs TOTP dinámico

El código OTP se genera una sola vez al crear el paquete y permanece fijo hasta ser usado. Esto es diferente de un TOTP real (RFC 6238) donde el código cambia cada 30 segundos derivado de una función HMAC-SHA1. La ventaja del OTP fijo es la resiliencia ante conectividad limitada — el destinatario puede anotar su código sin depender de señal en el momento de la entrega.

### 6.5 Validación de estado en el backend, no en el frontend

Las transiciones de estado son validadas exclusivamente en `business_rules.py` del backend. El frontend muestra los botones apropiados para cada estado, pero no es la fuente de verdad para las reglas — cualquier llamada directa a la API sería igualmente validada.

### 6.6 Lucide React sobre emojis

Los iconos de la interfaz usan la librería Lucide React (SVG), reemplazando emojis que se habían usado en iteraciones tempranas. Los emojis tienen renderizado inconsistente entre sistemas operativos y problemas de accesibilidad para screen readers. Los íconos SVG son pixel-perfect, dimensionables y parametrizables por color.

---

## 7. Limitaciones actuales

### 7.1 Seguridad

| Limitación | Impacto | Mitigación sugerida |
|-----------|---------|-------------------|
| Token JWT en `localStorage` | Vulnerable a XSS | Migrar a cookies `httpOnly + SameSite=Strict` |
| Sin expiración verificada en cliente | Sesión persiste aunque token expire | Verificar `exp` del JWT al cargar la app |
| Sin refresh tokens | Sesión termina abruptamente | Implementar token rotation |
| OTP sin expiración temporal | Un OTP robado es válido indefinidamente | Agregar TTL (ej. 24h) al OTP |

### 7.2 Escalabilidad

| Limitación | Impacto |
|-----------|---------|
| SQLite sin concurrencia de escritura | Un solo escritor simultáneo; colisiones posibles con múltiples agentes |
| Sin índices en tabla `events` | Consultas lentas de historial con volúmenes grandes |
| Sin paginación en endpoints | Todos los paquetes se cargan en memoria de una vez |
| Sin caché | Cada request consulta la BD directamente |

### 7.3 Funcionalidad

| Limitación | Descripción |
|-----------|-------------|
| Sin notificaciones en tiempo real | El usuario debe refrescar manualmente para ver cambios |
| Sin validación de formato en ID proxy | Cualquier cadena de texto es aceptada como ID universitario |
| Solo un agente y un destinatario de prueba | El sistema tiene usuarios hardcoded en la inicialización |
| Sin recuperación de contraseña | No hay flujo de reset de credenciales |
| GPS simulado | La detección de geocerca es un botón manual, no GPS real |

### 7.4 Operaciones

| Limitación | Descripción |
|-----------|-------------|
| Sin logs estructurados | Los logs del servidor son stdout de uvicorn |
| Sin monitoreo | No hay métricas de uptime, latencia o errores |
| Sin backup automático | El archivo `pmn.db` no tiene respaldo periódico |
| Sin variables de entorno | `SECRET_KEY` del JWT está definida en código |

---

## 8. Posibles mejoras y trabajo futuro

### 8.1 Corto plazo (mejoras inmediatas)

**Seguridad:**
```typescript
// Verificar expiración del JWT en el cliente al cargar la app
function isTokenExpired(token: string): boolean {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
}
```

**Índices en SQLite:**
```sql
CREATE INDEX idx_events_package ON events(package_id);
CREATE INDEX idx_packages_estado ON packages(estado);
CREATE INDEX idx_packages_agente ON packages(agente_id);
```

**Variables de entorno:**
```python
# .env
SECRET_KEY=<generado-con-openssl-rand-hex-32>
DATABASE_URL=./data/pmn.db
```

**Paginación:**
```python
@router.get("")
def list_packages(skip: int = 0, limit: int = 50, ...):
    rows = db.execute("SELECT * FROM packages LIMIT ? OFFSET ?", (limit, skip))
```

### 8.2 Mediano plazo

**Notificaciones en tiempo real** con Server-Sent Events:
```python
from sse_starlette.sse import EventSourceResponse

@router.get("/stream")
async def notifications(current_user = Depends(get_current_user)):
    async def generator():
        while True:
            new_events = get_new_events_for(current_user["id"])
            for ev in new_events:
                yield {"data": json.dumps(ev)}
            await asyncio.sleep(3)
    return EventSourceResponse(generator())
```

**Validación de formato del proxy:**
```python
class TransitionRequest(BaseModel):
    proxy_id: Optional[str] = Field(
        None, pattern=r"^\d{4}-UCT-\d{3,6}$"
    )
```

**OTP con TTL:**
```sql
ALTER TABLE packages ADD COLUMN otp_expires_at TEXT;
```
```python
# Validar expiración antes de aceptar OTP
if pkg["otp_expires_at"] and pkg["otp_expires_at"] < now_iso():
    raise HTTPException(422, "El OTP ha expirado")
```

### 8.3 Largo plazo

| Mejora | Descripción |
|-------|-------------|
| **Migrar a PostgreSQL** | Soporte para múltiples escritores concurrentes, replicación, backups nativos |
| **GPS real** | Integrar Geolocation API del browser para detección automática de geocerca |
| **App móvil** | La API REST existente puede consumirse desde React Native o Flutter sin cambios en el backend |
| **TOTP real (RFC 6238)** | Generar secreto por paquete y validar con `pyotp`; mostrar QR al destinatario |
| **Reportes** | Dashboard de métricas: tiempos promedio de entrega, tasa de disputas por agente, paquetes por período |
| **Roles adicionales** | Director de unidad (aprobador de despachos), auditor (solo lectura de toda la trazabilidad) |
| **Firma digital** | Reemplazar el handshake textual por una firma criptográfica con clave privada del actor |

---

## Conclusión

El sistema PMN-INFO1163 implementa de forma funcional y coherente un protocolo de gestión de distribución institucional con trazabilidad completa, autenticación robusta y un flujo operacional que refleja un proceso logístico real. Las limitaciones identificadas son conocidas, documentadas y justificables en el contexto académico del proyecto. La arquitectura desacoplada garantiza que el sistema puede evolucionar de forma independiente en cada capa sin afectar al resto.

---

*Informe Técnico — Sistema PMN-INFO1163 | Universidad Católica de Temuco | 2026*
