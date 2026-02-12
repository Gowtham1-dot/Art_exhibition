import { verifyJwt } from "../utils/jwt.js";

export function requireCuratorAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [, token] = header.split(" ");

    if (!token) {
      return res.status(401).json({ message: "Missing Bearer token" });
    }

    const payload = verifyJwt(token);

    if (payload?.role !== "curator") {
      return res.status(403).json({ message: "Curator access required" });
    }

    req.user = payload;
    next();
  } catch (error) {
    if (error?.code === "JWT_SECRET_MISSING") {
      return res.status(500).json({ message: error.message });
    }
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
