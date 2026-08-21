import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES, useStore, type Category } from "@/lib/store";

export const Route = createFileRoute("/category/$slug")({
  loader: ({ params }) => {
    const match = CATEGORIES.find((c) => c.toLowerCase() === params.slug.toLowerCase());
    if (!match) throw notFound();
    return { category: match };
  },
  head: ({ loaderData }) => {
    const c = loaderData?.category;
    if (!c) {
      return { meta: [{ title: "Category not found — Remo Collections" }, { name: "robots", content: "noindex" }] };
    }
    return {
      meta: [
        { title: `${c}'s Clothing Online — Remo Collections` },
        {
          name: "description",
          content: `Browse the latest ${c.toLowerCase()}'s fashion at Remo Collections. Great prices and all over India delivery.`,
        },
        { property: "og:title", content: `${c}'s Collection — Remo Collections` },
        { property: "og:description", content: `Shop trending ${c.toLowerCase()}'s wear online.` },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useLoaderData() as { category: Category };
  const { products } = useStore();
  const [sort, setSort] = useState("new");
  const [maxPrice, setMaxPrice] = useState(0);
  const [onlyStock, setOnlyStock] = useState(false);

  let items = products.filter((p) => p.category === category);
  if (maxPrice > 0) items = items.filter((p) => p.price <= maxPrice);
  if (onlyStock) items = items.filter((p) => p.inStock);
  items = [...items].sort((a, b) =>
    sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : b.createdAt - a.createdAt,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold">{category}'s Collection</h1>
      <p className="mt-1 text-sm text-muted-foreground">{items.length} products found</p>

      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          aria-label="Sort products"
        >
          <option value="new">Newest first</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
        </select>
        <select
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          aria-label="Filter by price"
        >
          <option value={0}>All prices</option>
          <option value={500}>Under ₹500</option>
          <option value={1000}>Under ₹1,000</option>
          <option value={2000}>Under ₹2,000</option>
        </select>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={onlyStock} onChange={(e) => setOnlyStock(e.target.checked)} />
          In stock only
        </label>
      </div>

      {items.length === 0 ? (
        <p className="mt-10 text-muted-foreground">No products in this category yet.</p>
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
