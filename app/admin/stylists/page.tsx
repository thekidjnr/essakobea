"use client";

import { useEffect, useState } from "react";
import type { Stylist } from "@/lib/supabase/types";
import ImageUpload from "@/components/admin/ImageUpload";

const EMPTY: Omit<Stylist, "id" | "created_at"> = {
  name: "",
  title: "Stylist",
  bio: "",
  photo_url: null,
  fee_adjustment: 0,
  is_available: true,
  display_order: 0,
};

export default function AdminStylistsPage() {
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Stylist | null>(null);
  const [form, setForm] = useState<Omit<Stylist, "id" | "created_at">>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stylists")
      .then((r) => r.json())
      .then((data: Stylist[]) => {
        setStylists(data);
        setLoading(false);
      });
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, display_order: stylists.length });
    setShowModal(true);
  };

  const openEdit = (s: Stylist) => {
    setEditing(s);
    setForm({
      name: s.name,
      title: s.title,
      bio: s.bio ?? "",
      photo_url: s.photo_url,
      fee_adjustment: s.fee_adjustment,
      is_available: s.is_available,
      display_order: s.display_order,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);

    const payload = {
      ...form,
      bio: form.bio?.trim() || null,
      photo_url: form.photo_url || null,
      fee_adjustment: Number(form.fee_adjustment),
      display_order: Number(form.display_order),
    };

    if (editing) {
      const res = await fetch(`/api/admin/stylists/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.error) {
        setStylists((prev) => prev.map((s) => (s.id === editing.id ? data : s)));
        setShowModal(false);
      }
    } else {
      const res = await fetch("/api/admin/stylists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.error) {
        setStylists((prev) => [...prev, data]);
        setShowModal(false);
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this stylist? This cannot be undone.")) return;
    setDeletingId(id);
    await fetch(`/api/admin/stylists/${id}`, { method: "DELETE" });
    setStylists((prev) => prev.filter((s) => s.id !== id));
    setDeletingId(null);
  };

  return (
    <div className="p-8 md:p-10 max-w-[900px]">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-1">Admin</p>
          <h1 className="font-serif text-[2.5rem] font-light text-ink leading-none">
            Stylists<span className="italic">.</span>
          </h1>
          <p className="font-sans text-[13px] text-ink/40 mt-2">
            Manage team members shown during booking
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-ink text-paper font-sans text-[11px] tracking-widest uppercase px-6 py-3 hover:bg-ink/80 transition-colors"
        >
          + Add Stylist
        </button>
      </div>

      {loading ? (
        <div className="font-sans text-[12px] text-ink/40 py-12">Loading…</div>
      ) : stylists.length === 0 ? (
        <div className="border border-dashed border-ink/15 py-20 text-center">
          <p className="font-sans text-[13px] text-ink/25 mb-4">No stylists yet.</p>
          <button
            onClick={openCreate}
            className="font-sans text-[11px] tracking-widest uppercase text-ink/40 hover:text-ink border border-ink/15 px-5 py-2.5 transition-colors"
          >
            + Add First Stylist
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-0 divide-y divide-ink/[0.07]">
          {stylists.map((s) => (
            <div key={s.id} className="py-5 flex items-center gap-5">
              {/* Photo */}
              <div className="w-14 h-14 bg-mist flex-shrink-0 overflow-hidden">
                {s.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.photo_url} alt={s.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-serif text-[1.25rem] text-ink/20 italic">
                      {s.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="font-sans text-[13px] text-ink font-medium">{s.name}</p>
                  <span className="font-sans text-[10px] tracking-widest uppercase text-ink/35">
                    {s.title}
                  </span>
                  {!s.is_available && (
                    <span className="font-sans text-[9px] tracking-widest uppercase text-amber-500 border border-amber-200 px-2 py-0.5">
                      Unavailable
                    </span>
                  )}
                </div>
                {s.bio && (
                  <p className="font-sans text-[12px] text-ink/40 mt-0.5 truncate">{s.bio}</p>
                )}
                <p className="font-sans text-[11px] text-ink/35 mt-0.5">
                  {s.fee_adjustment > 0
                    ? `+₵${s.fee_adjustment} deposit`
                    : s.fee_adjustment < 0
                    ? `−₵${Math.abs(s.fee_adjustment)} deposit`
                    : "No fee adjustment"}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => openEdit(s)}
                  className="font-sans text-[10px] tracking-widest uppercase text-ink/40 hover:text-ink border border-ink/15 px-4 py-2 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  disabled={deletingId === s.id}
                  className="font-sans text-[10px] tracking-widest uppercase text-ink/25 hover:text-red-500 border border-ink/10 hover:border-red-200 px-4 py-2 transition-colors disabled:opacity-40"
                >
                  {deletingId === s.id ? "…" : "Remove"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-ink/60 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-paper w-full max-w-[560px] my-12 p-8 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 font-sans text-[20px] text-ink/40 hover:text-ink leading-none"
            >
              ×
            </button>
            <h2 className="font-serif text-[1.5rem] font-light text-ink mb-6">
              {editing ? "Edit Stylist" : "Add Stylist"}
            </h2>

            <div className="flex flex-col gap-5">
              {/* Photo */}
              <div>
                <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">
                  Photo
                </label>
                <ImageUpload
                  value={form.photo_url ?? ""}
                  onChange={(url) => setForm((f) => ({ ...f, photo_url: url || null }))}
                  folder="stylists"
                />
              </div>

              {/* Name */}
              <div>
                <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">
                  Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Akua Mensah"
                  className="w-full border border-ink/15 px-3 py-2.5 font-sans text-[13px] text-ink focus:outline-none focus:border-ink bg-transparent"
                />
              </div>

              {/* Title */}
              <div>
                <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">
                  Title
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Senior Stylist"
                  className="w-full border border-ink/15 px-3 py-2.5 font-sans text-[13px] text-ink focus:outline-none focus:border-ink bg-transparent"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">
                  Short bio (optional)
                </label>
                <textarea
                  value={form.bio ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="A sentence or two about this stylist…"
                  rows={2}
                  className="w-full border border-ink/15 px-3 py-2.5 font-sans text-[13px] text-ink focus:outline-none focus:border-ink bg-transparent resize-none"
                />
              </div>

              {/* Fee adjustment */}
              <div>
                <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">
                  Deposit fee adjustment (₵)
                </label>
                <input
                  type="number"
                  value={form.fee_adjustment}
                  onChange={(e) => setForm((f) => ({ ...f, fee_adjustment: Number(e.target.value) }))}
                  placeholder="0"
                  className="w-full border border-ink/15 px-3 py-2.5 font-sans text-[13px] text-ink focus:outline-none focus:border-ink bg-transparent"
                />
                <p className="font-sans text-[10px] text-ink/30 mt-1">
                  Added to base deposit. Use negative to discount. 0 = no change.
                </p>
              </div>

              {/* Availability */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_available"
                  checked={form.is_available}
                  onChange={(e) => setForm((f) => ({ ...f, is_available: e.target.checked }))}
                  className="w-4 h-4 accent-ink"
                />
                <label htmlFor="is_available" className="font-sans text-[12px] text-ink/60">
                  Available for booking
                </label>
              </div>

              {/* Display order */}
              <div>
                <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">
                  Display order
                </label>
                <input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm((f) => ({ ...f, display_order: Number(e.target.value) }))}
                  className="w-full border border-ink/15 px-3 py-2.5 font-sans text-[13px] text-ink focus:outline-none focus:border-ink bg-transparent"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleSave}
                  disabled={!form.name.trim() || saving}
                  className="flex-1 bg-ink text-paper font-sans text-[11px] tracking-widest uppercase py-4 hover:bg-ink/80 transition-colors disabled:opacity-40"
                >
                  {saving ? "Saving…" : editing ? "Save Changes" : "Add Stylist"}
                </button>
                <button
                  onClick={() => setShowModal(false)}
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
