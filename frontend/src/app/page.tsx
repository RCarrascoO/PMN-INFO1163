"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getUser } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    const user = getUser();
    const routes: Record<string, string> = {
      REMITENTE: "/dashboard/remitente",
      AGENTE: "/dashboard/agente",
      DESTINATARIO: "/dashboard/destinatario",
      SUPERVISOR: "/dashboard/supervisor",
    };
    router.replace(routes[user?.rol || ""] || "/login");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-deep)" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
        <p style={{ color: "var(--text-muted)" }} className="text-sm">Redirigiendo...</p>
      </div>
    </div>
  );
}