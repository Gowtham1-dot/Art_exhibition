import jwt from "jsonwebtoken";

function getCandidateSecrets() {
  const secrets = [];

  const primary = process.env.JWT_SECRET;
  if (primary) secrets.push(primary);

  const curatorFallback = process.env.CURATOR_JWT_SECRET;
  if (curatorFallback && curatorFallback !== primary)
    secrets.push(curatorFallback);

  return secrets;
}

export function assertJwtSecretAvailable() {
  const secrets = getCandidateSecrets();
  if (secrets.length === 0) {
    const error = new Error(
      "Server misconfigured: JWT_SECRET missing (or CURATOR_JWT_SECRET for legacy curator tokens)"
    );
    error.code = "JWT_SECRET_MISSING";
    throw error;
  }
}

export function signJwt(payload, options = {}) {
  const secret = process.env.JWT_SECRET || process.env.CURATOR_JWT_SECRET;
  if (!secret) {
    const error = new Error(
      "Server misconfigured: JWT_SECRET missing (or CURATOR_JWT_SECRET for legacy curator tokens)"
    );
    error.code = "JWT_SECRET_MISSING";
    throw error;
  }

  return jwt.sign(payload, secret, { expiresIn: "7d", ...options });
}

export function verifyJwt(token) {
  const secrets = getCandidateSecrets();
  if (secrets.length === 0) {
    const error = new Error(
      "Server misconfigured: JWT_SECRET missing (or CURATOR_JWT_SECRET for legacy curator tokens)"
    );
    error.code = "JWT_SECRET_MISSING";
    throw error;
  }

  let lastError;
  for (const secret of secrets) {
    try {
      return jwt.verify(token, secret);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Invalid token");
}
