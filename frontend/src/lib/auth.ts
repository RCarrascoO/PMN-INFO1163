"use client";
import { User } from "./api";

export function saveAuth(token: string, user: User) {
  localStorage.setItem("pmn_token", token);
  localStorage.setItem("pmn_user", JSON.stringify(user));
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("pmn_token");
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("pmn_user");
  if (!raw) return null;
  try { return JSON.parse(raw) as User; } catch { return null; }
}

export function logout() {
  localStorage.removeItem("pmn_token");
  localStorage.removeItem("pmn_user");
}

export function isAuthenticated(): boolean {
  return !!getToken() && !!getUser();
}
