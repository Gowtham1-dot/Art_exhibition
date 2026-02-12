const AUTH_TOKEN_KEY = "auth_token";
const CURATOR_TOKEN_KEY = "curator_jwt";

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function getStoredToken() {
  if (typeof window === "undefined") return "";
  return (
    window.localStorage.getItem(AUTH_TOKEN_KEY) ||
    window.localStorage.getItem(CURATOR_TOKEN_KEY) ||
    ""
  );
}

export function setStoredToken(token) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(CURATOR_TOKEN_KEY);
}

export function decodeJwtPayload(token) {
  try {
    const parts = String(token || "").split(".");
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );

    const json = atob(padded);
    return safeJsonParse(json);
  } catch {
    return null;
  }
}

export function getAuthRole() {
  const token = getStoredToken();
  const payload = decodeJwtPayload(token);
  return payload?.role || "";
}

export function isLoggedIn() {
  const token = getStoredToken();
  return String(token).split(".").length === 3;
}
