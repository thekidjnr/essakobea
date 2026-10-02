"use client";

import { useEffect, useRef, useState } from "react";
import type { DbService, ServiceWork } from "@/lib/supabase/types";
import {
  Page,
  PageHeader,
  Button,
  IconButton,
  Segmented,
  ErrorNote,
  Empty,
  Skeleton,
  ConfirmDialog,
  CloseIcon,
} from "@/components/admin/ui";

export default function AdminWorksPage() {
  const [services, setServices] = useState<DbService[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [works, setWorks] = useState<ServiceWork[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingWorks, setLoadingWorks] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load services
  useEffect(() => {
    fetch("/api/admin/services")
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok || !Array.isArray(data)) throw new Error(data?.error ?? "Could not load services.");
        setServices(data as DbService[]);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .catch((e: Error) => setError(e.message || "Could not load services."))
      .finally(() => setLoadingServices(false));
  }, []);

  // Load works when service changes
  useEffect(() => {
    if (!selectedId) return;
    setLoadingWorks(true);
    setWorks([]);
    fetch(`/api/admin/works?service_id=${selectedId}`)
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok || !Array.isArray(data)) throw new Error(data?.error ?? "Could not load photos.");
        setWorks(data as ServiceWork[]);
        setError("");
      })
      .catch((e: Error) => setError(e.message || "Could not load photos."))
      .finally(() => setLoadingWorks(false));
  }, [selectedId]);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (e.target) e.target.value = "";
    if (files.length === 0 || !selectedId) return;

    setUploading(true);
    setError("");

    let nextOrder = works.length;
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "works");

      const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: fd }).catch(() => null);
      const uploadData = uploadRes ? await uploadRes.json().catch(() => ({})) : {};

      if (!uploadRes?.ok || uploadData.error || !uploadData.url) {
        setError(uploadData.error ?? "Upload failed. Please try again.");
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
      }).catch(() => null);
      const data = res ? await res.json().catch(() => ({})) : {};
      if (res?.ok && !data.error) {
        setWorks((prev) => [...prev, data]);
        nextOrder += 1;
      } else {
        setError(data.error ?? "Could not save photo. Please try again.");
      }
    }
    setUploading(false);
  };

  const askDelete = (id: string) => {
    setRemoveError("");
    setConfirmId(id);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError("");
    setRemoveError("");
    const res = await fetch(`/api/admin/works/${id}`, { method: "DELETE" }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setDeletingId(null);
    if (!res?.ok) { setRemoveError(data.error ?? "Could not remove photo. Please try again."); return; }
    setWorks((prev) => prev.filter((w) => w.id !== id));
    setConfirmId(null);
  };

  const openPicker = () => fileInputRef.current?.click();
  const hasServices = !loadingServices && services.length > 0;

  return (
    <Page wide>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelected}
      />

      <PageHeader
        title="Works"
        subtitle={
          hasServices && !loadingWorks
            ? `${works.length} ${works.length === 1 ? "photo" : "photos"}`
            : undefined
        }
        actions={
          hasServices ? (
            <Button onClick={openPicker} disabled={uploading || !selectedId}>
              {uploading ? "Uploading…" : "Add photos"}
            </Button>
          ) : undefined
        }
      />

      <ErrorNote className="mb-4">{error}</ErrorNote>

      {loadingServices ? (
        <>
          <Skeleton className="h-11 w-full max-w-[520px] rounded-full mb-8" />
          <PhotoSkeletons />
        </>
      ) : services.length === 0 && error ? null : services.length === 0 ? (
        <Empty title="No services yet" />
      ) : (
        <>
          <Segmented
            options={services.map((s) => ({ value: s.id, label: s.name }))}
            value={selectedId}
            onChange={setSelectedId}
            className="mb-8"
          />

          {loadingWorks ? (
            <PhotoSkeletons />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 fade-up">
              {works.map((work) => {
                const busy = deletingId === work.id;
                return (
                  <div key={work.id} className="group relative overflow-hidden rounded-[20px] bg-soft">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={work.image_url}
                      alt=""
                      className="w-full aspect-[3/4] object-cover"
                    />
                    {busy ? (
                      <div className="absolute inset-0 bg-ink/40 flex items-center justify-center">
                        <span className="w-5 h-5 rounded-full border border-paper/30 border-t-paper animate-spin" />
                      </div>
                    ) : (
                      <IconButton
                        label="Remove photo"
                        onClick={() => askDelete(work.id)}
                        className="absolute top-2 right-2 bg-paper/90 text-ink hover:bg-paper shadow-[0_2px_8px_rgba(26,33,43,0.15)] md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 transition-opacity"
                      >
                        {CloseIcon}
                      </IconButton>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={openPicker}
                disabled={uploading}
                className="aspect-[3/4] rounded-[20px] flex flex-col items-center justify-center gap-2 border border-dashed border-[#D5D7DB] text-muted hover:border-ink/40 hover:text-ink transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <span className="w-5 h-5 rounded-full border border-ink/25 border-t-ink animate-spin" />
                ) : (
                  <>
                    <span className="font-serif text-[34px] font-light leading-none">+</span>
                    <span className="font-sans text-[13px]">Add photos</span>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmId !== null}
        title="Remove photo?"
        body="It will no longer show on the site."
        confirmLabel="Remove"
        busy={confirmId !== null && deletingId === confirmId}
        error={removeError}
        onConfirm={() => confirmId && handleDelete(confirmId)}
        onClose={() => setConfirmId(null)}
      />
    </Page>
  );
}

function PhotoSkeletons() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="aspect-[3/4] rounded-[20px]" />
      ))}
    </div>
  );
}
