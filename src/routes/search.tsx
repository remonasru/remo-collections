import { createFileRoute } from "@tanstack/react-router";
import { ProductCard } from "@/components/ProductCard";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({ q: String(search["q"] ?? "") }),
  head: () => ({
    meta: [
      { title: "Search Products — Remo Collections" },
      { name: "description", content: "Search shirts, kurtis, dresses and kids wear at Remo Collections." },
      { property: "og:title", content: "Search Products — Remo Collections" },
      { property: "og:description", content: "Find your next favourite outfit at Remo Collections." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const { products } = useStore();
  const term = q.trim().toLowerCase();
  const items = term
    ? products.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term),
      )
    : products;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold">
        {term ? `Results for “${q}”` : "All products"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{items.length} products</p>
      {items.length === 0 ? (
        <p className="mt-10 text-muted-foreground">No products matched your search.</p>
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
