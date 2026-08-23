import { createFileRoute, notFound } from "@tanstack/react-router";
import { PackageSearch } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import {
  applyFilters,
  emptyFilters,
  activeCount,
  FilterPanel,
  MobileFilterButton,
  type Filters,
  type SortKey,
} from "@/components/ProductFilters";
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
          content: `Browse the latest ${c.toLowerCase()}'s fashion at Remo Collections. Filter by sub-category, size, colour, fabric and price.`,
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
  const [sort, setSort] = useState<SortKey>("new");
  const [filters, setFilters] = useState<Filters>(emptyFilters());

  const items = useMemo(
    () => applyFilters(products.filter((p) => p.category === category), filters, sort),
    [products, category, filters, sort],
  );
  const n = activeCount(filters);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold">{category}'s Collection</h1>
      <p className="mt-1 text-sm text-muted-foreground">{items.length} products found</p>

      <div className="mt-6 flex gap-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-lg font-extrabold">Filters</p>
              {n > 0 && <span className="text-xs font-bold text-primary">{n} active</span>}
            </div>
            <FilterPanel category={category} filters={filters} setFilters={setFilters} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card">
            <MobileFilterButton category={category} filters={filters} setFilters={setFilters} />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              aria-label="Sort products"
            >
              <option value="new">Newest Arrivals</option>
              <option value="low">Price: Low to High</option>
              <option value="high">Price: High to Low</option>
              <option value="popular">Popularity / Rating</option>
            </select>
            {n > 0 && (
              <button
                type="button"
                onClick={() => setFilters(emptyFilters())}
                className="text-sm font-semibold text-primary"
              >
                Clear All Filters
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="mt-10 flex flex-col items-center rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <PackageSearch className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 font-display text-lg font-bold">No products found matching your filters</p>
              <p className="mt-1 text-sm text-muted-foreground">Try widening your price range or clearing filters.</p>
              <button
                type="button"
                onClick={() => setFilters(emptyFilters())}
                className="mt-5 rounded-md bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

