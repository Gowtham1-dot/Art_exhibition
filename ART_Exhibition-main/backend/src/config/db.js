import mongoose from "mongoose";

function buildConnectOptions() {
  const options = {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  };

  // Dev-only escape hatch for TLS-intercepting antivirus/proxies.
  // Prefer fixing network/proxy, not disabling cert validation.
  if (String(process.env.MONGO_TLS_INSECURE).toLowerCase() === "true") {
    options.tlsInsecure = true;
    options.tlsAllowInvalidCertificates = true;
  }

  return options;
}

async function tryConnect(uri) {
  await mongoose.connect(uri, buildConnectOptions());
}

export const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error(
      "MONGO_URI is missing. Set it in backend/.env (local Mongo) or Atlas connection string."
    );
  }

  const fallbackUri = process.env.MONGO_FALLBACK_URI;
  const allowFallback =
    String(process.env.MONGO_ALLOW_FALLBACK).toLowerCase() === "true";

  try {
    await tryConnect(uri);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:");
    console.error(error?.message || error);

    // Extra hints for common Atlas failures.
    const msg = String(error?.message || "");
    if (
      msg.includes("Could not connect to any servers") ||
      msg.includes("ServerSelection")
    ) {
      console.error(
        "Atlas tips: (1) Network Access: add your current IP or 0.0.0.0/0 for dev, (2) ensure your password is URL-encoded, (3) verify the mongodb+srv URI from Atlas 'Connect'."
      );
    }
    if (msg.includes("SSL") || msg.includes("TLS") || msg.includes("ERR_SSL")) {
      console.error(
        "TLS tip: antivirus/proxy can break TLS to Atlas. Try a different network/hotspot or allow MongoDB traffic; also verify your system clock is correct."
      );
    }

    if (allowFallback && fallbackUri) {
      console.error("Attempting fallback MongoDB connection...");
      try {
        await tryConnect(fallbackUri);
        console.log("MongoDB connected (fallback)");
        return;
      } catch (fallbackError) {
        console.error("Fallback MongoDB connection failed:");
        console.error(fallbackError?.message || fallbackError);
      }
    }

    throw error;
  }
};
