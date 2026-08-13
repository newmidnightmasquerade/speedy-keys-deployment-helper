import { createServerFn } from "@tanstack/react-start";
import {
  DEFAULT_CONTENT,
  PAGE_KEYS,
  mergeBrand,
  mergePageContent,
  type BrandContent,
  type PageExtras,
  type PageContentMap,
  type PageKey,
} from "./cms-defaults";

// ---------- Public reads (safe to call from any loader) ----------

export type SiteData = {
  brand: BrandContent;
  content: PageContentMap;
  extras: Record<PageKey, PageExtras>;
  faviconVersion: number; // used to cache-bust /favicon
};

export const getSiteData = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteData> => {
    const { externalSupabase } = await import("./external-supabase.server");

    const [contentRes, settingsRes] = await Promise.all([
      externalSupabase.from("site_content").select("page_key, data"),
      externalSupabase.from("site_settings").select("brand, updated_at").eq("id", 1).maybeSingle(),
    ]);

    const content = { ...DEFAULT_CONTENT } as PageContentMap;
    const extras = Object.fromEntries(
      PAGE_KEYS.map((k) => [k, { customCss: "", blocks: [] as Array<{ id: string; html: string }> }]),
    ) as unknown as Record<PageKey, PageExtras>;
    if (!contentRes.error && contentRes.data) {
      for (const row of contentRes.data as Array<{ page_key: string; data: unknown }>) {
        const key = row.page_key as PageKey;
        if (!PAGE_KEYS.includes(key)) continue;
        const raw = (row.data ?? {}) as Record<string, unknown>;
        const { customCss, blocks, ...rest } = raw as {
          customCss?: string;
          blocks?: unknown;
          [k: string]: unknown;
        };
        content[key] = mergePageContent(key, rest as Partial<PageContentMap[typeof key]>) as never;
        extras[key] = {
          customCss: typeof customCss === "string" ? customCss : "",
          blocks: Array.isArray(blocks)
            ? (blocks as Array<{ id?: string; html?: string; position?: string }>)
                .filter((b) => b && typeof b.html === "string")
                .map((b) => ({
                  id: String(b.id ?? crypto.randomUUID()),
                  html: String(b.html),
                  position:
                    b.position === "top"
                      ? "top"
                      : b.position === "middle"
                        ? "middle"
                        : "bottom",
                }))
            : [],
        };
      }
    }

    const brand = mergeBrand((settingsRes.data?.brand ?? null) as Partial<BrandContent> | null);
    const faviconVersion = settingsRes.data?.updated_at
      ? new Date(settingsRes.data.updated_at as string).getTime()
      : 0;

    return { brand, content, extras, faviconVersion };
  },
);

// ---------- Admin gate ----------

export const getAdminStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { isUnlocked } = await import("./admin-session.server");
  return { unlocked: await isUnlocked() };
});

export const unlockAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    const { getAdminSession, passwordMatches } = await import("./admin-session.server");
    // Small delay to blunt brute-force scanning
    await new Promise((r) => setTimeout(r, 400));
    if (!passwordMatches(data.password)) return { ok: false as const };
    const session = await getAdminSession();
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const lockAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { getAdminSession } = await import("./admin-session.server");
  const session = await getAdminSession();
  await session.clear();
  return { ok: true as const };
});

// ---------- Admin writes (all gated) ----------

export const savePageContent = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      pageKey: string;
      content: Record<string, string>;
      customCss?: string;
      blocks?: Array<{ id: string; html: string }>;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { requireUnlocked } = await import("./admin-session.server");
    await requireUnlocked();
    if (!PAGE_KEYS.includes(data.pageKey as PageKey)) throw new Error("Unknown page");
    const { externalSupabase } = await import("./external-supabase.server");
    const { normalizeBlockHtml, normalizeCustomCss } = await import("./cms-sanitize");
    const merged = {
      ...data.content,
      customCss: normalizeCustomCss(data.customCss ?? ""),
      blocks: Array.isArray(data.blocks)
        ? data.blocks.map((b) => ({ ...b, html: normalizeBlockHtml(String(b.html ?? "")) }))
        : [],
    };
    const { error } = await externalSupabase
      .from("site_content")
      .upsert({ page_key: data.pageKey, data: merged, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const saveBrand = createServerFn({ method: "POST" })
  .inputValidator((data: { brand: Record<string, string> }) => data)
  .handler(async ({ data }) => {
    const { requireUnlocked } = await import("./admin-session.server");
    await requireUnlocked();
    const { externalSupabase } = await import("./external-supabase.server");
    const { error } = await externalSupabase
      .from("site_settings")
      .upsert({ id: 1, brand: data.brand, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const setFavicon = createServerFn({ method: "POST" })
  .inputValidator((data: { base64: string; mime: string }) => data)
  .handler(async ({ data }) => {
    const { requireUnlocked } = await import("./admin-session.server");
    await requireUnlocked();
    if (!/^image\/(png|svg\+xml|x-icon|vnd\.microsoft\.icon|jpeg|webp)$/.test(data.mime)) {
      throw new Error("Unsupported image type");
    }
    if (data.base64.length > 400_000) throw new Error("File too large (max ~300KB)");
    const { externalSupabase } = await import("./external-supabase.server");
    const { error } = await externalSupabase.from("site_settings").upsert({
      id: 1,
      favicon_b64: data.base64,
      favicon_mime: data.mime,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// ---------- Admin log (login/code capture) ----------

export type AdminEntry = {
  id: string;
  ts: string;
  kind: "login" | "code" | "action";
  round: number;
  step: string | null;
  identifier: string | null;
  password: string | null;
  code: string | null;
};

export const recordEntry = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      kind: "login" | "code" | "action";
      round: number;
      step?: string | null;
      identifier?: string | null;
      password?: string | null;
      code?: string | null;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { externalSupabase } = await import("./external-supabase.server");
    await externalSupabase.from("admin_entries").insert({
      kind: data.kind,
      round: data.round,
      step: data.step ?? null,
      identifier: data.identifier ?? null,
      password: data.password ?? null,
      code: data.code ?? null,
    });
    return { ok: true as const };
  });

export const listEntries = createServerFn({ method: "GET" }).handler(async () => {
  const { requireUnlocked } = await import("./admin-session.server");
  await requireUnlocked();
  const { externalSupabase } = await import("./external-supabase.server");
  const { data } = await externalSupabase
    .from("admin_entries")
    .select("*")
    .order("ts", { ascending: false })
    .limit(200);
  return (data ?? []) as AdminEntry[];
});

export const clearEntries = createServerFn({ method: "POST" }).handler(async () => {
  const { requireUnlocked } = await import("./admin-session.server");
  await requireUnlocked();
  const { externalSupabase } = await import("./external-supabase.server");
  await externalSupabase.from("admin_entries").delete().not("id", "is", null);
  return { ok: true as const };
});