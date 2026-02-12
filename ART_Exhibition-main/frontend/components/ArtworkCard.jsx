// Artwork Card Component
import Image from "next/image";

export default function ArtworkCard({ artwork }) {
  const src = artwork.thumbnailUrl || artwork.imageUrl;
  return (
    <div className="border rounded p-3">
      <Image
        src={src}
        alt={artwork.title}
        width={400}
        height={400}
        className="w-full h-auto rounded"
        sizes="(max-width: 768px) 100vw, 33vw"
      />
      <h3 className="font-semibold">{artwork.title}</h3>
      <p className="text-sm">{artwork.artistName}</p>
    </div>
  );
}
