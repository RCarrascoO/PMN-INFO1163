const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("pmn_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("pmn_token");
      localStorage.removeItem("pmn_user");
      window.location.href = "/login";
    }
    throw new Error("Sesión expirada");
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Error en el servidor");
  }
  return data as T;
}

export interface User {
  id: number;
  username: string;
  nombre: string;
  rol: "REMITENTE" | "AGENTE" | "DESTINATARIO" | "SUPERVISOR";
}

export interface PackageEvent {
  id: number;
  package_id: number;
  actor_nombre: string;
  estado_anterior: string;
  estado_nuevo: string;
  notas: string;
  timestamp: string;
}

export interface Package {
  id: number;
  titulo: string;
  descripcion: string;
  origen: string;
  destino: string;
  estado: string;
  remitente_nombre?: string;
  agente_nombre?: string;
  destinatario_nombre?: string;
  proxy_nombre?: string;
  proxy_id?: string;
  otp_code?: string;
  otp_visible?: string;
  otp_used?: number;
  notas?: string;
  created_at: string;
  updated_at: string;
  events: PackageEvent[];
  allowed_transitions?: string[];
  otp_generado?: string;
}

export interface DashboardStats {
  total: number;
  entregados: number;
  en_transito: number;
  disputas: number;
  pendientes: number;
}

// Auth
export const apiLogin = (username: string, password: string) =>
  apiFetch<{ access_token: string; user: User }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

export const apiGetUsers = () => apiFetch<User[]>("/api/auth/me");

// Packages
export const apiGetPackages = () => apiFetch<Package[]>("/api/packages");
export const apiGetAllPackages = () => apiFetch<Package[]>("/api/packages/all");

export const apiGetPackage = (id: number) =>
  apiFetch<Package>(`/api/packages/${id}`);

export const apiCreatePackage = (data: {
  titulo: string;
  descripcion: string;
  origen: string;
  destino: string;
  agente_username: string;
  destinatario_username: string;
}) => apiFetch<Package>("/api/packages", { method: "POST", body: JSON.stringify(data) });

export const apiTransition = (
  id: number,
  new_state: string,
  extra?: { notas?: string; otp_code?: string; proxy_nombre?: string; proxy_id?: string }
) =>
  apiFetch<Package>(`/api/packages/${id}/transition`, {
    method: "POST",
    body: JSON.stringify({ new_state, ...extra }),
  });

export const apiGetStats = () =>
  apiFetch<DashboardStats>("/api/packages/stats/dashboard");
