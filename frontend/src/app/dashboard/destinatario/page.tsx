"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, AlertCircle, Package, CheckCircle2, XCircle,
  Clock, Inbox, Shield, Timer, Key
} from "lucide-react";
import { apiGetPackages, apiGetPackage, apiTransition, Package as PkgType } from "@/lib/api";
import { PackageCard, StatusBadge, EventTimeline } from "@/components/ui/DashboardComponents";

const card: React.CSSProperties = {
  padding: "28px", borderRadius: "20px",
  background: "rgba(10,22,40,0.9)", border: "1px solid rgba(255,215,0,0.08)"
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: "11px", fontWeight: 700,
  letterSpacing: "0.1em", textTransform: "uppercase",
  color: "rgba(74,96,128,1)", marginBottom: "8px"
};
const fld: React.CSSProperties = {
  width: "100%", background: "rgba(4,10,20,0.85)",
  border: "1px solid rgba(255,215,0,0.14)", borderRadius: "12px",
  padding: "12px 16px", color: "white", fontSize: "14px",
  outline: "none", boxSizing: "border-box"
};

/* ─────────────────────────────────────────
   TOTP WIDGET — código de seguridad visual
───────────────────────────────────────── */
function TotpWidget({ code, used }: { code: string; used: boolean }) {
  const [countdown, setCountdown] = useState(30 - (Math.floor(Date.now() / 1000) % 30));

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(30 - (Math.floor(Date.now() / 1000) % 30));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const progress = (countdown / 30) * 100;
  const R = 26;
  const circ = 2 * Math.PI * R;
  const offset = circ - (progress / 100) * circ;
  const urgent = countdown <= 6;

  if (used) {
    return (
      <div style={{
        padding: "20px 24px", borderRadius: "16px",
        background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.25)",
        display: "flex", alignItems: "center", gap: "14px"
      }}>
        <CheckCircle2 size={28} style={{ color: "#10b981", flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#6ee7b7", marginBottom: "3px" }}>
            Código ya utilizado
          </p>
          <p style={{ fontSize: "12px", color: "rgba(74,96,128,1)" }}>La entrega fue completada con éxito.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: "22px 24px", borderRadius: "18px",
      background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.3)"
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <Shield size={16} style={{ color: "#34d399" }} />
        <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#34d399" }}>
          Código de Seguridad OTP
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        {/* Countdown ring */}
        <div style={{ position: "relative", flexShrink: 0, width: "68px", height: "68px" }}>
          <svg width="68" height="68" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="34" cy="34" r={R} fill="none" stroke="rgba(52,211,153,0.1)" strokeWidth="3" />
            <circle
              cx="34" cy="34" r={R} fill="none"
              stroke={urgent ? "#ef4444" : "#34d399"}
              strokeWidth="3" strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
          }}>
            <span style={{ fontSize: "15px", fontWeight: 900, color: urgent ? "#ef4444" : "#34d399", fontFamily: "monospace", lineHeight: 1 }}>
              {countdown}
            </span>
            <span style={{ fontSize: "8px", color: "rgba(74,96,128,1)", marginTop: "2px" }}>SEG</span>
          </div>
        </div>

        {/* Digits */}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "12px", color: "rgba(139,163,199,1)", marginBottom: "12px" }}>
            Muestra este código al agente cuando llegue a entregarte el activo:
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            {(code || "------").split("").map((d, i) => (
              <div key={i} style={{
                width: "42px", height: "54px", borderRadius: "12px",
                background: "rgba(4,10,20,0.9)",
                border: `2px solid ${urgent ? "rgba(239,68,68,0.5)" : "rgba(52,211,153,0.35)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "24px", fontWeight: 900, fontFamily: "monospace",
                color: urgent ? "#ef4444" : "#34d399",
                transition: "border-color 0.3s, color 0.3s",
                userSelect: "none",
              }}>
                {d}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px" }}>
            <Timer size={12} style={{ color: "rgba(74,96,128,1)" }} />
            <span style={{ fontSize: "11px", color: urgent ? "#ef4444" : "rgba(74,96,128,1)" }}>
              {urgent ? `Expira en ${countdown}s` : `Se renueva en ${countdown}s`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────
   MAIN VIEW
───────────────────── */
export default function DestinatarioView() {
  const [packages, setPackages] = useState<PkgType[]>([]);
  const [selected, setSelected] = useState<PkgType | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [notas, setNotas] = useState("");
  const selectedIdRef = useRef<number | null>(null);

  /* Load list — always re-fetch selected individually to get otp_visible */
  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiGetPackages();
      setPackages(data);

      if (selectedIdRef.current !== null) {
        try {
          const full = await apiGetPackage(selectedIdRef.current);
          setSelected(full);
        } catch {
          const upd = data.find(p => p.id === selectedIdRef.current);
          if (upd) setSelected(upd);
        }
      }
    } catch {
      setError("Error al cargar paquetes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Auto-refresh every 15s when selected package is active */
  useEffect(() => {
    const activeStates = ["INSPECCION_ACTIVO", "SOLICITAR_OTP", "PRESENCIA_DESTINATARIO", "LLEGADA_GEOCERCA"];
    if (selected && activeStates.includes(selected.estado)) {
      const t = setInterval(async () => {
        if (selectedIdRef.current) {
          try {
            const full = await apiGetPackage(selectedIdRef.current);
            setSelected(full);
          } catch { /* ignore */ }
        }
      }, 15000);
      return () => clearInterval(t);
    }
  }, [selected?.estado]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Select and fetch full package data including otp_visible */
  async function selectPkg(p: PkgType) {
    selectedIdRef.current = p.id;
    setError("");
    // Immediately show what we have, then update with full data
    setSelected(p);
    try {
      const full = await apiGetPackage(p.id);
      setSelected(full);
    } catch { /* keep showing partial */ }
  }

  async function doTransition(newState: string, notasExtra?: string) {
    if (!selected) return;
    setActing(true);
    setError("");
    try {
      const updated = await apiTransition(selected.id, newState, {
        notas: notasExtra || notas
      });
      // Fetch full updated package to get otp_visible
      try {
        const full = await apiGetPackage(updated.id);
        setSelected(full);
      } catch {
        setSelected(updated);
      }
      setNotas("");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error en la operación");
    } finally {
      setActing(false);
    }
  }

  const pendingInspection = packages.filter(p => p.estado === "INSPECCION_ACTIVO");
  const awaitingOtp       = packages.filter(p => p.estado === "SOLICITAR_OTP");
  const inTransit         = packages.filter(p =>
    ["EN_TRANSITO","LLEGADA_GEOCERCA","PRESENCIA_DESTINATARIO",
     "INTENTO_FALLIDO_ESPERA","HANDSHAKE_ORIGEN","PENDIENTE_RECOLECCION"].includes(p.estado)
  );
  const completed = packages.filter(p =>
    ["ENTREGADO","DEVUELTO_ORIGEN","CERRADO_INCIDENCIA",
     "FLUJO_RETORNO","DISPUTA_CUSTODIA","CUARENTENA"].includes(p.estado)
  );

  /* Determine OTP widget data from selected package */
  const hasActiveOtp = selected &&
    selected.otp_visible &&
    selected.otp_visible !== "YA USADO" &&
    selected.otp_used !== 1;
  const isOtpUsed = selected && (selected.otp_used === 1 || selected.otp_visible === "YA USADO");

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 900, color: "white", marginBottom: "6px" }}>Panel Destinatario</h1>
          <p style={{ fontSize: "14px", color: "rgba(139,163,199,1)" }}>Prof. Jefe de Laboratorio de Redes — UCT</p>
        </div>
        <button onClick={() => load()} style={{
          display: "flex", alignItems: "center", gap: "8px", padding: "13px 22px",
          borderRadius: "12px", background: "rgba(255,215,0,0.04)",
          color: "rgba(200,220,255,0.8)", fontWeight: 600, fontSize: "14px",
          border: "1px solid rgba(255,215,0,0.14)", cursor: "pointer"
        }}>
          <RefreshCw size={15} /> Actualizar
        </button>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {awaitingOtp.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ marginBottom: "16px", padding: "18px 24px", borderRadius: "16px", display: "flex", alignItems: "center", gap: "14px", background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.4)" }}>
            <Key size={18} style={{ color: "#34d399", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#6ee7b7", marginBottom: "2px" }}>
                Agente listo para entregar — muestra tu código OTP
              </p>
              <p style={{ fontSize: "13px", color: "rgba(139,163,199,1)" }}>
                Selecciona el paquete y muestra el código de seguridad al agente.
              </p>
            </div>
          </motion.div>
        )}
        {pendingInspection.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ marginBottom: "16px", padding: "18px 24px", borderRadius: "16px", display: "flex", alignItems: "center", gap: "14px", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.4)" }}>
            <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#8b5cf6", flexShrink: 0, animation: "pulse 1.5s ease-in-out infinite" }} />
            <div>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#c4b5fd", marginBottom: "2px" }}>
                {pendingInspection.length} paquete{pendingInspection.length > 1 ? "s" : ""} esperando tu inspección D3
              </p>
              <p style={{ fontSize: "13px", color: "rgba(139,163,199,1)" }}>El agente está en el destino.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div style={{ marginBottom: "20px", padding: "14px 18px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "20px" }}>

        {/* ── Left: Package list ── */}
        <div style={card}>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(74,96,128,1)", marginBottom: "16px" }}>
            Paquetes dirigidos a mí
          </p>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[1,2].map(i => (
                <div key={i} style={{ height: "120px", borderRadius: "16px", background: "rgba(255,255,255,0.04)", animation: "pulse 1.5s ease-in-out infinite" }} />
              ))}
            </div>
          ) : packages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <Inbox size={36} style={{ color: "rgba(74,96,128,0.4)", margin: "0 auto 12px" }} />
              <p style={{ fontSize: "14px", color: "rgba(74,96,128,1)" }}>No hay paquetes asignados</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "600px", overflowY: "auto", paddingRight: "4px" }}>
              {awaitingOtp.length > 0 && (
                <>
                  <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#34d399", padding: "0 4px" }}>Validar OTP</p>
                  {awaitingOtp.map(p => <PackageCard key={p.id} pkg={p} onClick={() => selectPkg(p)} selected={selected?.id === p.id} />)}
                </>
              )}
              {pendingInspection.length > 0 && (
                <>
                  <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#a78bfa", padding: "8px 4px 0" }}>Inspección D3</p>
                  {pendingInspection.map(p => <PackageCard key={p.id} pkg={p} onClick={() => selectPkg(p)} selected={selected?.id === p.id} />)}
                </>
              )}
              {inTransit.length > 0 && (
                <>
                  <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(74,96,128,1)", padding: "8px 4px 0" }}>En camino</p>
                  {inTransit.map(p => <PackageCard key={p.id} pkg={p} onClick={() => selectPkg(p)} selected={selected?.id === p.id} />)}
                </>
              )}
              {completed.length > 0 && (
                <>
                  <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(74,96,128,1)", padding: "8px 4px 0" }}>Historial</p>
                  {completed.map(p => <PackageCard key={p.id} pkg={p} onClick={() => selectPkg(p)} selected={selected?.id === p.id} />)}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Detail panel ── */}
        <div>
          {selected ? (
            <motion.div key={selected.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Package info */}
              <div style={card}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "20px" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontFamily: "monospace", color: "rgba(74,96,128,1)" }}>Paquete #{selected.id}</span>
                    <h2 style={{ fontSize: "20px", fontWeight: 800, color: "white", margin: "4px 0 6px" }}>{selected.titulo}</h2>
                    <p style={{ fontSize: "14px", color: "rgba(139,163,199,1)" }}>{selected.descripcion}</p>
                  </div>
                  <StatusBadge estado={selected.estado} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                  {[
                    { l: "Remitente",    v: selected.remitente_nombre    || "—" },
                    { l: "Agente",       v: selected.agente_nombre       || "—" },
                    { l: "Desde",        v: selected.origen },
                    { l: "Hacia",        v: selected.destino },
                  ].map(({ l, v }) => (
                    <div key={l} style={{ padding: "14px 16px", borderRadius: "12px", background: "rgba(4,10,20,0.6)" }}>
                      <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: "rgba(74,96,128,1)", marginBottom: "5px" }}>{l}</p>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</p>
                    </div>
                  ))}
                </div>

                {selected.proxy_nombre && (
                  <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "12px", background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.2)" }}>
                    <p style={{ fontSize: "13px", color: "#c4b5fd" }}>
                      Recibido por proxy: <strong>{selected.proxy_nombre}</strong>
                    </p>
                  </div>
                )}
              </div>

              {/* ── TOTP Widget — siempre visible si hay OTP activo ── */}
              {(hasActiveOtp || isOtpUsed) && (
                <div style={card}>
                  <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(74,96,128,1)", marginBottom: "16px" }}>
                    Mi Código de Verificación
                  </p>
                  <TotpWidget
                    code={selected.otp_visible || "------"}
                    used={!!isOtpUsed}
                  />
                  {!isOtpUsed && (
                    <p style={{ fontSize: "12px", color: "rgba(74,96,128,1)", marginTop: "14px", lineHeight: 1.6 }}>
                      Este código es tu identificador de seguridad para esta entrega. Muéstraselo al agente cuando llegue con el paquete — él lo ingresará para completar la entrega.
                    </p>
                  )}
                </div>
              )}

              {/* D3 Inspection actions */}
              {selected.estado === "INSPECCION_ACTIVO" && (
                <div style={card}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "20px" }}>
                    <div style={{ width: "4px", minHeight: "52px", borderRadius: "4px", background: "#8b5cf6", flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(74,96,128,1)", marginBottom: "4px" }}>Acción requerida — D3</p>
                      <h3 style={{ fontSize: "15px", fontWeight: 700, color: "white", marginBottom: "6px" }}>Inspecciona el activo físicamente</h3>
                      <p style={{ fontSize: "13px", color: "rgba(139,163,199,1)", lineHeight: 1.6 }}>
                        Verifica caja sellada, sin daños y número de serie correcto.
                        Si todo está bien, acepta y muestra tu código OTP al agente para finalizar.
                      </p>
                    </div>
                  </div>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={lbl}>Observaciones</label>
                    <input type="text" value={notas} onChange={e => setNotas(e.target.value)}
                      placeholder="ej. Activo en perfectas condiciones, caja intacta..."
                      style={fld} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <button id="btn-d3-ok"
                      onClick={() => doTransition("SOLICITAR_OTP", `Inspección OK (D3). ${notas || "Activo conforme."}`)}
                      disabled={acting}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px", borderRadius: "12px", background: "linear-gradient(135deg,#10b981,#059669)", color: "white", fontWeight: 700, fontSize: "14px", border: "none", cursor: "pointer" }}>
                      <CheckCircle2 size={16} /> Activo conforme — D3 OK
                    </button>
                    <button id="btn-d3-rechazar"
                      onClick={() => doTransition("FLUJO_RETORNO", `D3 negativo. ${notas || "Daño detectado"}. Activo rechazado.`)}
                      disabled={acting}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px", borderRadius: "12px", background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "white", fontWeight: 700, fontSize: "14px", border: "none", cursor: "pointer" }}>
                      <XCircle size={16} /> Rechazar activo — E3
                    </button>
                  </div>
                  {acting && <p style={{ textAlign: "center", marginTop: "12px", fontSize: "13px", color: "rgba(74,96,128,1)" }}>Procesando...</p>}
                </div>
              )}

              {/* Waiting states */}
              {selected.estado === "SOLICITAR_OTP" && (
                <div style={{ ...card, display: "flex", alignItems: "center", gap: "14px" }}>
                  <Key size={22} style={{ color: "#34d399", flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "#6ee7b7", marginBottom: "3px" }}>Muestra el código de arriba al agente</p>
                    <p style={{ fontSize: "13px", color: "rgba(139,163,199,1)" }}>El agente ingresará este código para finalizar la entrega.</p>
                  </div>
                </div>
              )}

              {selected.estado === "ENTREGADO" && (
                <div style={{ ...card, textAlign: "center", padding: "32px" }}>
                  <CheckCircle2 size={44} style={{ color: "#10b981", margin: "0 auto 12px" }} />
                  <p style={{ fontSize: "16px", fontWeight: 700, color: "#6ee7b7", marginBottom: "4px" }}>Activo recibido correctamente</p>
                  <p style={{ fontSize: "13px", color: "rgba(74,96,128,1)" }}>El ciclo de entrega está cerrado.</p>
                </div>
              )}

              {!["INSPECCION_ACTIVO","ENTREGADO","DEVUELTO_ORIGEN","CERRADO_INCIDENCIA",
                  "FLUJO_RETORNO","DISPUTA_CUSTODIA","CUARENTENA","SOLICITAR_OTP"].includes(selected.estado) && (
                <div style={{ ...card, display: "flex", alignItems: "center", gap: "12px" }}>
                  <Clock size={18} style={{ color: "#6366f1", flexShrink: 0 }} />
                  <p style={{ fontSize: "14px", color: "rgba(139,163,199,1)" }}>
                    Paquete en camino — el agente está gestionando la entrega
                  </p>
                </div>
              )}

              {/* Timeline */}
              <div style={card}>
                <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(74,96,128,1)", marginBottom: "20px" }}>
                  Trazabilidad
                </p>
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  <EventTimeline events={selected.events} />
                </div>
              </div>
            </motion.div>
          ) : (
            <div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "320px", textAlign: "center" }}>
              <Shield size={44} style={{ color: "rgba(74,96,128,0.25)", marginBottom: "16px" }} />
              <p style={{ fontSize: "15px", fontWeight: 600, color: "rgba(139,163,199,1)", marginBottom: "6px" }}>Selecciona un paquete</p>
              <p style={{ fontSize: "13px", color: "rgba(74,96,128,1)" }}>
                Elige un paquete de la lista para ver su estado y tu código de verificación OTP
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
