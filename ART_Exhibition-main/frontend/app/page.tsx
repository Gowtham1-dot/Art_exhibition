"use client";

import { useEffect, useState } from "react";
import API from "../lib/api";
import Navbar from "../components/Navbar";
import ExhibitionCard from "../components/ExhibitionCard";
import Image from "next/image";
import { Libre_Baskerville } from "next/font/google";

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

type ArtworkForCover = {
  thumbnailUrl?: string;
  imageUrl?: string;
};

const pickUniqueCoverUrl = (
  artworks: ArtworkForCover[],
  used: Set<string>
): string => {
  for (const artwork of artworks) {
    const url = artwork?.thumbnailUrl || artwork?.imageUrl;
    if (url && !used.has(url)) {
      used.add(url);
      return url;
    }
  }

  const fallback = artworks?.[0]?.thumbnailUrl || artworks?.[0]?.imageUrl || "";
  if (fallback) used.add(fallback);
  return fallback;
};

export default function HomePage() {
  const [exhibitions, setExhibitions] = useState<unknown[]>([]);
  const [artworks, setArtworks] = useState<
    Array<{
      _id: string;
      title: string;
      artistName: string;
      description?: string;
      style?: string;
      medium?: string;
      tags?: string[];
      thumbnailUrl?: string;
      imageUrl?: string;
    }>
  >([]);

  useEffect(() => {
    Promise.all([API.get("/exhibitions"), API.get("/artworks?limit=120")])
      .then(([exRes, artRes]) => {
        setExhibitions(exRes.data);
        setArtworks(Array.isArray(artRes.data) ? artRes.data : []);
      })
      .catch(console.error);
  }, []);

  const aspectClasses = [
    "aspect-[4/3]",
    "aspect-[16/10]",
    "aspect-[1/1]",
    "aspect-[3/4]",
  ] as const;

  const safePreview = (value: unknown, max = 120) => {
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
          <section className="space-y-2">
            <h1
              className={`${libreBaskerville.className} text-4xl font-semibold italic tracking-tight text-white text-center`}
              style={{ fontWeight: 600 }}
            >
              The Grand Canvas
            </h1>
            <p className="text-sm text-slate-300">
              Explore published artworks and exhibitions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-white">
              Published Exhibitions
            </h2>
            {exhibitions.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch [grid-auto-rows:1fr]">
                {(() => {
                  const used = new Set<string>();
                  return exhibitions.map((ex) => {
                    const exAny = ex as {
                      _id: string;
                      artworkIds?: ArtworkForCover[];
                    };
                    const artworks = Array.isArray(exAny.artworkIds)
                      ? exAny.artworkIds
                      : [];
                    const coverUrl = pickUniqueCoverUrl(artworks, used);

                    return (
                      <div key={exAny._id} className="w-full h-full">
                        <ExhibitionCard exhibition={ex} coverUrl={coverUrl} />
                      </div>
                    );
                  });
                })()}
              </div>
            ) : (
              <p className="text-sm text-slate-300">
                No published exhibitions yet.
              </p>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">
                Published Artworks
              </h2>
              <p className="text-xs text-slate-400">
                Showing {artworks.length} artwork{artworks.length === 1 ? "" : "s"}
              </p>
            </div>

            {artworks.length ? (
              <div className="columns-1 sm:columns-2 lg:columns-4 [column-gap:1.25rem]">
                {artworks.map((artwork, index) => {
                  const src = artwork.thumbnailUrl || artwork.imageUrl || "";
                  const preview = safePreview(artwork.description, 140);
                  const aspectClass = aspectClasses[index % aspectClasses.length];
                  const tags = Array.isArray(artwork.tags) ? artwork.tags : [];

                  return (
                    <div key={artwork._id} className="break-inside-avoid mb-5">
                      <div className="bg-white rounded-2xl overflow-hidden shadow-sm ring-1 ring-black/5 hover:shadow-md transition-shadow">
                        <div className={`relative w-full ${aspectClass} bg-slate-100`}>
                          {src ? (
                            <Image
                              src={src}
                              alt={artwork.title || "Artwork"}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            />
                          ) : null}
                        </div>

                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <div className="min-w-0">
                              <h3 className="text-sm font-semibold text-slate-900 leading-snug truncate">
                                {artwork.title}
                              </h3>
                              <p className="text-xs text-slate-500 truncate">
                                {artwork.artistName}
                              </p>
                            </div>

                            {artwork.style ? (
                              <span className="shrink-0 text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                                {artwork.style}
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
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-300">
                No published artworks yet.
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}