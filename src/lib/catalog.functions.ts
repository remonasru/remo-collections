import { createServerFn } from "@tanstack/react-start";

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

const PRODUCT_UPDATE_TIMEOUT_MS = 30_000;

function isTransientUpdateError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /timeout|timed out|abort|network|fetch failed|502|503|504|cold start/i.test(message);
}

/**
 * Updates a single product row, sending ONLY the columns that actually changed.
 * Heavy fields (base64 images, arrays) are skipped when unmodified, and the
 * update is retried once on transient network/timeout errors.
 */
export const saveProduct = createServerFn({ method: "POST" })
  .inputValidator((input: { pass: string; id: string; patch: Record<string, unknown> }) => input)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./admin.server");
    assertAdmin(String(data.pass ?? ""));
    const id = String(data.id ?? "");
    if (!isUuid(id)) throw new Error("Invalid product id.");

    const allowed = new Set([
      "title", "category", "sub_category", "price", "mrp", "description",
      "sizes", "colors", "fabric", "recipient", "occasion", "images", "in_stock",
    ]);
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data.patch ?? {})) {
      if (allowed.has(key) && value !== undefined) patch[key] = value;
    }
    if (!Object.keys(patch).length) return { ok: true, skipped: true };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let lastError: unknown = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { data: row, error } = await supabaseAdmin
          .from("products")
          .update(patch)
          .eq("id", id)
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        return { ok: true, id: row?.id ?? id };
      } catch (error) {
        lastError = error;
        if (attempt === 0 && isTransientUpdateError(error)) {
          await new Promise((resolve) => setTimeout(resolve, 800));
          continue;
        }
        break;
      }
    }
    throw lastError instanceof Error ? lastError : new Error("Product update failed.");
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
