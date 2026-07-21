"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SWIPE_THRESHOLD = 50;
const SNAP_MS = 220;

export function useLightboxSwipe(length: number) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [imgVisible, setImgVisible] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragTransition, setDragTransition] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const isTouch = useRef(false);

  useEffect(() => {
    isTouch.current = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  }, []);

  const open = useCallback((i: number) => {
    setLightboxIndex(i);
    if (isTouch.current) {
      setVisible(true);
      setImgVisible(true);
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setVisible(true);
      setTimeout(() => setImgVisible(true), 60);
    }));
  }, []);

  const close = useCallback(() => {
    if (isTouch.current) {
      setVisible(false);
      setImgVisible(false);
      setLightboxIndex(null);
      return;
    }
    setImgVisible(false);
    setVisible(false);
    setTimeout(() => setLightboxIndex(null), 350);
  }, []);

  const step = useCallback((dir: "prev" | "next") => {
    setLightboxIndex((i) =>
      i === null ? null : dir === "prev" ? (i - 1 + length) % length : (i + 1) % length
    );
  }, [length]);

  const navigate = useCallback((dir: "prev" | "next") => {
    if (isTouch.current) {
      step(dir);
      return;
    }
    setImgVisible(false);
    setTimeout(() => {
      step(dir);
      setTimeout(() => setImgVisible(true), 30);
    }, 180);
  }, [step]);

  const prev = useCallback(() => navigate("prev"), [navigate]);
  const next = useCallback(() => navigate("next"), [navigate]);

  const jumpTo = useCallback((i: number) => {
    if (isTouch.current) {
      setLightboxIndex(i);
      return;
    }
    setImgVisible(false);
    setTimeout(() => { setLightboxIndex(i); setTimeout(() => setImgVisible(true), 30); }, 180);
  }, []);

  // Keyboard
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, prev, next, close]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = lightboxIndex !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightboxIndex]);

  // Drag-follow swipe (touch devices only — mouse never fires touch events)
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setDragTransition(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    setDragX(e.touches[0].clientX - touchStartX.current);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;

    const width = window.innerWidth;
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      const dir: "prev" | "next" = dx < 0 ? "next" : "prev";
      setDragTransition(true);
      setDragX(dir === "next" ? -width : width);
      setTimeout(() => {
        step(dir);
        setDragTransition(false);
        setDragX(dir === "next" ? width : -width);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setDragTransition(true);
            setDragX(0);
          });
        });
      }, SNAP_MS);
    } else {
      setDragTransition(true);
      setDragX(0);
    }
  };

  return {
    lightboxIndex,
    visible,
    imgVisible,
    dragX,
    dragTransition,
    open,
    close,
    prev,
    next,
    jumpTo,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    isTouch,
    SNAP_MS,
  };
}
