import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signJwt } from "../utils/jwt.js";

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

export const register = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");
    const displayName = String(req.body?.displayName || "").trim();

    if (!email) return res.status(400).json({ message: "Email is required" });
    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      passwordHash,
      displayName,
      role: "user",
    });

    const token = signJwt({ role: "user", userId: String(user._id) });
    return res.status(201).json({
      token,
      user: {
        id: String(user._id),
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (error) {
    if (error?.code === "JWT_SECRET_MISSING") {
      return res.status(500).json({ message: error.message });
    }
    console.error("Register failed:", error);
    return res.status(500).json({ message: "Failed to register" });
  }
};

export const login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!email) return res.status(400).json({ message: "Email is required" });
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signJwt({ role: "user", userId: String(user._id) });
    return res.json({
      token,
      user: {
        id: String(user._id),
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (error) {
    if (error?.code === "JWT_SECRET_MISSING") {
      return res.status(500).json({ message: error.message });
    }
    console.error("Login failed:", error);
    return res.status(500).json({ message: "Failed to login" });
  }
};

export const me = async (req, res) => {
  if (req.auth?.role === "curator") {
    return res.json({ role: "curator" });
  }

  if (req.auth?.role === "user") {
    const user = await User.findById(req.auth.userId).select(
      "email displayName role"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
      id: String(user._id),
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    });
  }

  return res.status(401).json({ message: "Invalid token" });
};
