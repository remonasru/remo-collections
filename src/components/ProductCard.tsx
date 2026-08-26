import { Link } from "@tanstack/react-router";
import { Heart, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { avgRating, discountPct, inr, toggleWishlist, useStore, type Product } from "@/lib/store";

export function ProductImage({ product, className }: { product: Product; className?: string }) {
  const src = product.images?.[0];
  const [broken, setBroken] = useState(false);

  // A newly saved photo replaces a previously broken one — retry rendering it.
  useEffect(() => setBroken(false), [src]);

  if (src && !broken) {
    return (
      <img
        src={src}
        alt={product.title}
        loading="lazy"
        decoding="async"
        onError={() => setBroken(true)}
        className={className ?? "h-full w-full object-cover"}
      />
    );
  }
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-secondary ${className ?? ""}`}
    >
      <span className="line-clamp-3 px-2 text-center font-display text-[11px] font-semibold leading-tight text-muted-foreground sm:text-sm">
        {product.title}
      </span>
    </div>
  );
}


export function ProductCard({ product }: { product: Product }) {
  const { wishlist } = useStore();
  const wished = wishlist.includes(product.id);
  const pct = discountPct(product);
  const rating = avgRating(product);

  return (
    <div className="card-hover group relative overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <button
        type="button"
        aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        onClick={() => toggleWishlist(product.id)}
        className="absolute right-2 top-2 z-10 rounded-full bg-background/90 p-2 text-muted-foreground shadow-card transition-colors hover:text-accent"
      >
        <Heart className={`h-4 w-4 ${wished ? "fill-accent text-accent" : ""}`} />
      </button>

      <Link to="/product/$id" params={{ id: product.id }} className="block">
        <div className="aspect-4/5 overflow-hidden bg-secondary">
          <ProductImage product={product} />
        </div>
        <div className="space-y-1 p-3">
          <p className="truncate text-sm font-semibold">{product.title}</p>
          <p className="text-xs text-muted-foreground">{product.category}</p>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-display text-base font-bold">{inr(product.price)}</span>
            {pct > 0 && (
              <>
                <span className="text-xs text-muted-foreground line-through">{inr(product.mrp)}</span>
                <span className="text-xs font-semibold text-success">{pct}% off</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 pt-1">
            {rating > 0 ? (
              <span className="inline-flex items-center gap-1 rounded bg-success px-1.5 py-0.5 text-[11px] font-semibold text-success-foreground">
                {rating.toFixed(1)} <Star className="h-3 w-3 fill-current" />
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">No ratings yet</span>
            )}
            {!product.inStock && (
              <span className="text-[11px] font-semibold text-destructive">Out of Stock</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
