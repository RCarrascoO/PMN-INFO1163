"use client";

import { Package as PackageType } from "@/lib/api";
import { MapPin, Truck, User, ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";

const STATE_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  BORRADOR:               { label: "Borrador",          color: "#6b7280", bg: "rgba(107,114,128,0.15)", dot: "#6b7280" },
  PENDIENTE_RECOLECCION:  { label: "Pendiente",         color: "#f59e0b", bg: "rgba(245,158,11,0.15)",  dot: "#f59e0b" },
  HANDSHAKE_ORIGEN:       { label: "Handshake Origen",  color: "#3b82f6", bg: "rgba(59,130,246,0.15)",  dot: "#3b82f6" },
  EN_TRANSITO:            { label: "En Tránsito",       color: "#6366f1", bg: "rgba(99,102,241,0.15)",  dot: "#6366f1" },
  LLEGADA_GEOCERCA:       { label: "Llegada GPS",       color: "#8b5cf6", bg: "rgba(139,92,246,0.15)",  dot: "#8b5cf6" },
  PRESENCIA_DESTINATARIO: { label: "Verificando",       color: "#06b6d4", bg: "rgba(6,182,212,0.15)",   dot: "#06b6d4" },
  INTENTO_FALLIDO_ESPERA: { label: "Espera Proxy",      color: "#f97316", bg: "rgba(249,115,22,0.15)",  dot: "#f97316" },
  INSPECCION_ACTIVO:      { label: "En Inspección",     color: "#a78bfa", bg: "rgba(167,139,250,0.15)", dot: "#a78bfa" },
  SOLICITAR_OTP:          { label: "Validando OTP",     color: "#34d399", bg: "rgba(52,211,153,0.15)",  dot: "#34d399" },
  ENTREGADO:              { label: "Entregado",         color: "#10b981", bg: "rgba(16,185,129,0.15)",  dot: "#10b981" },
  FLUJO_RETORNO:          { label: "En Retorno",        color: "#fb923c", bg: "rgba(251,146,60,0.15)",  dot: "#fb923c" },
  RECHAZO_ORIGEN:         { label: "Rechazado Origen",  color: "#ef4444", bg: "rgba(239,68,68,0.15)",   dot: "#ef4444" },
  DISPUTA_CUSTODIA:       { label: "Disputa Custodia",  color: "#dc2626", bg: "rgba(220,38,38,0.15)",   dot: "#dc2626" },
  CUARENTENA:             { label: "Cuarentena",        color: "#9ca3af", bg: "rgba(156,163,175,0.15)", dot: "#9ca3af" },
  DEVUELTO_ORIGEN:        { label: "Devuelto a Origen", color: "#64748b", bg: "rgba(100,116,139,0.15)", dot: "#64748b" },
  CERRADO_INCIDENCIA:     { label: "Cerrado c/Incid.",  color: "#dc2626", bg: "rgba(220,38,38,0.1)",    dot: "#dc2626" },
};

/* ────────── StatusBadge ────────── */
export function StatusBadge({ estado }: { estado: string }) {
  const cfg = STATE_CONFIG[estado] || { label: estado, color: "#888", bg: "rgba(136,136,136,0.1)", dot: "#888" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: "4px 10px", borderRadius: "999px",
      fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em",
      textTransform: "uppercase", whiteSpace: "nowrap",
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30`,
    }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

/* ────────── PackageCard ────────── */
export function PackageCard({ pkg, onClick, selected = false }: {
  pkg: PackageType; onClick?: () => void; selected?: boolean;
}) {
  const cfg = STATE_CONFIG[pkg.estado] || { label: pkg.estado, color: "#888", bg: "rgba(136,136,136,0.1)", dot: "#888" };
  const isTerminal = ["ENTREGADO","DEVUELTO_ORIGEN","CERRADO_INCIDENCIA"].includes(pkg.estado);

  return (
    <div
      onClick={onClick}
      role="button"
      style={{
        width: "100%", textAlign: "left", padding: "18px 20px", borderRadius: "16px",
        transition: "all 0.2s", cursor: onClick ? "pointer" : "default",
        background: selected ? "rgba(255,215,0,0.05)" : "rgba(10,22,40,0.9)",
        border: `1px solid ${selected ? "rgba(255,215,0,0.3)" : "rgba(255,215,0,0.08)"}`,
        userSelect: "none",
      }}
    >
      {/* Top */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "10px", fontFamily: "monospace", fontWeight: 600, color: "rgba(74,96,128,1)" }}>#{pkg.id}</span>
            {isTerminal && <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "999px", background: "rgba(107,114,128,0.2)", color: "#6b7280", fontWeight: 700 }}>CERRADO</span>}
          </div>
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "3px" }}>{pkg.titulo}</h3>
          <p style={{ fontSize: "12px", color: "rgba(139,163,199,1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pkg.descripcion}</p>
        </div>
        <StatusBadge estado={pkg.estado} />
      </div>

      {/* Route info */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px", minWidth: 0 }}>
          <ArrowUpRight size={12} style={{ color: "rgba(74,96,128,1)", flexShrink: 0 }} />
          <span style={{ fontSize: "12px", color: "rgba(139,163,199,1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pkg.origen}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "7px", minWidth: 0 }}>
          <ArrowDownLeft size={12} style={{ color: "rgba(74,96,128,1)", flexShrink: 0 }} />
          <span style={{ fontSize: "12px", color: "rgba(139,163,199,1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pkg.destino}</span>
        </div>
        {pkg.agente_nombre && (
          <div style={{ display: "flex", alignItems: "center", gap: "7px", minWidth: 0 }}>
            <Truck size={12} style={{ color: "rgba(74,96,128,1)", flexShrink: 0 }} />
            <span style={{ fontSize: "12px", color: "rgba(139,163,199,1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pkg.agente_nombre}</span>
          </div>
        )}
        {pkg.destinatario_nombre && (
          <div style={{ display: "flex", alignItems: "center", gap: "7px", minWidth: 0 }}>
            <User size={12} style={{ color: "rgba(74,96,128,1)", flexShrink: 0 }} />
            <span style={{ fontSize: "12px", color: "rgba(139,163,199,1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pkg.destinatario_nombre}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: cfg.dot }} />
          <span style={{ fontSize: "11px", color: "rgba(74,96,128,1)" }}>{pkg.events?.length || 0} eventos</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <Clock size={11} style={{ color: "rgba(74,96,128,1)" }} />
          <span style={{ fontSize: "11px", color: "rgba(74,96,128,1)" }}>
            {new Date(pkg.updated_at).toLocaleDateString("es-CL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ────────── StatCard — usa Icon (mayúscula) ────────── */
export function StatCard({ label, value, Icon, color, bg }: {
  label: string; value: number | string;
  Icon: React.ElementType; color: string; bg: string;
}) {
  return (
    <div style={{ padding: "24px", borderRadius: "20px", background: "rgba(10,22,40,0.9)", border: "1px solid rgba(255,215,0,0.08)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={22} style={{ color }} />
        </div>
        <span style={{ fontSize: "36px", fontWeight: 900, color, lineHeight: 1 }}>{value}</span>
      </div>
      <p style={{ fontSize: "13px", fontWeight: 500, color: "rgba(139,163,199,1)" }}>{label}</p>
    </div>
  );
}

/* ────────── EventTimeline ────────── */
export function EventTimeline({ events }: { events: PackageType["events"] }) {
  if (!events || events.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <MapPin size={28} style={{ color: "rgba(74,96,128,0.4)", margin: "0 auto 10px" }} />
        <p style={{ fontSize: "13px", color: "rgba(74,96,128,1)" }}>Sin eventos registrados</p>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {[...events].reverse().map((ev, i) => {
        const cfg = STATE_CONFIG[ev.estado_nuevo] || { color: "#888", label: ev.estado_nuevo, bg: "", dot: "#888" };
        return (
          <div key={ev.id} style={{ display: "flex", gap: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: cfg.dot, marginTop: "6px", boxShadow: `0 0 6px ${cfg.dot}60`, flexShrink: 0 }} />
              {i < events.length - 1 && <div style={{ width: "1px", flex: 1, background: "rgba(255,215,0,0.07)", minHeight: "32px", margin: "4px 0" }} />}
            </div>
            <div style={{ paddingBottom: "20px", minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                <StatusBadge estado={ev.estado_nuevo} />
                <span style={{ fontSize: "11px", fontFamily: "monospace", color: "rgba(74,96,128,1)" }}>
                  {new Date(ev.timestamp).toLocaleString("es-CL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "rgba(139,163,199,1)", marginBottom: "2px" }}>
                <span style={{ color: "rgba(74,96,128,1)" }}>por </span>
                <strong style={{ color: "rgba(200,220,255,0.9)" }}>{ev.actor_nombre}</strong>
              </p>
              {ev.notas && <p style={{ fontSize: "12px", color: "rgba(74,96,128,1)", fontStyle: "italic" }}>{ev.notas}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { STATE_CONFIG };
