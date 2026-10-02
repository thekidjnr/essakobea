"use client";

import { useRef, useState } from "react";

export default function ImageUpload({
  value,
  onChange,
  folder = "uploads",
  positionClass = "object-top",
}: {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  // Tailwind object-position class, so the preview matches how the site crops it.
  positionClass?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);

    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);

    if (data.error) {
      setUploadError(data.error);
    } else if (data.url) {
      onChange(data.url);
    }

    if (e.target) e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-3">
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="Preview" className={`w-full h-64 object-cover ${positionClass} rounded-[20px] bg-soft transition-[object-position] duration-300`} />
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-40 rounded-[20px] border border-dashed border-[#D5D7DB] bg-soft/50 hover:border-ink/40 font-sans text-[14px] text-muted transition-colors disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Add a photo"}
        </button>
      )}

      {value && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="h-9 px-4 rounded-full border border-[#D5D7DB] font-sans text-[13px] font-medium text-ink hover:border-ink transition-colors disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Replace"}
          </button>
          <button
            type="button"
            onClick={() => onChange("")}
            className="h-9 px-4 rounded-full font-sans text-[13px] text-muted hover:text-ink transition-colors"
          >
            Remove
          </button>
        </div>
      )}

      {uploadError && (
        <p role="alert" className="font-sans text-[13px] text-red-700">{uploadError}</p>
      )}

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
