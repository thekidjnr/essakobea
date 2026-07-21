"use client";

import { useRef, useState } from "react";
import Image from "next/image";

const AXIS_LOCK_PX        = 10;   // movement needed before we decide horizontal drag vs. vertical scroll (and below which a release counts as a tap)
const SWIPE_DISTANCE_FRAC = 0.2;  // drag past 20% of the card width commits to the next slide
const SWIPE_VELOCITY      = 0.5;  // px/ms flick speed that commits regardless of distance

export default function ImageCarousel({
  images,
  alt,
  position,
  aspectClassName = "aspect-[4/3]",
  number,
  onTap,
  ariaLabel,
  imageClassName = "",
  onDraggingChange,
}: {
  images: string[];
  alt: string;
  position: string;
  aspectClassName?: string;
  number?: string;
  onTap?: () => void;
  ariaLabel?: string;
  imageClassName?: string;
  onDraggingChange?: (dragging: boolean) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [dragging, setDraggingState] = useState(false);

  const setDragging = (v: boolean) => {
    setDraggingState(v);
    onDraggingChange?.(v);
  };

  const drag = useRef({
    active: false,
    axis: null as "x" | "y" | null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0,
  });

  const basePercent = (index / images.length) * 100;
  const goTo = (next: number) => setIndex(Math.max(0, Math.min(images.length - 1, next)));

  const onPointerDown = (e: React.PointerEvent) => {
    if (images.length <= 1) return;
    drag.current = { active: true, axis: null, startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastT: e.timeStamp, velocity: 0 };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;

    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    if (d.axis === null) {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
      d.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (d.axis === "x") {
        setDragging(true);
        try {
          (e.target as Element).setPointerCapture?.(e.pointerId);
        } catch {
          // Some browsers throw for pointer ids not associated with an active native gesture — safe to ignore.
        }
      } else {
        d.active = false;
        return;
      }
    }
    if (d.axis !== "x") return;

    e.preventDefault();
    const dt = e.timeStamp - d.lastT;
    if (dt > 0) d.velocity = (e.clientX - d.lastX) / dt;
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;

    // Rubber-band resistance past the first/last slide
    const offset = (index === 0 && dx > 0) || (index === images.length - 1 && dx < 0) ? dx / 3 : dx;

    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(calc(-${basePercent}% + ${offset}px))`;
    }
  };

  const endDrag = () => {
    const d = drag.current;
    const wasDrag = d.axis !== null;
    d.active = false;
    setDragging(false);
    return wasDrag;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    const dx = e.clientX - d.startX;

    if (d.axis === "x") {
      const width = containerRef.current?.getBoundingClientRect().width ?? 0;
      const committed = Math.abs(dx) > width * SWIPE_DISTANCE_FRAC || Math.abs(d.velocity) > SWIPE_VELOCITY;
      goTo(committed ? index + (dx < 0 ? 1 : -1) : index);
    }

    if (!endDrag()) onTap?.();
  };

  const onPointerCancel = () => {
    goTo(index);
    endDrag();
  };

  return (
    <div
      ref={containerRef}
      role={onTap ? "link" : undefined}
      tabIndex={onTap ? 0 : undefined}
      aria-label={ariaLabel}
      onKeyDown={onTap ? (e) => { if (e.key === "Enter" || e.key === " ") onTap(); } : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      style={{ touchAction: "pan-y" }}
      className={`relative overflow-hidden bg-mist select-none ${aspectClassName}`}
    >
      <div
        ref={trackRef}
        className="flex h-full"
        style={{
          width: `${images.length * 100}%`,
          transform: `translateX(-${basePercent}%)`,
          transition: dragging ? "none" : "transform 320ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {images.map((src, i) => (
          <div key={src + i} className="relative h-full" style={{ width: `${100 / images.length}%` }}>
            <Image
              src={src}
              alt={alt}
              fill
              draggable={false}
              className={`object-cover ${position} ${imageClassName}`}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        ))}
      </div>

      {number && (
        <span className="absolute top-5 left-5 font-sans text-[10px] tracking-widest text-paper/70 bg-ink/40 backdrop-blur-sm px-2.5 py-1 pointer-events-none">
          {number}
        </span>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none">
          {images.map((_, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full bg-paper transition-opacity duration-300 ${
                i === index ? "opacity-100" : "opacity-40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
