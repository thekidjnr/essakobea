"use client";

import { useEffect, useState } from "react";
import type { DbService, ServiceWork } from "@/lib/supabase/types";
import ImageUpload from "@/components/admin/ImageUpload";

export default function AdminWorksPage() {
  const [services, setServices] = useState<DbService[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [works, setWorks] = useState<ServiceWork[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingWorks, setLoadingWorks] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load services
  useEffect(() => {
    fetch("/api/admin/services")
      .then((r) => r.json())
      .then((data: DbService[]) => {
        setServices(data);
        if (data.length > 0) setSelectedId(data[0].id);
        setLoadingServices(false);
      });
  }, []);

  // Load works when service changes
  useEffect(() => {
    if (!selectedId) return;
    setLoadingWorks(true);
    fetch(`/api/admin/works?service_id=${selectedId}`)
      .then((r) => r.json())
      .then((data: ServiceWork[]) => {
        setWorks(data);
        setLoadingWorks(false);
      });
  }, [selectedId]);

  const handleAdd = async () => {
    if (!newImageUrl || !selectedId) return;
    setSaving(true);
    const res = await fetch("/api/admin/works", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: selectedId,
        image_url: newImageUrl,
        caption: newCaption.trim() || null,
        display_order: works.length,
      }),
    });
    const data = await res.json();
    if (!data.error) {
      setWorks((prev) => [...prev, data]);
      setNewImageUrl("");
      setNewCaption("");
      setShowUpload(false);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this photo?")) return;
    setDeletingId(id);
    await fetch(`/api/admin/works/${id}`, { method: "DELETE" });
    setWorks((prev) => prev.filter((w) => w.id !== id));
    setDeletingId(null);
  };

  const selectedService = services.find((s) => s.id === selectedId);

  return (
    <div className="p-8 md:p-10 max-w-[1100px]">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-1">Admin</p>
          <h1 className="font-serif text-[2.5rem] font-light text-ink leading-none">
            Works<span className="italic">.</span>
          </h1>
          <p className="font-sans text-[13px] text-ink/40 mt-2">
            Portfolio photos per service
          </p>
        </div>
        {selectedId && (
          <button
            onClick={() => { setShowUpload(true); setNewImageUrl(""); setNewCaption(""); }}
            className="bg-ink text-paper font-sans text-[11px] tracking-widest uppercase px-6 py-3 hover:bg-ink/80 transition-colors"
          >
            + Add Photo
          </button>
        )}
      </div>

      {/* Service selector */}
      {loadingServices ? (
        <div className="font-sans text-[12px] text-ink/40">Loading…</div>
      ) : services.length === 0 ? (
        <div className="font-sans text-[13px] text-ink/30">No services found.</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-8">
            {services.map((svc) => (
              <button
                key={svc.id}
                onClick={() => setSelectedId(svc.id)}
                className={`font-sans text-[11px] tracking-widest uppercase px-4 py-2 border transition-colors ${
                  svc.id === selectedId
                    ? "bg-ink text-paper border-ink"
                    : "text-ink/50 border-ink/15 hover:border-ink/40 hover:text-ink"
                }`}
              >
                {svc.name}
              </button>
            ))}
          </div>

          {/* Works grid */}
          <div>
            {/* Stats row */}
            <div className="flex items-center justify-between mb-5">
              <p className="font-sans text-[11px] text-ink/35">
                {loadingWorks
                  ? "Loading…"
                  : `${works.length} photo${works.length !== 1 ? "s" : ""} for ${selectedService?.name}`}
              </p>
              {selectedService && (
                <a
                  href={`/works/${selectedService.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-[10px] tracking-widest uppercase text-ink/35 hover:text-ink transition-colors"
                >
                  View page →
                </a>
              )}
            </div>

            {loadingWorks ? (
              <div className="font-sans text-[12px] text-ink/30 py-12">Loading…</div>
            ) : works.length === 0 ? (
              <div className="border border-dashed border-ink/15 py-20 text-center">
                <p className="font-sans text-[13px] text-ink/25">No photos yet.</p>
                <button
                  onClick={() => setShowUpload(true)}
                  className="mt-4 font-sans text-[11px] tracking-widest uppercase text-ink/40 hover:text-ink border border-ink/15 px-5 py-2.5 transition-colors"
                >
                  + Add First Photo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {works.map((work) => (
                  <div key={work.id} className="group relative bg-mist">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={work.image_url}
                      alt={work.caption ?? ""}
                      className="w-full aspect-[3/4] object-cover"
                    />
                    {work.caption && (
                      <div className="px-2 py-1.5 bg-paper border-t border-ink/[0.06]">
                        <p className="font-sans text-[10px] text-ink/50 truncate">{work.caption}</p>
                      </div>
                    )}
                    {/* Delete overlay */}
                    <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/40 transition-all duration-300 flex items-center justify-center">
                      <button
                        onClick={() => handleDelete(work.id)}
                        disabled={deletingId === work.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-paper text-ink font-sans text-[10px] tracking-widest uppercase px-4 py-2 hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                      >
                        {deletingId === work.id ? "…" : "Remove"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Photo Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 bg-ink/60 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-paper w-full max-w-[520px] my-12 p-8 relative">
            <button
              onClick={() => setShowUpload(false)}
              className="absolute top-5 right-5 font-sans text-[20px] text-ink/40 hover:text-ink leading-none"
            >
              ×
            </button>
            <h2 className="font-serif text-[1.5rem] font-light text-ink mb-1">
              Add Photo
            </h2>
            <p className="font-sans text-[11px] text-ink/35 mb-6">
              {selectedService?.name}
            </p>

            <div className="flex flex-col gap-5">
              <div>
                <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">
                  Photo *
                </label>
                <ImageUpload
                  value={newImageUrl}
                  onChange={setNewImageUrl}
                  folder="works"
                />
              </div>

              <div>
                <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">
                  Caption (optional)
                </label>
                <input
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="e.g. Closure wig install with baby hairs"
                  className="w-full border border-ink/15 px-3 py-2.5 font-sans text-[13px] text-ink focus:outline-none focus:border-ink bg-transparent"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleAdd}
                  disabled={!newImageUrl || saving}
                  className="flex-1 bg-ink text-paper font-sans text-[11px] tracking-widest uppercase py-4 hover:bg-ink/80 transition-colors disabled:opacity-40"
                >
                  {saving ? "Saving…" : "Add Photo"}
                </button>
                <button
                  onClick={() => setShowUpload(false)}
                  className="border border-ink/20 text-ink font-sans text-[11px] tracking-widest uppercase px-8 hover:bg-ink/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
