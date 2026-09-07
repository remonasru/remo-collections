import { SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  ACCESSORY_GROUPS,
  ALL_SIZES,
  COLORS,
  FABRICS,
  OCCASIONS,
  RECIPIENTS,
  SUBCATEGORIES,
  avgRating,
  inr,
  type Category,
  type Product,
} from "@/lib/store";

export type SortKey = "new" | "low" | "high" | "popular";

export type Filters = {
  subs: string[];
  sizes: string[];
  colors: string[];
  fabrics: string[];
  recipients: string[];
  occasions: string[];
  maxPrice: number;
  minPrice: number;
  inStockOnly: boolean;
};

export const PRICE_MIN = 99;
export const PRICE_MAX = 4999;

export function emptyFilters(): Filters {
  return {
    subs: [],
    sizes: [],
    colors: [],
    fabrics: [],
    recipients: [],
    occasions: [],
    minPrice: PRICE_MIN,
    maxPrice: PRICE_MAX,
    inStockOnly: false,
  };
}

export function activeCount(f: Filters) {
  return (
    f.subs.length +
    f.sizes.length +
    f.colors.length +
    f.fabrics.length +
    f.recipients.length +
    f.occasions.length +
    (f.inStockOnly ? 1 : 0) +
    (f.maxPrice !== PRICE_MAX || f.minPrice !== PRICE_MIN ? 1 : 0)
  );
}

export function applyFilters(products: Product[], f: Filters, sort: SortKey) {
  const items = products.filter((p) => {
    if (f.subs.length && !f.subs.includes(p.subCategory)) return false;
    if (f.sizes.length && !f.sizes.some((s) => p.sizes.includes(s))) return false;
    if (f.colors.length && !f.colors.some((c) => p.colors.includes(c))) return false;
    if (f.fabrics.length && !f.fabrics.includes(p.fabric)) return false;
    if (f.recipients.length && !f.recipients.includes(p.recipient)) return false;
    if (f.occasions.length && !f.occasions.includes(p.occasion)) return false;
    if (p.price < f.minPrice || p.price > f.maxPrice) return false;
    if (f.inStockOnly && !p.inStock) return false;
    return true;
  });
  return items.sort((a, b) => {
    if (sort === "low") return a.price - b.price;
    if (sort === "high") return b.price - a.price;
    if (sort === "popular") return avgRating(b) - avgRating(a) || b.reviews.length - a.reviews.length;
    return b.createdAt - a.createdAt;
  });
}

function toggle(list: string[], v: string) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

export function FilterPanel({
  category,
  filters,
  setFilters,
}: {
  category: Category;
  filters: Filters;
  setFilters: (f: Filters) => void;
}) {
  const subs = useMemo(() => SUBCATEGORIES[category], [category]);
  const isGifts = category === "Accessories";
  const set = (patch: Partial<Filters>) => setFilters({ ...filters, ...patch });

  return (
    <div className="space-y-6">
      {isGifts ? (
        <>
          {ACCESSORY_GROUPS.map((g) => (
            <Section key={g.group} title={g.group}>
              <div className="space-y-1.5">
                {g.items.map((i) => {
                  const value = `${g.group} \u203a ${i}`;
                  return (
                    <Check
                      key={value}
                      label={i}
                      checked={filters.subs.includes(value)}
                      onChange={() => set({ subs: toggle(filters.subs, value) })}
                    />
                  );
                })}
              </div>
            </Section>
          ))}

          <Section title="Gift By Recipient">
            <div className="flex flex-wrap gap-2">
              {RECIPIENTS.map((r) => (
                <Pill
                  key={r}
                  label={r}
                  on={filters.recipients.includes(r)}
                  onClick={() => set({ recipients: toggle(filters.recipients, r) })}
                />
              ))}
            </div>
          </Section>

          <Section title="Occasion">
            <div className="flex flex-wrap gap-2">
              {OCCASIONS.map((o) => (
                <Pill
                  key={o}
                  label={o}
                  on={filters.occasions.includes(o)}
                  onClick={() => set({ occasions: toggle(filters.occasions, o) })}
                />
              ))}
            </div>
          </Section>
        </>
      ) : (
        <Section title="Sub-Category">
          <div className="space-y-1.5">
            {subs.map((s) => (
              <Check
                key={s}
                label={s}
                checked={filters.subs.includes(s)}
                onChange={() => set({ subs: toggle(filters.subs, s) })}
              />
            ))}
          </div>
        </Section>
      )}

      <Section title="Size">
        <div className="flex flex-wrap gap-2">
          {ALL_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => set({ sizes: toggle(filters.sizes, s) })}
              className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold ${
                filters.sizes.includes(s)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </Section>

      <Section title={`Price: ${inr(filters.minPrice)} – ${inr(filters.maxPrice)}`}>
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={100}
          value={filters.maxPrice}
          onChange={(e) => set({ maxPrice: Math.max(Number(e.target.value), filters.minPrice) })}
          aria-label="Maximum price"
          className="w-full accent-primary"
        />
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={100}
          value={filters.minPrice}
          onChange={(e) => set({ minPrice: Math.min(Number(e.target.value), filters.maxPrice) })}
          aria-label="Minimum price"
          className="mt-2 w-full accent-primary"
        />
      </Section>

      <Section title="Colour">
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => {
            const on = filters.colors.includes(c.name);
            return (
              <button
                key={c.name}
                type="button"
                title={c.name}
                aria-label={c.name}
                aria-pressed={on}
                onClick={() => set({ colors: toggle(filters.colors, c.name) })}
                className={`h-8 w-8 rounded-full border-2 ${on ? "border-primary ring-2 ring-primary/40" : "border-border"}`}
                style={{ backgroundColor: c.hex }}
              />
            );
          })}
        </div>
      </Section>

      {!isGifts && (
        <Section title="Fabric">
          <div className="space-y-1.5">
            {FABRICS.map((f) => (
              <Check
                key={f}
                label={f}
                checked={filters.fabrics.includes(f)}
                onChange={() => set({ fabrics: toggle(filters.fabrics, f) })}
              />
            ))}
          </div>
        </Section>
      )}

      <Check
        label="In stock only"
        checked={filters.inStockOnly}
        onChange={() => set({ inStockOnly: !filters.inStockOnly })}
      />

      <button
        type="button"
        onClick={() => setFilters(emptyFilters())}
        className="w-full rounded-md border border-input px-4 py-2.5 text-sm font-bold"
      >
        Clear All Filters
      </button>
    </div>
  );
}

export function MobileFilterButton({
  category,
  filters,
  setFilters,
}: {
  category: Category;
  filters: Filters;
  setFilters: (f: Filters) => void;
}) {
  const [open, setOpen] = useState(false);
  const n = activeCount(filters);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" /> Filters{n > 0 ? ` (${n})` : ""}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            className="flex-1 bg-foreground/40"
            onClick={() => setOpen(false)}
          />
          <div className="w-[85%] max-w-sm overflow-y-auto bg-card p-4 shadow-float">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-lg font-extrabold">Filters</p>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <FilterPanel category={category} filters={filters} setFilters={setFilters} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 w-full rounded-md bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
            >
              Show results
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-primary" />
      {label}
    </label>
  );
}

function Pill({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
        on ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background"
      }`}
    >
      {label}
    </button>
  );
}
