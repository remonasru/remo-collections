import { createFileRoute } from "@tanstack/react-router";
import { LogOut, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProductImage } from "@/components/ProductCard";
import {
  addProduct,
  CATEGORIES,
  commitChanges,
  discardChanges,
  deleteProduct,
  inr,
  setOrderStatus,
  setStaging,
  SIZES,
  updateProduct,
  useDirty,
  useStore,
  type Category,
  type OrderStatus,
} from "@/lib/store";

const ADMIN_USER = "Remo Collections";
const ADMIN_PASS = "RemoNasru20";
const SESSION_KEY = "remo-admin-session";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — Remo Collections" },
      { name: "description", content: "Private admin dashboard for Remo Collections store management." },
      { property: "og:title", content: "Admin Panel — Remo Collections" },
      { property: "og:description", content: "Private admin dashboard." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAuthed(sessionStorage.getItem(SESSION_KEY) === "granted");
    setReady(true);
  }, []);

  if (!ready) return <div className="min-h-[60vh]" />;
  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;

  return (
    <Dashboard
      onLogout={() => {
        sessionStorage.removeItem(SESSION_KEY);
        setAuthed(false);
      }}
    />
  );
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (user.trim() === ADMIN_USER && pass === ADMIN_PASS) {
      sessionStorage.setItem(SESSION_KEY, "granted");
      setError("");
      onSuccess();
    } else {
      setError("Invalid Credentials");
      toast.error("Invalid Credentials");
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
          className="mt-5 w-full rounded-md bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
        >
          Login
        </button>
      </form>
    </div>
  );
}

type Tab = "add" | "inventory" | "orders";

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const { products, orders } = useStore();
  const dirty = useDirty();
  const [tab, setTab] = useState<Tab>("inventory");

  useEffect(() => {
    setStaging(true);
    return () => {
      discardChanges();
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
                  discardChanges();
                  toast.success("Changes discarded");
                }
              }}
              className="rounded-md border border-input px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              Discard
            </button>
            <button
              type="button"
              disabled={!dirty}
              onClick={() => {
                commitChanges();
                toast.success("All changes saved");
              }}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-card disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> Save Changes
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
  const [images, setImages] = useState<string[]>([]);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 5);
    const read = (f: File) =>
      new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result));
        fr.onerror = reject;
        fr.readAsDataURL(f);
      });
    try {
      const urls = await Promise.all(files.map(read));
      setImages((prev) => [...prev, ...urls].slice(0, 5));
    } catch {
      toast.error("Could not read the selected images");
    }
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

      <L label="Product Images (from your gallery)">
        <input type="file" accept="image/*" multiple onChange={onFiles} className="text-sm" />
      </L>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative h-24 w-20 overflow-hidden rounded-md border border-border">
              <img src={img} alt={`Upload ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => setImages((prev) => prev.filter((_, n) => n !== i))}
                className="absolute right-0 top-0 bg-destructive px-1 text-xs text-destructive-foreground"
              >
                ×
              </button>
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
  return (
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
              {p.category} · {p.sizes.join(", ") || "No sizes"} · {p.reviews.length} reviews
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
      ))}
    </div>
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
          <p className="mt-3 text-right font-display text-lg font-extrabold">Total: {inr(o.total)}</p>
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
