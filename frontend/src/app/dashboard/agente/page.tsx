"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw, AlertCircle, Package, CheckCircle2, XCircle,
  MapPin, Clock, User, Key, ArrowRight, Inbox
} from "lucide-react";
import { apiGetPackages, apiTransition, Package as PkgType } from "@/lib/api";
import { PackageCard, StatusBadge, EventTimeline } from "@/components/ui/DashboardComponents";

const STEP_META: Record<string, { title: string; desc: string; color: string }> = {
  PENDIENTE_RECOLECCION:  { title: "Verificar paquete en origen",        desc: "Inspecciona el estado físico de la caja antes de asumir custodia (D1).",                 color: "#f59e0b" },
  HANDSHAKE_ORIGEN:       { title: "Primer Handshake Digital",           desc: "Firma con el Remitente para asumir responsabilidad formal del activo.",                  color: "#3b82f6" },
  EN_TRANSITO:            { title: "En Tránsito hacia destino",          desc: "Dirígete al destino. El sistema validará tu llegada por GPS.",                          color: "#6366f1" },
  LLEGADA_GEOCERCA:       { title: "Match Espacial (GPS)",               desc: "Sistema detecta tu ubicación en el destino. Registra la llegada.",                      color: "#8b5cf6" },
  PRESENCIA_DESTINATARIO: { title: "Verificar presencia del Destinatario", desc: "Confirma si el destinatario está físicamente disponible para recibir (D2).",         color: "#06b6d4" },
  INTENTO_FALLIDO_ESPERA: { title: "Ventana de Tolerancia (15 min)",    desc: "Espera o valida un proxy autorizado con credencial universitaria.",                     color: "#f97316" },
  INSPECCION_ACTIVO:      { title: "Inspección por Destinatario",       desc: "El destinatario inspecciona el activo (D3). Muéstrale el código OTP cuando confirme.", color: "#a78bfa" },
  SOLICITAR_OTP:          { title: "Validar OTP de Entrega",            desc: "Ingresa el código de 6 dígitos que muestra el destinatario en su panel.",              color: "#34d399" },
  FLUJO_RETORNO:          { title: "Retorno a Origen requerido",        desc: "El activo fue rechazado. Se requiere el 3er Handshake del Remitente.",                  color: "#fb923c" },
  DISPUTA_CUSTODIA:       { title: "Disputa de Custodia",               desc: "Remitente rechazó devolución. Deposita el activo en Bodega Cuarentena.",               color: "#dc2626" },
};

const card: React.CSSProperties = { padding: "28px", borderRadius: "20px", background: "rgba(10,22,40,0.9)", border: "1px solid rgba(255,215,0,0.08)" };
const lbl: React.CSSProperties  = { display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(74,96,128,1)", marginBottom: "8px" };
const fld: React.CSSProperties  = { width: "100%", background: "rgba(4,10,20,0.85)", border: "1px solid rgba(255,215,0,0.14)", borderRadius: "12px", padding: "12px 16px", color: "white", fontSize: "14px", outline: "none", boxSizing: "border-box" };

const actionBtn = (bg: string): React.CSSProperties => ({
  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
  width: "100%", padding: "14px 20px", borderRadius: "12px",
  background: bg, color: "white", fontWeight: 700, fontSize: "14px", border: "none", cursor: "pointer",
});

export default function AgenteView() {
  const [packages, setPackages] = useState<PkgType[]>([]);
  const [selected, setSelected] = useState<PkgType | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [otpInput, setOtpInput] = useState(["","","","","",""]);
  const [proxyNombre, setProxyNombre] = useState("");
  const [proxyId, setProxyId] = useState("");
  const [notas, setNotas] = useState("");
  const selectedIdRef = useRef<number | null>(null);

  async function load() {
    setLoading(true); setError("");
    try {
      const data = await apiGetPackages();
      setPackages(data);
      if (selectedIdRef.current !== null) {
        const upd = data.find(p => p.id === selectedIdRef.current);
        if (upd) setSelected(upd);
      }
    } catch { setError("Error al cargar paquetes"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function selectPkg(p: PkgType) { selectedIdRef.current = p.id; setSelected(p); setError(""); }

  async function doTransition(newState: string, extra?: object) {
    if (!selected) return;
    setActing(true); setError("");
    try {
      const otp = otpInput.join("");
      const updated = await apiTransition(selected.id, newState, {
        notas, otp_code: otp || undefined, ...(extra || {}),
      });
      setSelected(updated);
      setOtpInput(["","","","","",""]); setProxyNombre(""); setProxyId(""); setNotas("");
      await load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error en la operación"); }
    finally { setActing(false); }
  }

  function handleOtpDigit(idx: number, val: string) {
    if (!/^\d*$/.test(val)) return;
    const next = [...otpInput]; next[idx] = val.slice(-1); setOtpInput(next);
    if (val && idx < 5) document.getElementById(`otp-a-${idx+1}`)?.focus();
  }

  const activePackages  = packages.filter(p => !["ENTREGADO","DEVUELTO_ORIGEN","CERRADO_INCIDENCIA","RECHAZO_ORIGEN"].includes(p.estado));
  const closedPackages  = packages.filter(p =>  ["ENTREGADO","DEVUELTO_ORIGEN","CERRADO_INCIDENCIA","RECHAZO_ORIGEN"].includes(p.estado));
  const step      = selected ? STEP_META[selected.estado] : null;
  const isTerminal = selected && ["ENTREGADO","DEVUELTO_ORIGEN","CERRADO_INCIDENCIA","RECHAZO_ORIGEN"].includes(selected.estado);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 900, color: "white", marginBottom: "6px" }}>Panel Agente</h1>
          <p style={{ fontSize: "14px", color: "rgba(139,163,199,1)" }}>Juan — Estafeta de Distribución UCT</p>
        </div>
        <button onClick={() => load()} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "13px 22px", borderRadius: "12px", background: "rgba(255,215,0,0.04)", color: "rgba(200,220,255,0.8)", fontWeight: 600, fontSize: "14px", border: "1px solid rgba(255,215,0,0.14)", cursor: "pointer" }}>
          <RefreshCw size={15} /> Actualizar
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Activos",   value: activePackages.length,                                                              color: "#FFD700", bg: "rgba(255,215,0,0.08)" },
          { label: "Entregados", value: closedPackages.filter(p=>p.estado==="ENTREGADO").length,                           color: "#10b981", bg: "rgba(16,185,129,0.08)" },
          { label: "Disputas",  value: packages.filter(p=>["DISPUTA_CUSTODIA","CUARENTENA"].includes(p.estado)).length,    color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
        ].map(s => (
          <div key={s.label} style={{ padding: "24px 28px", borderRadius: "20px", background: "rgba(10,22,40,0.9)", border: "1px solid rgba(255,215,0,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "rgba(139,163,199,1)" }}>{s.label}</p>
            <span style={{ fontSize: "42px", fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</span>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ marginBottom: "20px", padding: "14px 18px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "20px" }}>
        {/* List */}
        <div style={card}>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(74,96,128,1)", marginBottom: "16px" }}>Paquetes asignados</p>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[1,2,3].map(i => <div key={i} style={{ height: "120px", borderRadius: "16px", background: "rgba(255,255,255,0.04)", animation: "pulse 1.5s ease-in-out infinite" }} />)}
            </div>
          ) : packages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <Inbox size={36} style={{ color: "rgba(74,96,128,0.4)", margin: "0 auto 12px" }} />
              <p style={{ fontSize: "14px", color: "rgba(74,96,128,1)" }}>Sin paquetes asignados</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "600px", overflowY: "auto", paddingRight: "4px" }}>
              {activePackages.length > 0 && (
                <>
                  <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#FFD700", padding: "0 4px" }}>Activos</p>
                  {activePackages.map(p => <PackageCard key={p.id} pkg={p} onClick={() => selectPkg(p)} selected={selected?.id === p.id} />)}
                </>
              )}
              {closedPackages.length > 0 && (
                <>
                  <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(74,96,128,1)", padding: "8px 4px 0" }}>Cerrados</p>
                  {closedPackages.map(p => <PackageCard key={p.id} pkg={p} onClick={() => selectPkg(p)} selected={selected?.id === p.id} />)}
                </>
              )}
            </div>
          )}
        </div>

        {/* Action panel */}
        <div>
          {selected ? (
            <motion.div key={selected.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Info card */}
              <div style={card}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "14px" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontFamily: "monospace", color: "rgba(74,96,128,1)" }}>Paquete #{selected.id}</span>
                    <h2 style={{ fontSize: "20px", fontWeight: 800, color: "white", margin: "4px 0 4px" }}>{selected.titulo}</h2>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "rgba(139,163,199,1)" }}>
                      <span>{selected.origen}</span>
                      <ArrowRight size={12} style={{ color: "rgba(74,96,128,1)" }} />
                      <span>{selected.destino}</span>
                    </div>
                  </div>
                  <StatusBadge estado={selected.estado} />
                </div>

                {selected.otp_visible && selected.otp_visible !== "YA USADO" && !isTerminal && (
                  <div style={{ padding: "12px 16px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "12px", background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)", marginTop: "8px" }}>
                    <Key size={15} style={{ color: "#34d399", flexShrink: 0 }} />
                    <span style={{ fontSize: "12px", color: "rgba(74,96,128,1)" }}>OTP esperado:</span>
                    <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#34d399", fontSize: "18px", letterSpacing: "0.2em" }}>{selected.otp_visible}</span>
                    <span style={{ fontSize: "11px", color: "rgba(74,96,128,0.6)", marginLeft: "auto" }}>(para verificación)</span>
                  </div>
                )}
              </div>

              {/* Step + actions */}
              {!isTerminal && step && (
                <div style={card}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "24px", paddingBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ width: "4px", minHeight: "52px", borderRadius: "4px", background: step.color, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(74,96,128,1)", marginBottom: "6px" }}>Paso actual</p>
                      <h3 style={{ fontSize: "16px", fontWeight: 800, color: "white", marginBottom: "6px" }}>{step.title}</h3>
                      <p style={{ fontSize: "13px", color: "rgba(139,163,199,1)", lineHeight: 1.6 }}>{step.desc}</p>
                    </div>
                  </div>

                  {/* OTP input */}
                  {selected.estado === "SOLICITAR_OTP" && (
                    <div style={{ marginBottom: "20px" }}>
                      <label style={lbl}>Código OTP — ingresa los 6 dígitos del panel del destinatario</label>
                      <div style={{ display: "flex", gap: "10px", justifyContent: "center", margin: "14px 0" }}>
                        {otpInput.map((d, i) => (
                          <input key={i} id={`otp-a-${i}`} type="text" inputMode="numeric" maxLength={1} value={d}
                            onChange={e => handleOtpDigit(i, e.target.value)}
                            style={{ width: "54px", height: "64px", borderRadius: "14px", border: `2px solid ${d ? "#FFD700" : "rgba(255,215,0,0.2)"}`, background: "rgba(4,10,20,0.85)", color: "white", fontSize: "26px", fontWeight: 900, textAlign: "center", outline: "none", fontFamily: "monospace", transition: "border-color 0.15s", boxSizing: "border-box" }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Proxy input */}
                  {selected.estado === "INTENTO_FALLIDO_ESPERA" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
                      <div><label style={lbl}>Nombre del Proxy</label><input type="text" value={proxyNombre} onChange={e => setProxyNombre(e.target.value)} placeholder="ej. Ayudante de Lab" style={fld} /></div>
                      <div><label style={lbl}>ID Universitario</label><input type="text" value={proxyId} onChange={e => setProxyId(e.target.value)} placeholder="ej. 2021-UCT-001" style={fld} /></div>
                    </div>
                  )}

                  {/* Notes */}
                  <div style={{ marginBottom: "20px" }}>
                    <label style={lbl}>Notas del evento (opcional)</label>
                    <input type="text" value={notas} onChange={e => setNotas(e.target.value)} placeholder="Observaciones..." style={fld} />
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {selected.estado === "PENDIENTE_RECOLECCION" && (<>
                      <button id="btn-caja-ok" onClick={() => doTransition("HANDSHAKE_ORIGEN", { notas: "Caja sellada verificada (D1 OK)" })} disabled={acting} style={actionBtn("linear-gradient(135deg,#10b981,#059669)")}>
                        <CheckCircle2 size={16} /> Caja sellada — D1 Conforme, iniciar Handshake
                      </button>
                      <button id="btn-caja-rechazar" onClick={() => doTransition("RECHAZO_ORIGEN", { notas: "Caja abierta o mal sellada (E1)" })} disabled={acting} style={actionBtn("linear-gradient(135deg,#ef4444,#dc2626)")}>
                        <XCircle size={16} /> Caja abierta — Rechazar en origen (E1)
                      </button>
                    </>)}
                    {selected.estado === "HANDSHAKE_ORIGEN" && (
                      <button id="btn-firmar-hs" onClick={() => doTransition("EN_TRANSITO", { notas: "1er Handshake firmado. Custodia asumida." })} disabled={acting} style={actionBtn("linear-gradient(135deg,#3b82f6,#1d4ed8)")}>
                        <CheckCircle2 size={16} /> Firmar Handshake y asumir custodia
                      </button>
                    )}
                    {selected.estado === "EN_TRANSITO" && (
                      <button id="btn-simular-llegada" onClick={() => doTransition("LLEGADA_GEOCERCA", { notas: "GPS validado en destino." })} disabled={acting} style={actionBtn("linear-gradient(135deg,#8b5cf6,#6d28d9)")}>
                        <MapPin size={16} /> Simular llegada al destino (Match GPS)
                      </button>
                    )}
                    {selected.estado === "LLEGADA_GEOCERCA" && (
                      <button id="btn-registrar-contacto" onClick={() => doTransition("PRESENCIA_DESTINATARIO")} disabled={acting} style={actionBtn("linear-gradient(135deg,#06b6d4,#0284c7)")}>
                        <User size={16} /> Registrar contacto con Destinatario
                      </button>
                    )}
                    {selected.estado === "PRESENCIA_DESTINATARIO" && (<>
                      <button id="btn-destinatario-presente" onClick={() => doTransition("INSPECCION_ACTIVO", { notas: "Destinatario presente (D2 OK). Iniciando inspección." })} disabled={acting} style={actionBtn("linear-gradient(135deg,#10b981,#059669)")}>
                        <CheckCircle2 size={16} /> Destinatario presente — D2 OK
                      </button>
                      <button id="btn-destinatario-ausente" onClick={() => doTransition("INTENTO_FALLIDO_ESPERA", { notas: "Destinatario ausente. Ventana de tolerancia iniciada." })} disabled={acting} style={actionBtn("linear-gradient(135deg,#f59e0b,#d97706)")}>
                        <Clock size={16} /> Destinatario ausente — Iniciar espera
                      </button>
                    </>)}
                    {selected.estado === "INTENTO_FALLIDO_ESPERA" && (<>
                      <button id="btn-validar-proxy" onClick={() => doTransition("INSPECCION_ACTIVO", { notas: `Proxy validado: ${proxyNombre} (${proxyId})`, proxy_nombre: proxyNombre, proxy_id: proxyId })} disabled={acting || !proxyNombre} style={{ ...actionBtn("linear-gradient(135deg,#8b5cf6,#7c3aed)"), opacity: !proxyNombre ? 0.5 : 1 }}>
                        <User size={16} /> Validar Proxy con credencial universitaria
                      </button>
                      <button id="btn-tolerancia-expirada" onClick={() => doTransition("FLUJO_RETORNO", { notas: "Tolerancia expirada. Sin destinatario ni proxy." })} disabled={acting} style={actionBtn("linear-gradient(135deg,#ef4444,#dc2626)")}>
                        <XCircle size={16} /> Tolerancia expirada — Iniciar retorno
                      </button>
                    </>)}
                    {selected.estado === "INSPECCION_ACTIVO" && (
                      <button id="btn-rechazar-inspeccion" onClick={() => doTransition("FLUJO_RETORNO", { notas: "Activo rechazado por daño en inspección (D3 negativo)." })} disabled={acting} style={actionBtn("linear-gradient(135deg,#ef4444,#dc2626)")}>
                        <XCircle size={16} /> Activo dañado — Rechazar en inspección (E3)
                      </button>
                    )}
                    {selected.estado === "SOLICITAR_OTP" && (
                      <button id="btn-validar-otp" onClick={() => doTransition("ENTREGADO", { notas: "OTP validado. 2do Handshake sellado. Entrega completada." })} disabled={acting || otpInput.join("").length < 6} style={{ ...actionBtn("linear-gradient(135deg,#10b981,#059669)"), opacity: otpInput.join("").length < 6 ? 0.5 : 1 }}>
                        <Key size={16} /> Validar OTP y confirmar entrega
                      </button>
                    )}
                    {selected.estado === "FLUJO_RETORNO" && (
                      <button id="btn-depositar-cuarentena" onClick={() => doTransition("CUARENTENA", { notas: "Depositado en bodega de cuarentena." })} disabled={acting} style={actionBtn("linear-gradient(135deg,#6b7280,#4b5563)")}>
                        <Package size={16} /> Depositar en Bodega Cuarentena
                      </button>
                    )}
                    {selected.estado === "DISPUTA_CUSTODIA" && (
                      <button id="btn-depositar-disputa" onClick={() => doTransition("CUARENTENA", { notas: "Depositado en cuarentena por disputa." })} disabled={acting} style={actionBtn("linear-gradient(135deg,#6b7280,#4b5563)")}>
                        <Package size={16} /> Depositar en Bodega Cuarentena (Ajuste 3)
                      </button>
                    )}
                    {acting && <p style={{ textAlign: "center", fontSize: "13px", color: "rgba(74,96,128,1)", marginTop: "4px" }}>Procesando...</p>}
                  </div>
                </div>
              )}

              {isTerminal && (
                <div style={{ ...card, textAlign: "center", padding: "32px" }}>
                  <CheckCircle2 size={44} style={{ color: selected.estado === "ENTREGADO" ? "#10b981" : "#6b7280", margin: "0 auto 12px" }} />
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "white", marginBottom: "4px" }}>
                    {selected.estado === "ENTREGADO" ? "Entrega completada" : "Ciclo cerrado"}
                  </h3>
                  <p style={{ fontSize: "13px", color: "rgba(74,96,128,1)" }}>Este paquete ya no requiere acciones.</p>
                </div>
              )}

              {/* Timeline */}
              <div style={card}>
                <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(74,96,128,1)", marginBottom: "20px" }}>Historial de trazabilidad</p>
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  <EventTimeline events={selected.events} />
                </div>
              </div>
            </motion.div>
          ) : (
            <div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "320px", textAlign: "center" }}>
              <Package size={44} style={{ color: "rgba(74,96,128,0.25)", marginBottom: "16px" }} />
              <p style={{ fontSize: "15px", fontWeight: 600, color: "rgba(139,163,199,1)", marginBottom: "6px" }}>Selecciona un paquete</p>
              <p style={{ fontSize: "13px", color: "rgba(74,96,128,1)" }}>Escoge un paquete activo para ejecutar las acciones de entrega</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
