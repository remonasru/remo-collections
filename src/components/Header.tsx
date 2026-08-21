import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Menu, Search, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { CATEGORIES, useStore } from "@/lib/store";

export function Header() {
  const { cart, wishlist } = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const cartCount = cart.reduce((a, c) => a + c.qty, 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: "/search", search: { q: q.trim() } });
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 gradient-brand text-primary-foreground shadow-card">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <button
          type="button"
          className="md:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        <Link to="/" className="shrink-0 font-display text-lg font-extrabold leading-none sm:text-xl">
          Remo <span className="opacity-80">Collections</span>
        </Link>

        <form onSubmit={submit} className="ml-2 hidden flex-1 md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for shirts, kurtis, kids wear…"
              className="w-full rounded-md bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none ring-accent focus:ring-2"
            />
          </div>
        </form>

        <nav className="ml-auto hidden items-center gap-5 text-sm font-semibold md:flex">
          {CATEGORIES.map((c) => (
            <Link key={c} to="/category/$slug" params={{ slug: c.toLowerCase() }} className="hover:opacity-80">
              {c}
            </Link>
          ))}
          <Link to="/admin" className="opacity-80 hover:opacity-100">
            Admin
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-4 md:ml-4">
          <Link to="/wishlist" className="relative" aria-label="Wishlist">
            <Heart className="h-6 w-6" />
            {wishlist.length > 0 && <Badge n={wishlist.length} />}
          </Link>
          <Link to="/cart" className="relative" aria-label="Cart">
            <ShoppingCart className="h-6 w-6" />
            {cartCount > 0 && <Badge n={cartCount} />}
          </Link>
        </div>
      </div>

      <div className="px-4 pb-3 md:hidden">
        <form onSubmit={submit}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products…"
              className="w-full rounded-md bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none"
            />
          </div>
        </form>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-primary-foreground/20 px-4 pb-3 text-sm font-semibold md:hidden">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              to="/category/$slug"
              params={{ slug: c.toLowerCase() }}
              onClick={() => setOpen(false)}
              className="py-2"
            >
              {c}
            </Link>
          ))}
          <Link to="/admin" onClick={() => setOpen(false)} className="py-2 opacity-80">
            Admin Panel
          </Link>
        </nav>
      )}
    </header>
  );
}

function Badge({ n }: { n: number }) {
  return (
    <span className="absolute -right-2 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-foreground">
      {n}
    </span>
  );
}
