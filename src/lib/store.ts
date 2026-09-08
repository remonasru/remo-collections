import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  adminLogin,
  listCoupons,
  listOrders,
  saveCatalog,
  saveCoupons,
  updateOrderStatus,
  type ProductInput,
} from "@/lib/catalog.functions";

export type Category = "Men" | "Women" | "Kids" | "Accessories";
export const CATEGORIES: Category[] = ["Men", "Women", "Kids", "Accessories"];

export const CATEGORY_LABELS: Record<Category, string> = {
  Men: "Men",
  Women: "Women",
  Kids: "Kids",
  Accessories: "Accessories & Gifts",
};

export const CATEGORY_HEADINGS: Record<Category, string> = {
  Men: "Men's Collection",
  Women: "Women's Collection",
  Kids: "Kids' Collection",
  Accessories: "Fashion Accessories & Gifts",
};

export const SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export type Size = (typeof SIZES)[number];

export const KIDS_SIZES = ["2-3Y", "4-5Y", "6-7Y", "8-9Y", "10-12Y"] as const;
export const ALL_SIZES = [...SIZES, "Free Size", ...KIDS_SIZES] as const;

/** Grouped sub-categories for the Accessories & Gifts catalogue. */
export const ACCESSORY_GROUPS: { group: string; items: string[] }[] = [
  { group: "Watches", items: ["Analog", "Digital", "Smartwatches", "Couple Sets"] },
  {
    group: "Footwear / Shoes",
    items: ["Sneakers", "Formal Shoes", "Sandals", "Heels", "Crocs"],
  },
  { group: "Jewelry", items: ["Rings", "Bracelets", "Chains", "Earrings", "Anklets"] },
  { group: "Eyewear", items: ["Sunglasses", "Blue-light Glasses", "Frames"] },
  {
    group: "Fancy & Lifestyle",
    items: ["Handbags", "Wallets", "Belts", "Keychains", "Perfumes / Fragrances"],
  },
  {
    group: "Gifts & Combo Sets",
    items: ["Customized Gifts", "Birthday Combos", "Festival Gift Packs", "Couple Gifts"],
  },
];

export const RECIPIENTS = ["For Him", "For Her", "For Kids", "For Couples"] as const;
export const OCCASIONS = ["Birthday", "Anniversary", "Wedding", "Casual Wear", "Festive"] as const;

export const SUBCATEGORIES: Record<Category, string[]> = {
  Men: [
    "Shirts (Casual)",
    "Shirts (Formal)",
    "Pants / Trousers",
    "T-Shirts",
    "Track Pants",
    "Shorts",
    "Ethnic Wear (Dhoti/Kurta)",
    "Innerwear",
    "Jackets / Hoodies",
  ],
  Women: [
    "Sarees",
    "Chudithar / Salwar Suits",
    "Tops / Tunics",
    "Leggings",
    "Pattiyala",
    "Shawls / Dupattas",
    "Nightwear",
    "Western Dresses",
  ],
  Kids: [
    "Boys T-Shirts",
    "Boys Shirts",
    "Boys Shorts / Pants",
    "Girls Dresses / Frocks",
    "Girls Tops & Leggings",
    "Ethnic Wear",
    "Nightwear",
    "Newborn Baby Clothing",
  ],
  Accessories: ACCESSORY_GROUPS.flatMap((g) => g.items.map((i) => `${g.group} › ${i}`)),
};


export const COLORS: { name: string; hex: string }[] = [
  { name: "Red", hex: "#dc2626" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Black", hex: "#111827" },
  { name: "White", hex: "#ffffff" },
  { name: "Yellow", hex: "#facc15" },
  { name: "Green", hex: "#16a34a" },
  { name: "Grey", hex: "#6b7280" },
  { name: "Maroon", hex: "#7f1d1d" },
  { name: "Beige", hex: "#e7d8c0" },
];

export const FABRICS = ["Cotton", "Silk", "Denim", "Rayon", "Polyester", "Linen"] as const;

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
  subCategory: string;
  price: number;
  mrp: number;
  description: string;
  sizes: string[];
  colors: string[];
  fabric: string;
  recipient: string;
  occasion: string;
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

export type DiscountType = "percent" | "flat";

export type Coupon = {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrder: number;
  active: boolean;
};

export type Order = {
  id: string;
  customer: { name: string; address: string; phone: string; payment: string };
  items: { title: string; size: string; qty: number; price: number }[];
  subtotal: number;
  couponCode: string;
  discount: number;
  total: number;
  status: OrderStatus;
  createdAt: number;
};

export type StoreState = {
  products: Product[];
  coupons: Coupon[];
  cart: CartItem[];
  wishlist: string[];
  orders: Order[];
  loading: boolean;
};

export const WHATSAPP_NUMBER = "918903206428";

const LOCAL_KEY = "remo-basket-v1";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/* ---------- normalization ---------- */
type ProductRow = {
  id: string;
  title: string;
  category: string;
  sub_category: string;
  price: number | string;
  mrp: number | string;
  description: string;
  sizes: string[] | null;
  colors: string[] | null;
  fabric: string | null;
  recipient: string | null;
  occasion: string | null;
  images: string[] | null;
  in_stock: boolean | null;
  created_at: string;
};

type CouponRow = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number | string;
  min_order: number | string;
  active: boolean | null;
};

export function toCoupon(row: CouponRow): Coupon {
  return {
    id: row.id,
    code: String(row.code ?? "").toUpperCase(),
    discountType: row.discount_type === "flat" ? "flat" : "percent",
    discountValue: Number(row.discount_value) || 0,
    minOrder: Number(row.min_order) || 0,
    active: row.active !== false,
  };
}

type ReviewRow = {
  id: string;
  product_id: string;
  name: string;
  rating: number;
  text: string;
  created_at: string;
};

function toProduct(row: ProductRow, reviews: Review[]): Product {
  const category: Category = CATEGORIES.includes(row.category as Category)
    ? (row.category as Category)
    : "Men";
  const price = Number(row.price) || 0;
  const mrp = Number(row.mrp) || price;
  return {
    id: row.id,
    title: row.title || "Untitled product",
    category,
    subCategory: row.sub_category || SUBCATEGORIES[category][0] || "",
    price,
    mrp,
    description: row.description ?? "",
    sizes: (row.sizes ?? []).filter((s) => typeof s === "string"),
    colors: (row.colors ?? []).filter((c) => typeof c === "string"),
    fabric: row.fabric ?? "",
    recipient: row.recipient ?? "",
    occasion: row.occasion ?? "",
    images: (row.images ?? []).filter((i) => typeof i === "string" && i),
    inStock: row.in_stock !== false,
    reviews,
    createdAt: new Date(row.created_at).getTime() || Date.now(),
  };
}

/* ---------- state ---------- */
const initial: StoreState = {
  products: [],
  coupons: [],
  cart: [],
  wishlist: [],
  orders: [],
  loading: true,
};

let state: StoreState = initial;
let loaded = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function setState(updater: (s: StoreState) => StoreState) {
  state = updater(state);
  notify();
}

/* ---------- basket (device-local by design) ---------- */
function loadBasket() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<StoreState>;
    state = {
      ...state,
      cart: Array.isArray(parsed.cart) ? parsed.cart.filter((c) => c && c.productId) : [],
      wishlist: Array.isArray(parsed.wishlist)
        ? parsed.wishlist.filter((w) => typeof w === "string")
        : [],
    };
  } catch {
    /* ignore corrupt storage */
  }
}

function persistBasket() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      LOCAL_KEY,
      JSON.stringify({ cart: state.cart, wishlist: state.wishlist }),
    );
  } catch {
    /* quota — basket is non-critical */
  }
}

function setBasket(updater: (s: StoreState) => StoreState) {
  setState(updater);
  persistBasket();
}

/* ---------- catalog from the shared database ---------- */
let fetching: Promise<void> | null = null;

export function refreshCatalog(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  fetching ??= (async () => {
    try {
      const [{ data: prodRows, error: pErr }, { data: revRows }, { data: coupRows }] =
        await Promise.all([
          supabase.from("products").select("*").order("created_at", { ascending: false }),
          supabase.from("reviews").select("*").order("created_at", { ascending: false }),
          supabase.from("coupons").select("*").order("created_at", { ascending: false }),
        ]);
      if (pErr) throw new Error(pErr.message);
      const byProduct = new Map<string, Review[]>();
      for (const r of (revRows ?? []) as ReviewRow[]) {
        const list = byProduct.get(r.product_id) ?? [];
        list.push({
          id: r.id,
          name: r.name,
          rating: Number(r.rating) || 5,
          text: r.text ?? "",
          createdAt: new Date(r.created_at).getTime() || Date.now(),
        });
        byProduct.set(r.product_id, list);
      }
      const products = ((prodRows ?? []) as ProductRow[]).map((row) =>
        toProduct(row, byProduct.get(row.id) ?? []),
      );
      const coupons = ((coupRows ?? []) as CouponRow[]).map(toCoupon);
      // Never clobber unsaved admin edits.
      if (!dirty) setState((s) => ({ ...s, products, coupons, loading: false }));
      else setState((s) => ({ ...s, loading: false }));
    } catch {
      setState((s) => ({ ...s, loading: false }));
    } finally {
      fetching = null;
    }
  })();
  return fetching;
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  loadBasket();
  void refreshCatalog();
  window.addEventListener("focus", () => void refreshCatalog());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void refreshCatalog();
  });
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

/* ---------- admin session ---------- */
let adminPass = "";

export function setAdminPass(pass: string) {
  adminPass = pass;
}

export async function verifyAdminLogin(user: string, pass: string): Promise<boolean> {
  const res = await adminLogin({ data: { user, pass } });
  if (res.ok) adminPass = pass;
  return res.ok;
}

/* ---------- staged (draft) admin mode ---------- */
let staging = false;
let dirty = false;

export function setStaging(on: boolean) {
  staging = on;
  if (!on) dirty = false;
  notify();
}

function stage(updater: (s: StoreState) => StoreState) {
  setState(updater);
  if (staging) {
    dirty = true;
    notify();
  } else {
    void commitChanges().catch(() => undefined);
  }
}

export async function commitChanges(): Promise<void> {
  const products: ProductInput[] = state.products.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    subCategory: p.subCategory,
    price: p.price,
    mrp: p.mrp,
    description: p.description,
    sizes: p.sizes,
    colors: p.colors,
    fabric: p.fabric,
    recipient: p.recipient,
    occasion: p.occasion,
    images: p.images,
    inStock: p.inStock,
    createdAt: p.createdAt,
  }));
  await saveCatalog({ data: { pass: adminPass, products } });
  if (couponsLoaded) {
    await saveCoupons({
      data: {
        pass: adminPass,
        coupons: state.coupons.map((c) => ({
          id: c.id,
          code: c.code,
          discountType: c.discountType,
          discountValue: c.discountValue,
          minOrder: c.minOrder,
          active: c.active,
        })),
      },
    });
  }
  dirty = false;
  notify();
  await refreshCatalog();
}

export async function discardChanges(): Promise<void> {
  dirty = false;
  await refreshCatalog();
  notify();
}

export function useDirty(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => dirty,
    () => false,
  );
}

/* ---------- products ---------- */
export function addProduct(p: Omit<Product, "id" | "reviews" | "createdAt">) {
  stage((s) => ({
    ...s,
    products: [{ ...p, id: uid(), reviews: [], createdAt: Date.now() }, ...s.products],
  }));
}

export function updateProduct(id: string, patch: Partial<Product>) {
  stage((s) => ({
    ...s,
    products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  }));
}

export function deleteProduct(id: string) {
  stage((s) => ({
    ...s,
    products: s.products.filter((p) => p.id !== id),
  }));
  setBasket((s) => ({
    ...s,
    cart: s.cart.filter((c) => c.productId !== id),
    wishlist: s.wishlist.filter((w) => w !== id),
  }));
}

export function addReview(productId: string, review: Omit<Review, "id" | "createdAt">) {
  const optimistic: Review = { ...review, id: uid(), createdAt: Date.now() };
  setState((s) => ({
    ...s,
    products: s.products.map((p) =>
      p.id === productId ? { ...p, reviews: [optimistic, ...p.reviews] } : p,
    ),
  }));
  void supabase
    .from("reviews")
    .insert({
      product_id: productId,
      name: review.name,
      rating: review.rating,
      text: review.text,
    })
    .then(() => refreshCatalog());
}

/* ---------- cart ---------- */
export function addToCart(productId: string, size: string, qty = 1) {
  setBasket((s) => {
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
  setBasket((s) => ({
    ...s,
    cart:
      qty <= 0 ? s.cart.filter((c) => c.id !== id) : s.cart.map((c) => (c.id === id ? { ...c, qty } : c)),
  }));
}

export function removeFromCart(id: string) {
  setBasket((s) => ({ ...s, cart: s.cart.filter((c) => c.id !== id) }));
}

export function clearCart() {
  setBasket((s) => ({ ...s, cart: [] }));
}

/* ---------- wishlist ---------- */
export function toggleWishlist(productId: string) {
  setBasket((s) => ({
    ...s,
    wishlist: s.wishlist.includes(productId)
      ? s.wishlist.filter((w) => w !== productId)
      : [...s.wishlist, productId],
  }));
}

/* ---------- orders ---------- */
export function placeOrder(order: Omit<Order, "id" | "createdAt" | "status">): Order {
  const full: Order = { ...order, id: uid(), createdAt: Date.now(), status: "Pending" };
  void supabase
    .from("orders")
    .insert({
      id: full.id,
      customer: full.customer,
      items: full.items,
      subtotal: full.subtotal,
      coupon_code: full.couponCode,
      discount: full.discount,
      total: full.total,
      status: full.status,
    })
    .then(() => undefined);
  return full;
}

export async function loadOrders(): Promise<void> {
  try {
    const rows = await listOrders({ data: { pass: adminPass } });
    const orders: Order[] = (rows as unknown as {
      id: string;
      customer: Order["customer"];
      items: Order["items"];
      subtotal: number | string | null;
      coupon_code: string | null;
      discount: number | string | null;
      total: number | string;
      status: string;
      created_at: string;
    }[]).map((o) => ({
      id: o.id,
      customer: o.customer,
      items: Array.isArray(o.items) ? o.items : [],
      subtotal: Number(o.subtotal) || Number(o.total) || 0,
      couponCode: o.coupon_code ?? "",
      discount: Number(o.discount) || 0,
      total: Number(o.total) || 0,
      status: (["Pending", "Shipped", "Delivered"].includes(o.status)
        ? o.status
        : "Pending") as OrderStatus,
      createdAt: new Date(o.created_at).getTime() || Date.now(),
    }));
    setState((s) => ({ ...s, orders }));
  } catch {
    /* keep whatever is on screen */
  }
}

export function setOrderStatus(id: string, status: OrderStatus) {
  setState((s) => ({
    ...s,
    orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)),
  }));
  void updateOrderStatus({ data: { pass: adminPass, id, status } }).catch(() => undefined);
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
    `*Item Total:* ${inr(order.subtotal)}`,
    ...(order.discount > 0
      ? [
          `*Coupon:* ${order.couponCode}`,
          `*Discount:* -${inr(order.discount)}`,
        ]
      : []),
    `*Total Payable: ${inr(order.total)}*`,
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


/* ---------- coupons ---------- */
let couponsLoaded = false;

export async function loadAdminCoupons(): Promise<void> {
  try {
    const rows = await listCoupons({ data: { pass: adminPass } });
    const coupons = (rows as unknown as CouponRow[]).map(toCoupon);
    couponsLoaded = true;
    setState((s) => ({ ...s, coupons }));
  } catch {
    /* keep whatever is on screen */
  }
}

export function addCoupon(c: Omit<Coupon, "id">) {
  stage((s) => ({ ...s, coupons: [{ ...c, id: uid() }, ...s.coupons] }));
}

export function updateCoupon(id: string, patch: Partial<Coupon>) {
  stage((s) => ({
    ...s,
    coupons: s.coupons.map((c) => (c.id === id ? { ...c, ...patch } : c)),
  }));
}

export function deleteCoupon(id: string) {
  stage((s) => ({ ...s, coupons: s.coupons.filter((c) => c.id !== id) }));
}

export function couponDiscount(coupon: Coupon, subtotal: number): number {
  const raw =
    coupon.discountType === "percent"
      ? (subtotal * coupon.discountValue) / 100
      : coupon.discountValue;
  return Math.max(0, Math.min(subtotal, Math.round(raw)));
}

export type CouponCheck =
  | { ok: true; coupon: Coupon; discount: number }
  | { ok: false; reason: string };

export function validateCoupon(code: string, subtotal: number): CouponCheck {
  const wanted = code.trim().toUpperCase();
  if (!wanted) return { ok: false, reason: "Please enter a coupon code" };
  const coupon = state.coupons.find((c) => c.code.toUpperCase() === wanted && c.active);
  if (!coupon) return { ok: false, reason: "Invalid or expired coupon code" };
  if (subtotal < coupon.minOrder) {
    return {
      ok: false,
      reason: `Add items worth ${inr(coupon.minOrder - subtotal)} more to apply this coupon`,
    };
  }
  const discount = couponDiscount(coupon, subtotal);
  if (discount <= 0) return { ok: false, reason: "This coupon gives no discount on your cart" };
  return { ok: true, coupon, discount };
}
