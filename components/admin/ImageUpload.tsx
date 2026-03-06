"use client";

import { useRef, useState } from "react";

export default function ImageUpload({
  value,
  onChange,
  folder = "uploads",
}: {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
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
    <div className="flex flex-col gap-2">
      {/* Preview */}
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="preview" className="w-full h-40 object-cover object-top bg-mist" />
      )}

      {/* Upload button */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="font-sans text-[10px] tracking-widest uppercase text-ink border border-ink/20 px-4 py-2 hover:bg-ink/5 transition-colors disabled:opacity-40"
        >
          {uploading ? "Uploading…" : value ? "Replace Image" : "Upload Image"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="font-sans text-[10px] tracking-widest uppercase text-ink/30 hover:text-red-400 border border-ink/10 px-3 py-2 transition-colors"
          >
            Remove
          </button>
        )}
      </div>

      {uploadError && (
        <p className="font-sans text-[11px] text-red-400">{uploadError}</p>
      )}

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {/* URL fallback */}
      <div className="flex items-center gap-2 mt-1">
        <div className="h-px flex-1 bg-ink/8" />
        <span className="font-sans text-[9px] tracking-widest uppercase text-ink/25">or paste URL</span>
        <div className="h-px flex-1 bg-ink/8" />
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://..."
        className="w-full border border-ink/15 px-3 py-2 font-sans text-[11px] text-ink/60 focus:outline-none focus:border-ink bg-transparent"
      />
    </div>
  );
}
