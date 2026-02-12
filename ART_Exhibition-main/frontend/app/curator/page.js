"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../../lib/api";
import Navbar from "../../components/Navbar";
import ArtworkCard from "../../components/ArtworkCard";
import { decodeJwtPayload } from "../../lib/auth";

const JWT_STORAGE_KEY = "curator_jwt";

export default function CuratorPage() {
  const [pin, setPin] = useState("");
  const [jwt, setJwt] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [pendingArtworks, setPendingArtworks] = useState([]);
  const [approvedArtworks, setApprovedArtworks] = useState([]);
  const [artworksLoading, setArtworksLoading] = useState(false);
  const [approvedArtworksLoading, setApprovedArtworksLoading] = useState(false);
  const [artworkError, setArtworkError] = useState("");

  const [publishedExhibitions, setPublishedExhibitions] = useState([]);
  const [exhibitionsLoading, setExhibitionsLoading] = useState(false);
  const [exhibitionError, setExhibitionError] = useState("");

  const [generating, setGenerating] = useState(false);

  const [approvingArtworkId, setApprovingArtworkId] = useState(null);
  const [rejectingArtworkId, setRejectingArtworkId] = useState(null);
  const [deletingArtworkId, setDeletingArtworkId] = useState(null);

  const [approvingSuggestionId, setApprovingSuggestionId] = useState(null);
  const [deletingSuggestionId, setDeletingSuggestionId] = useState(null);

  const [selectedSuggestionId, setSelectedSuggestionId] = useState(null);
  const [selectedDraftId, setSelectedDraftId] = useState(null);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [draftDetailLoading, setDraftDetailLoading] = useState(false);

  const [draftTitle, setDraftTitle] = useState("");
  const [draftStatement, setDraftStatement] = useState("");
  const [draftArtworks, setDraftArtworks] = useState([]);
  const [draftSaving, setDraftSaving] = useState(false);

  const [draftImageUploadingArtworkId, setDraftImageUploadingArtworkId] =
    useState(null);

  const [publishingId, setPublishingId] = useState(null);
  const [unpublishingId, setUnpublishingId] = useState(null);

  const normalizedJwt = jwt.trim();
  const isAuthed = normalizedJwt.split(".").length === 3;
  const role = useMemo(() => {
    const payload = decodeJwtPayload(normalizedJwt);
    return payload?.role || "";
  }, [normalizedJwt]);

  const isCurator = isAuthed && role === "curator";

  const authHeaders = useMemo(() => {
    if (!isCurator) return null;
    return { Authorization: `Bearer ${normalizedJwt}` };
  }, [isCurator, normalizedJwt]);

  const publishedExhibitionIdSet = useMemo(() => {
    const set = new Set();
    for (const ex of publishedExhibitions || []) {
      if (ex?._id) set.add(String(ex._id));
    }
    return set;
  }, [publishedExhibitions]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(JWT_STORAGE_KEY);
      if (saved) setJwt(saved);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  async function login() {
    setAuthError("");
    setError("");
    setAuthLoading(true);

    try {
      const res = await API.post("/curator/auth/pin", {
        pin: pin.trim(),
      });
      const token = res?.data?.token;
      if (!token) throw new Error("Missing token");

      setJwt(token);
      try {
        localStorage.setItem(JWT_STORAGE_KEY, token);
      } catch {
        // ignore
      }

      setPin("");
    } catch (err) {
      setAuthError(
        err?.response?.data?.message || err?.message || "Failed to sign in"
      );
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    setJwt("");
    try {
      localStorage.removeItem(JWT_STORAGE_KEY);
    } catch {
      // ignore
    }

    setSelectedSuggestionId(null);
    setSelectedDraftId(null);
    setSelectedDraft(null);
    setDraftTitle("");
    setDraftStatement("");
    setDraftArtworks([]);

    setSuggestions([]);
    setPendingArtworks([]);
    setApprovedArtworks([]);
    setPublishedExhibitions([]);

    setError("");
    setAuthError("");
  }

  const reloadSuggestions = useCallback(async () => {
    if (!authHeaders) return;

    setLoadingSuggestions(true);
    setError("");

    try {
      const res = await API.get("/curator/ai-suggestions", {
        headers: authHeaders,
      });
      setSuggestions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load suggestions"
      );
    } finally {
      setLoadingSuggestions(false);
    }
  }, [authHeaders]);

  const reloadPendingArtworks = useCallback(async () => {
    if (!authHeaders) return;

    setArtworksLoading(true);
    setArtworkError("");

    try {
      const res = await API.get("/curator/artworks", {
        params: { status: "pending", limit: 60 },
        headers: authHeaders,
      });
      setPendingArtworks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setArtworkError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load artworks"
      );
    } finally {
      setArtworksLoading(false);
    }
  }, [authHeaders]);

  const reloadApprovedArtworks = useCallback(async () => {
    if (!authHeaders) return;

    setApprovedArtworksLoading(true);
    setArtworkError("");

    try {
      const res = await API.get("/curator/artworks", {
        params: { status: "approved", limit: 60 },
        headers: authHeaders,
      });
      setApprovedArtworks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setArtworkError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load artworks"
      );
    } finally {
      setApprovedArtworksLoading(false);
    }
  }, [authHeaders]);

  const reloadPublishedExhibitions = useCallback(async () => {
    if (!authHeaders) return;

    setExhibitionsLoading(true);
    setExhibitionError("");

    try {
      const res = await API.get("/curator/exhibitions", {
        params: { published: "true", limit: 50 },
        headers: authHeaders,
      });
      setPublishedExhibitions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setExhibitionError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load exhibitions"
      );
    } finally {
      setExhibitionsLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (!isCurator) return;

    reloadSuggestions().catch(() => {});
    reloadPendingArtworks().catch(() => {});
    reloadApprovedArtworks().catch(() => {});
    reloadPublishedExhibitions().catch(() => {});
  }, [
    isCurator,
    reloadSuggestions,
    reloadPendingArtworks,
    reloadApprovedArtworks,
    reloadPublishedExhibitions,
  ]);

  async function generateSuggestions() {
    setError("");
    setGenerating(true);

    try {
      await API.post("/exhibitions/generate");
      await reloadSuggestions();
      setToast("AI suggestions generated.");
    } catch (err) {
      const serverMessage = String(
        err?.response?.data?.message || err?.message || ""
      );

      if (/not\s+enough\s+approved\s+artworks/i.test(serverMessage)) {
        setError(
          "Not enough approved artworks to generate suggestions. Approve at least 2 artworks first (Curator → Pending Artworks → Approve)."
        );
      } else {
        setError(serverMessage || "Failed to generate");
      }
    } finally {
      setGenerating(false);
    }
  }

  async function approveArtwork(artworkId) {
    if (!authHeaders) return;

    setArtworkError("");
    setApprovingArtworkId(artworkId);

    try {
      await API.post(`/curator/artworks/${artworkId}/approve`, null, {
        headers: authHeaders,
      });
      await reloadPendingArtworks();
      await reloadApprovedArtworks();
    } catch (err) {
      setArtworkError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to approve artwork"
      );
    } finally {
      setApprovingArtworkId(null);
    }
  }

  async function rejectArtwork(artworkId) {
    if (!authHeaders) return;

    setArtworkError("");
    setRejectingArtworkId(artworkId);

    try {
      await API.post(`/curator/artworks/${artworkId}/reject`, null, {
        headers: authHeaders,
      });
      await reloadPendingArtworks();
    } catch (err) {
      setArtworkError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to reject artwork"
      );
    } finally {
      setRejectingArtworkId(null);
    }
  }

  async function deleteArtwork(artworkId) {
    if (!authHeaders) return;

    setArtworkError("");
    setDeletingArtworkId(artworkId);

    try {
      await API.delete(`/curator/artworks/${artworkId}`, {
        headers: authHeaders,
      });
      await reloadPendingArtworks();
      await reloadApprovedArtworks();
    } catch (err) {
      setArtworkError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete artwork"
      );
    } finally {
      setDeletingArtworkId(null);
    }
  }

  async function removeSuggestion(suggestionId) {
    if (!authHeaders) return;

    setError("");
    setDeletingSuggestionId(suggestionId);

    try {
      await API.delete(`/curator/ai-suggestions/${suggestionId}`, {
        headers: authHeaders,
      });
      if (selectedSuggestionId === suggestionId) {
        setSelectedSuggestionId(null);
        setSelectedDraftId(null);
        setSelectedDraft(null);
        setDraftTitle("");
        setDraftStatement("");
        setDraftArtworks([]);
      }
      await reloadSuggestions();
      await reloadPublishedExhibitions();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to remove suggestion"
      );
    } finally {
      setDeletingSuggestionId(null);
    }
  }

  async function loadDraftDetail(exhibitionId) {
    if (!authHeaders) return;

    setDraftDetailLoading(true);
    setError("");

    try {
      const res = await API.get(`/curator/exhibitions/${exhibitionId}`, {
        headers: authHeaders,
      });
      setSelectedDraft(res.data);
      setDraftTitle(String(res?.data?.themeTitle || ""));
      setDraftStatement(String(res?.data?.curatorialStatement || ""));
      setDraftArtworks(
        Array.isArray(res?.data?.artworkIds) ? res.data.artworkIds : []
      );
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to load draft"
      );
    } finally {
      setDraftDetailLoading(false);
    }
  }

  function moveDraftArtwork(artworkId, direction) {
    setDraftArtworks((prev) => {
      const items = Array.isArray(prev) ? [...prev] : [];
      const idx = items.findIndex((a) => String(a?._id) === String(artworkId));
      if (idx === -1) return prev;

      const nextIdx = direction === "up" ? idx - 1 : idx + 1;
      if (nextIdx < 0 || nextIdx >= items.length) return prev;

      const temp = items[idx];
      items[idx] = items[nextIdx];
      items[nextIdx] = temp;
      return items;
    });
  }

  function removeDraftArtwork(artworkId) {
    setDraftArtworks((prev) => {
      const items = Array.isArray(prev) ? prev : [];
      return items.filter((a) => String(a?._id) !== String(artworkId));
    });
  }

  async function saveDraft() {
    if (!authHeaders || !selectedDraftId) return;

    setError("");
    setDraftSaving(true);

    try {
      const artworkIds = (draftArtworks || [])
        .map((a) => String(a?._id))
        .filter(Boolean);
      await API.put(
        `/curator/exhibitions/${selectedDraftId}`,
        {
          themeTitle: draftTitle,
          curatorialStatement: draftStatement,
          artworkIds,
        },
        { headers: authHeaders }
      );

      await loadDraftDetail(selectedDraftId);
      setToast("Draft saved.");
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to save draft"
      );
    } finally {
      setDraftSaving(false);
    }
  }

  async function replaceArtworkImage(artworkId, file) {
    if (!authHeaders || !selectedDraftId) return;
    if (!file) return;

    setError("");
    setDraftImageUploadingArtworkId(artworkId);

    try {
      const form = new FormData();
      form.append("image", file);

      const res = await API.post(
        `/curator/exhibitions/${selectedDraftId}/artworks/${artworkId}/image`,
        form,
        {
          headers: {
            ...authHeaders,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updated = res?.data;
      setDraftArtworks((prev) => {
        const items = Array.isArray(prev) ? [...prev] : [];
        const idx = items.findIndex(
          (a) => String(a?._id) === String(artworkId)
        );
        if (idx === -1) return prev;
        items[idx] = { ...items[idx], ...updated };
        return items;
      });

      setToast("Image updated successfully.");
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to upload image"
      );
    } finally {
      setDraftImageUploadingArtworkId(null);
    }
  }

  async function publish(exhibitionId) {
    if (!authHeaders) return;

    setError("");
    setPublishingId(exhibitionId);

    try {
      await API.post(
        "/curator/exhibitions/publish",
        { exhibitionId },
        { headers: authHeaders }
      );

      await reloadPublishedExhibitions();
      await reloadSuggestions();

      setSelectedSuggestionId(null);
      setSelectedDraftId(null);
      setSelectedDraft(null);
      setDraftTitle("");
      setDraftStatement("");
      setDraftArtworks([]);

      setToast("Exhibition published.");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to publish exhibition"
      );
    } finally {
      setPublishingId(null);
    }
  }

  async function unpublish(exhibitionId) {
    if (!authHeaders) return;

    setExhibitionError("");
    setUnpublishingId(exhibitionId);

    try {
      await API.post(`/curator/exhibitions/${exhibitionId}/unpublish`, null, {
        headers: authHeaders,
      });
      await reloadPublishedExhibitions();
      setToast("Exhibition unpublished.");
    } catch (err) {
      setExhibitionError(
        err?.response?.data?.message || err?.message || "Failed to unpublish"
      );
    } finally {
      setUnpublishingId(null);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 artt-animated-dark-bg bg-gradient-to-br from-slate-950 via-sky-950 to-amber-950" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-60 artt-animated-dark-bg bg-gradient-to-tr from-indigo-950 via-emerald-950 to-slate-950" />
      <div className="pointer-events-none fixed -top-24 -left-24 -z-10 h-[26rem] w-[26rem] rounded-full blur-3xl opacity-25 artt-blob-a bg-gradient-to-tr from-sky-400 to-amber-400" />
      <div className="pointer-events-none fixed -bottom-28 -right-28 -z-10 h-[30rem] w-[30rem] rounded-full blur-3xl opacity-20 artt-blob-b bg-gradient-to-tr from-indigo-500 to-cyan-400" />

      <Navbar />

      {toast ? (
        <div className="fixed top-16 left-0 right-0 z-50">
          <div className="max-w-5xl mx-auto px-6">
            <div className="border border-green-300 bg-green-50 text-green-800 p-3 rounded">
              {toast}
            </div>
          </div>
        </div>
      ) : null}

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-6 relative text-slate-100">
        <h1 className="text-2xl font-bold">Curator Dashboard</h1>

        <div className="border rounded p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="font-semibold">Curator Access</div>
            {isAuthed ? (
              <button
                className="border border-red-300 bg-red-50 text-red-800 rounded px-2 py-1 text-sm cursor-pointer hover:bg-red-100 hover:border-red-400 disabled:opacity-60 disabled:cursor-not-allowed"
                type="button"
                onClick={logout}
              >
                Log out
              </button>
            ) : null}
          </div>

          {!isAuthed ? (
            <>
              <div className="grid gap-2">
                <label className="text-sm font-medium">PIN</label>
                <input
                  className="border rounded px-3 py-2"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter curator PIN"
                  type="password"
                />
              </div>

              <button
                className="border rounded px-3 py-2"
                type="button"
                onClick={login}
                disabled={authLoading}
              >
                {authLoading ? "Signing in…" : "Sign in"}
              </button>

              {authError ? (
                <div className="border border-red-300 bg-red-50 text-red-800 p-3 rounded">
                  {authError}
                </div>
              ) : null}

              <p className="text-xs text-slate-300">
                Sign in with a short PIN (server returns a JWT).
              </p>
            </>
          ) : isCurator ? (
            <div className="text-xs text-slate-300">Signed in as curator.</div>
          ) : (
            <div className="text-xs text-slate-300">
              Curator access required.
            </div>
          )}
        </div>

        {!isCurator ? (
          <div className="text-sm text-slate-300">
            Sign in to review artworks and publish exhibitions.
          </div>
        ) : (
          <>
            {error ? (
              <div className="border border-red-300 bg-red-50 text-red-800 p-3 rounded">
                {error}
              </div>
            ) : null}

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">AI Suggestions</h2>
                <button
                  className="border border-green-300 bg-green-50 text-green-800 rounded px-2 py-1 text-sm cursor-pointer hover:bg-green-100 hover:border-green-400 disabled:opacity-60 disabled:cursor-not-allowed"
                  type="button"
                  disabled={generating}
                  onClick={generateSuggestions}
                >
                  {generating ? "Generating…" : "Generate"}
                </button>
              </div>

              {loadingSuggestions ? (
                <div className="text-sm text-slate-300">
                  Loading suggestions…
                </div>
              ) : null}

              {!loadingSuggestions && suggestions.length === 0 ? (
                <div className="text-sm text-slate-300">
                  No suggestions available.
                </div>
              ) : null}

              {suggestions.map((s) => (
                <div key={s._id} className="space-y-3">
                  <div className="border p-4 rounded space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{s.themeTitle}</h3>
                        <div className="text-sm text-slate-200 whitespace-pre-wrap">
                          {s.curatorialStatement}
                        </div>
                        <div className="text-xs text-slate-300">
                          Confidence: {String(s.confidenceScore)}
                        </div>
                        {s.approved && s.exhibitionId ? (
                          <div className="text-xs text-slate-300">
                            Draft created. Ready to review/edit and publish.
                          </div>
                        ) : null}
                      </div>

                      <div className="flex gap-2">
                        <button
                          className="border border-green-300 bg-green-50 text-green-800 rounded px-2 py-1 text-sm cursor-pointer hover:bg-green-100 hover:border-green-400 disabled:opacity-60 disabled:cursor-not-allowed"
                          type="button"
                          disabled={approvingSuggestionId === s._id}
                          onClick={async () => {
                            setError("");
                            setApprovingSuggestionId(s._id);

                            try {
                              let exhibitionId = s.exhibitionId;

                              // If a draft doesn't exist yet, create it first.
                              if (!s.approved || !exhibitionId) {
                                const res = await API.post(
                                  `/curator/ai-suggestions/${s._id}/approve`,
                                  null,
                                  { headers: authHeaders }
                                );
                                exhibitionId =
                                  res?.data?.suggestion?.exhibitionId ||
                                  res?.data?.exhibition?._id;
                                await reloadSuggestions();
                              }

                              if (!exhibitionId) {
                                throw new Error(
                                  "Draft exhibition was not created"
                                );
                              }

                              setSelectedSuggestionId(s._id);
                              setSelectedDraftId(String(exhibitionId));
                              await loadDraftDetail(String(exhibitionId));
                            } catch (err) {
                              setError(
                                err?.response?.data?.message ||
                                  err?.message ||
                                  "Failed to open draft"
                              );
                            } finally {
                              setApprovingSuggestionId(null);
                            }
                          }}
                        >
                          {approvingSuggestionId === s._id
                            ? "Opening…"
                            : "Review / Edit"}
                        </button>
                      </div>
                    </div>

                    {(() => {
                      const isPublished =
                        !!s?.exhibitionId &&
                        publishedExhibitionIdSet.has(String(s.exhibitionId));

                      if (!s.reasoning) {
                        return isPublished ? (
                          <div className="inline-flex items-center border border-green-300 bg-green-50 text-green-800 text-xs px-2 py-1 rounded">
                            Published
                          </div>
                        ) : null;
                      }

                      return (
                        <div className="flex items-start gap-2">
                          <details className="space-y-2">
                            <summary className="inline-flex items-center border border-blue-300 bg-blue-50 text-blue-800 text-xs px-3 py-1 rounded cursor-pointer select-none">
                              Reasoning
                            </summary>
                            <p className="text-sm whitespace-pre-wrap">
                              {s.reasoning}
                            </p>
                          </details>

                          {isPublished ? (
                            <span className="inline-flex items-center border border-green-300 bg-green-50 text-green-800 text-xs px-2 py-1 rounded">
                              Published
                            </span>
                          ) : null}
                        </div>
                      );
                    })()}
                  </div>

                  {selectedSuggestionId === s._id ? (
                    <div className="border p-4 rounded space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="font-semibold">Draft Review</h4>
                        <div className="flex gap-2">
                          <button
                            className="border border-red-300 bg-red-50 text-red-800 rounded px-3 py-1 cursor-pointer hover:bg-red-100 hover:border-red-400 disabled:opacity-60 disabled:cursor-not-allowed"
                            type="button"
                            disabled={deletingSuggestionId === s._id}
                            onClick={async () => {
                              if (
                                !window.confirm(
                                  "Delete this AI suggestion? If it created a draft exhibition, that draft will also be deleted (unless it is already published)."
                                )
                              ) {
                                return;
                              }

                              setError("");
                              setDeletingSuggestionId(s._id);

                              try {
                                await removeSuggestion(s._id);
                                setSelectedSuggestionId(null);
                                setSelectedDraftId(null);
                                setSelectedDraft(null);
                                setDraftTitle("");
                                setDraftStatement("");
                                setDraftArtworks([]);
                                setToast("Suggestion deleted.");
                              } catch (err) {
                                setError(
                                  err?.response?.data?.message ||
                                    err?.message ||
                                    "Failed to delete suggestion"
                                );
                              } finally {
                                setDeletingSuggestionId(null);
                              }
                            }}
                          >
                            {deletingSuggestionId === s._id
                              ? "Deleting…"
                              : "Delete"}
                          </button>

                          <button
                            className="border rounded px-3 py-1"
                            type="button"
                            onClick={() => {
                              setSelectedSuggestionId(null);
                              setSelectedDraftId(null);
                              setSelectedDraft(null);
                              setDraftTitle("");
                              setDraftStatement("");
                              setDraftArtworks([]);
                            }}
                          >
                            Close
                          </button>
                        </div>
                      </div>

                      {draftDetailLoading || !selectedDraft ? (
                        <div className="text-sm text-slate-300">
                          Loading draft details…
                        </div>
                      ) : (
                        <>
                          <div className="grid gap-2">
                            <label className="text-sm font-medium">Title</label>
                            <input
                              className="border rounded px-3 py-2"
                              value={draftTitle}
                              onChange={(e) => setDraftTitle(e.target.value)}
                            />
                          </div>

                          <div className="grid gap-2">
                            <label className="text-sm font-medium">
                              Description
                            </label>
                            <textarea
                              className="border rounded px-3 py-2 min-h-[120px]"
                              value={draftStatement}
                              onChange={(e) =>
                                setDraftStatement(e.target.value)
                              }
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              className="border rounded px-3 py-2"
                              type="button"
                              disabled={draftSaving}
                              onClick={saveDraft}
                            >
                              {draftSaving ? "Saving…" : "Save changes"}
                            </button>

                            <button
                              className="border rounded px-3 py-2"
                              type="button"
                              disabled={
                                !selectedDraftId ||
                                publishingId === selectedDraftId
                              }
                              onClick={() => publish(selectedDraftId)}
                            >
                              {publishingId === selectedDraftId
                                ? "Publishing…"
                                : "Publish"}
                            </button>
                          </div>

                          <div className="space-y-2">
                            <div className="font-medium">Images</div>
                            <div className="grid grid-cols-3 gap-4">
                              {(draftArtworks || []).map((a, idx) => (
                                <div key={a._id} className="space-y-2">
                                  <ArtworkCard artwork={a} />

                                  <div className="flex gap-2">
                                    <button
                                      className="border rounded px-2 py-1"
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() =>
                                        moveDraftArtwork(a._id, "up")
                                      }
                                    >
                                      Up
                                    </button>
                                    <button
                                      className="border rounded px-2 py-1"
                                      type="button"
                                      disabled={
                                        idx === draftArtworks.length - 1
                                      }
                                      onClick={() =>
                                        moveDraftArtwork(a._id, "down")
                                      }
                                    >
                                      Down
                                    </button>
                                    <button
                                      className="border rounded px-2 py-1"
                                      type="button"
                                      onClick={() => removeDraftArtwork(a._id)}
                                    >
                                      Remove
                                    </button>
                                  </div>

                                  <input
                                    type="file"
                                    accept="image/*"
                                    disabled={
                                      draftImageUploadingArtworkId === a._id
                                    }
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      replaceArtworkImage(a._id, file);
                                    }}
                                  />

                                  <div className="text-xs text-slate-300">
                                    {draftImageUploadingArtworkId === a._id
                                      ? "Uploading…"
                                      : "Replace image"}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <p className="text-xs text-slate-300">
                            Reordering/removing is applied when you click “Save
                            changes”.
                          </p>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Pending Artworks</h2>

              {artworkError ? (
                <div className="border border-red-300 bg-red-50 text-red-800 p-3 rounded">
                  {artworkError}
                </div>
              ) : null}

              {artworksLoading ? (
                <div className="text-sm text-slate-300">Loading artworks…</div>
              ) : null}

              {!artworksLoading &&
              !artworkError &&
              pendingArtworks.length === 0 ? (
                <div className="text-sm text-slate-300">
                  No pending artworks.
                </div>
              ) : null}

              <div className="grid grid-cols-3 gap-4">
                {pendingArtworks.map((a) => (
                  <div key={a._id} className="space-y-2">
                    <ArtworkCard artwork={a} />
                    <div className="flex gap-2">
                      <button
                        className="border rounded px-3 py-1"
                        type="button"
                        disabled={approvingArtworkId === a._id}
                        onClick={() => approveArtwork(a._id)}
                      >
                        {approvingArtworkId === a._id
                          ? "Approving…"
                          : "Approve"}
                      </button>
                      <button
                        className="border rounded px-3 py-1"
                        type="button"
                        disabled={rejectingArtworkId === a._id}
                        onClick={() => rejectArtwork(a._id)}
                      >
                        {rejectingArtworkId === a._id ? "Rejecting…" : "Reject"}
                      </button>
                      <button
                        className="border border-red-300 bg-red-50 text-red-800 rounded px-3 py-1 cursor-pointer hover:bg-red-100 hover:border-red-400 disabled:opacity-60 disabled:cursor-not-allowed"
                        type="button"
                        disabled={deletingArtworkId === a._id}
                        onClick={() => {
                          if (!window.confirm("Delete this artwork?")) return;
                          deleteArtwork(a._id);
                        }}
                      >
                        {deletingArtworkId === a._id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Approved Artworks</h2>

              {approvedArtworksLoading ? (
                <div className="text-sm text-slate-300">
                  Loading approved artworks…
                </div>
              ) : null}

              {!approvedArtworksLoading && approvedArtworks.length === 0 ? (
                <div className="text-sm text-slate-300">
                  No approved artworks.
                </div>
              ) : null}

              <div className="grid grid-cols-3 gap-4">
                {approvedArtworks.map((a) => (
                  <div key={a._id} className="space-y-2">
                    <ArtworkCard artwork={a} />
                    <div className="flex gap-2">
                      <button
                        className="border border-red-300 bg-red-50 text-red-800 rounded px-3 py-1 cursor-pointer hover:bg-red-100 hover:border-red-400 disabled:opacity-60 disabled:cursor-not-allowed"
                        type="button"
                        disabled={deletingArtworkId === a._id}
                        onClick={() => {
                          if (!window.confirm("Delete this artwork?")) return;
                          deleteArtwork(a._id);
                        }}
                      >
                        {deletingArtworkId === a._id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Published Exhibitions</h2>

              {exhibitionError ? (
                <div className="border border-red-300 bg-red-50 text-red-800 p-3 rounded">
                  {exhibitionError}
                </div>
              ) : null}

              {exhibitionsLoading ? (
                <div className="text-sm text-slate-300">
                  Loading exhibitions…
                </div>
              ) : null}

              {!exhibitionsLoading &&
              !exhibitionError &&
              publishedExhibitions.length === 0 ? (
                <div className="text-sm text-slate-300">
                  No published exhibitions.
                </div>
              ) : null}

              {publishedExhibitions.map((ex) => (
                <div key={ex._id} className="border p-4 rounded space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-semibold">{ex.themeTitle}</div>
                      <div className="text-sm text-slate-200 whitespace-pre-wrap">
                        {ex.curatorialStatement}
                      </div>
                      <a
                        className="text-xs underline"
                        href={`/exhibition/${ex._id}`}
                      >
                        View public page
                      </a>
                    </div>

                    <button
                      className="border border-red-300 bg-red-50 text-red-800 rounded px-3 py-1 cursor-pointer hover:bg-red-100 hover:border-red-400 disabled:opacity-60 disabled:cursor-not-allowed"
                      type="button"
                      disabled={unpublishingId === ex._id}
                      onClick={() => unpublish(ex._id)}
                    >
                      {unpublishingId === ex._id
                        ? "Unpublishing…"
                        : "Unpublish"}
                    </button>
                  </div>
                  <p className="text-xs text-slate-300">
                    Unpublishing removes it from the public gallery.
                  </p>
                </div>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
