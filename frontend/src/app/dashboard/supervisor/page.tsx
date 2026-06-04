"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw, AlertCircle, Package, ShieldCheck, CheckCircle2, Archive,
  BarChart3, Inbox
} from "lucide-react";
import { apiGetPackages, apiGetAllPackages, apiTransition, Package as PkgType } from "@/lib/api";
import { PackageCard, StatCard, StatusBadge, EventTimeline } from "@/components/ui/DashboardComponents";

const card: React.CSSProperties = { padding: "28px", borderRadius: "20px", background: "rgba(10,22,40,0.9)", border: "1px solid rgba(255,215,0,0.08)" };
const lbl: React.CSSProperties  = { display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(74,96,128,1)", marginBottom: "8px" };
const fld: React.CSSProperties  = { width: "100%", background: "rgba(4,10,20,0.85)", border: "1px solid rgba(255,215,0,0.14)", borderRadius: "12px", padding: "12px 16px", color: "white", fontSize: "14px", outline: "none", boxSizing: "border-box" };

export default function SupervisorView() {
  const [myPkgs, setMyPkgs]   = useState<PkgType[]>([]);
  const [allPkgs, setAllPkgs] = useState<PkgType[]>([]);
  const [selected, setSelected] = useState<PkgType | null>(null);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState(false);
  const [error, setError]       = useState("");
  const [notas, setNotas]       = useState("");
  const [view, setView]         = useState<"activos"|"todos">("activos");
  const selectedIdRef = useRef<number | null>(null);

  async function load() {
    setLoading(true); setError("");
    try {
      const [my, all] = await Promise.all([apiGetPackages(), apiGetAllPackages()]);
      setMyPkgs(my); setAllPkgs(all);
      if (selectedIdRef.current !== null) {
        const src = view === "activos" ? my : all;
        const upd = src.find(p => p.id === selectedIdRef.current);
        if (upd) setSelected(upd);
      }
    } catch { setError("Error al cargar datos"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function selectPkg(p: PkgType) { selectedIdRef.current = p.id; setSelected(p); setError(""); }

  async function handleResolve(pkgId: number) {
    setActing(true); setError("");
    try {
      const updated = await apiTransition(pkgId, "CERRADO_INCIDENCIA", {
        notas: notas || "Revisión de trazabilidad completa. Supervisor cierra el caso.",
      });
      setSelected(updated); setNotas(""); await load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error al resolver"); }
    finally { setActing(false); }
  }

  async function handleHandshake(pkgId: number, accept: boolean) {
    setActing(true); setError("");
    try {
      const updated = await apiTransition(pkgId, accept ? "DEVUELTO_ORIGEN" : "DISPUTA_CUSTODIA", {
        notas: accept
          ? "3er Handshake aceptado. Paquete devuelto a origen."
          : "Remitente rechazó devolución. Activando disputa de custodia (Ajuste 3).",
      });
      setSelected(updated); await load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error al procesar"); }
    finally { setActing(false); }
  }

  const disputas        = myPkgs.filter(p => ["DISPUTA_CUSTODIA","CUARENTENA","FLUJO_RETORNO"].includes(p.estado));
  const displayPackages = view === "activos" ? disputas : allPkgs;
  const total       = allPkgs.length;
  const entregados  = allPkgs.filter(p => p.estado === "ENTREGADO").length;
  const en_transito = allPkgs.filter(p => ["EN_TRANSITO","HANDSHAKE_ORIGEN","LLEGADA_GEOCERCA","PRESENCIA_DESTINATARIO","INTENTO_FALLIDO_ESPERA","INSPECCION_ACTIVO","SOLICITAR_OTP"].includes(p.estado)).length;
  const incidencias = disputas.length;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 900, color: "white", marginBottom: "6px" }}>Panel Supervisor</h1>
          <p style={{ fontSize: "14px", color: "rgba(139,163,199,1)" }}>Supervisor de Bodega UCT — Control y Resolución de Disputas</p>
        </div>
        <button onClick={() => load()} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "13px 22px", borderRadius: "12px", background: "rgba(255,215,0,0.04)", color: "rgba(200,220,255,0.8)", fontWeight: 600, fontSize: "14px", border: "1px solid rgba(255,215,0,0.14)", cursor: "pointer" }}>
          <RefreshCw size={15} /> Actualizar
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "28px" }}>
        <StatCard label="Total en Sistema"     value={total}       Icon={BarChart3}    color="#FFD700"  bg="rgba(255,215,0,0.08)" />
        <StatCard label="Entregados"            value={entregados}  Icon={CheckCircle2} color="#10b981"  bg="rgba(16,185,129,0.08)" />
        <StatCard label="En Tránsito"           value={en_transito} Icon={RefreshCw}    color="#6366f1"  bg="rgba(99,102,241,0.08)" />
        <StatCard label="Disputas / Cuarentena" value={incidencias} Icon={AlertCircle}  color="#ef4444"  bg="rgba(239,68,68,0.08)" />
      </div>

      {/* Dispute alert */}
      {disputas.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: "24px", padding: "18px 24px", borderRadius: "16px", display: "flex", alignItems: "center", gap: "14px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.35)" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", flexShrink: 0, animation: "pulse 1.5s ease-in-out infinite" }} />
          <p style={{ fontSize: "14px", fontWeight: 600, color: "#fca5a5" }}>
            {disputas.length} caso{disputas.length > 1 ? "s" : ""} requiere{disputas.length === 1 ? "" : "n"} tu intervención
          </p>
        </motion.div>
      )}

      {error && (
        <div style={{ marginBottom: "20px", padding: "14px 18px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Toggle */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {[
          { k: "activos", label: `Disputas activas (${disputas.length})` },
          { k: "todos",   label: `Vista global (${allPkgs.length})` },
        ].map(t => (
          <button key={t.k} onClick={() => setView(t.k as "activos"|"todos")} style={{
            padding: "10px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, border: "1px solid", cursor: "pointer", transition: "all 0.2s",
            background:   view === t.k ? "linear-gradient(135deg,#FFD700,#e6c200)" : "rgba(255,215,0,0.04)",
            color:        view === t.k ? "#003366" : "rgba(200,220,255,0.7)",
            borderColor:  view === t.k ? "transparent" : "rgba(255,215,0,0.12)",
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "20px" }}>
        {/* List */}
        <div style={card}>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(74,96,128,1)", marginBottom: "16px" }}>
            {view === "activos" ? "Disputas / Retornos" : "Todos los paquetes"}
          </p>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[1,2,3].map(i => <div key={i} style={{ height: "120px", borderRadius: "16px", background: "rgba(255,255,255,0.04)", animation: "pulse 1.5s ease-in-out infinite" }} />)}
            </div>
          ) : displayPackages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <ShieldCheck size={36} style={{ color: "#10b981", opacity: 0.5, margin: "0 auto 12px" }} />
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#6ee7b7", marginBottom: "4px" }}>Sin incidencias activas</p>
              <p style={{ fontSize: "12px", color: "rgba(74,96,128,1)" }}>El sistema opera sin disputas</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "600px", overflowY: "auto", paddingRight: "4px" }}>
              {displayPackages.map(p => <PackageCard key={p.id} pkg={p} onClick={() => selectPkg(p)} selected={selected?.id === p.id} />)}
            </div>
          )}
        </div>

        {/* Detail */}
        <div>
          {selected ? (
            <motion.div key={selected.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={card}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "20px" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontFamily: "monospace", color: "rgba(74,96,128,1)" }}>Expediente #{selected.id}</span>
                    <h2 style={{ fontSize: "20px", fontWeight: 800, color: "white", margin: "4px 0 6px" }}>{selected.titulo}</h2>
                    <p style={{ fontSize: "14px", color: "rgba(139,163,199,1)" }}>{selected.descripcion}</p>
                  </div>
                  <StatusBadge estado={selected.estado} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                  {[
                    { l: "Remitente",   v: selected.remitente_nombre || "—" },
                    { l: "Agente",      v: selected.agente_nombre || "—" },
                    { l: "Destinatario", v: selected.destinatario_nombre || "—" },
                    { l: "Estado",      v: selected.estado.replace(/_/g, " ") },
                  ].map(({ l, v }) => (
                    <div key={l} style={{ padding: "14px 16px", borderRadius: "12px", background: "rgba(4,10,20,0.6)" }}>
                      <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: "rgba(74,96,128,1)", marginBottom: "5px" }}>{l}</p>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</p>
                    </div>
                  ))}
                </div>

                {/* 3rd Handshake */}
                {selected.estado === "FLUJO_RETORNO" && (
                  <div style={{ padding: "20px", borderRadius: "16px", background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.3)", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "16px" }}>
                      <div style={{ width: "4px", minHeight: "52px", borderRadius: "4px", background: "#f59e0b", flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(74,96,128,1)", marginBottom: "4px" }}>Acción requerida — 3er Handshake</p>
                        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "white", marginBottom: "6px" }}>El Remitente debe firmar la devolución</h3>
                        <p style={{ fontSize: "13px", color: "rgba(139,163,199,1)", lineHeight: 1.6 }}>
                          El agente retornó el activo. Firma el 3er Handshake para aceptar o abrir una disputa formal.
                        </p>
                      </div>
                    </div>
                    <div style={{ marginBottom: "14px" }}>
                      <label style={lbl}>Notas del supervisor</label>
                      <input type="text" value={notas} onChange={e => setNotas(e.target.value)} placeholder="Observaciones de la revisión..." style={fld} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <button id="btn-aceptar-devolucion" onClick={() => handleHandshake(selected.id, true)} disabled={acting} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px", borderRadius: "12px", background: "linear-gradient(135deg,#10b981,#059669)", color: "white", fontWeight: 700, fontSize: "14px", border: "none", cursor: "pointer" }}>
                        <CheckCircle2 size={16} /> Firmar — Aceptar devolución
                      </button>
                      <button id="btn-abrir-disputa" onClick={() => handleHandshake(selected.id, false)} disabled={acting} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px", borderRadius: "12px", background: "linear-gradient(135deg,#dc2626,#b91c1c)", color: "white", fontWeight: 700, fontSize: "14px", border: "none", cursor: "pointer" }}>
                        <AlertCircle size={16} /> Rechazar — Abrir disputa
                      </button>
                    </div>
                  </div>
                )}

                {/* Quarantine resolution */}
                {selected.estado === "CUARENTENA" && (
                  <div style={{ padding: "20px", borderRadius: "16px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.3)", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "16px" }}>
                      <div style={{ width: "4px", minHeight: "52px", borderRadius: "4px", background: "#ef4444", flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(74,96,128,1)", marginBottom: "4px" }}>Intervención del Supervisor de Bodega</p>
                        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "white", marginBottom: "6px" }}>Resolver expediente en cuarentena</h3>
                        <p style={{ fontSize: "13px", color: "rgba(139,163,199,1)", lineHeight: 1.6 }}>
                          Revisa la trazabilidad completa. Al resolver, cierras el expediente y liberas al agente de responsabilidad.
                        </p>
                      </div>
                    </div>
                    <div style={{ marginBottom: "14px" }}>
                      <label style={lbl}>Resolución del supervisor</label>
                      <input type="text" value={notas} onChange={e => setNotas(e.target.value)} placeholder="ej. Revisión confirma daño previo al despacho..." style={fld} />
                    </div>
                    <button id="btn-resolver-supervisor" onClick={() => handleResolve(selected.id)} disabled={acting} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "14px", borderRadius: "12px", background: "linear-gradient(135deg,#dc2626,#b91c1c)", color: "white", fontWeight: 700, fontSize: "14px", border: "none", cursor: "pointer" }}>
                      <Archive size={16} /> Resolver — Cerrar con incidencia
                    </button>
                    {acting && <p style={{ textAlign: "center", marginTop: "12px", fontSize: "13px", color: "rgba(74,96,128,1)" }}>Procesando...</p>}
                  </div>
                )}

                {["CERRADO_INCIDENCIA","DEVUELTO_ORIGEN","ENTREGADO"].includes(selected.estado) && (
                  <div style={{ padding: "20px", borderRadius: "14px", textAlign: "center", background: "rgba(107,114,128,0.05)", border: "1px solid rgba(107,114,128,0.2)" }}>
                    <ShieldCheck size={36} style={{ color: "#9ca3af", margin: "0 auto 10px" }} />
                    <p style={{ fontSize: "15px", fontWeight: 700, color: "#d1d5db" }}>Expediente cerrado</p>
                    <p style={{ fontSize: "13px", color: "rgba(74,96,128,1)", marginTop: "4px" }}>Estado final: {selected.estado.replace(/_/g, " ")}</p>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div style={card}>
                <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(74,96,128,1)", marginBottom: "20px" }}>Trazabilidad completa del expediente</p>
                <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                  <EventTimeline events={selected.events} />
                </div>
              </div>
            </motion.div>
          ) : (
            <div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "320px", textAlign: "center" }}>
              <Inbox size={44} style={{ color: "rgba(74,96,128,0.25)", marginBottom: "16px" }} />
              <p style={{ fontSize: "15px", fontWeight: 600, color: "rgba(139,163,199,1)", marginBottom: "6px" }}>Selecciona un expediente</p>
              <p style={{ fontSize: "13px", color: "rgba(74,96,128,1)" }}>Revisa la trazabilidad y resuelve disputas o cuarentenas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
