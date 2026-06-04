"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Package, RefreshCw, X, AlertCircle, CheckCircle2,
  Send, ArrowUpRight, ArrowDownLeft, Key, Clock, TrendingUp
} from "lucide-react";
import { apiGetPackages, apiCreatePackage, Package as PkgType } from "@/lib/api";
import { PackageCard, StatCard, EventTimeline, StatusBadge } from "@/components/ui/DashboardComponents";

type FormData = {
  titulo: string; descripcion: string; origen: string;
  destino: string; agente_username: string; destinatario_username: string;
};
const EMPTY: FormData = {
  titulo: "", descripcion: "", origen: "Depto. Informática UCT",
  destino: "", agente_username: "juan", destinatario_username: "profesor",
};

const card: React.CSSProperties = { padding: "28px", borderRadius: "20px", background: "rgba(10,22,40,0.9)", border: "1px solid rgba(255,215,0,0.08)" };
const lbl: React.CSSProperties = { display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(74,96,128,1)", marginBottom: "8px" };
const fld: React.CSSProperties = { width: "100%", background: "rgba(4,10,20,0.85)", border: "1px solid rgba(255,215,0,0.14)", borderRadius: "12px", padding: "12px 16px", color: "white", fontSize: "14px", outline: "none", boxSizing: "border-box" };
const btnG: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "13px 22px", borderRadius: "12px", background: "linear-gradient(135deg,#FFD700,#e6c200)", color: "#003366", fontWeight: 700, fontSize: "14px", border: "none", cursor: "pointer" };
const btnO: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "13px 22px", borderRadius: "12px", background: "rgba(255,215,0,0.04)", color: "rgba(200,220,255,0.8)", fontWeight: 600, fontSize: "14px", border: "1px solid rgba(255,215,0,0.14)", cursor: "pointer" };
const box: React.CSSProperties = { padding: "14px 16px", borderRadius: "12px", background: "rgba(4,10,20,0.6)" };

export default function RemitenteView() {
  const [packages, setPackages] = useState<PkgType[]>([]);
  const [selected, setSelected] = useState<PkgType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const selectedIdRef = useRef<number | null>(null);

  async function load() {
    setLoading(true);
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

  function selectPkg(p: PkgType) {
    selectedIdRef.current = p.id;
    setSelected(p);
    setError("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim() || !form.destino.trim()) { setError("Completa título y destino"); return; }
    setSaving(true); setError("");
    try {
      const created = await apiCreatePackage(form);
      setOtp(created.otp_generado || "");
      await load();
      setShowForm(false);
      setForm(EMPTY);
      selectedIdRef.current = created.id;
      setSelected(created);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al crear paquete");
    } finally { setSaving(false); }
  }

  const stats = {
    total: packages.length,
    pendientes: packages.filter(p => p.estado === "PENDIENTE_RECOLECCION").length,
    transito: packages.filter(p => ["EN_TRANSITO","HANDSHAKE_ORIGEN","LLEGADA_GEOCERCA","PRESENCIA_DESTINATARIO","INTENTO_FALLIDO_ESPERA","INSPECCION_ACTIVO","SOLICITAR_OTP"].includes(p.estado)).length,
    entregados: packages.filter(p => p.estado === "ENTREGADO").length,
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 900, color: "white", marginBottom: "6px" }}>Panel Remitente</h1>
          <p style={{ fontSize: "14px", color: "rgba(139,163,199,1)" }}>Gestión de despachos — Depto. Informática UCT</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => load()} style={btnO}><RefreshCw size={15} /> Actualizar</button>
          <button id="btn-crear-paquete" onClick={() => { setShowForm(true); setError(""); }} style={btnG}><Plus size={15} /> Nuevo Paquete</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "28px" }}>
        <StatCard label="Total Paquetes"  value={stats.total}      Icon={Package}    color="#FFD700"  bg="rgba(255,215,0,0.1)" />
        <StatCard label="Pendientes"       value={stats.pendientes} Icon={Clock}       color="#f59e0b"  bg="rgba(245,158,11,0.1)" />
        <StatCard label="En Tránsito"      value={stats.transito}   Icon={TrendingUp}  color="#6366f1"  bg="rgba(99,102,241,0.1)" />
        <StatCard label="Entregados"       value={stats.entregados} Icon={CheckCircle2} color="#10b981" bg="rgba(16,185,129,0.1)" />
      </div>

      {/* OTP Banner */}
      <AnimatePresence>
        {otp && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ marginBottom: "20px", padding: "18px 22px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <CheckCircle2 size={22} style={{ color: "#10b981", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#6ee7b7", marginBottom: "3px" }}>Paquete creado exitosamente</p>
                <p style={{ fontSize: "13px", color: "rgba(139,163,199,1)" }}>
                  Código OTP generado: <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#34d399", fontSize: "18px", letterSpacing: "0.2em", marginLeft: "6px" }}>{otp}</span>
                  <span style={{ color: "rgba(74,96,128,1)", fontSize: "11px", marginLeft: "10px" }}>(el destinatario lo verá en su panel)</span>
                </p>
              </div>
            </div>
            <button onClick={() => setOtp("")} style={{ color: "#34d399", background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div style={{ marginBottom: "16px", padding: "14px 18px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "20px" }}>
        {/* List */}
        <div style={card}>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(74,96,128,1)", marginBottom: "16px" }}>Mis paquetes ({packages.length})</p>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[1,2,3].map(i => <div key={i} style={{ height: "120px", borderRadius: "16px", background: "rgba(255,255,255,0.04)", animation: "pulse 1.5s ease-in-out infinite" }} />)}
            </div>
          ) : packages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <Package size={36} style={{ color: "rgba(74,96,128,0.4)", margin: "0 auto 12px" }} />
              <p style={{ fontSize: "14px", color: "rgba(74,96,128,1)", marginBottom: "16px" }}>No hay paquetes aún</p>
              <button onClick={() => setShowForm(true)} style={btnG}><Plus size={14} /> Crear primero</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "560px", overflowY: "auto", paddingRight: "4px" }}>
              {packages.map(p => <PackageCard key={p.id} pkg={p} onClick={() => selectPkg(p)} selected={selected?.id === p.id} />)}
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
                    <span style={{ fontSize: "11px", fontFamily: "monospace", color: "rgba(74,96,128,1)" }}>Paquete #{selected.id}</span>
                    <h2 style={{ fontSize: "20px", fontWeight: 800, color: "white", margin: "4px 0 6px" }}>{selected.titulo}</h2>
                    <p style={{ fontSize: "14px", color: "rgba(139,163,199,1)" }}>{selected.descripcion}</p>
                  </div>
                  <StatusBadge estado={selected.estado} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  {[
                    { l: "Origen",       v: selected.origen,                Icon: ArrowUpRight },
                    { l: "Destino",      v: selected.destino,               Icon: ArrowDownLeft },
                    { l: "Agente",       v: selected.agente_nombre || "—",  Icon: RefreshCw },
                    { l: "Destinatario", v: selected.destinatario_nombre || "—", Icon: Package },
                  ].map(({ l, v, Icon }) => (
                    <div key={l} style={box}>
                      <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: "rgba(74,96,128,1)", marginBottom: "6px" }}>{l}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Icon size={13} style={{ color: "rgba(74,96,128,1)", flexShrink: 0 }} />
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {selected.otp_visible && selected.otp_visible !== "YA USADO" && (
                  <div style={{ padding: "14px 16px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "12px", background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)" }}>
                    <Key size={16} style={{ color: "#34d399", flexShrink: 0 }} />
                    <span style={{ fontSize: "12px", color: "rgba(74,96,128,1)" }}>OTP activo:</span>
                    <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#34d399", fontSize: "18px", letterSpacing: "0.2em" }}>{selected.otp_visible}</span>
                  </div>
                )}
              </div>

              <div style={card}>
                <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(74,96,128,1)", marginBottom: "20px" }}>Historial de Trazabilidad</p>
                <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                  <EventTimeline events={selected.events} />
                </div>
              </div>
            </motion.div>
          ) : (
            <div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "320px", textAlign: "center" }}>
              <Package size={44} style={{ color: "rgba(74,96,128,0.25)", marginBottom: "16px" }} />
              <p style={{ fontSize: "15px", fontWeight: 600, color: "rgba(139,163,199,1)", marginBottom: "6px" }}>Selecciona un paquete</p>
              <p style={{ fontSize: "13px", color: "rgba(74,96,128,1)" }}>Haz clic en un paquete para ver su detalle y trazabilidad</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal crear */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)" }}>
            <motion.div initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }}
              style={{ width: "100%", maxWidth: "520px", borderRadius: "24px", padding: "32px", background: "#0a1628", border: "1px solid rgba(255,215,0,0.12)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
                <div>
                  <h3 style={{ fontSize: "20px", fontWeight: 800, color: "white", marginBottom: "4px" }}>Registrar Nuevo Paquete</h3>
                  <p style={{ fontSize: "12px", color: "rgba(74,96,128,1)" }}>Estado inicial: PENDIENTE RECOLECCION</p>
                </div>
                <button onClick={() => { setShowForm(false); setError(""); }} style={{ padding: "8px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(139,163,199,1)", cursor: "pointer" }}>
                  <X size={16} />
                </button>
              </div>

              {error && (
                <div style={{ marginBottom: "20px", padding: "12px 16px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
                  <AlertCircle size={15} /> {error}
                </div>
              )}

              <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {[
                  { id: "titulo",      label: "Título / Activo",  placeholder: "ej. GPU RTX 3050",               key: "titulo" as keyof FormData },
                  { id: "descripcion", label: "Descripción",      placeholder: "ej. Reemplazo para laboratorio", key: "descripcion" as keyof FormData },
                  { id: "origen",      label: "Origen",           placeholder: "ej. Depto. Informática",         key: "origen" as keyof FormData },
                  { id: "destino",     label: "Destino",          placeholder: "ej. Laboratorio de Redes",       key: "destino" as keyof FormData },
                ].map(f => (
                  <div key={f.id}>
                    <label style={lbl}>{f.label}</label>
                    <input id={f.id} type="text" value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} style={fld} />
                  </div>
                ))}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={lbl}>Agente</label>
                    <select id="agente_username" value={form.agente_username} onChange={e => setForm({ ...form, agente_username: e.target.value })} style={fld}>
                      <option value="juan">Juan Estafeta</option>
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Destinatario</label>
                    <select id="destinatario_username" value={form.destinatario_username} onChange={e => setForm({ ...form, destinatario_username: e.target.value })} style={fld}>
                      <option value="profesor">Prof. Lab Redes</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "8px" }}>
                  <button type="button" onClick={() => { setShowForm(false); setError(""); }} style={btnO}>Cancelar</button>
                  <button id="btn-confirmar-crear" type="submit" disabled={saving} style={{ ...btnG, opacity: saving ? 0.7 : 1 }}>
                    {saving ? <><RefreshCw size={14} style={{ animation: "spin 0.8s linear infinite" }} /> Creando...</> : <><Send size={14} /> Registrar</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
