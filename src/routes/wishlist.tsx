import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductCard } from "@/components/ProductCard";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "My Wishlist — Remo Collections" },
      { name: "description", content: "Your saved favourite outfits at Remo Collections." },
      { property: "og:title", content: "My Wishlist — Remo Collections" },
      { property: "og:description", content: "Your saved favourite outfits at Remo Collections." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { products, wishlist } = useStore();
  const items = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold">My Wishlist</h1>
      {items.length === 0 ? (
        <p className="mt-6 text-muted-foreground">
          Nothing saved yet.{" "}
          <Link to="/" className="font-semibold text-primary hover:underline">
            Start shopping
          </Link>
</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
