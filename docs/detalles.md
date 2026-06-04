# Detalles técnicos del desarrollo — PMN-INFO1163

**Autor:** Desarrollador principal  
**Rol:** Ingeniero de Software — Semestre 5  
**Proyecto:** Sistema de Paquetería UCT  

> Este documento recoge los problemas reales que aparecieron durante el desarrollo, cómo los abordé y por qué tomé ciertas decisiones. No es un informe formal — es el registro honesto de lo que costó levantar esto.

---

## Índice

1. [El punto de partida](#1-el-punto-de-partida)
2. [Primer bloqueo: Pydantic y Python 3.13](#2-primer-bloqueo-pydantic-y-python-313)
3. [El CSS que rompía todo al arrancar](#3-el-css-que-rompía-todo-al-arrancar)
4. [Turbopack vs la RAM de Windows](#4-turbopack-vs-la-ram-de-windows)
5. [La máquina de estados — diseño y cambios de enfoque](#5-la-máquina-de-estados--diseño-y-cambios-de-enfoque)
6. [Las tarjetas de paquetes en blanco — el bug más frustrante](#6-las-tarjetas-de-paquetes-en-blanco--el-bug-más-frustrante)
7. [El OTP que no aparecía en el Destinatario](#7-el-otp-que-no-aparecía-en-el-destinatario)
8. [El problema del diseño visual — primera iteración fallida](#8-el-problema-del-diseño-visual--primera-iteración-fallida)
9. [Los emojis — error de juicio](#9-los-emojis--error-de-juicio)
10. [El widget TOTP — qué salió bien y qué no](#10-el-widget-totp--qué-salió-bien-y-qué-no)
11. [Decisiones que tomé y por qué](#11-decisiones-que-tomé-y-por-qué)
12. [Lo que haría diferente](#12-lo-que-haría-diferente)

---

## 1. El punto de partida

El proyecto llegó como un repositorio npm existente, sin backend funcional y con un frontend básico que básicamente era estructura vacía. La consigna era clara: implementar funcionalidades reales con persistencia real. No quería hacer una SPA con datos en memoria que simulara ser un sistema — eso es exactamente lo que el enunciado dice explícitamente que no quiere.

La decisión inicial fue usar **FastAPI + SQLite** para el backend y mantener **Next.js** para el frontend. FastAPI porque conozco Python bien, SQLite porque no quería configurar un servidor de base de datos para un proyecto académico que va a vivir en una sola máquina. El tradeoff era claro: simplicidad de setup a cambio de limitaciones de concurrencia. Aceptable.

Lo que no anticipé fue la cantidad de problemas de entorno que iban a aparecer antes de escribir una sola línea de lógica de negocio.

---

## 2. Primer bloqueo: Pydantic y Python 3.13

Cuando intenté instalar las dependencias del backend por primera vez, todo explotó con esto:

```
AttributeError: module 'typing' has no attribute '_GenericAlias'
```

El error viene de Pydantic v1 intentando usar internos del módulo `typing` que Python 3.13 removió. No es un error de mi código — es una incompatibilidad de versiones entre la librería y el runtime.

**Intento 1 (fallido):** Tratar de bajar la versión de Python. No viable porque el entorno de Windows no lo tenía disponible fácilmente.

**Intento 2 (fallido):** Buscar un `requirements.txt` con versiones pinadas al proyecto original. No existía.

**Solución real:** Actualizar a Pydantic v2. Pydantic v2 reescribió el motor de validación completamente en Rust (`pydantic-core`), por lo que no depende de los internos de `typing` que cambiaron. Una vez actualizado, el backend arrancó sin problemas.

La lección aquí es simple: cuando hay un error de incompatibilidad de versiones entre librería y runtime, la solución casi nunca es bajar el runtime — es actualizar la librería.

---

## 3. El CSS que rompía todo al arrancar

Después de levantar el backend, arranqué el frontend con `npm run dev` y la primera página cargaba un error 500. No hay nada más desorientador que un 500 en una página que no tiene código de negocio todavía.

El stack trace apuntaba a un error en la compilación de CSS. Tardé un rato en entender qué estaba pasando porque el mensaje de error de Next.js con Tailwind v4 no es particularmente claro.

El problema era el orden de los `@import` en `globals.css`:

```css
/* Así estaba — incorrecto */
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Inter...');
```

Tailwind CSS v4 procesa los imports en orden y no puede manejar un `@import` de URL externa **después** de su propio import. Tiene que ir al revés:

```css
/* Correcto */
@import url('https://fonts.googleapis.com/css2?family=Inter...');
@import "tailwindcss";
```

Una vez corregido, el 500 desapareció. Tiempo perdido en esto: más del que debería haberme costado. Documentarlo para no volver a cometer el mismo error.

---

## 4. Turbopack vs la RAM de Windows

Este fue el más inesperado. Después de varios días de desarrollo, al intentar arrancar el servidor de desarrollo, el proceso crasheaba con:

```
thread 'tokio-runtime-worker' panicked
OS can't spawn worker thread: El archivo de paginación es demasiado pequeño
para completar la operación. (os error 1455)
```

Error de Windows. El archivo de paginación virtual no tenía espacio para crear los worker threads que Tokio (el runtime async de Rust que usa Turbopack internamente) necesitaba.

**Primera reacción:** Buscar cómo aumentar el archivo de paginación de Windows. Es un setting del sistema que requiere reinicio. Posible, pero no quería tocar la configuración del sistema si había una alternativa.

**Intento fallido:** `next dev --no-turbopack`. Este flag no existe. Me lo inventé por analogía con otros CLIs de Node.js. El CLI de Next.js devolvió:
```
error: unknown option '--no-turbopack'
(Did you mean --turbopack?)
```

**Solución real:** `next dev --help`. Simplemente ver qué flags están disponibles. Ahí estaba:
```
--webpack    Starts development mode using webpack.
```

El flag correcto era `--webpack`. Webpack usa Node.js, no Rust, y no necesita workers del OS con el mismo footprint de memoria. Una vez cambiado el script en `package.json`, el problema desapareció completamente.

Moraleja: cuando un comando no existe, leer el help antes de adivinar.

---

## 5. La máquina de estados — diseño y cambios de enfoque

La máquina de estados del sistema es el corazón del proyecto. Definir qué transiciones son válidas desde cada estado y para cada rol fue la parte más compleja de diseñar correctamente.

**Primer enfoque:** Una función gigante con un `if/elif` por cada combinación de estado + rol + transición destino. Funcionó, pero era imposible de leer y mantener.

**Cambio de enfoque:** Un diccionario de transiciones válidas:

```python
VALID_TRANSITIONS: dict[str, dict[str, list[str]]] = {
    "PENDIENTE_RECOLECCION": {
        "AGENTE": ["HANDSHAKE_ORIGEN", "RECHAZO_ORIGEN"],
    },
    "HANDSHAKE_ORIGEN": {
        "AGENTE": ["EN_TRANSITO"],
    },
    # ...
}
```

Esto hizo el código legible y fácil de extender. Agregar un nuevo estado es añadir una entrada al diccionario, no modificar lógica condicional.

**El problema del Supervisor:** La primera versión del query del Supervisor para ver sus paquetes no incluía `FLUJO_RETORNO`. Eso significaba que cuando un paquete estaba en retorno esperando el 3er Handshake, el Supervisor no lo veía en su lista principal — solo en la "Vista global". Un bug funcional real que pasé por alto en el diseño inicial.

```python
# Incorrecto — faltaba FLUJO_RETORNO
WHERE estado IN ('CUARENTENA','DISPUTA_CUSTODIA','CERRADO_INCIDENCIA')

# Correcto
WHERE estado IN ('CUARENTENA','DISPUTA_CUSTODIA','CERRADO_INCIDENCIA','FLUJO_RETORNO')
```

---

## 6. Las tarjetas de paquetes en blanco — el bug más frustrante

Este bug tardé más en diagnosticar que en arreglar. Los paquetes cargaban (la API respondía correctamente), pero las tarjetas en el panel aparecían como rectángulos grises. Al hacer click en una tarjeta, el sistema volvía a cargar y todo aparecía bien. Pasaba solo en la carga inicial.

Estuve un buen rato mirando el componente `PackageCard` buscando un error de renderizado. No era el componente.

El problema era en el hook de carga. Había escrito esto:

```typescript
const load = useCallback(async () => {
    const data = await apiGetPackages();
    setPackages(data);
    if (selected) {
        const upd = data.find(p => p.id === selected.id);
        if (upd) setSelected(upd);
    }
}, [selected]);   // ← selected como dependencia

useEffect(() => { load(); }, [load]);  // ← load como dependencia
```

Lo que pasa aquí:
1. Componente monta → `load` se ejecuta → paquetes cargan → `setPackages(data)`.
2. Usuario hace click en un paquete → `setSelected(p)` → `selected` cambia.
3. `selected` cambió → `useCallback` recrea `load` → `useEffect` detecta que `load` es nueva → ejecuta `load` otra vez.
4. Nueva ejecución de `load` → `setPackages([])` temporalmente durante el fetch → las tarjetas desaparecen → `setPackages(data)` → las tarjetas reaparecen.

Era un ciclo de re-render innecesario cada vez que el usuario seleccionaba algo.

**Fix:** Sacar `selected` del ciclo reactivo usando `useRef`:

```typescript
const selectedIdRef = useRef<number | null>(null);

async function load() {          // función normal, sin useCallback
    const data = await apiGetPackages();
    setPackages(data);
    if (selectedIdRef.current !== null) {
        const upd = data.find(p => p.id === selectedIdRef.current);
        if (upd) setSelected(upd);
    }
}

useEffect(() => { load(); }, []);  // solo al montar

function selectPkg(p: PkgType) {
    selectedIdRef.current = p.id;    // actualiza ref, no estado reactivo
    setSelected(p);
}
```

`useRef` guarda el valor sin disparar re-renders. El ciclo se rompe. Apliqué este patrón en los 4 dashboards porque todos tenían el mismo problema.

---

## 7. El OTP que no aparecía en el Destinatario

El widget TOTP del Destinatario estaba implementado correctamente en código, pero al seleccionar un paquete, el widget simplemente no aparecía. El código decía:

```typescript
const hasActiveOtp = selected?.otp_visible && selected.otp_visible !== "YA USADO";
{hasActiveOtp && <TotpWidget code={selected.otp_visible} ... />}
```

`selected.otp_visible` era `undefined` siempre.

Revisé el backend — el campo `otp_visible` estaba correctamente implementado. Pero cuando hice una prueba directa con `curl`:

```bash
GET /api/packages       → otp_visible: NO EXISTE en la respuesta
GET /api/packages/2     → otp_visible: "800012"
```

El campo solo lo devolvía el endpoint **individual**, no el de **lista**. El frontend cargaba los paquetes con el endpoint de lista y `otp_visible` nunca llegaba.

**Fix en el frontend:** La función `selectPkg` hace fetch individual al hacer click:

```typescript
async function selectPkg(p: PkgType) {
    selectedIdRef.current = p.id;
    setSelected(p);                          // muestra lo que tenemos
    const full = await apiGetPackage(p.id);  // fetch individual con otp_visible
    setSelected(full);                       // actualiza con datos completos
}
```

**Fix en el backend (largo plazo):** Mover la asignación de `otp_visible` a `_package_to_dict()`, la función helper que construye la respuesta en ambos endpoints. Así el campo estaría disponible siempre, sin doble fetch.

---

## 8. El problema del diseño visual — primera iteración fallida

La primera versión del frontend era funcional pero visualmente terrible. Todo comprimido, sin espacio, texto diminuto, y con emojis mezclados con texto. El feedback fue directo: "se ve todo compactado y bugeado, no es amigable a la vista".

El problema de fondo era que había priorizado hacer funcionar la lógica antes de pensar en el layout. Resultado: cards aplastadas, padding de 8px en todo, y una interfaz que se veía como un debug dump de datos.

**Cambios principales del rediseño:**

| Antes | Después |
|-------|---------|
| Padding 8px | Padding 28px en cards |
| Grid de 2 columnas sin separación | `340px` para lista + `1fr` para detalle |
| Fuente 11px en todo | Jerarquía: 26px títulos → 14px texto → 11px labels |
| Colores planos | Sistema de colores por estado (verde=entregado, amarillo=pendiente, etc.) |
| Sin espacio entre elementos | `gap: 16-20px` consistente |
| Iconos emoji | Lucide React SVG con tamaño y color parametrizables |

El rediseño tomó tiempo pero era necesario. Un sistema empresarial que se ve mal transmite falta de cuidado en todo lo demás.

---

## 9. Los emojis — error de juicio

Los emojis entraron en la primera iteración como shortcuts visuales rápidos. `🔐` para autenticación, `📦` para paquetes, `✍️` para handshakes. En el momento parecía razonable.

Problemas que no consideré:
- **Renderizado en Windows 10:** Los emojis de Windows tienen un estilo distinto a los de macOS. Lo que se ve bien en un sistema se ve diferente en otro.
- **En pantallas pequeñas o con DPI alto:** Los emojis no son vectoriales — tienen un tamaño fijo de bitmap.
- **Profesionalismo:** Un sistema de gestión empresarial universitario con emojis en los títulos de sección se ve amateur.

La eliminación fue sistemática: reemplazar cada emoji con el ícono Lucide equivalente. `🔐` → `<Lock />`, `📦` → `<Package />`, `✍️` → `<PenLine />`, `🔑` → `<KeyRound />`. Más trabajo, mejor resultado.

---

## 10. El widget TOTP — qué salió bien y qué no

**Lo que salió bien:**

El anillo de cuenta regresiva SVG funcionó a la primera. La lógica es simple:
```typescript
const circ = 2 * Math.PI * R;
const offset = circ - (progress / 100) * circ;
// stroke-dashoffset animado con CSS transition
```

El efecto visual de los 6 dígitos individuales en cajas separadas — como un autenticador real — da una percepción de profesionalismo que justifica la complejidad.

**Lo que no funcionó al principio:**

El widget tenía una condición de visibilidad demasiado restrictiva — solo aparecía para 4 estados específicos del paquete (`INSPECCION_ACTIVO`, `SOLICITAR_OTP`, etc.). El resultado era que la mayoría del tiempo el widget no se veía aunque hubiera un OTP activo.

La corrección fue remover la restricción de estado y mostrar el widget para **cualquier paquete con `otp_visible` disponible y no usado**:

```typescript
// Antes — muy restrictivo
const isActive = ["INSPECCION_ACTIVO", "SOLICITAR_OTP", ...].includes(pkg.estado);
if (!isActive && !isUsed) return null;

// Después — visible siempre que haya OTP activo
const hasActiveOtp = selected?.otp_visible && !isOtpUsed;
{hasActiveOtp && <TotpWidget ... />}
```

**Lo que es una limitación consciente:**

El código no cambia realmente cada 30 segundos — el countdown es cosmético. En un TOTP real (RFC 6238), el código se deriva de `HMAC-SHA1(secret, floor(time/30))`. Acá el código es el OTP fijo del paquete. La diferencia es intencional: un OTP fijo es más resistente a problemas de conectividad, que son reales en un campus universitario.

---

## 11. Decisiones que tomé y por qué

**JWT en localStorage en vez de cookies httpOnly:**  
Cookiees httpOnly son más seguras pero requieren configurar CORS con `credentials: "include"` en ambos lados, y el servidor debe devolver `Set-Cookie` correctamente. Para desarrollo local cruzando puertos (3001 → 8000) eso agrega complejidad. Para el contexto académico, localStorage es suficiente y más fácil de depurar.

**`useRef` en vez de limpiar las dependencias del `useCallback`:**  
La alternativa era limpiar las dependencias del callback. El problema es que `selected` ES una dependencia legítima — el callback usa su valor. La solución "limpia" habría sido usar `useReducer` o elevar el estado. `useRef` es más pragmático para este caso: el ref se actualiza síncronamente y siempre tiene el valor más reciente sin participar en el grafo reactivo.

**No implementar WebSockets:**  
Server-Sent Events o WebSockets para notificaciones en tiempo real habría mejorado mucho la experiencia — el Destinatario podría recibir una alerta cuando el agente llega, sin tener que refrescar. Decidí no implementarlo por tiempo. El auto-refresh cada 15 segundos es el compromiso: funcional, predecible, sin estado persistente de conexión.

**Webpack sobre Turbopack:**  
Turbopack es más rápido en compilación incremental pero requiere más memoria. En el entorno de desarrollo (Windows con archivo de paginación limitado), Turbopack no era viable. Webpack compila más lento al inicio pero es estable. Para un proyecto de desarrollo es perfectamente aceptable.

---

## 12. Lo que haría diferente

Si empezara el proyecto desde cero con lo que sé ahora:

**1. Estructura de la API desde el inicio con `otp_visible` en el listado**  
El campo debería construirse en `_package_to_dict()` y estar disponible siempre, no solo en el endpoint individual. Me hubiera ahorrado el doble-fetch en el Destinatario.

**2. Definir el sistema de diseño antes de escribir componentes**  
El rediseño completo que tuve que hacer hubiera sido innecesario si desde el principio hubiera establecido: tokens de espaciado, paleta de colores por estado, jerarquía tipográfica. En cambio lo fui improvisando y tuve que reescribir todo.

**3. Variables de entorno desde el día 1**  
`SECRET_KEY` hardcodeada en el código es técnicamente incorrecto. Un archivo `.env` con `python-dotenv` tarda 5 minutos en configurar y evita commits de secretos al repositorio.

**4. Tests básicos en el backend**  
Sin tests, cada cambio en `business_rules.py` requería probar manualmente el flujo completo. Con `pytest` y un par de tests de transición de estados, habría detectado el bug del Supervisor (`FLUJO_RETORNO` ausente) en el momento que escribí el código, no después de probarlo manualmente.

**5. No usar emojis nunca en interfaces de producción**  
Punto. No hay argumento que los justifique en este contexto.

---

*Documento de desarrollo — PMN-INFO1163 | Universidad Católica de Temuco | 2026*  
*Escrito desde la perspectiva del desarrollador principal durante y después del desarrollo del sistema.*
