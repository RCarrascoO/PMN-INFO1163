"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Lock, User, Eye, EyeOff, ChevronRight, AlertCircle, CheckCircle2, ShieldCheck, Package, PenLine, KeyRound } from "lucide-react";
import { apiLogin } from "@/lib/api";
import { saveAuth, isAuthenticated, getUser } from "@/lib/auth";

const DEMO_USERS = [
  { username: "informatica", password: "uct2026",     label: "Remitente",    desc: "Depto. Informática", initial: "R", gradient: "linear-gradient(135deg,#3b82f6,#1d4ed8)" },
  { username: "juan",        password: "estafeta123", label: "Agente",       desc: "Juan Estafeta",      initial: "A", gradient: "linear-gradient(135deg,#10b981,#059669)" },
  { username: "profesor",    password: "lab_redes",   label: "Destinatario", desc: "Prof. Lab Redes",    initial: "D", gradient: "linear-gradient(135deg,#8b5cf6,#6d28d9)" },
  { username: "supervisor",  password: "bodega_uct",  label: "Supervisor",   desc: "Bodega UCT",         initial: "S", gradient: "linear-gradient(135deg,#f59e0b,#d97706)" },
];

const FEATURES = [
  { Icon: ShieldCheck, text: "Autenticación multi-rol con JWT" },
  { Icon: Package,     text: "Trazabilidad completa de paquetes" },
  { Icon: PenLine,     text: "Protocolo de handshakes digitales" },
  { Icon: KeyRound,    text: "Validación OTP de 6 dígitos" },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated()) redirectByRole(getUser()!.rol);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function redirectByRole(rol: string) {
    const routes: Record<string, string> = {
      REMITENTE: "/dashboard/remitente",
      AGENTE: "/dashboard/agente",
      DESTINATARIO: "/dashboard/destinatario",
      SUPERVISOR: "/dashboard/supervisor",
    };
    router.push(routes[rol] || "/dashboard/agente");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) { setError("Completa todos los campos"); return; }
    setLoading(true); setError("");
    try {
      const data = await apiLogin(username.trim(), password.trim());
      saveAuth(data.access_token, data.user);
      redirectByRole(data.user.rol);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Credenciales incorrectas");
    } finally { setLoading(false); }
  }

  function quickLogin(u: typeof DEMO_USERS[0]) {
    setUsername(u.username); setPassword(u.password); setSelectedUser(u.username); setError("");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "Inter, system-ui, sans-serif", background: "linear-gradient(135deg,#050c18 0%,#0a1628 60%,#060d1a 100%)" }}>
      {/* Background grid */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(0,64,128,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(0,64,128,0.06) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />

      {/* LEFT — Branding */}
      <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
        className="hidden lg:flex flex-col"
        style={{ width: "48%", minHeight: "100vh", background: "linear-gradient(160deg,#003a7a 0%,#001f45 60%,#00122b 100%)", borderRight: "1px solid rgba(255,215,0,0.08)", padding: "60px 64px", position: "relative", overflow: "hidden" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "72px" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ position: "absolute", inset: "-4px", borderRadius: "50%", background: "radial-gradient(circle,rgba(255,215,0,0.25),transparent)", opacity: 0.7 }} />
            <Image src="/logo.jpg" alt="Logo UCT" width={60} height={60} style={{ borderRadius: "50%", position: "relative" }} />
          </div>
          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.2em", color: "rgba(255,215,0,0.65)", textTransform: "uppercase", marginBottom: "2px" }}>Universidad Católica de Temuco</p>
            <p style={{ fontSize: "16px", fontWeight: 700, color: "white" }}>Sistema de Paquetería</p>
          </div>
        </div>

        {/* Headline */}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "48px", fontWeight: 900, lineHeight: 1.1, color: "white", marginBottom: "24px" }}>
            Gestión de<br />
            <span style={{ background: "linear-gradient(135deg,#FFD700,#FFF176,#FFD700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Distribución</span><br />
            Interna
          </h1>
          <p style={{ fontSize: "16px", lineHeight: 1.7, color: "rgba(180,210,255,0.7)", marginBottom: "48px", maxWidth: "400px" }}>
            Plataforma de trazabilidad y control de activos institucionales con handshakes digitales y validación OTP.
          </p>

          {/* Features — sin emojis */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "56px" }}>
            {FEATURES.map(({ Icon, text }, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
                style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "rgba(255,215,0,0.07)", border: "1px solid rgba(255,215,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={16} style={{ color: "#FFD700" }} />
                </div>
                <span style={{ fontSize: "14px", color: "rgba(200,220,255,0.8)", fontWeight: 500 }}>{text}</span>
              </motion.div>
            ))}
          </div>

          {/* States */}
          <div style={{ background: "rgba(255,215,0,0.04)", border: "1px solid rgba(255,215,0,0.12)", borderRadius: "16px", padding: "20px 24px" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,215,0,0.6)", marginBottom: "14px" }}>Estados del flujo</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {["PENDIENTE","EN TRÁNSITO","VALIDACIÓN","ENTREGADO","DISPUTA","CUARENTENA"].map(s => (
                <span key={s} style={{ fontSize: "10px", padding: "4px 10px", borderRadius: "999px", fontFamily: "monospace", fontWeight: 700, background: "rgba(255,215,0,0.06)", color: "#FFD700", border: "1px solid rgba(255,215,0,0.18)", letterSpacing: "0.05em" }}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* RIGHT — Form */}
      <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 48px", minHeight: "100vh" }}>
        <div style={{ width: "100%", maxWidth: "420px" }}>

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <Image src="/logo.jpg" alt="Logo UCT" width={48} height={48} style={{ borderRadius: "50%" }} />
            <div>
              <p style={{ fontSize: "10px", color: "rgba(255,215,0,0.7)", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>UCT</p>
              <p style={{ fontSize: "15px", color: "white", fontWeight: 700 }}>Sistema de Paquetería</p>
            </div>
          </div>

          <div style={{ marginBottom: "36px" }}>
            <h2 style={{ fontSize: "28px", fontWeight: 800, color: "white", marginBottom: "8px" }}>Iniciar Sesión</h2>
            <p style={{ fontSize: "14px", color: "rgba(139,163,199,1)" }}>Accede con tus credenciales institucionales</p>
          </div>

          {/* Quick access */}
          <div style={{ marginBottom: "32px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(74,96,128,1)", marginBottom: "14px" }}>Acceso rápido demo</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {DEMO_USERS.map(u => (
                <button key={u.username} id={`quick-${u.username}`} onClick={() => quickLogin(u)} style={{
                  display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "14px",
                  border: `1px solid ${selectedUser === u.username ? "rgba(255,215,0,0.45)" : "rgba(255,215,0,0.1)"}`,
                  background: selectedUser === u.username ? "rgba(255,215,0,0.07)" : "rgba(255,255,255,0.02)",
                  cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: u.gradient, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "14px", flexShrink: 0 }}>{u.initial}</div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "white", marginBottom: "1px" }}>{u.label}</p>
                    <p style={{ fontSize: "11px", color: "rgba(139,163,199,1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.username}</p>
                  </div>
                  {selectedUser === u.username && <CheckCircle2 size={14} style={{ color: "#FFD700", marginLeft: "auto", flexShrink: 0 }} />}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,215,0,0.08)" }} />
            <span style={{ fontSize: "12px", color: "rgba(74,96,128,1)" }}>o ingresa manualmente</span>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,215,0,0.08)" }} />
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", borderRadius: "12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", fontSize: "13px" }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} /> {error}
              </motion.div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(74,96,128,1)", marginBottom: "8px" }}>Usuario</label>
              <div style={{ position: "relative" }}>
                <User size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(74,96,128,1)" }} />
                <input id="login-username" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="ej. informatica" className="input-field" style={{ paddingLeft: "42px" }} autoComplete="username" />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(74,96,128,1)", marginBottom: "8px" }}>Contraseña</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(74,96,128,1)" }} />
                <input id="login-password" type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input-field" style={{ paddingLeft: "42px", paddingRight: "42px" }} autoComplete="current-password" />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(74,96,128,1)", background: "none", border: "none", cursor: "pointer" }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button id="btn-login" type="submit" disabled={loading} className="btn-primary btn-gold" style={{ padding: "16px 24px", fontSize: "15px", marginTop: "8px", opacity: loading ? 0.75 : 1 }}>
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
                  <span style={{ width: "16px", height: "16px", border: "2px solid rgba(0,51,102,0.3)", borderTop: "2px solid #003366", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                  Autenticando...
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                  <Lock size={16} /> Ingresar al Sistema <ChevronRight size={16} />
                </span>
              )}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "12px", color: "rgba(74,96,128,1)", marginTop: "28px" }}>
            Sistema interno UCT · Paquetería Institucional v2.0
          </p>
        </div>
      </motion.div>
    </div>
  );
}
