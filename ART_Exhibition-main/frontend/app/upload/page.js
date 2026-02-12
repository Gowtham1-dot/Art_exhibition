"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import API from "../../lib/api";
import Navbar from "../../components/Navbar";
import { getStoredToken } from "../../lib/auth";

export default function UploadPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [style, setStyle] = useState("");
  const [medium, setMedium] = useState("");
  const [colors, setColors] = useState("");
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [isAuthed] = useState(() => {
    const token = getStoredToken();
    return String(token).split(".").length === 3;
  });

  useEffect(() => {
    if (isAuthed) return;
    window.alert("Please login to upload artworks.");
    router.replace("/login");
  }, [isAuthed, router]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isAuthed) {
      setError("Please login to upload artworks.");
      return;
    }

    if (!image) {
      setError("Please select an image.");
      return;
    }

    const data = new FormData();
    data.append("title", title);
    data.append("artistName", artistName);
    data.append("description", description);
    data.append("tags", tags);
    data.append("style", style);
    data.append("medium", medium);
    data.append("colors", colors);
    data.append("image", image);

    try {
      setIsUploading(true);
      const res = await API.post("/artworks", data);
      void res;

      setToast("Upload successful. Your artwork is pending curator approval.");
      window.setTimeout(() => setToast(""), 3000);

      setTitle("");
      setArtistName("");
      setDescription("");
      setTags("");
      setStyle("");
      setMedium("");
      setColors("");
      setImage(null);
      setPreviewUrl("");
    } catch (err) {
      const data = err?.response?.data;
      const message =
        data?.message ||
        err?.message ||
        "Upload failed. Check the backend server and API URL.";

      const details = data?.details ? `\n\nDetails: ${data.details}` : "";
      setError(`${message}${details}`);
      // Helpful for debugging in DevTools
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 artt-animated-dark-bg bg-gradient-to-br from-black via-slate-950 to-black" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-60 artt-animated-dark-bg bg-gradient-to-tr from-rose-950 via-red-950 to-black" />
      <div className="pointer-events-none fixed -top-24 -left-24 -z-10 h-[26rem] w-[26rem] rounded-full blur-3xl opacity-25 artt-blob-a bg-gradient-to-tr from-red-500 to-rose-600" />
      <div className="pointer-events-none fixed -bottom-28 -right-28 -z-10 h-[30rem] w-[30rem] rounded-full blur-3xl opacity-20 artt-blob-b bg-gradient-to-tr from-rose-500 to-red-700" />

      <Navbar />
      {toast ? (
        <div className="fixed top-4 left-0 right-0 z-50 px-6">
          <div className="max-w-2xl mx-auto border border-green-300 bg-green-50 text-green-800 p-3 rounded-xl shadow-sm">
            {toast}
          </div>
        </div>
      ) : null}
      <main className="relative">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white/5 backdrop-blur rounded-2xl shadow-sm ring-1 ring-white/10 p-6">
            <h1 className="text-2xl font-bold text-white">Upload Artwork</h1>
            <p className="text-sm text-slate-300 mt-1">
              Add metadata so the AI curator can analyze and curate your work.
            </p>

            {!isAuthed ? (
              <div className="mt-4 bg-white/5 ring-1 ring-white/10 rounded-xl p-4 text-slate-200">
                Please{" "}
                <a className="underline" href="/login">
                  login
                </a>{" "}
                to upload.
              </div>
            ) : null}

            <form onSubmit={submit} className="mt-6 space-y-4">
              {error ? (
                <div className="border border-red-300 bg-red-50 text-red-800 p-3 rounded-xl">
                  {error}
                </div>
              ) : null}

              <div className="grid gap-2 border rounded-xl p-4 bg-white/5 ring-1 ring-white/10">
                <label className="text-sm font-medium text-white">Image</label>
                <input
                  className="border rounded-lg p-2 bg-white/10 text-white border-white/15 file:text-white file:bg-white/10 file:border-0 file:rounded-md file:px-3 file:py-1"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setImage(file);
                    setPreviewUrl(file ? URL.createObjectURL(file) : "");
                  }}
                />
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    width={1200}
                    height={900}
                    unoptimized
                    className="w-full h-auto rounded-xl border border-white/10"
                  />
                ) : null}
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-white">Title</label>
                <input
                  className="border rounded-lg p-2 bg-white/10 text-white border-white/15 placeholder:text-slate-400"
                  placeholder="e.g., Neon Reverie"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-white">
                  Artist Name
                </label>
                <input
                  className="border rounded-lg p-2 bg-white/10 text-white border-white/15 placeholder:text-slate-400"
                  placeholder="e.g., Baswa"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-white">
                  Description
                </label>
                <textarea
                  className="border rounded-lg p-2 min-h-28 bg-white/10 text-white border-white/15 placeholder:text-slate-400"
                  placeholder="What is this artwork about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-white">
                  Tags (comma-separated)
                </label>
                <input
                  className="border rounded-lg p-2 bg-white/10 text-white border-white/15 placeholder:text-slate-400"
                  placeholder="e.g., surreal, dreamlike, neon"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-white">
                    Style
                  </label>
                  <input
                    className="border rounded-lg p-2 bg-white/10 text-white border-white/15 placeholder:text-slate-400"
                    placeholder="e.g., Generative"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-white">
                    Medium
                  </label>
                  <input
                    className="border rounded-lg p-2 bg-white/10 text-white border-white/15 placeholder:text-slate-400"
                    placeholder="e.g., Digital"
                    value={medium}
                    onChange={(e) => setMedium(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-white">
                  Colors (comma-separated)
                </label>
                <input
                  className="border rounded-lg p-2 bg-white/10 text-white border-white/15 placeholder:text-slate-400"
                  placeholder="e.g., cyan, magenta, black"
                  value={colors}
                  onChange={(e) => setColors(e.target.value)}
                />
              </div>

              <button
                className="rounded-lg px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={isUploading || !isAuthed}
              >
                {isUploading ? "Uploading..." : "Upload"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
