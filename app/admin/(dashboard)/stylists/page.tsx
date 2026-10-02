"use client";

import { useEffect, useState } from "react";
import type { Stylist } from "@/lib/supabase/types";
import ImageUpload from "@/components/admin/ImageUpload";
import Toggle from "@/components/admin/Toggle";
import {
  Page,
  PageHeader,
  Button,
  Pill,
  inputClass,
  Field,
  ErrorNote,
  Empty,
  Skeleton,
  Modal,
  ConfirmDialog,
} from "@/components/admin/ui";

const EMPTY: Omit<Stylist, "id" | "created_at"> = {
  name: "",
  title: "Stylist",
  photo_url: null,
  fee_adjustment: 0,
  is_available: true,
  display_order: 0,
  daily_capacity: null,
};

function summary(s: Stylist) {
  const fee =
    s.fee_adjustment > 0
      ? `+₵${s.fee_adjustment} deposit`
      : s.fee_adjustment < 0
      ? `−₵${Math.abs(s.fee_adjustment)} deposit`
      : "No extra fee";
  const cap = s.daily_capacity ? `${s.daily_capacity} a day` : "No daily limit";
  return `${fee} · ${cap}`;
}

export default function AdminStylistsPage() {
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Stylist | null>(null);
  const [form, setForm] = useState<Omit<Stylist, "id" | "created_at">>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<Stylist | null>(null);
  const [removeError, setRemoveError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stylists")
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok || !Array.isArray(data)) throw new Error(data?.error ?? "Could not load stylists.");
        setStylists(data as Stylist[]);
      })
      .catch((e: Error) => setError(e.message || "Could not load stylists."))
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, display_order: stylists.length });
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (s: Stylist) => {
    setEditing(s);
    setForm({
      name: s.name,
      title: s.title,
      photo_url: s.photo_url,
      fee_adjustment: s.fee_adjustment,
      is_available: s.is_available,
      display_order: s.display_order,
      daily_capacity: s.daily_capacity,
    });
    setFormError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setFormError("");

    const payload = {
      ...form,
      photo_url: form.photo_url || null,
      fee_adjustment: Number(form.fee_adjustment),
      display_order: Number(form.display_order),
      daily_capacity: form.daily_capacity === null || form.daily_capacity === undefined || Number.isNaN(form.daily_capacity)
        ? null
        : Number(form.daily_capacity),
    };

    const res = await fetch(editing ? `/api/admin/stylists/${editing.id}` : "/api/admin/stylists", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setSaving(false);
    if (!res?.ok || data.error || !data.id) { setFormError(data.error ?? "Could not save. Please try again."); return; }
    setStylists((prev) => editing ? prev.map((s) => (s.id === editing.id ? data : s)) : [...prev, data]);
    setShowModal(false);
  };

  const askRemove = (s: Stylist) => {
    setRemoveError("");
    setConfirmRemove(s);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError("");
    setRemoveError("");
    const res = await fetch(`/api/admin/stylists/${id}`, { method: "DELETE" }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setDeletingId(null);
    if (!res?.ok) { setRemoveError(data.error ?? "Could not remove stylist. Please try again."); return; }
    setStylists((prev) => prev.filter((s) => s.id !== id));
    setConfirmRemove(null);
    setShowModal(false);
  };

  const total = stylists.length;
  const taking = stylists.filter((s) => s.is_available).length;
  const subtitle = loading
    ? undefined
    : `${total} ${total === 1 ? "stylist" : "stylists"} · ${taking} taking bookings`;

  return (
    <Page>
      <PageHeader
        title="Team"
        subtitle={subtitle}
        actions={<Button onClick={openCreate}>Add stylist</Button>}
      />

      <ErrorNote className="mb-6">{error}</ErrorNote>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[3/4] rounded-[24px]" />
              <Skeleton className="mt-3 h-4 w-3/4 rounded-full" />
            </div>
          ))}
        </div>
      ) : stylists.length === 0 && error ? null : stylists.length === 0 ? (
        <Empty title="No stylists yet">
          <Button onClick={openCreate} className="mt-2">Add stylist</Button>
        </Empty>
      ) : (
        <ul className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-7 md:gap-x-6 md:gap-y-9 fade-up">
          {stylists.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => openEdit(s)}
                aria-label={`Edit ${s.name}`}
                className="group block w-full text-left focus:outline-none"
              >
                <div className="relative aspect-[3/4] rounded-[24px] overflow-hidden bg-ink group-focus-visible:ring-2 group-focus-visible:ring-ink group-focus-visible:ring-offset-2">
                  {s.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.photo_url}
                      alt={s.name}
                      className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${s.is_available ? "" : "grayscale-[60%]"}`}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-serif italic font-light text-[64px] md:text-[80px] text-paper/35 leading-none">
                        {s.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent" />
                  {!s.is_available && (
                    <Pill tone="soft" className="absolute top-3 left-3 bg-paper/90 text-graphite">Away</Pill>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                    <p className="font-serif text-[20px] md:text-[24px] leading-tight text-paper truncate">{s.name}</p>
                    <p className="mt-0.5 font-sans text-[12px] md:text-[13px] text-paper/75 truncate">{s.title}</p>
                  </div>
                </div>
                <p className="mt-3 px-1 font-sans text-[12px] md:text-[13px] text-muted truncate">{summary(s)}</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit stylist" : "Add stylist"}
        footer={
          <>
            {editing && (
              <Button
                variant="ghost"
                onClick={() => askRemove(editing)}
                disabled={deletingId === editing.id}
                className="mr-auto -ml-3"
              >
                Remove
              </Button>
            )}
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || saving}>
              {saving ? "Saving…" : editing ? "Save" : "Add stylist"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <div>
            <span className="block mb-2 font-sans text-[13px] text-graphite">Photo</span>
            <ImageUpload
              value={form.photo_url ?? ""}
              onChange={(url) => setForm((f) => ({ ...f, photo_url: url || null }))}
              folder="stylists"
            />
          </div>

          <Field label="Name">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Akua Mensah"
              className={inputClass}
            />
          </Field>

          <Field label="Title">
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Senior stylist"
              className={inputClass}
            />
          </Field>

          <div className="flex items-center justify-between gap-4 min-h-[56px] px-4 rounded-2xl bg-soft">
            <span className="font-sans text-[14px] text-ink">Taking bookings</span>
            <Toggle
              checked={form.is_available}
              onChange={(v) => setForm((f) => ({ ...f, is_available: v }))}
              label="Taking bookings"
            />
          </div>

          <details className="group rounded-2xl border border-line">
            <summary className="flex items-center justify-between gap-4 min-h-[52px] px-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden font-sans text-[14px] text-ink">
              More options
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
                className="text-muted transition-transform duration-200 group-open:rotate-180"
              >
                <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <div className="flex flex-col gap-5 px-4 pt-1 pb-5">
              <Field label="Deposit adjustment (₵)" hint="Added to the service deposit · negative for a discount">
                <input
                  type="number"
                  value={form.fee_adjustment}
                  onChange={(e) => setForm((f) => ({ ...f, fee_adjustment: Number(e.target.value) }))}
                  placeholder="0"
                  className={inputClass}
                />
              </Field>

              <Field label="Daily limit" hint="Leave empty for no limit">
                <input
                  type="number"
                  min={0}
                  value={form.daily_capacity ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, daily_capacity: e.target.value === "" ? null : Number(e.target.value) }))}
                  placeholder="No limit"
                  className={inputClass}
                />
              </Field>

              <Field label="Display order" hint="Lower numbers show first">
                <input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm((f) => ({ ...f, display_order: Number(e.target.value) }))}
                  className={inputClass}
                />
              </Field>
            </div>
          </details>

          <ErrorNote>{formError}</ErrorNote>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmRemove}
        title={confirmRemove ? `Remove ${confirmRemove.name}?` : ""}
        body="Stylists with upcoming bookings can't be removed. Mark them away instead."
        confirmLabel="Remove"
        busy={!!confirmRemove && deletingId === confirmRemove.id}
        error={removeError}
        onConfirm={() => confirmRemove && handleDelete(confirmRemove.id)}
        onClose={() => setConfirmRemove(null)}
      />
    </Page>
  );
}
