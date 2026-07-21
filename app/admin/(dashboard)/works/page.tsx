"use client";

import { useEffect, useRef, useState } from "react";
import type { DbService, ServiceWork } from "@/lib/supabase/types";

export default function AdminWorksPage() {
  const [services, setServices] = useState<DbService[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [works, setWorks] = useState<ServiceWork[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingWorks, setLoadingWorks] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (e.target) e.target.value = "";
    if (files.length === 0 || !selectedId) return;

    setUploading(true);
    setUploadError("");

    let nextOrder = works.length;
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "works");

      const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const uploadData = await uploadRes.json();

      if (uploadData.error) {
        setUploadError(uploadData.error);
        continue;
      }

      const res = await fetch("/api/admin/works", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: selectedId,
          image_url: uploadData.url,
          display_order: nextOrder,
        }),
      });
      const data = await res.json();
      if (!data.error) {
        setWorks((prev) => [...prev, data]);
        nextOrder += 1;
      } else {
        setUploadError(data.error);
      }
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this photo?")) return;
    setDeletingId(id);
    await fetch(`/api/admin/works/${id}`, { method: "DELETE" });
    setWorks((prev) => prev.filter((w) => w.id !== id));
    setDeletingId(null);
  };

  return (
    <div className="p-8 md:p-10 max-w-[1100px]">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Header */}
      <div className="mb-8 fade-up">
        <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-1">Admin</p>
        <h1 className="font-serif text-[2.5rem] font-light text-ink leading-none">
          Works<span className="italic">.</span>
        </h1>
      </div>

      {uploadError && (
        <p className="font-sans text-[12px] text-red-400 mb-4">{uploadError}</p>
      )}

      {/* Service selector */}
      {loadingServices ? (
        <div className="font-sans text-[12px] text-ink/40">Loading…</div>
      ) : services.length === 0 ? (
        <div className="font-sans text-[13px] text-ink/50">No services found.</div>
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
            {loadingWorks ? (
              <div className="font-sans text-[12px] text-ink/30 py-12">Loading…</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 fade-up">
                {works.map((work) => (
                  <div key={work.id} className="group relative bg-mist">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={work.image_url}
                      alt=""
                      className="w-full aspect-[3/4] object-cover"
                    />
                    {/* Delete overlay */}
                    <div
                      className={`absolute inset-0 bg-ink/0 transition-all duration-300 flex items-center justify-center ${
                        deletingId === work.id ? "bg-ink/40" : "group-hover:bg-ink/40"
                      }`}
                    >
                      {deletingId === work.id ? (
                        <span className="w-4 h-4 rounded-full border border-paper/30 border-t-paper animate-spin" />
                      ) : (
                        <button
                          onClick={() => handleDelete(work.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-paper text-ink font-sans text-[10px] tracking-widest uppercase px-4 py-2 hover:bg-red-50 hover:text-red-500"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add tile */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="aspect-[3/4] flex flex-col items-center justify-center gap-2 border border-dashed border-ink/20 text-ink/40 hover:border-ink/40 hover:text-ink transition-colors disabled:opacity-40"
                >
                  {uploading ? (
                    <span className="w-4 h-4 rounded-full border border-ink/25 border-t-ink animate-spin" />
                  ) : (
                    <>
                      <span className="text-[28px] font-light leading-none">+</span>
                      <span className="font-sans text-[10px] tracking-widest uppercase">Add Photo</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
