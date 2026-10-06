import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type ProductInput = {
  id: string;
  title: string;
  category: string;
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
  createdAt: number;
};

const isUuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

const productImageSchema = z
  .string()
  .min(1)
  .max(8_000_000)
  .refine((value) => {
    if (/^data:image\/(?:jpeg|png|webp|gif|svg\+xml);base64,[a-z0-9+/=]+$/i.test(value)) return true;
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }, "Images must be an HTTP(S) URL or an image data URL.");

const productEditSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(160),
  category: z.enum(["Men", "Women", "Kids", "Accessories"]),
  subCategory: z.string().trim().min(1).max(120),
  price: z.number().finite().positive().max(1_000_000),
  mrp: z.number().finite().positive().max(1_000_000),
  description: z.string().max(5000),
  sizes: z.array(z.string().min(1).max(20)).max(12),
  colors: z.array(z.string().min(1).max(40)).max(20),
  fabric: z.string().max(80),
  recipient: z.string().max(80),
  occasion: z.string().max(80),
  images: z.array(productImageSchema).min(1).max(7).refine(
    (images) => images.reduce((total, image) => total + image.length, 0) <= 20_000_000,
    "The combined image data is too large.",
  ),
  inStock: z.boolean(),
  createdAt: z.number().finite().nonnegative(),
});

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((input: { user: string; pass: string }) => input)
  .handler(async ({ data }) => {
    const { verifyAdmin } = await import("./admin.server");
    return { ok: verifyAdmin(String(data.user ?? ""), String(data.pass ?? "")) };
  });

/** Replaces the whole catalog with the admin's staged snapshot. */
export const saveCatalog = createServerFn({ method: "POST" })
  .inputValidator((input: { pass: string; products: ProductInput[] }) => input)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./admin.server");
    assertAdmin(String(data.pass ?? ""));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const rows = (data.products ?? []).map((p) => ({
      id: isUuid(p.id) ? p.id : crypto.randomUUID(),
      title: p.title,
      category: p.category,
      sub_category: p.subCategory ?? "",
      price: Number(p.price) || 0,
      mrp: Number(p.mrp) || 0,
      description: p.description ?? "",
      sizes: p.sizes ?? [],
      colors: p.colors ?? [],
      fabric: p.fabric ?? "",
      recipient: p.recipient ?? "",
      occasion: p.occasion ?? "",
      images: p.images ?? [],
      in_stock: p.inStock !== false,
      created_at: new Date(Number(p.createdAt) || Date.now()).toISOString(),
    }));

    const { error: upsertError } = rows.length
      ? await supabaseAdmin.from("products").upsert(rows)
      : { error: null };
    if (upsertError) throw new Error(upsertError.message);

    const keep = rows.map((r) => r.id);
    const del = keep.length
      ? await supabaseAdmin.from("products").delete().not("id", "in", `(${keep.join(",")})`)
      : await supabaseAdmin.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (del.error) throw new Error(del.error.message);

    return { ok: true, count: rows.length };
  });

/** Updates one existing product without replacing or deleting other catalog entries. */
export const saveProduct = createServerFn({ method: "POST" })
  .inputValidator((input: { pass: string; product: ProductInput }) =>
    z.object({ pass: z.string().min(1), product: productEditSchema }).parse(input),
  )
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./admin.server");
    assertAdmin(data.pass);
    if (!isUuid(data.product.id)) throw new Error("Invalid product ID.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: updated, error } = await supabaseAdmin
      .from("products")
      .update({
        title: data.product.title,
        category: data.product.category,
        sub_category: data.product.subCategory,
        price: data.product.price,
        mrp: data.product.mrp,
        description: data.product.description,
        sizes: data.product.sizes,
        colors: data.product.colors,
        fabric: data.product.fabric,
        recipient: data.product.recipient,
        occasion: data.product.occasion,
        images: data.product.images,
        in_stock: data.product.inStock,
      })
      .eq("id", data.product.id)
      .select("id")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!updated) throw new Error("Product no longer exists. Refresh the inventory and try again.");
    return { ok: true, id: updated.id };
  });

export const listOrders = createServerFn({ method: "POST" })
  .inputValidator((input: { pass: string }) => input)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./admin.server");
    assertAdmin(String(data.pass ?? ""));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { pass: string; id: string; status: string }) => input)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./admin.server");
    assertAdmin(String(data.pass ?? ""));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type CouponInput = {
  id: string;
  code: string;
  discountType: "percent" | "flat";
  discountValue: number;
  minOrder: number;
  active: boolean;
};

export const listCoupons = createServerFn({ method: "POST" })
  .inputValidator((input: { pass: string }) => input)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./admin.server");
    assertAdmin(String(data.pass ?? ""));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/** Replaces the whole coupon list with the admin's staged snapshot. */
export const saveCoupons = createServerFn({ method: "POST" })
  .inputValidator((input: { pass: string; coupons: CouponInput[] }) => input)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./admin.server");
    assertAdmin(String(data.pass ?? ""));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const rows = (data.coupons ?? [])
      .filter((c) => String(c.code ?? "").trim())
      .map((c) => ({
        id: isUuid(c.id) ? c.id : crypto.randomUUID(),
        code: String(c.code).trim().toUpperCase(),
        discount_type: c.discountType === "flat" ? "flat" : "percent",
        discount_value: Number(c.discountValue) || 0,
        min_order: Number(c.minOrder) || 0,
        active: c.active !== false,
      }));

    const keep = rows.map((r) => r.id);
    const del = keep.length
      ? await supabaseAdmin.from("coupons").delete().not("id", "in", `(${keep.join(",")})`)
      : await supabaseAdmin
          .from("coupons")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");
    if (del.error) throw new Error(del.error.message);

    if (rows.length) {
      const { error } = await supabaseAdmin.from("coupons").upsert(rows);
      if (error) throw new Error(error.message);
    }
    return { ok: true, count: rows.length };
  });

/** Saves the public APK download URL after verifying the admin password. */
export const saveApkUrl = createServerFn({ method: "POST" })
  .inputValidator((input: { pass: string; url: string }) => input)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./admin.server");
    assertAdmin(String(data.pass ?? ""));
    const url = String(data.url ?? "").trim();
    if (url) {
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        throw new Error("Enter a valid APK download URL.");
      }
      if (parsed.protocol !== "https:") {
        throw new Error("APK download links must use HTTPS.");
      }
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("app_settings").upsert({
      key: "apk_url",
      value: url,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
