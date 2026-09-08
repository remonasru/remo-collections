import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Truck, Sparkles } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import catMen from "@/assets/cat-men.jpg";
import catWomen from "@/assets/cat-women.jpg";
import catKids from "@/assets/cat-kids.jpg";
import catAccessories from "@/assets/cat-accessories.jpg";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES, CATEGORY_HEADINGS, CATEGORY_LABELS, useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Remo Collections — Trendy Clothing for Men, Women & Kids" },
      {
        name: "description",
        content:
          "Shop premium men's, women's and kids' fashion at Remo Collections, Arni. Best prices, all over India delivery and easy WhatsApp ordering.",
      },
      { property: "og:title", content: "Remo Collections — Online Clothing Store" },
      {
        property: "og:description",
        content: "Trendy shirts, kurtis, dresses and kids wear with all over India delivery.",
      },
    ],
  }),
  component: Home,
});

const catImages: Record<string, string> = {
  Men: catMen,
  Women: catWomen,
  Kids: catKids,
  Accessories: catAccessories,
};

function Home() {
  const { products } = useStore();
  const featured = [...products].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);

  return (
    <div>
      <section className="gradient-brand text-primary-foreground">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 md:grid-cols-2 md:py-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-background/15 px-3 py-1 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> New Season Arrivals
            </span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight sm:text-5xl">
              Style that speaks.
              <br />
              Prices that smile.
            </h1>
            <p className="mt-4 max-w-md text-sm opacity-90 sm:text-base">
              Discover the trending collection at Remo Collections — up to 45% off on men's, women's
              and kids' fashion. Delivered all over India.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/category/$slug"
                params={{ slug: "women" }}
                className="rounded-md bg-accent px-5 py-3 text-sm font-bold text-accent-foreground shadow-float transition-transform hover:-translate-y-0.5"
              >
                Shop Women
              </Link>
              <Link
                to="/category/$slug"
                params={{ slug: "men" }}
                className="rounded-md bg-background px-5 py-3 text-sm font-bold text-primary transition-transform hover:-translate-y-0.5"
              >
                Shop Men
              </Link>
            </div>
          </div>
          <img
            src={heroImg}
            alt="Models wearing Remo Collections outfits"
            width={1920}
            height={1080}
            className="rounded-xl shadow-float"
          />
        </div>
      </section>

      <section className="border-b border-border bg-secondary">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 text-sm sm:grid-cols-3">
          <Feature icon={<Truck className="h-5 w-5" />} title="All over India Delivery" />
          <Feature icon={<ShieldCheck className="h-5 w-5" />} title="Quality checked products" />
          <Feature icon={<Sparkles className="h-5 w-5" />} title="Order instantly on WhatsApp" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="font-display text-2xl font-bold">Shop by category</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              to="/category/$slug"
              params={{ slug: c.toLowerCase() }}
              className="card-hover group relative overflow-hidden rounded-xl border border-border shadow-card"
            >
              <img
                src={catImages[c]}
                alt={`${CATEGORY_LABELS[c]} collection`}
                loading="lazy"
                width={800}
                height={1000}
                className="aspect-4/3 w-full object-cover object-top"
              />
              <div className="absolute inset-x-0 bottom-0 gradient-brand p-4">
                <p className="font-display text-lg font-bold text-primary-foreground">{CATEGORY_LABELS[c]}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {CATEGORIES.map((c) => {
        const items = products.filter((p) => p.category === c).slice(0, 4);
        if (!items.length) return null;
        return (
          <section key={c} className="mx-auto max-w-7xl px-4 py-6">
            <div className="flex items-end justify-between">
              <h2 className="font-display text-2xl font-bold">{CATEGORY_HEADINGS[c]}</h2>
              <Link
                to="/category/$slug"
                params={{ slug: c.toLowerCase() }}
                className="text-sm font-semibold text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        );
      })}

      <section className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="font-display text-2xl font-bold">Latest arrivals</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Feature({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center justify-center gap-2 font-semibold text-secondary-foreground">
      <span className="text-accent">{icon}</span>
      {title}
    </div>
  );
}
