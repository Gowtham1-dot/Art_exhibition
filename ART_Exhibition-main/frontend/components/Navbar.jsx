"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  clearStoredToken,
  decodeJwtPayload,
  getStoredToken,
} from "../lib/auth";

export default function Navbar() {
  const router = useRouter();
  const token = getStoredToken();
  const isAuthed = String(token).split(".").length === 3;
  const payload = decodeJwtPayload(token);
  const role = payload?.role || "";

  const showCurator = role === "curator";
  const showMyArtworks = role === "user";

  return (
    <>
      <div className="h-16" />
      <nav className="fixed top-0 left-0 w-full z-50 bg-transparent backdrop-blur">
        <div className="h-16 max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-3">
          <div className="shrink-0 w-16" aria-hidden="true" />

          <div className="flex-1 flex justify-center">
            <div className="hidden sm:flex items-center gap-1 rounded-full bg-slate-950 ring-1 ring-white/10 px-1 py-1">
              <Link
                className="px-4 py-2 rounded-full text-sm text-slate-200 hover:text-white hover:bg-white/10 transition"
                href="/"
              >
                Gallery
              </Link>
              {showMyArtworks ? (
                <Link
                  className="px-4 py-2 rounded-full text-sm text-slate-200 hover:text-white hover:bg-white/10 transition"
                  href="/my-artworks"
                >
                  My Artworks
                </Link>
              ) : null}
              {isAuthed ? (
                <Link
                  className="px-4 py-2 rounded-full text-sm text-slate-200 hover:text-white hover:bg-white/10 transition"
                  href="/upload"
                >
                  Upload Art
                </Link>
              ) : (
                <button
                  type="button"
                  className="px-4 py-2 rounded-full text-sm text-slate-200 hover:text-white hover:bg-white/10 transition"
                  onClick={() => {
                    window.alert("Please login to upload artworks.");
                    router.push("/login");
                  }}
                >
                  Upload Art
                </button>
              )}
              {showCurator ? (
                <Link
                  className="px-4 py-2 rounded-full text-sm text-slate-200 hover:text-white hover:bg-white/10 transition"
                  href="/curator"
                >
                  Curator
                </Link>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {isAuthed ? (
              <button
                type="button"
                onClick={() => {
                  clearStoredToken();
                  window.location.href = "/";
                }}
                className="h-9 px-4 inline-flex items-center rounded-full bg-rose-500 text-white text-sm font-medium hover:bg-rose-400 transition"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                className="h-9 px-4 inline-flex items-center rounded-full bg-rose-500 text-white text-sm font-medium hover:bg-rose-400 transition"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
