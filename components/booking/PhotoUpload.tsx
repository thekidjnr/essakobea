"use client";

import { useRef, useState } from "react";
import { uploadImage } from "@/lib/upload-image";
import { thumbUrl } from "@/lib/media";

// Hair unit and inspo photos. Shared by the booking form and the manage
// booking page, where clients can swap their photos later.

// Checked before the photo is shrunk in the browser, so it can be generous
const MAX_PHOTO_BYTES = 30 * 1024 * 1024;

export default function PhotoUpload({
  photos,
  onAdd,
  onRemove,
  onUploadingChange,
}: {
  photos: string[];
  onAdd: (url: string) => void;
  onRemove: (index: number) => void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const uploadOne = async (file: File): Promise<string | null> => {
    const isImage = file.type.startsWith("image/") || /\.hei[cf]$/i.test(file.name);
    if (!isImage) return `"${file.name}" isn't an image. Please use a JPG or PNG.`;
    if (file.size > MAX_PHOTO_BYTES)
      return `"${file.name}" is over ${MAX_PHOTO_BYTES / 1024 / 1024} MB. Please choose a smaller photo.`;
    const result = await uploadImage("/api/bookings/upload", file);
    if ("error" in result) return result.error;
    onAdd(result.url);
    return null;
  };

  // Uploads one at a time, and always releases the "uploading" lock so the
  // client is never stuck on this step.
  const handleFiles = async (files: File[]) => {
    if (uploading || files.length === 0) return;
    setError("");
    setUploading(true);
    onUploadingChange?.(true);
    try {
      for (const file of files) {
        const err = await uploadOne(file);
        if (err) setError(err);
      }
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border border-dashed border-ink/20 py-8 px-4 text-center transition-colors ${
          uploading ? "cursor-wait" : "cursor-pointer hover:border-ink/40"
        }`}
      >
        {uploading ? (
          <p className="font-sans text-[13px] text-ink/55">Uploading…</p>
        ) : (
          <>
            <p className="font-sans text-[14px] text-ink/70">
              Drop a photo here or <span className="underline">browse</span>
            </p>
            <p className="font-sans text-[12px] text-ink/50 mt-1">
              JPG, PNG or iPhone photos
            </p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      {error && (
        <p className="font-sans text-[13px] text-red-500" role="alert">
          {error}
        </p>
      )}
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((url, i) => (
            <div key={i} className="relative group w-20 h-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbUrl(url)} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => onRemove(i)}
                aria-label="Remove photo"
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-ink text-paper text-[10px] flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
