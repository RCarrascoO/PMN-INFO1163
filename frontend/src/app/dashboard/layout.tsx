"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, LayoutDashboard, LogOut, Menu, X,
  Building2, Truck, User, ShieldCheck, ChevronRight
} from "lucide-react";
import { getUser, logout, isAuthenticated } from "@/lib/auth";
import type { User as UserType } from "@/lib/api";

const roleConfig: Record<string, {
  label: string; color: string; bg: string; icon: React.ElementType; route: string; gradient: string;
}> = {
  REMITENTE:    { label: "Remitente",    color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  icon: Building2,  route: "/dashboard/remitente", gradient: "linear-gradient(135deg,#3b82f6,#1d4ed8)" },
  AGENTE:       { label: "Agente",       color: "#10b981", bg: "rgba(16,185,129,0.12)",  icon: Truck,       route: "/dashboard/agente",    gradient: "linear-gradient(135deg,#10b981,#059669)" },
  DESTINATARIO: { label: "Destinatario", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)",  icon: User,        route: "/dashboard/destinatario", gradient: "linear-gradient(135deg,#8b5cf6,#6d28d9)" },
  SUPERVISOR:   { label: "Supervisor",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  icon: ShieldCheck, route: "/dashboard/supervisor", gradient: "linear-gradient(135deg,#f59e0b,#d97706)" },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserType | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    setUser(getUser());
  }, [router]);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#060d1a" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "40px", height: "40px", border: "2px solid rgba(255,215,0,0.2)", borderTop: "2px solid #FFD700", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <p style={{ color: "rgba(74,96,128,1)", fontSize: "14px" }}>Cargando sistema...</p>
        </div>
      </div>
    );
  }

  const rc = roleConfig[user.rol] || roleConfig.AGENTE;
  const RoleIcon = rc.icon;

  const navItems = [
    { href: rc.route, label: "Dashboard", icon: LayoutDashboard },
    { href: rc.route, label: "Paquetes", icon: Package },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#060d1a", fontFamily: "Inter, system-ui, sans-serif" }}>
      
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 20, display: "block" }}
            className="lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        style={{
          width: "280px",
          minHeight: "100vh",
          background: "#0a1628",
          borderRight: "1px solid rgba(255,215,0,0.08)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
          zIndex: 30,
        }}
        className={`fixed lg:sticky inset-y-0 left-0 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo area */}
        <div style={{ padding: "28px 24px 24px", borderBottom: "1px solid rgba(255,215,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ position: "absolute", inset: "-3px", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,215,0,0.25), transparent)", opacity: 0.8 }} />
              <Image src="/logo.jpg" alt="Logo UCT" width={44} height={44} style={{ borderRadius: "50%", position: "relative" }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "14px", fontWeight: 800, color: "white", lineHeight: 1.2 }}>Paquetería UCT</p>
              <p style={{ fontSize: "11px", color: "rgba(74,96,128,1)", marginTop: "2px" }}>Sistema Institucional</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden" style={{ marginLeft: "auto", color: "rgba(74,96,128,1)", background: "none", border: "none", cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* User card */}
        <div style={{ margin: "20px 16px 8px" }}>
          <div style={{ padding: "16px", borderRadius: "16px", background: rc.bg, border: `1px solid ${rc.color}25` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: rc.gradient, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <RoleIcon size={20} color="white" />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.nombre}</p>
                <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: rc.color, marginTop: "2px" }}>{rc.label}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "16px", overflowY: "auto" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(74,96,128,1)", padding: "0 8px", marginBottom: "10px" }}>Navegación</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.label} href={item.href}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "12px 14px", borderRadius: "12px", textDecoration: "none",
                    fontSize: "14px", fontWeight: 500, transition: "all 0.2s",
                    background: isActive ? "rgba(255,215,0,0.08)" : "transparent",
                    color: isActive ? "#FFD700" : "rgba(139,163,199,1)",
                    border: `1px solid ${isActive ? "rgba(255,215,0,0.25)" : "transparent"}`,
                  }}
                >
                  <Icon size={18} />
                  {item.label}
                  {isActive && <ChevronRight size={14} style={{ marginLeft: "auto" }} />}
                </Link>
              );
            })}
          </div>

          <div style={{ marginTop: "24px" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(74,96,128,1)", padding: "0 8px", marginBottom: "10px" }}>Sistema</p>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "12px", fontSize: "14px", fontWeight: 500, color: "rgba(74,96,128,0.6)", cursor: "not-allowed" }}>
              <Package size={18} />
              Notificaciones
              <span style={{ marginLeft: "auto", fontSize: "9px", padding: "2px 7px", borderRadius: "999px", background: "rgba(255,215,0,0.08)", color: "#FFD700", fontWeight: 700 }}>PRONTO</span>
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div style={{ padding: "16px", borderTop: "1px solid rgba(255,215,0,0.06)" }}>
          <button id="btn-logout" onClick={handleLogout}
            style={{
              display: "flex", alignItems: "center", gap: "12px", width: "100%",
              padding: "12px 14px", borderRadius: "12px", border: "1px solid rgba(239,68,68,0.2)",
              background: "rgba(239,68,68,0.05)", color: "#f87171", fontSize: "14px",
              fontWeight: 500, cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.05)"; }}
          >
            <LogOut size={17} />
            Cerrar Sesión
          </button>
          <p style={{ textAlign: "center", fontSize: "11px", color: "rgba(74,96,128,0.6)", marginTop: "16px" }}>v2.0 · UCT © 2026</p>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        {/* Topbar */}
        <header style={{
          display: "flex", alignItems: "center", gap: "16px",
          padding: "16px 28px", position: "sticky", top: 0, zIndex: 10,
          background: "rgba(6,13,26,0.9)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,215,0,0.06)",
        }}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden"
            style={{ padding: "8px", borderRadius: "10px", color: "rgba(139,163,199,1)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}>
            <Menu size={18} />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
            <span style={{ color: "rgba(74,96,128,1)" }}>UCT</span>
            <ChevronRight size={13} style={{ color: "rgba(74,96,128,1)" }} />
            <span style={{ color: "white", fontWeight: 600 }}>{rc.label}</span>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "rgba(139,163,199,1)" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "pulse 2s infinite" }} />
              En línea
            </div>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: rc.gradient, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "13px" }}>
              {user.nombre[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
