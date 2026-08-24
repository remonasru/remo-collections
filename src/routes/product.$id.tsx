import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Heart, Star, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ProductImage } from "@/components/ProductCard";
import {
  addReview,
  addToCart,
  avgRating,
  discountPct,
  inr,
  toggleWishlist,
  useStore,
} from "@/lib/store";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Product Details — Remo Collections" },
      {
        name: "description",
        content: "View product details, sizes, reviews and pricing at Remo Collections.",
      },
      { property: "og:title", content: "Product Details — Remo Collections" },
      { property: "og:description", content: "Sizes, reviews and pricing at Remo Collections." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { products, wishlist } = useStore();
  const navigate = useNavigate();
  const product = products.find((p) => p.id === id);
  const [size, setSize] = useState("");
  const [activeImg, setActiveImg] = useState(0);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [text, setText] = useState("");

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Product not found</h1>
        <Link to="/" className="mt-4 inline-block font-semibold text-primary hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  const pct = discountPct(product);
  const avg = avgRating(product);
  const wished = wishlist.includes(product.id);

  function requireSize() {
    if (!product!.sizes.length) return true;
    if (!size) {
      toast.error("Please select a size first");
      return false;
    }
    return true;
  }

  function handleAdd(buyNow = false) {
    if (!product!.inStock) {
      toast.error("This product is currently out of stock");
      return;
    }
    if (!requireSize()) return;
    addToCart(product!.id, size || "Free Size", 1);
    if (buyNow) navigate({ to: "/cart" });
    else toast.success("Added to cart");
  }

  function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !text.trim()) {
      toast.error("Please add your name and review");
      return;
    }
    addReview(product!.id, { name: name.trim(), rating, text: text.trim() });
    setName("");
    setText("");
    setRating(5);
    toast.success("Thanks for your review!");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery product={product} />

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">{product.category}</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold">{product.title}</h1>

          <div className="mt-2 flex items-center gap-3">
            {avg > 0 && (
              <span className="inline-flex items-center gap-1 rounded bg-success px-2 py-0.5 text-xs font-bold text-success-foreground">
                {avg.toFixed(1)} <Star className="h-3 w-3 fill-current" />
              </span>
            )}
            <span className="text-sm text-muted-foreground">{product.reviews.length} reviews</span>
            <span
              className={`text-sm font-semibold ${product.inStock ? "text-success" : "text-destructive"}`}
            >
              {product.inStock ? "In Stock" : "Out of Stock"}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="font-display text-3xl font-extrabold">{inr(product.price)}</span>
            {pct > 0 && (
              <>
                <span className="text-lg text-muted-foreground line-through">{inr(product.mrp)}</span>
                <span className="text-lg font-bold text-success">{pct}% off</span>
              </>
            )}
          </div>

          {product.sizes.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-bold">Select Size</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`h-11 w-14 rounded-md border text-sm font-semibold transition-colors ${
                      size === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background hover:border-primary"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <h2 className="text-sm font-bold">Product Description</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-bold text-secondary-foreground">
              <Truck className="h-4 w-4 text-accent" /> All over India Delivery
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleAdd(false)}
              className="flex-1 rounded-md border-2 border-primary px-6 py-3 text-sm font-bold text-primary transition-colors hover:bg-secondary"
            >
              Add to Cart
            </button>
            <button
              type="button"
              onClick={() => handleAdd(true)}
              className="flex-1 rounded-md bg-accent px-6 py-3 text-sm font-bold text-accent-foreground shadow-card transition-transform hover:-translate-y-0.5"
            >
              Buy Now
            </button>
            <button
              type="button"
              aria-label="Toggle wishlist"
              onClick={() => toggleWishlist(product.id)}
              className="rounded-md border border-input px-4 py-3"
            >
              <Heart className={`h-5 w-5 ${wished ? "fill-accent text-accent" : "text-muted-foreground"}`} />
            </button>
          </div>
        </div>
      </div>

      <section className="mt-12 max-w-3xl">
        <h2 className="font-display text-2xl font-bold">Ratings & Reviews</h2>

        <form onSubmit={submitReview} className="mt-4 space-y-3 rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`Rate ${n} star`}
                onClick={() => setRating(n)}
                className="p-0.5"
              >
                <Star
                  className={`h-6 w-6 ${n <= rating ? "fill-warning text-warning" : "text-muted-foreground"}`}
                />
              </button>
            ))}
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your experience with this product…"
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
          >
            Submit Review
          </button>
        </form>

        <div className="mt-6 space-y-4">
          {product.reviews.length === 0 && (
            <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review!</p>
          )}
          {product.reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded bg-success px-1.5 py-0.5 text-xs font-bold text-success-foreground">
                  {r.rating} <Star className="h-3 w-3 fill-current" />
                </span>
                <span className="text-sm font-semibold">{r.name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.createdAt).toLocaleDateString("en-IN")}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
