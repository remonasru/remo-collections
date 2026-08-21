import { Link } from "@tanstack/react-router";
import { CATEGORIES } from "@/lib/store";

export function Footer() {
  return (
    <footer className="mt-16 gradient-brand text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <h3 className="font-display text-xl font-extrabold">Remo Collections</h3>
          <p className="mt-3 text-sm leading-relaxed opacity-90">
            No. 30 VAK Nagar, Arni - 632301,
            <br />
            Tiruvannamalai District.
          </p>
          <p className="mt-3 text-sm opacity-90">Phone / WhatsApp: +91 89032 06428</p>
        </div>
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wide opacity-80">Shop</h4>
          <ul className="mt-3 space-y-2 text-sm">
            {CATEGORIES.map((c) => (
              <li key={c}>
                <Link to="/category/$slug" params={{ slug: c.toLowerCase() }} className="opacity-90 hover:opacity-100">
                  {c}'s Collection
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wide opacity-80">Help</h4>
          <ul className="mt-3 space-y-2 text-sm opacity-90">
            <li>All over India Delivery</li>
            <li>Easy WhatsApp ordering</li>
            <li>
              <Link to="/admin" className="hover:opacity-100">
                Admin Login
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/20 py-4 text-center text-xs opacity-80">
        © {new Date().getFullYear()} Remo Collections. All rights reserved.
      </div>
    </footer>
  );
}
