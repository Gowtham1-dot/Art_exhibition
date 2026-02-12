import { verifyJwt } from "../utils/jwt.js";

function extractBearerToken(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer") return "";
  return token || "";
}

export function requireAuth(req, res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ message: "Missing Bearer token" });
    }

    const payload = verifyJwt(token);
    if (!payload?.role) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.auth = payload;
    next();
  } catch (error) {
    if (error?.code === "JWT_SECRET_MISSING") {
      return res.status(500).json({ message: error.message });
    }
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireRole(role) {
  return function requireRoleMiddleware(req, res, next) {
    if (!req.auth) {
      return res.status(500).json({ message: "Auth middleware misconfigured" });
    }

    if (req.auth.role !== role) {
      return res.status(403).json({ message: `${role} access required` });
    }

    next();
  };
}

export const requireCurator = [requireAuth, requireRole("curator")];
export const requireUser = [requireAuth, requireRole("user")];
