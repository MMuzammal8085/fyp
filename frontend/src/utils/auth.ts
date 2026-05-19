export const UserRole = {
  HR: 1,
  EMPLOYEE: 2,
  CANDIDATE: 3,
} as const;

type JwtPayload = {
  sub?: string;
  role?: number | string;
};

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    return JSON.parse(decodeBase64Url(parts[1])) as JwtPayload;
  } catch {
    return null;
  }
}

export function getUserRole(): number | null {
  const stored = localStorage.getItem("userRole");
  if (stored !== null && stored !== "") {
    const parsed = Number(stored);
    if (!Number.isNaN(parsed)) return parsed;
  }

  const token = localStorage.getItem("token");
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  const role = payload?.role;

  if (typeof role === "number") return role;
  if (typeof role === "string") {
    const parsed = Number(role);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

export function getUserId(): string | null {
  const stored = localStorage.getItem("userId");
  if (stored) return stored;

  const token = localStorage.getItem("token");
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  return payload?.sub ? String(payload.sub) : null;
}

export function isHr(): boolean {
  return getUserRole() === UserRole.HR;
}

export function isEmployee(): boolean {
  return getUserRole() === UserRole.EMPLOYEE;
}

export function persistAuthFromToken(token: string, email?: string) {
  localStorage.setItem("token", token);

  const payload = decodeJwtPayload(token);
  if (payload?.role !== undefined && payload?.role !== null) {
    localStorage.setItem("userRole", String(payload.role));
  }
  if (payload?.sub) {
    localStorage.setItem("userId", String(payload.sub));
  }

  if (email) {
    localStorage.setItem("userEmail", email);
    const existing = localStorage.getItem("username");
    if (!existing) {
      localStorage.setItem("username", email.split("@")[0]);
    }
  }
}

export function clearAuthStorage() {
  localStorage.removeItem("token");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userId");
  localStorage.removeItem("username");
  localStorage.removeItem("userEmail");
}
