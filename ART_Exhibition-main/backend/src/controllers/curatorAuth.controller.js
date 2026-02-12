import { signJwt } from "../utils/jwt.js";

export const loginWithPin = async (req, res) => {
  try {
    const { pin } = req.body || {};

    const expectedPin = process.env.CURATOR_PIN;
    if (!expectedPin) {
      return res
        .status(500)
        .json({ message: "Server misconfigured: CURATOR_PIN missing" });
    }

    if (!pin || String(pin) !== String(expectedPin)) {
      return res.status(401).json({ message: "Invalid PIN" });
    }

    const token = signJwt({ role: "curator" });
    return res.json({ token });
  } catch (error) {
    console.error("PIN login failed:", error);

    if (error?.code === "JWT_SECRET_MISSING") {
      return res.status(500).json({ message: error.message });
    }

    return res.status(500).json({ message: "Failed to login" });
  }
};
