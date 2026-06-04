from sqlite3 import Connection
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.api.deps import get_db
from app.core.auth import get_current_user
from app.core.business_rules import validate_transition, get_allowed_transitions
from app.db.database import generate_otp, now_iso

router = APIRouter(prefix="/api/packages", tags=["packages"])

class CreatePackageRequest(BaseModel):
    titulo: str
    descripcion: str
    origen: str
    destino: str
    agente_username: str
    destinatario_username: str

class TransitionRequest(BaseModel):
    new_state: str
    notas: Optional[str] = None
    otp_code: Optional[str] = None
    proxy_nombre: Optional[str] = None
    proxy_id: Optional[str] = None

def _package_to_dict(row, db: Connection) -> dict:
    pkg = dict(row)
    # Agregar historial de eventos
    events = db.execute(
        "SELECT * FROM events WHERE package_id = ? ORDER BY timestamp ASC",
        (pkg["id"],)
    ).fetchall()
    pkg["events"] = [dict(e) for e in events]
    # Agregar nombres de actores
    if pkg.get("agente_id"):
        ag = db.execute("SELECT nombre FROM users WHERE id=?", (pkg["agente_id"],)).fetchone()
        pkg["agente_nombre"] = ag["nombre"] if ag else None
    if pkg.get("destinatario_id"):
        dest = db.execute("SELECT nombre FROM users WHERE id=?", (pkg["destinatario_id"],)).fetchone()
        pkg["destinatario_nombre"] = dest["nombre"] if dest else None
    rem = db.execute("SELECT nombre FROM users WHERE id=?", (pkg["remitente_id"],)).fetchone()
    pkg["remitente_nombre"] = rem["nombre"] if rem else None
    return pkg

@router.get("")
def list_packages(
    db: Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    rol = current_user["rol"]
    uid = current_user["id"]

    if rol == "REMITENTE":
        rows = db.execute(
            "SELECT * FROM packages WHERE remitente_id = ? ORDER BY updated_at DESC", (uid,)
        ).fetchall()
    elif rol == "AGENTE":
        rows = db.execute(
            "SELECT * FROM packages WHERE agente_id = ? ORDER BY updated_at DESC", (uid,)
        ).fetchall()
    elif rol == "DESTINATARIO":
        rows = db.execute(
            "SELECT * FROM packages WHERE destinatario_id = ? ORDER BY updated_at DESC", (uid,)
        ).fetchall()
    elif rol == "SUPERVISOR":
        rows = db.execute(
            """SELECT * FROM packages WHERE estado IN 
            ('CUARENTENA','DISPUTA_CUSTODIA','CERRADO_INCIDENCIA') 
            ORDER BY updated_at DESC"""
        ).fetchall()
    else:
        rows = []

    return [_package_to_dict(r, db) for r in rows]

@router.get("/all")
def list_all_packages(
    db: Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Solo para Supervisor: ver todos los paquetes"""
    if current_user["rol"] != "SUPERVISOR":
        raise HTTPException(status_code=403, detail="Acceso solo para Supervisor")
    rows = db.execute("SELECT * FROM packages ORDER BY updated_at DESC").fetchall()
    return [_package_to_dict(r, db) for r in rows]

@router.post("")
def create_package(
    body: CreatePackageRequest,
    db: Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["rol"] != "REMITENTE":
        raise HTTPException(status_code=403, detail="Solo el Remitente puede crear paquetes")

    # Validar campos
    if not body.titulo.strip():
        raise HTTPException(status_code=422, detail="El título no puede estar vacío")
    if not body.origen.strip():
        raise HTTPException(status_code=422, detail="El origen no puede estar vacío")
    if not body.destino.strip():
        raise HTTPException(status_code=422, detail="El destino no puede estar vacío")

    agente = db.execute("SELECT * FROM users WHERE username=? AND rol='AGENTE'", (body.agente_username,)).fetchone()
    if not agente:
        raise HTTPException(status_code=404, detail=f"Agente '{body.agente_username}' no encontrado")

    destinatario = db.execute("SELECT * FROM users WHERE username=? AND rol='DESTINATARIO'", (body.destinatario_username,)).fetchone()
    if not destinatario:
        raise HTTPException(status_code=404, detail=f"Destinatario '{body.destinatario_username}' no encontrado")

    # Validar que destino no sea inválido (lógica de negocio E2)
    destinos_invalidos = ["sala 404", "fuera de servicio", "inhabilitado"]
    if any(d in body.destino.lower() for d in destinos_invalidos):
        raise HTTPException(status_code=422, detail="El destino ingresado no existe o está fuera de servicio (Error E2)")

    otp = generate_otp()
    now = now_iso()

    cursor = db.execute(
        """INSERT INTO packages 
        (titulo, descripcion, origen, destino, estado, remitente_id, agente_id, destinatario_id, otp_code, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
        (body.titulo, body.descripcion, body.origen, body.destino,
         "PENDIENTE_RECOLECCION", current_user["id"], agente["id"], destinatario["id"],
         otp, now, now)
    )
    pkg_id = cursor.lastrowid

    db.execute(
        """INSERT INTO events (package_id, actor_id, actor_nombre, estado_anterior, estado_nuevo, notas, timestamp)
        VALUES (?,?,?,?,?,?,?)""",
        (pkg_id, current_user["id"], current_user["nombre"],
         "NUEVO", "PENDIENTE_RECOLECCION",
         f"Paquete creado. OTP generado para destinatario {destinatario['nombre']}.", now)
    )
    db.commit()

    row = db.execute("SELECT * FROM packages WHERE id=?", (pkg_id,)).fetchone()
    result = _package_to_dict(row, db)
    result["otp_generado"] = otp  # Para demo: mostrar OTP en la respuesta
    return result

@router.get("/{pkg_id}")
def get_package(
    pkg_id: int,
    db: Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    row = db.execute("SELECT * FROM packages WHERE id=?", (pkg_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")
    
    pkg = _package_to_dict(row, db)
    
    # Agregar transiciones disponibles
    pkg["allowed_transitions"] = get_allowed_transitions(pkg["estado"], current_user["rol"])
    
    # Mostrar OTP a agente, supervisor, remitente Y destinatario (para el widget TOTP)
    if current_user["rol"] in ("AGENTE", "SUPERVISOR", "REMITENTE", "DESTINATARIO"):
        pkg["otp_visible"] = row["otp_code"] if not row["otp_used"] else "YA USADO"
    
    return pkg

@router.post("/{pkg_id}/transition")
def transition_package(
    pkg_id: int,
    body: TransitionRequest,
    db: Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    row = db.execute("SELECT * FROM packages WHERE id=?", (pkg_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")

    pkg = dict(row)
    current_state = pkg["estado"]
    new_state = body.new_state

    # Validar transición
    ok, msg = validate_transition(current_state, new_state, current_user["rol"])
    if not ok:
        raise HTTPException(status_code=422, detail=msg)

    # Validar OTP si la transición es SOLICITAR_OTP → ENTREGADO
    if current_state == "SOLICITAR_OTP" and new_state == "ENTREGADO":
        if not body.otp_code:
            raise HTTPException(status_code=422, detail="Se requiere el código OTP para completar la entrega")
        if pkg["otp_used"]:
            raise HTTPException(status_code=422, detail="El código OTP ya fue utilizado")
        if pkg["otp_code"] != body.otp_code.strip():
            raise HTTPException(status_code=422, detail="Código OTP incorrecto. Verifica el código enviado al destinatario.")
        db.execute("UPDATE packages SET otp_used=1 WHERE id=?", (pkg_id,))

    # Actualizar proxy si aplica
    updates = {"estado": new_state, "updated_at": now_iso()}
    if body.proxy_nombre:
        updates["proxy_nombre"] = body.proxy_nombre
    if body.proxy_id:
        updates["proxy_id"] = body.proxy_id

    set_clause = ", ".join(f"{k}=?" for k in updates.keys())
    db.execute(
        f"UPDATE packages SET {set_clause} WHERE id=?",
        list(updates.values()) + [pkg_id]
    )

    # Registrar evento de trazabilidad
    db.execute(
        """INSERT INTO events (package_id, actor_id, actor_nombre, estado_anterior, estado_nuevo, notas, timestamp)
        VALUES (?,?,?,?,?,?,?)""",
        (pkg_id, current_user["id"], current_user["nombre"],
         current_state, new_state, body.notas or "", now_iso())
    )
    db.commit()

    updated = db.execute("SELECT * FROM packages WHERE id=?", (pkg_id,)).fetchone()
    result = _package_to_dict(updated, db)
    result["allowed_transitions"] = get_allowed_transitions(new_state, current_user["rol"])
    
    if current_user["rol"] in ("AGENTE", "SUPERVISOR", "REMITENTE", "DESTINATARIO"):
        result["otp_visible"] = updated["otp_code"] if not updated["otp_used"] else "YA USADO"
    
    return result

@router.get("/stats/dashboard")
def get_dashboard_stats(
    db: Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Estadísticas para el dashboard"""
    total = db.execute("SELECT COUNT(*) as c FROM packages").fetchone()["c"]
    entregados = db.execute("SELECT COUNT(*) as c FROM packages WHERE estado='ENTREGADO'").fetchone()["c"]
    en_transito = db.execute("SELECT COUNT(*) as c FROM packages WHERE estado IN ('EN_TRANSITO','LLEGADA_GEOCERCA','PRESENCIA_DESTINATARIO','INTENTO_FALLIDO_ESPERA','INSPECCION_ACTIVO','SOLICITAR_OTP','HANDSHAKE_ORIGEN')").fetchone()["c"]
    disputas = db.execute("SELECT COUNT(*) as c FROM packages WHERE estado IN ('DISPUTA_CUSTODIA','CUARENTENA')").fetchone()["c"]
    pendientes = db.execute("SELECT COUNT(*) as c FROM packages WHERE estado='PENDIENTE_RECOLECCION'").fetchone()["c"]
    
    return {
        "total": total,
        "entregados": entregados,
        "en_transito": en_transito,
        "disputas": disputas,
        "pendientes": pendientes,
    }
