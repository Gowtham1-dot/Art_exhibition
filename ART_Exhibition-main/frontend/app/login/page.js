"use client";

import { useState } from "react";
import API from "../../lib/api";
import Navbar from "../../components/Navbar";
import { setStoredToken } from "../../lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signIn() {
    setError("");
    setLoading(true);
    try {
      const res = await API.post("/auth/login", {
        email: email.trim(),
        password,
      });
      const token = res?.data?.token;
      if (!token) throw new Error("Missing token");
      setStoredToken(token);
      window.location.href = "/my-artworks";
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function register() {
    setError("");
    setLoading(true);
    try {
      const res = await API.post("/auth/register", {
        email: email.trim(),
        password,
        displayName: displayName.trim(),
      });
      const token = res?.data?.token;
      if (!token) throw new Error("Missing token");
      setStoredToken(token);
      window.location.href = "/my-artworks";
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 artt-animated-dark-bg bg-gradient-to-br from-slate-950 via-indigo-950 to-rose-950" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-60 artt-animated-dark-bg bg-gradient-to-tr from-emerald-950 via-fuchsia-950 to-cyan-950" />
      <div className="pointer-events-none fixed -top-24 -left-24 -z-10 h-[26rem] w-[26rem] rounded-full blur-3xl opacity-30 artt-blob-a bg-gradient-to-tr from-fuchsia-500 to-cyan-500" />
      <div className="pointer-events-none fixed -bottom-28 -right-28 -z-10 h-[30rem] w-[30rem] rounded-full blur-3xl opacity-25 artt-blob-b bg-gradient-to-tr from-amber-400 to-rose-500" />

      <Navbar />

      <main className="relative">
        <div className="max-w-md mx-auto px-4 sm:px-6 py-10">
          <div className="bg-white/5 backdrop-blur rounded-2xl shadow-sm ring-1 ring-white/10 p-6">
            <h1 className="text-2xl font-bold text-white">Login</h1>
            <p className="text-sm text-slate-300 mt-1">
              Sign in as a user to upload and track your artworks.
            </p>

            {error ? (
              <div className="mt-4 border border-red-300 bg-red-50 text-red-800 p-3 rounded-xl">
                {error}
              </div>
            ) : null}

            <div className="mt-6 space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-white">Email</label>
                <input
                  className="border rounded-lg p-2 bg-white/10 text-white border-white/15 placeholder:text-slate-400"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-white">
                  Password
                </label>
                <input
                  type="password"
                  className="border rounded-lg p-2 bg-white/10 text-white border-white/15 placeholder:text-slate-400"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-white">
                  Display name (for register)
                </label>
                <input
                  className="border rounded-lg p-2 bg-white/10 text-white border-white/15 placeholder:text-slate-400"
                  placeholder="Optional"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={signIn}
                  className="rounded-lg px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Please wait…" : "Sign in"}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={register}
                  className="rounded-lg px-4 py-2 bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Please wait…" : "Create account"}
                </button>
              </div>

              <a className="text-xs text-slate-300 underline" href="/curator">
                Curator? Sign in with PIN
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
