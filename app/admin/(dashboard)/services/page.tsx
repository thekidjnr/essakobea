"use client";

import { useEffect, useState } from "react";
import type { DbService } from "@/lib/supabase/types";
import { formatDuration, optionDuration } from "@/lib/booking-duration";
import ImageUpload from "@/components/admin/ImageUpload";
import Toggle from "@/components/admin/Toggle";
import {
  Page,
  PageHeader,
  Card,
  Button,
  IconButton,
  inputClass,
  textareaClass,
  Field,
  ErrorNote,
  Empty,
  SkeletonRows,
  Modal,
  ConfirmDialog,
  CloseIcon,
} from "@/components/admin/ui";

// ─── Form types ───────────────────────────────────────────────────────────────

type BookOpt = { id?: string; name: string; price: string; price_raw: string; duration: string; note: string };

type ServiceForm = {
  name: string;
  description: string;
  image_url: string;
  image_position: string;
  // No longer editable in the form (it has no effect on the public site), but
  // an existing service keeps its stored value on save.
  flip: boolean;
  is_active: boolean;
  booking_options: BookOpt[];
};

const EMPTY_OPT: BookOpt = { name: "", price: "", price_raw: "", duration: "", note: "" };

// Half-hour steps up to 10 hours
const DURATION_CHOICES = Array.from({ length: 20 }, (_, i) => (i + 1) * 30);
const EMPTY_FORM: ServiceForm = {
  name: "", description: "",
  image_url: "", image_position: "object-center", flip: false, is_active: true,
  booking_options: [],
};

function dbToForm(svc: DbService): ServiceForm {
  return {
    name: svc.name,
    description: svc.description,
    image_url: svc.image_url,
    // Anything we don't offer (or blank) falls back to center.
    image_position: FOCUS_OPTIONS.some((o) => o.value === svc.image_position) ? svc.image_position : "object-center",
    flip: svc.flip,
    is_active: svc.is_active,
    booking_options: svc.booking_options.map((o) => ({
      id: o.id,
      name: o.name,
      price: o.price,
      price_raw: String(o.price_raw ?? ""),
      duration: String(optionDuration(svc.slug, o)),
      note: o.note ?? "",
    })),
  };
}

// Option ids are what bookings reference, so an existing option keeps its id
// even when renamed. Only new options get one, derived from the name.
function optionIds(opts: BookOpt[]): string[] {
  const used = new Set(opts.map((o) => o.id).filter(Boolean) as string[]);
  return opts.map((o) => {
    if (o.id) return o.id;
    const base = o.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "option";
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    return id;
  });
}

function formToPayload(form: ServiceForm) {
  const opts = form.booking_options.filter((o) => o.name.trim());
  const ids = optionIds(opts);
  return {
    name: form.name,
    description: form.description,
    image_url: form.image_url,
    image_position: form.image_position,
    flip: form.flip,
    is_active: form.is_active,
    booking_options: opts
      .map((o, i) => ({
        id: ids[i],
        name: o.name,
        price: o.price,
        price_raw: Number(o.price_raw) || 0,
        ...(Number(o.duration) > 0 ? { duration_minutes: Number(o.duration) } : {}),
        ...(o.note.trim() ? { note: o.note.trim() } : {}),
      })),
  };
}

const FOCUS_OPTIONS = [
  { value: "object-top", label: "Top" },
  { value: "object-[50%_25%]", label: "Upper middle" },
  { value: "object-center", label: "Center" },
  { value: "object-[50%_75%]", label: "Lower middle" },
  { value: "object-bottom", label: "Bottom" },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminServicesPage() {
  const [services, setServices] = useState<DbService[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<DbService | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DbService | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const [listError, setListError] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/admin/services")
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok || !Array.isArray(data)) throw new Error(data?.error ?? "Could not load services.");
        setServices(data as DbService[]);
        setListError("");
      })
      .catch((e: Error) => setListError(e.message || "Could not load services."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setModal("add");
  };

  const openEdit = (svc: DbService) => {
    setEditing(svc);
    setForm(dbToForm(svc));
    setError("");
    setModal("edit");
  };

  const patchForm = (patch: Partial<ServiceForm>) => setForm((f) => ({ ...f, ...patch }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    const unpriced = form.booking_options.find((o) => o.name.trim() && !(Number(o.price_raw) > 0));
    if (unpriced) {
      setError(`"${unpriced.name}" needs a deposit above ₵0.`);
      return;
    }
    setSaving(true);
    setError("");

    const payload = formToPayload(form);
    const url = editing ? `/api/admin/services/${editing.id}` : "/api/admin/services";
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({ error: "Could not save. Please try again." }));
    if (!res.ok || data.error) { setError(data.error ?? "Could not save. Please try again."); setSaving(false); return; }
    setSaving(false);
    setModal(null);
    load();
  };

  const toggleActive = async (svc: DbService) => {
    setListError("");
    const res = await fetch(`/api/admin/services/${svc.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !svc.is_active }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (!res?.ok) { setListError(data.error ?? "Could not update service. Please try again."); return; }
    load();
  };

  const askDelete = (svc: DbService) => {
    setDeleteError("");
    setConfirmDelete(svc);
  };

  const handleDelete = async (svc: DbService) => {
    setDeleting(svc.id);
    setDeleteError("");
    setListError("");
    const res = await fetch(`/api/admin/services/${svc.id}`, { method: "DELETE" }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setDeleting(null);
    if (!res?.ok) { setDeleteError(data.error ?? "Could not delete service. Please try again."); return; }
    setConfirmDelete(null);
    setModal(null);
    load();
  };

  const liveCount = services.filter((s) => s.is_active).length;

  return (
    <Page>
      <PageHeader
        title="Services"
        subtitle={loading ? undefined : `${services.length} ${services.length === 1 ? "service" : "services"} · ${liveCount} live`}
        actions={<Button onClick={openAdd}>Add service</Button>}
      />

      <ErrorNote className="mb-4">{listError}</ErrorNote>

      {loading ? (
        <SkeletonRows rows={5} />
      ) : services.length === 0 ? (
        listError ? null : <Card><Empty title="No services yet" /></Card>
      ) : (
        <Card padded={false} className="fade-up">
          <ul className="divide-y divide-line">
            {services.map((svc) => {
              const optCount = svc.booking_options.length;
              const optLabel = `${optCount} ${optCount === 1 ? "option" : "options"}`;
              return (
                <li key={svc.id} className="flex items-center gap-3 md:gap-5 px-4 md:px-6 py-3.5">
                  <button
                    type="button"
                    onClick={() => openEdit(svc)}
                    className="group flex flex-1 min-w-0 items-center gap-4 text-left"
                  >
                    <div className="w-14 h-14 flex-shrink-0 overflow-hidden rounded-[14px] bg-soft">
                      {svc.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={svc.image_url}
                          alt=""
                          className={`w-full h-full object-cover ${svc.image_position} transition-transform duration-300 group-hover:scale-105`}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-sans text-[15px] font-medium text-ink truncate">{svc.name}</p>
                      <p className="font-sans text-[13px] text-muted truncate">
                        <span className="md:hidden">{optLabel}{svc.description ? " · " : ""}</span>
                        {svc.description}
                      </p>
                    </div>
                  </button>
                  <span className="hidden md:block flex-shrink-0 font-sans text-[13px] text-muted w-20 text-right">
                    {optLabel}
                  </span>
                  <label className="flex-shrink-0 flex items-center gap-2.5 h-11 px-1 cursor-pointer">
                    <span className="hidden md:inline font-sans text-[13px] text-muted w-12 text-right">
                      {svc.is_active ? "Live" : "Hidden"}
                    </span>
                    <Toggle
                      checked={svc.is_active}
                      onChange={() => toggleActive(svc)}
                      label={`${svc.name} visible on site`}
                    />
                  </label>
                  <Button variant="secondary" onClick={() => openEdit(svc)} className="hidden sm:inline-flex">
                    Edit
                  </Button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* Add / edit */}
      <Modal
        open={modal !== null && confirmDelete === null}
        onClose={() => setModal(null)}
        title={modal === "add" ? "New service" : editing?.name ?? "Edit service"}
        size="lg"
        footer={
          <>
            <ErrorNote className="w-full">{error}</ErrorNote>
            {modal === "edit" && editing && (
              <Button variant="ghost" onClick={() => askDelete(editing)} className="mr-auto -ml-3">
                Delete
              </Button>
            )}
            <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : modal === "add" ? "Create service" : "Save changes"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <Field label="Name">
              <input
                value={form.name}
                onChange={(e) => patchForm({ name: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) => patchForm({ description: e.target.value })}
                rows={3}
                className={textareaClass}
              />
            </Field>
          </div>

          <FormSection title="Image">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_190px] gap-4 sm:items-start">
              <ImageUpload value={form.image_url} onChange={(url) => patchForm({ image_url: url })} folder="services" positionClass={form.image_position || "object-center"} />
              <Field label="Focus point">
                <span className="relative block">
                  <select
                    value={form.image_position}
                    onChange={(e) => patchForm({ image_position: e.target.value })}
                    className={`${inputClass} appearance-none cursor-pointer pr-10`}
                  >
                    {FOCUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted">
                    <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Field>
            </div>
          </FormSection>

          <FormSection title="Booking options">
            <BookingOptionsBuilder
              options={form.booking_options}
              defaultDuration={optionDuration(editing?.slug ?? "", null)}
              onChange={(opts) => patchForm({ booking_options: opts })}
            />
          </FormSection>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete service?"
        body={confirmDelete ? `${confirmDelete.name} will be removed. This cannot be undone.` : undefined}
        confirmLabel="Delete"
        busy={!!confirmDelete && deleting === confirmDelete.id}
        error={deleteError}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
      />
    </Page>
  );
}

// ─── Booking Options Builder ──────────────────────────────────────────────────

const OPT_GRID = "sm:grid sm:grid-cols-[minmax(0,1fr)_150px_110px_120px_44px] sm:gap-2 sm:items-center";

function BookingOptionsBuilder({
  options,
  onChange,
  defaultDuration,
}: {
  options: BookOpt[];
  onChange: (opts: BookOpt[]) => void;
  defaultDuration: number;
}) {
  const update = (i: number, field: keyof BookOpt, val: string) =>
    onChange(options.map((o, idx) => (idx === i ? { ...o, [field]: val } : o)));
  const remove = (i: number) => {
    setEditingNote(null);
    onChange(options.filter((_, idx) => idx !== i));
  };
  // The note shows as small text with a pencil until tapped. Inputs stay at
  // 16px (so iOS doesn't zoom), so the field only appears while editing.
  const [editingNote, setEditingNote] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <p className="font-sans text-[13px] text-muted">
        Clients see the &ldquo;Shown as&rdquo; price. The deposit is charged online to hold the slot.
        The stylist is booked for the full duration, so set it to the longest the option usually takes.
      </p>

      {options.length === 0 && (
        <p className="font-sans text-[14px] text-graphite">No options yet.</p>
      )}

      {options.length > 0 && (
        <div className={`hidden ${OPT_GRID} font-sans text-[12px] text-muted px-1`}>
          <span>Option</span>
          <span>Shown as</span>
          <span>Deposit (₵)</span>
          <span>Duration</span>
          <span />
        </div>
      )}

      {options.length > 0 && (
        <ul className="flex flex-col divide-y divide-line sm:divide-y-0 sm:gap-4">
          {options.map((opt, i) => (
            <li key={i} className="py-4 first:pt-0 sm:py-0 flex flex-col gap-2">
              <div className="flex items-center justify-between sm:hidden">
                <span className="font-sans text-[13px] text-graphite">Option {i + 1}</span>
                <IconButton label="Remove option" onClick={() => remove(i)} className="-mr-3">{CloseIcon}</IconButton>
              </div>
              <div className={`flex flex-col gap-2 ${OPT_GRID}`}>
                <input
                  value={opt.name}
                  onChange={(e) => update(i, "name", e.target.value)}
                  placeholder="e.g. Full wig installation"
                  aria-label="Option name"
                  className={inputClass}
                />
                <div className="grid grid-cols-2 gap-2 sm:contents">
                  <input
                    value={opt.price}
                    onChange={(e) => update(i, "price", e.target.value)}
                    placeholder="Shown as, ₵300"
                    aria-label="Shown as"
                    className={inputClass}
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    value={opt.price_raw}
                    onChange={(e) => update(i, "price_raw", e.target.value)}
                    placeholder="Deposit, 300"
                    aria-label="Deposit (₵)"
                    className={inputClass}
                  />
                  <span className="relative col-span-2 sm:col-span-1">
                    <select
                      value={opt.duration || String(defaultDuration)}
                      onChange={(e) => update(i, "duration", e.target.value)}
                      aria-label="Duration"
                      className={`${inputClass} appearance-none cursor-pointer pr-9`}
                    >
                      {DURATION_CHOICES.map((m) => (
                        <option key={m} value={m}>{formatDuration(m)}</option>
                      ))}
                    </select>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted">
                      <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
                <IconButton label="Remove option" onClick={() => remove(i)} className="hidden sm:inline-flex">
                  {CloseIcon}
                </IconButton>
              </div>
              {editingNote === i ? (
                <input
                  autoFocus
                  value={opt.note}
                  onChange={(e) => update(i, "note", e.target.value)}
                  onBlur={() => setEditingNote(null)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") { e.preventDefault(); setEditingNote(null); } }}
                  placeholder="Short note clients see"
                  aria-label="Note"
                  maxLength={80}
                  className={`${inputClass} h-10 sm:w-[calc(100%-52px)]`}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingNote(i)}
                  className="group w-full sm:w-[calc(100%-52px)] min-h-[40px] flex items-center gap-2 px-1 text-left font-sans text-[12px] text-muted hover:text-ink transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="flex-shrink-0">
                    <path d="M10.5 2.5l3 3L6 13H3v-3l7.5-7.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                  </svg>
                  <span className={`truncate ${opt.note ? "" : "underline decoration-dotted underline-offset-4"}`}>
                    {opt.note || "Add a note"}
                  </span>
                  {opt.note && <span className="ml-auto flex-shrink-0 text-[12px] text-muted/80 group-hover:text-ink">Edit</span>}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Button variant="secondary" onClick={() => onChange([...options, { ...EMPTY_OPT, duration: String(defaultDuration) }])} className="self-start">
        Add option
      </Button>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-6">
      <h4 className="font-serif text-[22px] font-normal text-ink leading-tight mb-4">{title}</h4>
      {children}
    </section>
  );
}
