import { useSyncExternalStore } from "react";

export type Category = "Men" | "Women" | "Kids";
export const CATEGORIES: Category[] = ["Men", "Women", "Kids"];
export const SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export type Size = (typeof SIZES)[number];

export type Review = {
  id: string;
  name: string;
  rating: number;
  text: string;
  createdAt: number;
};

export type Product = {
  id: string;
  title: string;
  category: Category;
  price: number;
  mrp: number;
  description: string;
  sizes: string[];
  images: string[];
  inStock: boolean;
  reviews: Review[];
  createdAt: number;
};

export type CartItem = {
  id: string;
  productId: string;
  size: string;
  qty: number;
};

export type OrderStatus = "Pending" | "Shipped" | "Delivered";

export type Order = {
  id: string;
  customer: { name: string; address: string; phone: string; payment: string };
  items: { title: string; size: string; qty: number; price: number }[];
  total: number;
  status: OrderStatus;
  createdAt: number;
};

export type StoreState = {
  products: Product[];
  cart: CartItem[];
  wishlist: string[];
  orders: Order[];
};

const KEY = "remo-collections-v1";

export const WHATSAPP_NUMBER = "918903206428";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function seedProducts(): Product[] {
  const base = [
    {
      title: "Classic Cotton Formal Shirt",
      category: "Men" as Category,
      price: 899,
      mrp: 1499,
      description:
        "Premium breathable cotton formal shirt with a tailored fit. Perfect for office wear and occasions. Machine washable, colour-fast fabric.",
    },
    {
      title: "Slim Fit Denim Jeans",
      category: "Men" as Category,
      price: 1199,
      mrp: 1999,
      description:
        "Stretchable slim-fit denim with reinforced stitching and five-pocket styling. All-day comfort with a sharp silhouette.",
    },
    {
      title: "Rose Pink Designer Kurti",
      category: "Women" as Category,
      price: 999,
      mrp: 1799,
      description:
        "Soft rayon kurti with delicate thread work and a flattering A-line cut. Light, airy and made for everyday elegance.",
    },
    {
      title: "Floral Printed Maxi Dress",
      category: "Women" as Category,
      price: 1349,
      mrp: 2299,
      description:
        "Flowy georgette maxi dress with an all-over floral print, elasticated waist and full-length flare.",
    },
    {
      title: "Kids Cotton T-Shirt Combo",
      category: "Kids" as Category,
      price: 649,
      mrp: 1099,
      description:
        "Pack of soft skin-friendly cotton t-shirts in bright colours. Durable stitching that survives playtime and washes.",
    },
    {
      title: "Kids Denim Dungaree Set",
      category: "Kids" as Category,
      price: 899,
      mrp: 1599,
      description:
        "Adorable denim dungaree with adjustable straps and a matching inner tee. Comfortable fit for active kids.",
    },
  ];
  return base.map((b, i) => ({
    ...b,
    id: `seed-${i + 1}`,
    sizes: [...SIZES],
    images: [],
    inStock: true,
    reviews: [],
    createdAt: Date.now() - i * 1000,
  }));
}

const initial: StoreState = {
  products: seedProducts(),
  cart: [],
  wishlist: [],
  orders: [],
};

let state: StoreState = initial;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoreState>;
      state = {
        products: parsed.products ?? initial.products,
        cart: parsed.cart ?? [],
        wishlist: parsed.wishlist ?? [],
        orders: parsed.orders ?? [],
      };
    }
  } catch {
    /* ignore corrupt storage */
  }
}

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota exceeded */
  }
}

/* ---------- staged (draft) mode for the admin panel ---------- */
let staging = false;
let dirty = false;

function notify() {
  listeners.forEach((l) => l());
}

function setState(updater: (s: StoreState) => StoreState) {
  load();
  state = updater(state);
  if (staging) dirty = true;
  else persist();
  notify();
}

export function setStaging(on: boolean) {
  staging = on;
  if (!on) dirty = false;
  notify();
}

export function commitChanges() {
  persist();
  dirty = false;
  notify();
}

export function discardChanges() {
  loaded = false;
  state = initial;
  load();
  dirty = false;
  notify();
}

export function useDirty(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => dirty,
    () => false,
  );
}

function subscribe(cb: () => void) {
  load();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const serverSnapshot: StoreState = initial;
function getSnapshot() {
  load();
  return state;
}

export function useStore(): StoreState {
  return useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
}


/* ---------- products ---------- */
export function addProduct(p: Omit<Product, "id" | "reviews" | "createdAt">) {
  setState((s) => ({
    ...s,
    products: [{ ...p, id: uid(), reviews: [], createdAt: Date.now() }, ...s.products],
  }));
}

export function updateProduct(id: string, patch: Partial<Product>) {
  setState((s) => ({
    ...s,
    products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  }));
}

export function deleteProduct(id: string) {
  setState((s) => ({
    ...s,
    products: s.products.filter((p) => p.id !== id),
    cart: s.cart.filter((c) => c.productId !== id),
    wishlist: s.wishlist.filter((w) => w !== id),
  }));
}

export function addReview(productId: string, review: Omit<Review, "id" | "createdAt">) {
  setState((s) => ({
    ...s,
    products: s.products.map((p) =>
      p.id === productId
        ? { ...p, reviews: [{ ...review, id: uid(), createdAt: Date.now() }, ...p.reviews] }
        : p,
    ),
  }));
}

/* ---------- cart ---------- */
export function addToCart(productId: string, size: string, qty = 1) {
  setState((s) => {
    const existing = s.cart.find((c) => c.productId === productId && c.size === size);
    if (existing) {
      return {
        ...s,
        cart: s.cart.map((c) => (c.id === existing.id ? { ...c, qty: c.qty + qty } : c)),
      };
    }
    return { ...s, cart: [...s.cart, { id: uid(), productId, size, qty }] };
  });
}

export function setCartQty(id: string, qty: number) {
  setState((s) => ({
    ...s,
    cart: qty <= 0 ? s.cart.filter((c) => c.id !== id) : s.cart.map((c) => (c.id === id ? { ...c, qty } : c)),
  }));
}

export function removeFromCart(id: string) {
  setState((s) => ({ ...s, cart: s.cart.filter((c) => c.id !== id) }));
}

export function clearCart() {
  setState((s) => ({ ...s, cart: [] }));
}

/* ---------- wishlist ---------- */
export function toggleWishlist(productId: string) {
  setState((s) => ({
    ...s,
    wishlist: s.wishlist.includes(productId)
      ? s.wishlist.filter((w) => w !== productId)
      : [...s.wishlist, productId],
  }));
}

/* ---------- orders ---------- */
export function placeOrder(order: Omit<Order, "id" | "createdAt" | "status">): Order {
  const full: Order = { ...order, id: uid(), createdAt: Date.now(), status: "Pending" };
  setState((s) => ({ ...s, orders: [full, ...s.orders] }));
  return full;
}

export function setOrderStatus(id: string, status: OrderStatus) {
  setState((s) => ({
    ...s,
    orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)),
  }));
}

/* ---------- helpers ---------- */
export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function discountPct(p: Product) {
  if (!p.mrp || p.mrp <= p.price) return 0;
  return Math.round(((p.mrp - p.price) / p.mrp) * 100);
}

export function avgRating(p: Product) {
  if (!p.reviews.length) return 0;
  return p.reviews.reduce((a, r) => a + r.rating, 0) / p.reviews.length;
}

export function buildWhatsAppMessage(order: Order) {
  const lines = [
    "*NEW ORDER — Remo Collections*",
    "",
    `*Name:* ${order.customer.name}`,
    `*Mobile:* ${order.customer.phone}`,
    `*Address:* ${order.customer.address}`,
    `*Payment:* ${order.customer.payment}`,
    "",
    "*Items:*",
    ...order.items.map(
      (i, n) => `${n + 1}. ${i.title} | Size: ${i.size} | Qty: ${i.qty} | ${inr(i.price * i.qty)}`,
    ),
    "",
    `*Total: ${inr(order.total)}*`,
    `*Order ID:* ${order.id}`,
  ];
  return lines.join("\n");
}

/* ---------- UPI ---------- */
export const UPI_VPA = "remonasru-1@oksbi";
export const UPI_PAYEE = "RemoCollections";

export function buildUpiUrl(amount: number, orderId?: string) {
  const parts = [
    `pa=${encodeURIComponent(UPI_VPA)}`,
    `pn=${encodeURIComponent(UPI_PAYEE)}`,
    `am=${amount.toFixed(2)}`,
    "cu=INR",
  ];
  if (orderId) parts.push(`tn=${encodeURIComponent(`Remo Order ${orderId}`)}`);
  return `upi://pay?${parts.join("&")}`;
}
