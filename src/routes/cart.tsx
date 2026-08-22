import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ProductImage } from "@/components/ProductCard";
import {
  buildUpiUrl,
  buildWhatsAppMessage,
  clearCart,
  inr,
  placeOrder,
  removeFromCart,
  setCartQty,
  UPI_VPA,
  useStore,
  WHATSAPP_NUMBER,
} from "@/lib/store";

function openUrl(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
}


export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Shopping Cart — Remo Collections" },
      { name: "description", content: "Review your items and place your order on WhatsApp." },
      { property: "og:title", content: "Shopping Cart — Remo Collections" },
      { property: "og:description", content: "Review your items and place your order on WhatsApp." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { cart, products } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", phone: "", payment: "COD" as "COD" | "UPI" });
  const [done, setDone] = useState<{ wa: string; upi: string | null } | null>(null);

  const rows = cart
    .map((c) => ({ item: c, product: products.find((p) => p.id === c.productId) }))
    .filter((r) => r.product);

  const total = rows.reduce((a, r) => a + r.product!.price * r.item.qty, 0);

  function confirmOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim() || !/^[0-9+\s-]{10,15}$/.test(form.phone.trim())) {
      toast.error("Please enter a valid name, address and 10-digit mobile number");
      return;
    }
    const isUpi = form.payment === "UPI";
    const order = placeOrder({
      customer: {
        name: form.name.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        payment: isUpi ? `UPI (${UPI_VPA})` : "Cash on Delivery",
      },
      items: rows.map((r) => ({
        title: r.product!.title,
        size: r.item.size,
        qty: r.item.qty,
        price: r.product!.price,
      })),
      total,
    });

    const upi = isUpi ? buildUpiUrl(order.total, order.id) : null;
    const wa = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage(order))}`;

    // Trigger synchronously via a real link click (popup blockers swallow window.open)
    if (upi) {
      window.location.href = upi;
      setTimeout(() => openUrl(wa), 1200);
    } else {
      openUrl(wa);
    }

    setDone({ wa, upi });
    clearCart();
    setOpen(false);
    toast.success(isUpi ? "Opening your UPI app…" : "Order placed! Opening WhatsApp…");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold">Shopping Cart</h1>

      {done && (
        <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-card">
          <p className="font-display font-bold">Order placed successfully</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {done.upi
              ? "Complete the payment in your UPI app, then send the order details on WhatsApp."
              : "If WhatsApp didn't open automatically, tap the button below to send your order details."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {done.upi && (
              <a
                href={done.upi}
                className="inline-flex rounded-md bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-card"
              >
                Pay via UPI
              </a>
            )}
            <a
              href={done.wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-md bg-accent px-6 py-3 text-sm font-bold text-accent-foreground shadow-card"
            >
              Send order on WhatsApp
            </a>
          </div>
        </div>
      )}



      {rows.length === 0 ? (
        <p className="mt-6 text-muted-foreground">
          Your cart is empty.{" "}
          <Link to="/" className="font-semibold text-primary hover:underline">
            Continue shopping
          </Link>
        </p>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {rows.map(({ item, product }) => (
              <div key={item.id} className="flex gap-4 rounded-xl border border-border bg-card p-3 shadow-card">
                <Link
                  to="/product/$id"
                  params={{ id: product!.id }}
                  className="h-28 w-24 shrink-0 overflow-hidden rounded-md bg-secondary"
                >
                  <ProductImage product={product!} />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{product!.title}</p>
                  <p className="text-xs text-muted-foreground">Size: {item.size}</p>
                  <p className="mt-1 font-display font-bold">{inr(product!.price)}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center rounded-md border border-input">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => setCartQty(item.id, item.qty - 1)}
                        className="px-2 py-1"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => setCartQty(item.id, item.qty + 1)}
                        className="px-2 py-1"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-destructive"
                    >
                      <Trash2 className="h-4 w-4" /> Remove
                    </button>
                  </div>
                </div>
                <p className="font-display font-bold">{inr(product!.price * item.qty)}</p>
              </div>
            ))}
          </div>

          <aside className="h-fit rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="font-display text-lg font-bold">Price Details</h2>
            <div className="mt-4 space-y-2 text-sm">
              <Row label={`Items (${rows.reduce((a, r) => a + r.item.qty, 0)})`} value={inr(total)} />
              <Row label="Delivery" value="Free" />
              <div className="border-t border-border pt-3">
                <Row label="Total Amount" value={inr(total)} bold />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-5 w-full rounded-md bg-accent px-6 py-3 text-sm font-bold text-accent-foreground shadow-card"
            >
              Place Order
            </button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Order is confirmed over WhatsApp. All over India Delivery.
            </p>
          </aside>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 p-0 sm:items-center sm:p-4">
          <form
            onSubmit={confirmOrder}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-card p-5 shadow-float sm:rounded-2xl"
          >
            <h2 className="font-display text-xl font-bold">Delivery Details</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              We'll send your order to Remo Collections on WhatsApp.
            </p>
            <div className="mt-4 space-y-3">
              <Field label="Customer Name">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </Field>
              <Field label="Full Delivery Address">
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </Field>
              <Field label="Mobile Number">
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  inputMode="tel"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </Field>
              <Field label="Payment Preference">
                <select
                  value={form.payment}
                  onChange={(e) => setForm({ ...form, payment: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option>Cash on Delivery</option>
                  <option>UPI / Google Pay</option>
                  <option>Bank Transfer</option>
                </select>
              </Field>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-md bg-secondary px-3 py-2 text-sm font-bold">
              <span>Total</span>
              <span>{inr(total)}</span>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-md border border-input px-4 py-3 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-md bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
              >
                Confirm Order
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-display text-base font-bold" : ""}`}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
