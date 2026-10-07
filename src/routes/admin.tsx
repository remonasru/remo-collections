import { createFileRoute } from "@tanstack/react-router";
import { Check, ChevronLeft, ChevronRight, ImagePlus, LogOut, Pencil, Save, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ProductImage } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  addCoupon,
  addProduct,
  ALL_SIZES,
  CATEGORIES,
  COLORS,
  commitChanges,
  discardChanges,
  deleteCoupon,
  deleteProduct,
  loadAdminCoupons,
  updateCoupon,
  FABRICS,
  inr,
  loadOrders,
  OCCASIONS,
  RECIPIENTS,
  setAdminPass,
  setApkUrl,
  setOrderStatus,
  setStaging,
  SIZES,
  SUBCATEGORIES,
  type Product,
  updateProduct,
  useDirty,
  useStore,
  verifyAdminLogin,
  type Category,
  type Coupon,
  type OrderStatus,
} from "@/lib/store";

const SESSION_KEY = "remo-admin-session";

/** Turns a failed network/server call into a message that says what actually broke. */
function describeSaveError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  const host = typeof window !== "undefined" ? window.location.host : "";
  if (/failed to fetch|networkerror|load failed/i.test(raw)) {
    return `Could not reach the store server from ${host || "this site"}. This copy of the site has no backend connected.`;
  }
  if (/unauthorized/i.test(raw)) return "Admin session expired — please log in again.";
  if (/404|not found/i.test(raw)) {
    return `The save endpoint is missing on ${host || "this site"}. This copy of the site is not the live Lovable deployment.`;
  }
  if (/csrf|forbidden|403/i.test(raw)) {
    return `The server rejected the request from ${host || "this site"} (blocked origin).`;
  }
  return raw ? `Save failed: ${raw}` : "Save failed — please try again.";
}


export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — Remo Collections" },
      { name: "description", content: "Private admin dashboard for Remo Collections store management." },
      { property: "og:title", content: "Admin Panel — Remo Collections" },
      { property: "og:description", content: "Private admin dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      setAdminPass(saved);
      setAuthed(true);
    }
    setReady(true);
  }, []);

  if (!ready) return <div className="min-h-[60vh]" />;
  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;

  return (
    <Dashboard
      onLogout={() => {
        sessionStorage.removeItem(SESSION_KEY);
        setAdminPass("");
        setAuthed(false);
      }}
    />
  );
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    try {
      const ok = await verifyAdminLogin(user, pass);
      if (ok) {
        sessionStorage.setItem(SESSION_KEY, pass);
        setError("");
        onSuccess();
      } else {
        setError("Invalid Credentials");
        toast.error("Invalid Credentials");
      }
    } catch (err) {
      console.error("[Admin] Login request failed", err);
      const msg = describeSaveError(err);
      setError(msg);
      toast.error(msg, { duration: 8000 });
    } finally {
      setChecking(false);
    }

  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4">
      <form onSubmit={submit} className="w-full rounded-2xl border border-border bg-card p-6 shadow-float">
        <h1 className="font-display text-2xl font-extrabold">Admin Login</h1>
        <p className="mt-1 text-sm text-muted-foreground">Authorised staff only.</p>
        <div className="mt-5 space-y-3">
          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="Username"
            autoComplete="username"
            className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm"
          />
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm"
          />
        </div>
        {error && (
          <p className="mt-3 rounded-md bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={checking}
          className="mt-5 w-full rounded-md bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {checking ? "Checking…" : "Login"}
        </button>

      </form>
    </div>
  );
}

type Tab = "add" | "inventory" | "orders" | "coupons" | "install";

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const { products, orders, coupons } = useStore();
  const dirty = useDirty();
  const [tab, setTab] = useState<Tab>("inventory");
  const [saving, setSaving] = useState(false);


  useEffect(() => {
    setStaging(true);
    void loadOrders();
    void loadAdminCoupons();
    return () => {
      void discardChanges();
      setStaging(false);
    };
  }, []);



  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-28">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold">Admin Dashboard</h1>
        <button
          type="button"
          onClick={() => {
            if (dirty && !confirm("You have unsaved changes. Log out and discard them?")) return;
            onLogout();
          }}
          className="inline-flex items-center gap-2 rounded-md border border-input px-4 py-2 text-sm font-semibold"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Products" value={String(products.length)} />
        <Stat label="Orders" value={String(orders.length)} />
        <Stat
          label="Revenue"
          value={inr(orders.reduce((a, o) => a + o.total, 0))}
        />
      </div>

      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto border-b border-border">
        {(
          [
            ["inventory", "Manage Inventory"],
            ["add", "Add Product"],
            ["orders", `Orders (${orders.length})`],
            ["coupons", `Coupons & Offers (${coupons.length})`],
            ["install", "Install / APK"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`whitespace-nowrap px-4 py-3 text-sm font-bold ${
              tab === key ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "add" && <AddProductForm onDone={() => setTab("inventory")} />}
        {tab === "inventory" && <Inventory />}
        {tab === "orders" && <Orders />}
        {tab === "coupons" && <Coupons />}
        {tab === "install" && <InstallSettings />}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm font-semibold">
            {dirty ? (
              <span className="text-destructive">Unsaved changes — click Save Changes to commit.</span>
            ) : (
              <span className="text-muted-foreground">All changes saved.</span>
            )}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!dirty}
              onClick={() => {
                if (confirm("Discard all unsaved changes?")) {
                  void discardChanges().then(() => toast.success("Changes discarded"));
                }
              }}
              className="rounded-md border border-input px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              Discard
            </button>
            <button
              type="button"
              disabled={!dirty || saving}
              onClick={() => {
                setSaving(true);
                commitChanges()
                  .then(() => toast.success("All changes saved successfully!"))
                  .catch((err: unknown) => {
                    console.error("[Admin] Save failed", err);
                    toast.error(describeSaveError(err), { duration: 8000 });
                  })
                  .finally(() => setSaving(false));
              }}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-card disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Changes"}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}


function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold">{value}</p>
    </div>
  );
}

function AddProductForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Men");
  const [subCategory, setSubCategory] = useState(SUBCATEGORIES.Men[0]!);
  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [description, setDescription] = useState("");
  const [sizes, setSizes] = useState<string[]>([...SIZES]);
  const [colors, setColors] = useState<string[]>([]);
  const [fabric, setFabric] = useState<string>(FABRICS[0]);
  const [recipient, setRecipient] = useState("");
  const [occasion, setOccasion] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const MAX_IMAGES = 7;

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      toast.error(`You can upload up to ${MAX_IMAGES} photos per product`);
      e.target.value = "";
      return;
    }
    if (picked.length > room) toast.info(`Only ${room} more photo(s) can be added`);
    const files = picked.slice(0, room);
    const read = (f: File) =>
      new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => {
          const src = String(fr.result);
          const img = new Image();
          img.onload = () => {
            const max = 1200;
            const scale = Math.min(1, max / Math.max(img.width, img.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve(src);
              return;
            }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            try {
              resolve(canvas.toDataURL("image/jpeg", 0.82));
            } catch {
              resolve(src);
            }
          };
          img.onerror = () => resolve(src);
          img.src = src;
        };
        fr.onerror = reject;
        fr.readAsDataURL(f);
      });

    try {
      const urls = await Promise.all(files.map(read));
      setImages((prev) => [...prev, ...urls].slice(0, MAX_IMAGES));
    } catch {
      toast.error("Could not read the selected images");
    } finally {
      e.target.value = "";
    }
  }

  function moveImage(from: number, dir: -1 | 1) {
    const to = from + dir;
    setImages((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m!);
      return next;
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = Number(price);
    const m = Number(mrp || price);
    if (!title.trim() || !p || p <= 0) {
      toast.error("Please enter a product title and a valid price");
      return;
    }
    if (!subCategory) {
      toast.error("Please select a sub-category");
      return;
    }
    if (images.length < 1) {
      toast.error("Please upload at least 1 product photo");
      return;
    }
    addProduct({
      title: title.trim(),
      category,
      subCategory,
      price: p,
      mrp: m,
      description: description.trim(),
      sizes,
      colors,
      fabric,
      recipient,
      occasion,
      images,
      inStock: true,
    });
    toast.success("Product added");
    setTitle("");
    setPrice("");
    setMrp("");
    setDescription("");
    setColors([]);
    setImages([]);
    setRecipient("");
    setOccasion("");
    onDone();
  }


  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-xl border border-border bg-card p-5 shadow-card">
      <L label="Product Title">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
      </L>
      <div className="grid gap-4 sm:grid-cols-2">
        <L label="Main Category">
          <select
            value={category}
            onChange={(e) => {
              const c = e.target.value as Category;
              setCategory(c);
              setSubCategory(SUBCATEGORIES[c][0]!);
            }}
            className={inputCls}
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </L>
        <L label="Sub-Category (required)">
          <select
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            className={inputCls}
          >
            {SUBCATEGORIES[category].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </L>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <L label="Selling Price (₹)">
          <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" className={inputCls} />
        </L>
        <L label="MRP (₹)">
          <input value={mrp} onChange={(e) => setMrp(e.target.value)} inputMode="numeric" className={inputCls} />
        </L>
        <L label="Fabric / Material">
          <select value={fabric} onChange={(e) => setFabric(e.target.value)} className={inputCls}>
            {FABRICS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </L>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <L label="Gift Recipient (optional)">
          <select value={recipient} onChange={(e) => setRecipient(e.target.value)} className={inputCls}>
            <option value="">Not specified</option>
            {RECIPIENTS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </L>
        <L label="Occasion (optional)">
          <select value={occasion} onChange={(e) => setOccasion(e.target.value)} className={inputCls}>
            <option value="">Not specified</option>
            {OCCASIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </L>
      </div>
      <L label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className={inputCls}
        />
      </L>
      <L label="Available Sizes">
        <div className="flex flex-wrap gap-2">
          {ALL_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() =>
                setSizes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
              }
              className={`h-10 min-w-14 rounded-md border px-2 text-sm font-semibold ${
                sizes.includes(s)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </L>
      <L label="Colours">
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c.name}
              type="button"
              title={c.name}
              aria-label={c.name}
              aria-pressed={colors.includes(c.name)}
              onClick={() =>
                setColors((prev) =>
                  prev.includes(c.name) ? prev.filter((x) => x !== c.name) : [...prev, c.name],
                )
              }
              className={`h-9 w-9 rounded-full border-2 ${
                colors.includes(c.name) ? "border-primary ring-2 ring-primary/40" : "border-border"
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </L>

      <L label={`Product Images (1–${MAX_IMAGES} photos from your gallery)`}>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={onFiles}
          disabled={images.length >= MAX_IMAGES}
          className="text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {images.length}/{MAX_IMAGES} selected — the first photo is the cover image.
        </p>
      </L>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((img, i) => (
            <div key={i} className="w-24">
              <div className="relative h-28 w-24 overflow-hidden rounded-md border border-border">
                <img src={img} alt={`Upload ${i + 1}`} className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-0 left-0 bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  aria-label={`Remove image ${i + 1}`}
                  onClick={() => setImages((prev) => prev.filter((_, n) => n !== i))}
                  className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center bg-destructive text-destructive-foreground"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-1 flex gap-1">
                <button
                  type="button"
                  aria-label={`Move image ${i + 1} left`}
                  disabled={i === 0}
                  onClick={() => moveImage(i, -1)}
                  className="flex h-7 flex-1 items-center justify-center rounded border border-input disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Move image ${i + 1} right`}
                  disabled={i === images.length - 1}
                  onClick={() => moveImage(i, 1)}
                  className="flex h-7 flex-1 items-center justify-center rounded border border-input disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <button type="submit" className="rounded-md bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
        Add Product
      </button>
    </form>
  );
}

function Inventory() {
  const { products } = useStore();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  return (
    <>
      <div className="space-y-3">
        {products.length === 0 && <p className="text-muted-foreground">No products yet.</p>}
        {products.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-3 shadow-card"
          >
            <div className="h-20 w-16 shrink-0 overflow-hidden rounded-md bg-secondary">
              <ProductImage product={p} />
            </div>
            <div className="min-w-40 flex-1">
              <p className="font-semibold">{p.title}</p>
              <p className="text-xs text-muted-foreground">
                {p.category} › {p.subCategory || "No sub-category"} ·{" "}
                {p.recipient || p.occasion
                  ? [p.recipient, p.occasion].filter(Boolean).join(" · ")
                  : p.fabric || "—"}{" "}
                · {p.sizes.join(", ") || "No sizes"} · {p.reviews.length} reviews
              </p>
            </div>
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Price
              <input
                key={`${p.id}-${p.price}`}
                defaultValue={p.price}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (v > 0) updateProduct(p.id, { price: v });
                }}
                inputMode="numeric"
                className="ml-2 w-24 rounded-md border border-input bg-background px-2 py-1.5 text-sm font-normal normal-case text-foreground"
              />
            </label>
            <button
              type="button"
              onClick={() => updateProduct(p.id, { inStock: !p.inStock })}
              className={`rounded-md px-3 py-2 text-xs font-bold ${
                p.inStock ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"
              }`}
            >
              {p.inStock ? "In Stock" : "Out of Stock"}
            </button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={`Edit ${p.title}`}
                title="Edit product"
                onClick={() => setEditingProduct(p)}
              >
                <Pencil aria-hidden="true" />
              </Button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete "${p.title}"?`)) {
                    deleteProduct(p.id);
                    toast.success("Product deleted");
                  }
                }}
                className="inline-flex items-center gap-1 rounded-md border border-input px-3 py-2 text-xs font-bold text-destructive"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {editingProduct && (
        <EditProductDialog
          key={editingProduct.id}
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </>
  );
}

const MAX_PRODUCT_IMAGES = 7;

function isValidImageSource(value: string): boolean {
  if (/^data:image\/(?:jpeg|png|webp|gif|svg\+xml);base64,[a-z0-9+/=]+$/i.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function compressProductImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/") || file.size > 15 * 1024 * 1024) {
      reject(new Error("Choose an image smaller than 15 MB."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.onload = () => {
      const source = String(reader.result ?? "");
      const image = new Image();
      image.onerror = () => reject(new Error("The selected file is not a readable image."));
      image.onload = () => {
        const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          resolve(source);
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        try {
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        } catch {
          resolve(source);
        }
      };
      image.src = source;
    };
    reader.readAsDataURL(file);
  });
}

function EditProductDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const [title, setTitle] = useState(product.title);
  const [category, setCategory] = useState<Category>(product.category);
  const [subCategory, setSubCategory] = useState(product.subCategory);
  const [price, setPrice] = useState(String(product.price));
  const [mrp, setMrp] = useState(String(product.mrp));
  const [description, setDescription] = useState(product.description);
  const [sizes, setSizes] = useState<string[]>([...product.sizes]);
  const [colors, setColors] = useState<string[]>([...product.colors]);
  const [fabric, setFabric] = useState(product.fabric);
  const [recipient, setRecipient] = useState(product.recipient);
  const [occasion, setOccasion] = useState(product.occasion);
  const [inStock, setInStock] = useState(product.inStock);
  const [images, setImages] = useState<string[]>([...product.images]);
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const addImageInput = useRef<HTMLInputElement>(null);
  const replaceImageInputs = useRef<Record<number, HTMLInputElement | null>>({});

  async function addUploadedImages(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    const room = MAX_PRODUCT_IMAGES - images.length;
    if (room <= 0) {
      toast.error(`A product can have up to ${MAX_PRODUCT_IMAGES} images.`);
      return;
    }
    if (files.length > room) toast.info(`Only ${room} more image(s) can be added.`);
    setImageBusy(true);
    try {
      const additions = await Promise.all(files.slice(0, room).map(compressProductImage));
      setImages((current) => [...current, ...additions].slice(0, MAX_PRODUCT_IMAGES));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read the selected image.");
    } finally {
      setImageBusy(false);
    }
  }

  async function replaceImage(index: number, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImageBusy(true);
    try {
      const replacement = await compressProductImage(file);
      setImages((current) => current.map((image, position) => position === index ? replacement : image));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not replace this image.");
    } finally {
      setImageBusy(false);
    }
  }

  function addImageUrl() {
    const value = imageUrl.trim();
    if (!isValidImageSource(value)) {
      toast.error("Enter a valid HTTP(S) image URL or image data URL.");
      return;
    }
    if (images.length >= MAX_PRODUCT_IMAGES) {
      toast.error(`A product can have up to ${MAX_PRODUCT_IMAGES} images.`);
      return;
    }
    setImages((current) => [...current, value]);
    setImageUrl("");
  }

  function moveImage(index: number, direction: -1 | 1) {
    setImages((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(index, 1);
      if (!moved) return current;
      next.splice(target, 0, moved);
      return next;
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || imageBusy) return;
    const cleanTitle = title.trim();
    const nextPrice = Number(price);
    const nextMrp = Number(mrp || price);
    if (!cleanTitle) {
      toast.error("Product title is required.");
      return;
    }
    if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
      toast.error("Enter a valid selling price greater than zero.");
      return;
    }
    if (!Number.isFinite(nextMrp) || nextMrp <= 0) {
      toast.error("Enter a valid MRP greater than zero.");
      return;
    }
    if (!subCategory.trim()) {
      toast.error("Choose a product sub-category.");
      return;
    }
    if (!images.length || images.length > MAX_PRODUCT_IMAGES || images.some((image) => !isValidImageSource(image))) {
      toast.error("Add at least one valid image URL or uploaded photo (up to seven).");
      return;
    }

    setSaving(true);
    updateProduct(product.id, {
      title: cleanTitle,
      category,
      subCategory: subCategory.trim(),
      price: nextPrice,
      mrp: nextMrp,
      description: description.trim(),
      sizes,
      colors,
      fabric,
      recipient,
      occasion,
      images,
      inStock,
    });
    toast.success("Product updated successfully!", {
      description: "Click Save Changes to publish this update.",
    });
    onClose();
  }

  const subcategories = SUBCATEGORIES[category];
  const validColors = new Set(COLORS.map((color) => color.name));

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-4 py-4 pr-12 text-left sm:px-6">
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>Update product details, stock, and gallery images.</DialogDescription>
        </DialogHeader>
        <form id="edit-product-form" onSubmit={submit} className="min-h-0 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-4">
            <L label="Product Title">
              <input required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} className={inputCls} />
            </L>
            <div className="grid gap-4 sm:grid-cols-2">
              <L label="Main Category">
                <select value={category} onChange={(event) => {
                  const nextCategory = event.target.value as Category;
                  setCategory(nextCategory);
                  setSubCategory(SUBCATEGORIES[nextCategory][0] ?? "");
                }} className={inputCls}>
                  {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </L>
              <L label="Sub-Category">
                <select required value={subCategory} onChange={(event) => setSubCategory(event.target.value)} className={inputCls}>
                  {!subcategories.includes(subCategory) && <option value={subCategory}>{subCategory}</option>}
                  {subcategories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </L>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <L label="Selling Price (₹)">
                <input required type="number" min="0.01" step="0.01" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} className={inputCls} />
              </L>
              <L label="MRP (₹)">
                <input required type="number" min="0.01" step="0.01" inputMode="decimal" value={mrp} onChange={(event) => setMrp(event.target.value)} className={inputCls} />
              </L>
              <L label="Fabric / Material">
                <select value={fabric} onChange={(event) => setFabric(event.target.value)} className={inputCls}>
                  {fabric && !FABRICS.includes(fabric as (typeof FABRICS)[number]) && <option value={fabric}>{fabric}</option>}
                  <option value="">Not specified</option>
                  {FABRICS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </L>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <L label="Gift Recipient">
                <select value={recipient} onChange={(event) => setRecipient(event.target.value)} className={inputCls}>
                  {recipient && !RECIPIENTS.includes(recipient as (typeof RECIPIENTS)[number]) && <option value={recipient}>{recipient}</option>}
                  <option value="">Not specified</option>
                  {RECIPIENTS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </L>
              <L label="Occasion">
                <select value={occasion} onChange={(event) => setOccasion(event.target.value)} className={inputCls}>
                  {occasion && !OCCASIONS.includes(occasion as (typeof OCCASIONS)[number]) && <option value={occasion}>{occasion}</option>}
                  <option value="">Not specified</option>
                  {OCCASIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </L>
            </div>
            <L label="Description">
              <textarea maxLength={5000} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className={inputCls} />
            </L>
            <L label="Available Sizes">
              <div className="flex flex-wrap gap-2">
                {ALL_SIZES.map((size) => (
                  <Button key={size} type="button" variant={sizes.includes(size) ? "default" : "outline"} size="sm" aria-pressed={sizes.includes(size)} onClick={() => setSizes((current) => current.includes(size) ? current.filter((item) => item !== size) : [...current, size])}>
                    {size}
                  </Button>
                ))}
              </div>
            </L>
            <L label="Colours">
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <Button
                    key={color.name}
                    type="button"
                    variant="outline"
                    size="icon"
                    title={color.name}
                    aria-label={`${color.name}${colors.includes(color.name) ? ", selected" : ""}`}
                    aria-pressed={colors.includes(color.name)}
                    onClick={() => setColors((current) => current.includes(color.name) ? current.filter((item) => item !== color.name) : [...current, color.name])}
                    className={colors.includes(color.name) ? "ring-2 ring-primary ring-offset-2" : ""}
                    style={{ backgroundColor: color.hex }}
                  >
                    {colors.includes(color.name) && <Check aria-hidden="true" className="text-foreground" />}
                  </Button>
                ))}
                {colors.filter((color) => !validColors.has(color)).map((color) => (
                  <Button key={color} type="button" variant="secondary" size="sm" aria-pressed="true" onClick={() => setColors((current) => current.filter((item) => item !== color))}>
                    {color} ×
                  </Button>
                ))}
              </div>
            </L>
            <div className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
              <div>
                <p className="text-sm font-semibold">Inventory status</p>
                <p className="text-xs text-muted-foreground">{inStock ? "Available to buy" : "Hidden from purchase"}</p>
              </div>
              <Button type="button" variant={inStock ? "secondary" : "destructive"} aria-pressed={inStock} onClick={() => setInStock((current) => !current)}>
                {inStock ? "In Stock" : "Out of Stock"}
              </Button>
            </div>
            <section aria-label="Product images" className="space-y-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Product Images</h3>
                <p className="mt-1 text-xs text-muted-foreground">{images.length}/{MAX_PRODUCT_IMAGES} images · First image is the cover.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="Paste an image URL" aria-label="Image URL" className={inputCls} />
                <Button type="button" variant="outline" className="shrink-0" onClick={addImageUrl} disabled={saving || imageBusy || images.length >= MAX_PRODUCT_IMAGES}>Add URL</Button>
              </div>
              <input ref={addImageInput} type="file" accept="image/*" multiple className="hidden" onChange={addUploadedImages} />
              <Button type="button" variant="outline" onClick={() => addImageInput.current?.click()} disabled={saving || imageBusy || images.length >= MAX_PRODUCT_IMAGES}>
                <ImagePlus aria-hidden="true" /> Upload photos
              </Button>
              {images.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {images.map((image, index) => (
                    <div key={`${product.id}-image-${index}`} className="min-w-0 rounded-md border border-border p-2">
                      <div className="flex gap-3">
                        <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded border border-border bg-secondary">
                          <img src={image} alt={`Product image ${index + 1}`} className="h-full w-full object-contain" />
                          {index === 0 && <span className="absolute bottom-0 left-0 bg-primary px-1 text-[10px] font-bold text-primary-foreground">Cover</span>}
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <label className="block text-xs font-semibold text-muted-foreground">Image URL
                            <input value={image} onChange={(event) => setImages((current) => current.map((item, position) => position === index ? event.target.value : item))} className={`${inputCls} mt-1 font-normal normal-case`} />
                          </label>
                          <input ref={(element) => { replaceImageInputs.current[index] = element; }} type="file" accept="image/*" className="hidden" onChange={(event) => void replaceImage(index, event)} />
                          <div className="flex flex-wrap gap-1">
                            <Button type="button" variant="outline" size="sm" onClick={() => replaceImageInputs.current[index]?.click()} disabled={saving || imageBusy}>Replace</Button>
                            <Button type="button" variant="outline" size="icon" aria-label={`Move image ${index + 1} earlier`} title="Move earlier" onClick={() => moveImage(index, -1)} disabled={saving || index === 0}><ChevronLeft aria-hidden="true" /></Button>
                            <Button type="button" variant="outline" size="icon" aria-label={`Move image ${index + 1} later`} title="Move later" onClick={() => moveImage(index, 1)} disabled={saving || index === images.length - 1}><ChevronRight aria-hidden="true" /></Button>
                            <Button type="button" variant="destructive" size="icon" aria-label={`Remove image ${index + 1}`} title="Remove image" onClick={() => setImages((current) => current.filter((_, position) => position !== index))} disabled={saving || imageBusy}><Trash2 aria-hidden="true" /></Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </form>
        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-background px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="edit-product-form" disabled={imageBusy}>
            <Save aria-hidden="true" /> Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Orders() {
  const { orders } = useStore();
  if (!orders.length) return <p className="text-muted-foreground">No orders yet.</p>;
  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <div key={o.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display font-bold">{o.customer.name}</p>
              <p className="text-xs text-muted-foreground">
                #{o.id} · {new Date(o.createdAt).toLocaleString("en-IN")}
              </p>
            </div>
            <select
              value={o.status}
              onChange={(e) => setOrderStatus(o.id, e.target.value as OrderStatus)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold"
            >
              <option>Pending</option>
              <option>Shipped</option>
              <option>Delivered</option>
            </select>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {o.customer.phone} · {o.customer.payment}
            <br />
            {o.customer.address}
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {o.items.map((i, n) => (
              <li key={n} className="flex justify-between border-b border-border pb-1">
                <span>
                  {i.title} <span className="text-muted-foreground">({i.size} × {i.qty})</span>
                </span>
                <span className="font-semibold">{inr(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 text-right text-sm">
            <p className="text-muted-foreground">Item Total: {inr(o.subtotal || o.total)}</p>
            {o.discount > 0 && (
              <p className="font-semibold text-success">
                Coupon {o.couponCode}: -{inr(o.discount)}
              </p>
            )}
            <p className="font-display text-lg font-extrabold">Total Paid: {inr(o.total)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}


function Coupons() {
  const { coupons } = useStore();
  const [code, setCode] = useState("");
  const [type, setType] = useState<Coupon["discountType"]>("percent");
  const [value, setValue] = useState("");
  const [minOrder, setMinOrder] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    const v = Number(value);
    if (!clean) {
      toast.error("Please enter a coupon code");
      return;
    }
    if (coupons.some((c) => c.code.toUpperCase() === clean)) {
      toast.error("That coupon code already exists");
      return;
    }
    if (!v || v <= 0 || (type === "percent" && v > 100)) {
      toast.error(type === "percent" ? "Enter a percentage between 1 and 100" : "Enter a valid discount amount");
      return;
    }
    addCoupon({
      code: clean,
      discountType: type,
      discountValue: v,
      minOrder: Math.max(0, Number(minOrder) || 0),
      active: true,
    });
    toast.success("Coupon added — click Save Changes to publish");
    setCode("");
    setValue("");
    setMinOrder("");
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-xl border border-border bg-card p-5 shadow-card">
        <h2 className="font-display text-lg font-bold">Create a Coupon</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <L label="Coupon Code">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="REMO10"
              className={inputCls}
            />
          </L>
          <L label="Discount Type">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Coupon["discountType"])}
              className={inputCls}
            >
              <option value="percent">Percentage (%)</option>
              <option value="flat">Flat Amount (₹)</option>
            </select>
          </L>
          <L label={type === "percent" ? "Discount (%)" : "Discount (₹)"}>
            <input value={value} onChange={(e) => setValue(e.target.value)} inputMode="numeric" className={inputCls} />
          </L>
          <L label="Minimum Order Amount (₹)">
            <input
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              inputMode="numeric"
              placeholder="0"
              className={inputCls}
            />
          </L>
        </div>
        <button type="submit" className="rounded-md bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
          Add Coupon
        </button>
      </form>

      <div className="space-y-3">
        {coupons.length === 0 && <p className="text-muted-foreground">No coupons yet.</p>}
        {coupons.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-3 shadow-card"
          >
            <div className="min-w-40 flex-1">
              <p className="font-display font-bold tracking-wide">{c.code}</p>
              <p className="text-xs text-muted-foreground">
                {c.discountType === "percent" ? `${c.discountValue}% OFF` : `${inr(c.discountValue)} OFF`} ·
                Min order {inr(c.minOrder)}
              </p>
            </div>
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Value
              <input
                key={`${c.id}-${c.discountValue}`}
                defaultValue={c.discountValue}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (v > 0 && !(c.discountType === "percent" && v > 100)) {
                    updateCoupon(c.id, { discountValue: v });
                  }
                }}
                inputMode="numeric"
                className="ml-2 w-20 rounded-md border border-input bg-background px-2 py-1.5 text-sm font-normal normal-case text-foreground"
              />
            </label>
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Min ₹
              <input
                key={`${c.id}-${c.minOrder}`}
                defaultValue={c.minOrder}
                onBlur={(e) => updateCoupon(c.id, { minOrder: Math.max(0, Number(e.target.value) || 0) })}
                inputMode="numeric"
                className="ml-2 w-20 rounded-md border border-input bg-background px-2 py-1.5 text-sm font-normal normal-case text-foreground"
              />
            </label>
            <button
              type="button"
              onClick={() => updateCoupon(c.id, { active: !c.active })}
              className={`rounded-md px-3 py-2 text-xs font-bold ${
                c.active ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"
              }`}
            >
              {c.active ? "Active" : "Inactive"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete coupon "${c.code}"?`)) {
                  deleteCoupon(c.id);
                  toast.success("Coupon deleted");
                }
              }}
              className="inline-flex items-center gap-1 rounded-md border border-input px-3 py-2 text-xs font-bold text-destructive"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function InstallSettings() {
  const { apkUrl } = useStore();
  return (
    <section className="max-w-2xl space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold">Android APK download</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add an HTTPS link to show a direct Android download option. Leave it blank to hide it.
        </p>
      </div>
      <L label="APK download URL">
        <input
          type="url"
          inputMode="url"
          value={apkUrl}
          onChange={(event) => setApkUrl(event.target.value)}
          placeholder="https://example.com/remo-collections.apk"
          className={inputCls}
        />
      </L>
    </section>
  );
}
