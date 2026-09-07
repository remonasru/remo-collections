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
