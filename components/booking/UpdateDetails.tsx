"use client";

// "Update details" on the manage booking page: the client's WhatsApp number,
// email, notes and photos. Nothing here changes the price or the time, so it
// saves straight away. Rules in lib/booking-edits.

import { useState } from "react";
import PhoneInput from "@/components/common/PhoneInput";
import PhotoUpload from "@/components/booking/PhotoUpload";
import { isPhoneComplete } from "@/lib/phone";
import { MAX_NOTES_LENGTH, MAX_PHOTOS } from "@/lib/booking-edits";

export interface EditableDetails {
  client_phone: string;
  client_email: string;
  notes: string;
  unit_photos: string[];
  inspo_photos: string[];
  photos: {
    unit: { label: string; help: string } | null;
    inspo: { label: string; help: string } | null;
  };
}

const label = "font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2";
const input = "w-full border border-ink/15 px-4 py-3 font-sans text-[14px] text-ink placeholder:text-ink/25 focus:outline-none focus:border-ink transition-colors bg-transparent";

export default function UpdateDetails({
  token, initial, onBack, onSaved,
}: {
  token: string;
  initial: EditableDetails;
  onBack: () => void;
  onSaved: (saved: Omit<EditableDetails, "photos">, changed: string[]) => void;
}) {
  const [phone, setPhone] = useState(initial.client_phone);
  const [email, setEmail] = useState(initial.client_email);
  const [notes, setNotes] = useState(initial.notes);
  const [unitPhotos, setUnitPhotos] = useState(initial.unit_photos);
  const [inspoPhotos, setInspoPhotos] = useState(initial.inspo_photos);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { unit, inspo } = initial.photos;

  const save = async () => {
    if (saving || uploading) return;
    if (!isPhoneComplete(phone)) { setError("Enter your full WhatsApp number."); return; }
    if (unit && unitPhotos.length === 0) { setError(`Add at least one ${unit.label.toLowerCase()}.`); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/manage/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientPhone: phone,
          clientEmail: email,
          notes,
          ...(unit && { unitPhotos }),
          ...(inspo && { inspoPhotos }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) { setError(data.error ?? "Something went wrong. Please try again."); return; }
      onSaved(
        { client_phone: phone, client_email: email.trim(), notes: notes.trim(), unit_photos: unitPhotos, inspo_photos: inspoPhotos },
        data.changed ?? [],
      );
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const photoBlock = (
    info: { label: string; help: string },
    photos: string[],
    setPhotos: (fn: (p: string[]) => string[]) => void,
  ) => (
    <div className="mb-8">
      <span className={label}>{info.label}</span>
      <p className="font-sans text-[13px] text-ink/55 mb-4 leading-relaxed">{info.help}</p>
      <PhotoUpload
        photos={photos}
        onAdd={(url) => setPhotos((p) => (p.length >= MAX_PHOTOS ? p : [...p, url]))}
        onRemove={(i) => setPhotos((p) => p.filter((_, j) => j !== i))}
        onUploadingChange={setUploading}
      />
    </div>
  );

  return (
    <div className="max-w-[480px] w-full">
      <button onClick={onBack} className="font-sans text-[11px] tracking-widest uppercase text-ink/50 hover:text-ink transition-colors mb-8">
        ‹ Back
      </button>
      <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-2">Update Details</p>
      <h1 className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-light text-ink leading-none mb-4">
        Your <span className="italic">details.</span>
      </h1>
      <p className="font-sans text-[13px] text-ink/50 leading-relaxed mb-10">
        Change how we reach you, add a note for your stylist, or swap your photos. To change your style, message us on WhatsApp.
      </p>

      <div className="mb-6">
        <label htmlFor="details-phone" className={label}>WhatsApp number</label>
        <PhoneInput id="details-phone" value={phone} onChange={(v) => { setPhone(v); setError(""); }} />
      </div>

      <div className="mb-6">
        <label htmlFor="details-email" className={label}>Email</label>
        <input id="details-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} className={input} />
      </div>

      <div className="mb-8">
        <label htmlFor="details-notes" className={label}>Notes for your stylist (optional)</label>
        <textarea
          id="details-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value.slice(0, MAX_NOTES_LENGTH))}
          placeholder="Anything we should know before your appointment…"
          rows={4}
          className={`${input} resize-none font-light`}
        />
      </div>

      {unit && photoBlock(unit, unitPhotos, setUnitPhotos)}
      {inspo && photoBlock(inspo, inspoPhotos, setInspoPhotos)}

      {error && <p className="font-sans text-[12px] text-red-500 mb-4" role="alert">{error}</p>}

      <button
        onClick={save}
        disabled={saving || uploading}
        className="w-full bg-ink text-paper font-sans text-[11px] tracking-widest uppercase py-4 hover:bg-ink/80 transition-colors disabled:opacity-40"
      >
        {saving ? "Saving…" : uploading ? "Uploading photo…" : "Save Changes"}
      </button>
    </div>
  );
}
