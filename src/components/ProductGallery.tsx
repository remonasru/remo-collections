import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProductImage } from "@/components/ProductCard";
import type { Product } from "@/lib/store";

type Props = { product: Product };

export function ProductGallery({ product }: Props) {
  const images = product.images ?? [];
  const count = images.length;
  const [index, setIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [hoverZoom, setHoverZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const touchX = useRef<number | null>(null);

  const go = useCallback(
    (dir: -1 | 1) => {
      if (count < 2) return;
      setIndex((i) => (i + dir + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (index > count - 1) setIndex(0);
  }, [count, index]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setZoomOpen(false);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (count === 0) {
    return (
      <div className="aspect-4/5 overflow-hidden rounded-xl border border-border bg-secondary shadow-card">
        <ProductImage product={product} />
      </div>
    );
  }

  const current = images[Math.min(index, count - 1)]!;

  return (
    <div>
      <div
        className="group relative aspect-4/5 select-none overflow-hidden rounded-xl border border-border bg-secondary shadow-card"
        onTouchStart={(e) => {
          touchX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchX.current;
          const end = e.changedTouches[0]?.clientX ?? null;
          touchX.current = null;
          if (start == null || end == null) return;
          const dx = end - start;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
        onMouseEnter={() => setHoverZoom(true)}
        onMouseLeave={() => setHoverZoom(false)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - r.left) / r.width) * 100;
          const y = ((e.clientY - r.top) / r.height) * 100;
          setOrigin(`${x}% ${y}%`);
        }}
      >
        <img
          src={current}
          alt={`${product.title} — photo ${index + 1} of ${count}`}
          className="h-full w-full cursor-zoom-in object-cover transition-transform duration-200"
          style={{ transformOrigin: origin, transform: hoverZoom ? "scale(1.8)" : "scale(1)" }}
          onClick={() => setZoomOpen(true)}
        />

        <button
          type="button"
          aria-label="Open full screen view"
          onClick={() => setZoomOpen(true)}
          className="absolute right-3 top-3 rounded-full bg-background/85 p-2 text-foreground shadow-card"
        >
          <ZoomIn className="h-4 w-4" />
        </button>

        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/85 p-2 shadow-card transition-opacity hover:bg-background"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/85 p-2 shadow-card transition-opacity hover:bg-background"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-background/70 px-2 py-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to image ${i + 1}`}
                  aria-current={i === index}
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === index ? "w-5 bg-primary" : "w-2 bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show image ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-20 w-16 shrink-0 overflow-hidden rounded-md border-2 ${
                i === index ? "border-primary" : "border-border"
              }`}
            >
              <img src={img} alt={`${product.title} thumbnail ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {zoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${product.title} image viewer`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/90 p-4"
          onClick={() => setZoomOpen(false)}
        >
          <button
            type="button"
            aria-label="Close image viewer"
            onClick={() => setZoomOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-background p-2 shadow-card"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={current}
            alt={`${product.title} enlarged photo ${index + 1}`}
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {count > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-background p-3 shadow-card"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-background p-3 shadow-card"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
