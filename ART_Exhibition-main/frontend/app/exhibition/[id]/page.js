"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import API from "../../../lib/api";
import Navbar from "../../../components/Navbar";

export default function ExhibitionDetail() {
  const params = useParams();
  const id = params?.id;
  const [ex, setEx] = useState(null);
  const [selectedArtwork, setSelectedArtwork] = useState(null);

  useEffect(() => {
    if (!id) return;
    API.get(`/exhibitions/${id}`).then((res) => setEx(res.data));
  }, [id]);

  if (!ex) return null;

  const artworks = ex.artworkIds || [];

  const safePreview = (value, max = 140) => {
    const text = String(value || "").trim();
    if (!text) return "";
    return text.length > max ? `${text.slice(0, max)}…` : text;
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 artt-animated-dark-bg bg-gradient-to-br from-slate-950 via-indigo-950 to-rose-950" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-60 artt-animated-dark-bg bg-gradient-to-tr from-emerald-950 via-fuchsia-950 to-cyan-950" />
      <div className="pointer-events-none fixed -top-24 -left-24 -z-10 h-[26rem] w-[26rem] rounded-full blur-3xl opacity-30 artt-blob-a bg-gradient-to-tr from-fuchsia-500 to-cyan-500" />
      <div className="pointer-events-none fixed -bottom-28 -right-28 -z-10 h-[30rem] w-[30rem] rounded-full blur-3xl opacity-25 artt-blob-b bg-gradient-to-tr from-amber-400 to-rose-500" />

      <Navbar />
      <main className="relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {ex.themeTitle}
          </h1>
          <p className="mt-2 text-sm text-slate-300 max-w-3xl">
            {ex.curatorialStatement}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6 items-stretch [grid-auto-rows:1fr]">
            {artworks.map((a) => {
              const src = a?.thumbnailUrl || a?.imageUrl || "";
              const preview = safePreview(a?.description, 140);
              const tags = Array.isArray(a?.tags) ? a.tags : [];

              return (
                <button
                  key={a._id}
                  type="button"
                  className="text-left w-full h-full"
                  onClick={() => setSelectedArtwork(a)}
                >
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm ring-1 ring-black/5 hover:shadow-md transition-shadow w-full h-full">
                    <div className="relative w-full aspect-[4/3] bg-slate-100">
                      {src ? (
                        <Image
                          src={src}
                          alt={a?.title || "Artwork"}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : null}
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-slate-900 leading-snug truncate">
                            {a?.title}
                          </h3>
                          <p className="text-xs text-slate-500 truncate">
                            {a?.artistName}
                          </p>
                        </div>

                        {a?.style ? (
                          <span className="shrink-0 text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                            {a.style}
                          </span>
                        ) : null}
                      </div>

                      {preview ? (
                        <p className="text-xs text-slate-600 leading-relaxed mb-2">
                          {preview}
                        </p>
                      ) : null}

                      {tags.length ? (
                        <div className="flex flex-wrap gap-2">
                          {tags.slice(0, 4).map((t) => (
                            <span
                              key={t}
                              className="text-[10px] px-2 py-1 rounded-full bg-slate-50 ring-1 ring-slate-200 text-slate-600"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {selectedArtwork ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-6"
          onClick={() => setSelectedArtwork(null)}
        >
          <div
            className="bg-white text-slate-900 max-w-2xl w-full rounded p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {selectedArtwork.title}
                </h2>
                <p className="text-sm text-slate-600">
                  {selectedArtwork.artistName}
                </p>
              </div>
              <button
                type="button"
                className="border border-slate-200 text-slate-900 rounded px-2 py-1"
                onClick={() => setSelectedArtwork(null)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <Image
                src={selectedArtwork.imageUrl}
                alt={selectedArtwork.title}
                width={900}
                height={900}
                className="w-full h-auto rounded"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="space-y-2">
                <div>
                  <div className="font-medium text-slate-900">AI Mood</div>
                  <div className="text-sm text-slate-800">
                    {selectedArtwork.aiAnalysis?.mood || "—"}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-slate-900">AI Symbolism</div>
                  <div className="text-sm text-slate-800">
                    {selectedArtwork.aiAnalysis?.symbolism || "—"}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-slate-900">Themes</div>
                  <div className="text-sm text-slate-800">
                    {(selectedArtwork.aiAnalysis?.themes || []).join(", ") ||
                      "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
