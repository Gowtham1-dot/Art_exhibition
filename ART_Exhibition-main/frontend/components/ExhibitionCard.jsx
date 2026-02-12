import Link from "next/link";
import Image from "next/image";

export default function ExhibitionCard({ exhibition, coverUrl: coverUrlProp }) {
  const artworks = Array.isArray(exhibition?.artworkIds)
    ? exhibition.artworkIds
    : [];
  const cover = artworks.find((a) => a?.thumbnailUrl || a?.imageUrl) || null;
  const coverUrl = coverUrlProp || cover?.thumbnailUrl || cover?.imageUrl || "";
  const count = artworks.length;

  const title = String(exhibition?.themeTitle || "");
  const fallbackMatch = title.match(/fallback\s*exhibition\s*(\d+)/i);
  const fallbackLabel = fallbackMatch
    ? `Fallback ${fallbackMatch[1]}`
    : /fallback/i.test(title)
    ? "Fallback"
    : "";

  const statement = String(exhibition?.curatorialStatement || "");
  const statementPreview =
    statement.length > 140 ? `${statement.slice(0, 140)}…` : statement;

  return (
    <Link href={`/exhibition/${exhibition._id}`}>
      <div className="bg-slate-900/70 rounded-2xl overflow-hidden ring-1 ring-white/10 hover:ring-white/20 hover:bg-slate-900/80 transition w-full h-full flex flex-col">
        <div className="p-3">
          <div className="relative w-full aspect-[16/11] bg-slate-800/60 rounded-xl overflow-hidden">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={exhibition?.themeTitle || "Exhibition cover"}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            ) : null}

            {fallbackLabel ? (
              <div className="absolute top-2 left-2 text-xs bg-black/40 ring-1 ring-white/15 text-slate-100 rounded px-2 py-1">
                {fallbackLabel}
              </div>
            ) : null}
          </div>
        </div>

        <div className="px-4 pb-4 space-y-2 flex-1">
          <div className="space-y-1">
            <h2 className="font-semibold text-white leading-snug min-h-[3.25rem]">
              {exhibition.themeTitle}
            </h2>
            <p className="text-xs text-slate-300">
              {exhibition?.year ? `${exhibition.year} · ` : ""}Artworks: {count}
            </p>
          </div>
          <p className="text-sm text-slate-200/90 min-h-[3.75rem] max-h-[3.75rem] overflow-hidden">
            {statementPreview}
          </p>
        </div>
      </div>
    </Link>
  );
}
