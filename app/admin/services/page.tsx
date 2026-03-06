"use client";

import { useEffect, useState } from "react";
import type { DbService } from "@/lib/supabase/types";
import ImageUpload from "@/components/admin/ImageUpload";

// ─── Form types ───────────────────────────────────────────────────────────────

type BookOpt = { name: string; price: string; price_raw: string; note: string };

type ServiceForm = {
  slug: string;
  name: string;
  number: string;
  tagline: string;
  description: string;
  image_url: string;
  image_position: string;
  flip: boolean;
  is_active: boolean;
  display_order: number;
  booking_options: BookOpt[];
};

const EMPTY_OPT: BookOpt = { name: "", price: "", price_raw: "", note: "" };
const EMPTY_FORM: ServiceForm = {
  slug: "", name: "", number: "", tagline: "", description: "",
  image_url: "", image_position: "object-center", flip: false, is_active: true, display_order: 0,
  booking_options: [],
};

function dbToForm(svc: DbService): ServiceForm {
  return {
    slug: svc.slug,
    name: svc.name,
    number: svc.number,
    tagline: svc.tagline,
    description: svc.description,
    image_url: svc.image_url,
    image_position: svc.image_position,
    flip: svc.flip,
    is_active: svc.is_active,
    display_order: svc.display_order,
    booking_options: svc.booking_options.map((o) => ({
      name: o.name,
      price: o.price,
      price_raw: String(o.price_raw ?? ""),
      note: o.note ?? "",
    })),
  };
}

function formToPayload(form: ServiceForm) {
  return {
    slug: form.slug,
    name: form.name,
    number: form.number || "01",
    tagline: form.tagline,
    description: form.description,
    image_url: form.image_url,
    image_position: form.image_position,
    flip: form.flip,
    is_active: form.is_active,
    display_order: Number(form.display_order),
    booking_options: form.booking_options
      .filter((o) => o.name.trim())
      .map((o) => ({
        id: o.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        name: o.name,
        price: o.price,
        price_raw: Number(o.price_raw) || 0,
        ...(o.note.trim() ? { note: o.note.trim() } : {}),
      })),
  };
}

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

  const load = () => {
    setLoading(true);
    fetch("/api/admin/services")
      .then((r) => r.json())
      .then((data: DbService[]) => { setServices(data); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, display_order: services.length });
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
    if (!form.name.trim() || !form.slug.trim()) {
      setError("Name and slug are required.");
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
    const data = await res.json();
    if (data.error) { setError(data.error); setSaving(false); return; }
    setSaving(false);
    setModal(null);
    load();
  };

  const toggleActive = async (svc: DbService) => {
    await fetch(`/api/admin/services/${svc.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !svc.is_active }),
    });
    load();
  };

  const handleDelete = async (svc: DbService) => {
    if (!confirm(`Delete "${svc.name}"? This cannot be undone.`)) return;
    setDeleting(svc.id);
    await fetch(`/api/admin/services/${svc.id}`, { method: "DELETE" });
    setDeleting(null);
    load();
  };

  return (
    <div className="p-8 md:p-10 max-w-[1000px]">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-1">Admin</p>
          <h1 className="font-serif text-[2.5rem] font-light text-ink leading-none">
            Services<span className="italic">.</span>
          </h1>
          <p className="font-sans text-[13px] text-ink/40 mt-2">
            {loading ? "Loading…" : `${services.length} services · ${services.filter((s) => s.is_active).length} live`}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-ink text-paper font-sans text-[11px] tracking-widest uppercase px-6 py-3 hover:bg-ink/80 transition-colors"
        >
          + Add Service
        </button>
      </div>

      {/* Services list */}
      {loading ? (
        <div className="font-sans text-[12px] text-ink/40">Loading…</div>
      ) : (
        <div className="bg-paper border border-ink/[0.07] divide-y divide-ink/[0.05]">
          {services.length === 0 && (
            <div className="px-6 py-12 text-center font-sans text-[13px] text-ink/30">
              No services yet. Add your first one.
            </div>
          )}
          {services.map((svc) => (
            <div key={svc.id} className="flex items-center gap-4 px-6 py-4">
              {svc.image_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={svc.image_url} alt={svc.name} className="w-10 h-10 object-cover flex-shrink-0 bg-mist" />
                : <div className="w-10 h-10 bg-mist flex-shrink-0" />
              }
              <span className="font-sans text-[10px] tracking-widest text-ink/30 flex-shrink-0 w-8">{svc.number}</span>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-[13px] text-ink font-medium truncate">{svc.name}</p>
                <p className="font-sans text-[11px] text-ink/40 truncate">{svc.tagline}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => toggleActive(svc)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${svc.is_active ? "bg-emerald-500" : "bg-ink/15"}`}
                >
                  <span className="absolute top-0.5 w-4 h-4 rounded-full bg-paper transition-all"
                    style={{ left: svc.is_active ? "calc(100% - 18px)" : "2px" }} />
                </button>
                <span className={`font-sans text-[10px] tracking-widest uppercase w-14 text-right ${svc.is_active ? "text-emerald-600" : "text-ink/30"}`}>
                  {svc.is_active ? "Live" : "Hidden"}
                </span>
                <button
                  onClick={() => openEdit(svc)}
                  className="font-sans text-[11px] tracking-widest uppercase text-ink/50 hover:text-ink border border-ink/15 px-4 py-2 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(svc)}
                  disabled={deleting === svc.id}
                  className="font-sans text-[11px] tracking-widest uppercase text-red-400 hover:text-red-600 border border-red-200 px-4 py-2 transition-colors disabled:opacity-40"
                >
                  {deleting === svc.id ? "…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-ink/60 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-paper w-full max-w-[780px] my-8 p-8 relative">
            <button
              onClick={() => setModal(null)}
              className="absolute top-5 right-5 font-sans text-[20px] text-ink/40 hover:text-ink leading-none"
            >
              ×
            </button>
            <h2 className="font-serif text-[1.75rem] font-light text-ink mb-6">
              {modal === "add" ? "Add Service" : `Edit — ${editing?.name}`}
            </h2>

            <div className="flex flex-col gap-6">

              {/* ── Basic Info ── */}
              <FormSection label="Basic Info">
                <div className="grid grid-cols-2 gap-3">
                  <SField label="Service Name *" value={form.name} onChange={(v) => {
                    patchForm({ name: v, ...(modal === "add" ? { slug: v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") } : {}) });
                  }} />
                  <SField label="URL Slug *" value={form.slug} onChange={(v) => patchForm({ slug: v })} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <SField label="Number (e.g. 01)" value={form.number} onChange={(v) => patchForm({ number: v })} />
                  <SField label="Display Order" value={String(form.display_order)} onChange={(v) => patchForm({ display_order: Number(v) })} type="number" />
                  <SToggle label="Visibility" onLabel="Live" offLabel="Hidden" value={form.is_active} onChange={(v) => patchForm({ is_active: v })} color="emerald" />
                </div>
                <SField label="Tagline" value={form.tagline} onChange={(v) => patchForm({ tagline: v })} />
                <STextArea label="Description" value={form.description} onChange={(v) => patchForm({ description: v })} rows={3} />
              </FormSection>

              {/* ── Image ── */}
              <FormSection label="Image">
                <ImageUpload value={form.image_url} onChange={(url) => patchForm({ image_url: url })} folder="services" />
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div>
                    <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">Focus Point</label>
                    <select
                      value={form.image_position}
                      onChange={(e) => patchForm({ image_position: e.target.value })}
                      className="w-full border border-ink/15 px-3 py-2.5 font-sans text-[13px] text-ink bg-transparent focus:outline-none focus:border-ink"
                    >
                      <option value="object-top">Top</option>
                      <option value="object-center">Center</option>
                      <option value="object-bottom">Bottom</option>
                    </select>
                  </div>
                  <SToggle label="Layout" onLabel="Image on right" offLabel="Image on left" value={form.flip} onChange={(v) => patchForm({ flip: v })} />
                </div>
              </FormSection>

              {/* ── Booking Options ── */}
              <FormSection
                label="Booking Options"
                hint="What clients select when booking. Deposit is charged online to secure the slot."
              >
                <BookingOptionsBuilder
                  options={form.booking_options}
                  onChange={(opts) => patchForm({ booking_options: opts })}
                />
              </FormSection>

              {error && <p className="font-sans text-[12px] text-red-500">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-ink text-paper font-sans text-[11px] tracking-widest uppercase py-4 hover:bg-ink/80 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving…" : modal === "add" ? "Create Service" : "Save Changes"}
                </button>
                <button
                  onClick={() => setModal(null)}
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

// ─── Booking Options Builder ──────────────────────────────────────────────────

function BookingOptionsBuilder({
  options,
  onChange,
}: {
  options: BookOpt[];
  onChange: (opts: BookOpt[]) => void;
}) {
  const update = (i: number, field: keyof BookOpt, val: string) =>
    onChange(options.map((o, idx) => (idx === i ? { ...o, [field]: val } : o)));

  return (
    <div className="flex flex-col gap-2">
      {options.length === 0 && (
        <p className="font-sans text-[11px] text-ink/30 py-1">No options yet — add at least one for clients to select.</p>
      )}
      {/* Column headers */}
      {options.length > 0 && (
        <div className="flex gap-2 items-center">
          <span className="w-44 flex-shrink-0 font-sans text-[9px] tracking-widest uppercase text-ink/30">Option Name</span>
          <span className="w-28 flex-shrink-0 font-sans text-[9px] tracking-widest uppercase text-ink/30">Price (display)</span>
          <span className="w-24 flex-shrink-0 font-sans text-[9px] tracking-widest uppercase text-ink/30">Deposit ₵</span>
          <span className="flex-1 font-sans text-[9px] tracking-widest uppercase text-ink/30">Note (optional)</span>
          <span className="w-8" />
        </div>
      )}
      {options.map((opt, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            value={opt.name}
            onChange={(e) => update(i, "name", e.target.value)}
            placeholder="e.g. Full Wig Installation"
            className="w-44 flex-shrink-0 border border-ink/15 px-3 py-2 font-sans text-[12px] text-ink focus:outline-none focus:border-ink bg-transparent"
          />
          <input
            value={opt.price}
            onChange={(e) => update(i, "price", e.target.value)}
            placeholder="₵300"
            className="w-28 flex-shrink-0 border border-ink/15 px-3 py-2 font-sans text-[12px] text-ink focus:outline-none focus:border-ink bg-transparent"
          />
          <input
            type="number"
            value={opt.price_raw}
            onChange={(e) => update(i, "price_raw", e.target.value)}
            placeholder="300"
            className="w-24 flex-shrink-0 border border-ink/15 px-3 py-2 font-sans text-[12px] text-ink focus:outline-none focus:border-ink bg-transparent"
          />
          <input
            value={opt.note}
            onChange={(e) => update(i, "note", e.target.value)}
            placeholder="e.g. Includes bleaching & plucking"
            className="flex-1 border border-ink/15 px-3 py-2 font-sans text-[12px] text-ink/60 focus:outline-none focus:border-ink bg-transparent"
          />
          <button
            onClick={() => onChange(options.filter((_, idx) => idx !== i))}
            className="text-ink/25 hover:text-red-400 text-[18px] w-8 flex-shrink-0 transition-colors leading-none"
          >
            ×
          </button>
        </div>
      ))}
      <p className="font-sans text-[9px] text-ink/25 mt-1">
        Deposit = amount charged online. Price is the display label clients see (e.g. ₵250 – ₵450). Note appears under the option on the services page.
      </p>
      <button
        onClick={() => onChange([...options, { ...EMPTY_OPT }])}
        className="self-start font-sans text-[10px] tracking-widest uppercase text-ink/40 hover:text-ink border border-ink/15 px-4 py-2 transition-colors mt-1"
      >
        + Add Option
      </button>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function FormSection({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline gap-3 mb-3">
        <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/50 flex-shrink-0">{label}</p>
        {hint && <p className="font-sans text-[10px] text-ink/25 leading-snug">{hint}</p>}
        <div className="h-px flex-1 bg-ink/8" />
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function SToggle({
  label, onLabel, offLabel, value, onChange, color = "ink",
}: {
  label: string; onLabel: string; offLabel: string; value: boolean; onChange: (v: boolean) => void; color?: "ink" | "emerald";
}) {
  const bg = value ? (color === "emerald" ? "bg-emerald-500" : "bg-ink") : "bg-ink/15";
  return (
    <div className="flex flex-col gap-2 justify-end">
      <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40">{label}</label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(!value)}
          className={`w-10 h-5 rounded-full relative transition-colors ${bg}`}
        >
          <span
            className="absolute top-0.5 w-4 h-4 rounded-full bg-paper transition-all"
            style={{ left: value ? "calc(100% - 18px)" : "2px" }}
          />
        </button>
        <span className="font-sans text-[11px] text-ink/50">{value ? onLabel : offLabel}</span>
      </div>
    </div>
  );
}

function SField({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-ink/15 px-3 py-2.5 font-sans text-[13px] text-ink focus:outline-none focus:border-ink transition-colors bg-transparent"
      />
    </div>
  );
}

function STextArea({ label, value, onChange, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number;
}) {
  return (
    <div>
      <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full border border-ink/15 px-3 py-2.5 font-sans text-[13px] text-ink focus:outline-none focus:border-ink transition-colors resize-y bg-transparent"
      />
    </div>
  );
}
