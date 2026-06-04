"""
Reglas de negocio: qué transiciones son válidas, qué rol las puede hacer.
"""

# Mapa: (estado_actual, estado_nuevo) -> rol_requerido
TRANSITIONS = {
    ("BORRADOR",              "PENDIENTE_RECOLECCION"): "REMITENTE",
    ("BORRADOR",              "BORRADOR"):               "REMITENTE",   # corregir datos
    ("PENDIENTE_RECOLECCION", "RECHAZO_ORIGEN"):         "AGENTE",
    ("PENDIENTE_RECOLECCION", "HANDSHAKE_ORIGEN"):       "AGENTE",
    ("HANDSHAKE_ORIGEN",      "EN_TRANSITO"):            "AGENTE",
    ("EN_TRANSITO",           "LLEGADA_GEOCERCA"):       "AGENTE",
    ("LLEGADA_GEOCERCA",      "PRESENCIA_DESTINATARIO"): "AGENTE",
    ("PRESENCIA_DESTINATARIO","INSPECCION_ACTIVO"):      "AGENTE",
    ("PRESENCIA_DESTINATARIO","INTENTO_FALLIDO_ESPERA"): "AGENTE",
    ("INTENTO_FALLIDO_ESPERA","INSPECCION_ACTIVO"):      "AGENTE",
    ("INTENTO_FALLIDO_ESPERA","FLUJO_RETORNO"):          "AGENTE",
    ("INSPECCION_ACTIVO",     "SOLICITAR_OTP"):          "DESTINATARIO",
    ("INSPECCION_ACTIVO",     "FLUJO_RETORNO"):          "AGENTE",
    ("SOLICITAR_OTP",         "ENTREGADO"):              "AGENTE",
    ("FLUJO_RETORNO",         "DEVUELTO_ORIGEN"):        "REMITENTE",
    ("FLUJO_RETORNO",         "DISPUTA_CUSTODIA"):       "REMITENTE",
    ("DISPUTA_CUSTODIA",      "CUARENTENA"):             "AGENTE",
    ("CUARENTENA",            "CERRADO_INCIDENCIA"):     "SUPERVISOR",
    ("RECHAZO_ORIGEN",        "PENDIENTE_RECOLECCION"):  "REMITENTE",
}

# Estados terminales (no se pueden mover)
TERMINAL_STATES = {"ENTREGADO", "DEVUELTO_ORIGEN", "CERRADO_INCIDENCIA"}

def validate_transition(current_state: str, new_state: str, user_rol: str) -> tuple[bool, str]:
    if current_state in TERMINAL_STATES:
        return False, f"El paquete está en estado terminal ({current_state}) y no puede modificarse."
    
    key = (current_state, new_state)
    required_rol = TRANSITIONS.get(key)
    
    if required_rol is None:
        return False, f"Transición de '{current_state}' → '{new_state}' no está permitida en el sistema."
    
    if user_rol != required_rol:
        role_names = {
            "REMITENTE": "Remitente (Informática)",
            "AGENTE": "Agente de Distribución",
            "DESTINATARIO": "Destinatario",
            "SUPERVISOR": "Supervisor de Bodega",
        }
        return False, f"Solo el rol '{role_names.get(required_rol, required_rol)}' puede realizar esta acción."
    
    return True, "OK"

def get_allowed_transitions(current_state: str, user_rol: str) -> list[str]:
    if current_state in TERMINAL_STATES:
        return []
    return [
        new for (cur, new), rol in TRANSITIONS.items()
        if cur == current_state and rol == user_rol
    ]
