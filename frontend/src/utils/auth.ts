type JwtPayload = {
  role?: number | string;
};

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
}

export function getUserRole(): number | null {
  const token = localStorage.getItem("token");
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const payload = JSON.parse(decodeBase64Url(parts[1])) as JwtPayload;
    const role = payload.role;

    if (typeof role === "number") return role;
    if (typeof role === "string") {
      const parsed = Number(role);
      return Number.isNaN(parsed) ? null : parsed;
    }

    return null;
  } catch {
    return null;
  }
}
