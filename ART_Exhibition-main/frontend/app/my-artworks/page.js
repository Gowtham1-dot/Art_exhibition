"use client";

import { useEffect, useState } from "react";
import API from "../../lib/api";
import Navbar from "../../components/Navbar";
import { decodeJwtPayload, getStoredToken } from "../../lib/auth";

function StatusPill({ status }) {
  const value = String(status || "pending");

  const map = {
    pending: {
      label: "Pending",
      className: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/30",
    },
    approved: {
      label: "Approved",
      className:
        "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30",
    },
    rejected: {
      label: "Rejected",
      className: "bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/30",
    },
  };

  const style = map[value] || map.pending;

  return (
    <div
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${style.className}`}
    >
      {style.label}
    </div>
  );
}

export default function MyArtworksPage() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  const token = getStoredToken();
  const payload = decodeJwtPayload(token);
  const role = payload?.role || "";
  const isUser = role === "user";

  useEffect(() => {
    if (!isUser) return;

    API.get("/artworks/mine?limit=200")
      .then((res) => {
        setItems(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load your artworks"
        );
        setItems([]);
      })
      .finally(() => {});
  }, [isUser]);

  const loading = isUser && !error && items === null;
  const list = Array.isArray(items) ? items : [];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 artt-animated-dark-bg bg-gradient-to-br from-slate-950 via-indigo-950 to-rose-950" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-60 artt-animated-dark-bg bg-gradient-to-tr from-emerald-950 via-fuchsia-950 to-cyan-950" />
      <div className="pointer-events-none fixed -top-24 -left-24 -z-10 h-[26rem] w-[26rem] rounded-full blur-3xl opacity-30 artt-blob-a bg-gradient-to-tr from-fuchsia-500 to-cyan-500" />
      <div className="pointer-events-none fixed -bottom-28 -right-28 -z-10 h-[30rem] w-[30rem] rounded-full blur-3xl opacity-25 artt-blob-b bg-gradient-to-tr from-amber-400 to-rose-500" />

      <Navbar />

      <main className="relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white">My Artworks</h1>
            <p className="text-sm text-slate-300 mt-1">
              Track review status for your uploads.
            </p>
          </div>

          {!token ? (
            <div className="bg-white/5 backdrop-blur rounded-2xl shadow-sm ring-1 ring-white/10 p-6 text-slate-200">
              Please log in to view your artworks.
              <div className="mt-3">
                <a
                  href="/login"
                  className="inline-flex items-center rounded-lg px-4 py-2 bg-rose-500 text-white text-sm font-medium hover:bg-rose-400 transition"
                >
                  Go to Login
                </a>
              </div>
            </div>
          ) : !isUser ? (
            <div className="bg-white/5 backdrop-blur rounded-2xl shadow-sm ring-1 ring-white/10 p-6 text-slate-200">
              User access required.
            </div>
          ) : error ? (
            <div className="border border-red-300 bg-red-50 text-red-800 p-3 rounded-xl">
              {error}
            </div>
          ) : loading ? (
            <div className="text-sm text-slate-300">Loading…</div>
          ) : list.length === 0 ? (
            <div className="text-sm text-slate-300">No uploads yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
              {list.map((a) => (
                <div
                  key={a._id}
                  className="bg-white/5 backdrop-blur rounded-2xl shadow-sm ring-1 ring-white/10 overflow-hidden"
                >
                  <div className="aspect-[4/3] w-full bg-black/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.thumbnailUrl || a.imageUrl}
                      alt={a.title || "Artwork"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="text-white font-semibold line-clamp-1">
                      {a.title}
                    </div>
                    <div className="text-xs text-slate-300 line-clamp-1">
                      {a.artistName}
                    </div>
                    <div>
                      <StatusPill status={a.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
