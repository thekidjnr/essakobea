"use client";

import { useEffect, useState } from "react";
import type { DbProduct } from "@/lib/supabase/types";
import ImageUpload from "@/components/admin/ImageUpload";

const CATEGORY_OPTIONS = [
  { value: "lace-front",  label: "Lace Front" },
  { value: "full-lace",   label: "Full Lace" },
  { value: "closure",     label: "Closure Unit" },
  { value: "accessories", label: "Accessories" },
];

const TAG_OPTIONS = [
  "New Arrival",
  "Best Seller",
  "Limited Edition",
  "Sale",
  "Staff Pick",
];

const EMPTY_FORM = {
  slug: "", name: "", category: "lace-front", category_label: "Lace Front",
  price_raw: "", length: "", description: "", image_url: "", tag: "",
  in_stock: true, display_order: 0,
};
type FormState = typeof EMPTY_FORM;

export default function AdminShopPage() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState<"add" | "edit" | null>(null);
  const [editing, setEditing]   = useState<DbProduct | null>(null);
  const [form, setForm]         = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const load = () => {
    setLoading(true);
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((data: DbProduct[]) => { setProducts(data); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  // Derive categories from actual product data so custom ones appear too
  const categories = [
    { value: "all", label: "All" },
    ...Array.from(new Map(products.map((p) => [p.category, p.category_label])).entries())
      .map(([value, label]) => ({ value, label })),
  ];
  const filtered = activeCategory === "all" ? products : products.filter((p) => p.category === activeCategory);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, display_order: products.length });
    setError("");
    setModal("add");
  };

  const openEdit = (p: DbProduct) => {
    setEditing(p);
    setForm({
      slug: p.slug, name: p.name, category: p.category,
      category_label: p.category_label, price_raw: String(p.price_raw),
      length: p.length ?? "", description: p.description, image_url: p.image_url,
      tag: p.tag ?? "", in_stock: p.in_stock, display_order: p.display_order,
    });
    setError("");
    setModal("edit");
  };

  const set = (k: keyof FormState, v: string | boolean | number) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.slug || !form.category) {
      setError("Name, slug, and category are required.");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      slug: form.slug, name: form.name, category: form.category,
      category_label: form.category_label || CATEGORY_OPTIONS.find((c) => c.value === form.category)?.label || form.category,
      price_raw: Number(form.price_raw) || 0,
      length: form.length || null,
      description: form.description,
      image_url: form.image_url,
      tag: form.tag || null,
      in_stock: form.in_stock,
      display_order: Number(form.display_order),
    };

    const url    = editing ? `/api/admin/products/${editing.id}` : "/api/admin/products";
    const method = editing ? "PUT" : "POST";

    const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (data.error) { setError(data.error); setSaving(false); return; }
    setSaving(false);
    setModal(null);
    load();
  };

  const toggleStock = async (p: DbProduct) => {
    await fetch(`/api/admin/products/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ in_stock: !p.in_stock }),
    });
    load();
  };

  const handleDelete = async (p: DbProduct) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    setDeleting(p.id);
    await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
    setDeleting(null);
    load();
  };

  return (
    <div className="p-8 md:p-10 max-w-[1100px]">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-1">Admin</p>
          <h1 className="font-serif text-[2.5rem] font-light text-ink leading-none">
            Shop<span className="italic">.</span>
          </h1>
          <p className="font-sans text-[13px] text-ink/40 mt-2">
            {loading ? "Loading…" : `${products.length} products · ${products.filter((p) => p.in_stock).length} in stock`}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-ink text-paper font-sans text-[11px] tracking-widest uppercase px-6 py-3 hover:bg-ink/80 transition-colors"
        >
          + Add Product
        </button>
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-1 mb-6 border-b border-ink/10">
        {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-4 py-2.5 font-sans text-[10px] tracking-widest uppercase border-b-2 -mb-px transition-all ${
                activeCategory === cat.value ? "border-ink text-ink" : "border-transparent text-ink/35 hover:text-ink/60"
              }`}
            >
              {cat.label}
            </button>
          ))}
      </div>

      {loading ? (
        <div className="font-sans text-[12px] text-ink/40">Loading…</div>
      ) : (
        <div className="bg-paper border border-ink/[0.07] divide-y divide-ink/[0.05]">
          {filtered.length === 0 && (
            <div className="px-6 py-12 text-center font-sans text-[13px] text-ink/30">
              No products here yet. Add your first one.
            </div>
          )}
          {filtered.map((p) => (
            <div key={p.id} className="flex items-center gap-4 px-6 py-4">
              {/* Thumbnail */}
              {p.image_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={p.image_url} alt={p.name} className="w-10 h-10 object-cover flex-shrink-0 bg-mist" />
                : <div className="w-10 h-10 bg-mist flex-shrink-0" />
              }

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <p className="font-sans text-[13px] text-ink font-medium truncate">{p.name}</p>
                  {p.tag && (
                    <span className="font-sans text-[9px] tracking-widest uppercase text-paper bg-ink px-1.5 py-0.5 flex-shrink-0">
                      {p.tag}
                    </span>
                  )}
                </div>
                <p className="font-sans text-[11px] text-ink/40 mt-0.5">
                  {p.category_label}{p.length ? ` · ${p.length}` : ""} · ₵{p.price_raw.toLocaleString()}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => toggleStock(p)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${p.in_stock ? "bg-emerald-500" : "bg-ink/15"}`}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-paper transition-all"
                    style={{ left: p.in_stock ? "calc(100% - 18px)" : "2px" }}
                  />
                </button>
                <span className={`font-sans text-[10px] tracking-widest uppercase w-16 ${p.in_stock ? "text-emerald-600" : "text-red-400"}`}>
                  {p.in_stock ? "In Stock" : "Out"}
                </span>
                <button
                  onClick={() => openEdit(p)}
                  className="font-sans text-[11px] tracking-widest uppercase text-ink/50 hover:text-ink border border-ink/15 px-4 py-2 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  disabled={deleting === p.id}
                  className="font-sans text-[11px] tracking-widest uppercase text-red-400 hover:text-red-600 border border-red-200 px-4 py-2 transition-colors disabled:opacity-40"
                >
                  {deleting === p.id ? "…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-ink/60 flex items-start justify-center p-6 overflow-y-auto">
          <div className="bg-paper w-full max-w-[620px] my-8 p-8 relative">
            <button
              onClick={() => setModal(null)}
              className="absolute top-5 right-5 font-sans text-[18px] text-ink/40 hover:text-ink"
            >
              ×
            </button>
            <h2 className="font-serif text-[1.75rem] font-light text-ink mb-6">
              {modal === "add" ? "Add Product" : "Edit Product"}
            </h2>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <PField label="Name *" value={form.name} onChange={(v) => {
                  set("name", v);
                  if (modal === "add") set("slug", v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
                }} />
                <PField label="Slug (URL path) *" value={form.slug} onChange={(v) => set("slug", v)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">Category *</label>
                  <select
                    value={CATEGORY_OPTIONS.some((c) => c.value === form.category) ? form.category : "other"}
                    onChange={(e) => {
                      if (e.target.value === "other") {
                        set("category", "");
                        set("category_label", "");
                      } else {
                        const cat = CATEGORY_OPTIONS.find((c) => c.value === e.target.value)!;
                        set("category", cat.value);
                        set("category_label", cat.label);
                      }
                    }}
                    className="w-full border border-ink/15 px-3 py-2.5 font-sans text-[13px] text-ink bg-transparent focus:outline-none focus:border-ink"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                    <option value="other">Other…</option>
                  </select>
                  {/* Custom category inputs */}
                  {!CATEGORY_OPTIONS.some((c) => c.value === form.category) && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <input
                        placeholder="slug (e.g. clip-ins)"
                        value={form.category}
                        onChange={(e) => set("category", e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))}
                        className="border border-ink/15 px-3 py-2 font-sans text-[12px] text-ink focus:outline-none focus:border-ink bg-transparent"
                      />
                      <input
                        placeholder="Label (e.g. Clip-Ins)"
                        value={form.category_label}
                        onChange={(e) => set("category_label", e.target.value)}
                        className="border border-ink/15 px-3 py-2 font-sans text-[12px] text-ink focus:outline-none focus:border-ink bg-transparent"
                      />
                    </div>
                  )}
                </div>
                <PField label="Price (₵ GHS)" value={form.price_raw} onChange={(v) => set("price_raw", v)} type="number" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <PField label="Length (e.g. 22 inch)" value={form.length} onChange={(v) => set("length", v)} />
                <div>
                  <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">Tag</label>
                  <select
                    value={form.tag}
                    onChange={(e) => set("tag", e.target.value)}
                    className="w-full border border-ink/15 px-3 py-2.5 font-sans text-[13px] text-ink bg-transparent focus:outline-none focus:border-ink"
                  >
                    <option value="">None</option>
                    {TAG_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={3}
                  className="w-full border border-ink/15 px-3 py-2.5 font-sans text-[13px] text-ink focus:outline-none focus:border-ink transition-colors resize-y bg-transparent"
                />
              </div>

              <div>
                <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">Image</label>
                <ImageUpload value={form.image_url} onChange={(url) => set("image_url", url)} folder="products" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <PField label="Display Order" value={String(form.display_order)} onChange={(v) => set("display_order", Number(v))} type="number" />
                <div className="flex flex-col gap-2 justify-end">
                  <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40">Stock Status</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => set("in_stock", !form.in_stock)}
                      className={`w-10 h-5 rounded-full relative transition-colors ${form.in_stock ? "bg-emerald-500" : "bg-ink/15"}`}
                    >
                      <span className="absolute top-0.5 w-4 h-4 rounded-full bg-paper transition-all"
                        style={{ left: form.in_stock ? "calc(100% - 18px)" : "2px" }}
                      />
                    </button>
                    <span className="font-sans text-[11px] text-ink/50">{form.in_stock ? "In Stock" : "Out of Stock"}</span>
                  </div>
                </div>
              </div>

              {error && <p className="font-sans text-[12px] text-red-500">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-ink text-paper font-sans text-[11px] tracking-widest uppercase py-4 hover:bg-ink/80 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving…" : modal === "add" ? "Create Product" : "Save Changes"}
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

function PField({ label, value, onChange, type = "text" }: {
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
