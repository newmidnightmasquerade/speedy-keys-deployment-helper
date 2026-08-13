import { createFileRoute } from "@tanstack/react-router";

// Serves the current favicon bytes from the CMS. Falls back to a
// transparent 1x1 PNG when nothing is set. Cache-busted by ?v= in root head.
const FALLBACK_PNG = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  ),
  (c) => c.charCodeAt(0),
);

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export const Route = createFileRoute("/favicon")({
  server: {
    handlers: {
      GET: async () => {
        type Row = { favicon_b64?: string; favicon_mime?: string };
        let data: Row | null = null;
        try {
          const { externalSupabase } = await import("@/lib/external-supabase.server");
          const res = await externalSupabase
            .from("site_settings")
            .select("favicon_b64, favicon_mime")
            .eq("id", 1)
            .maybeSingle();
          data = (res.data as Row | null) ?? null;
        } catch {
          data = null;
        }
        const b64 = data ? data.favicon_b64 : undefined;
        const mime = (data ? data.favicon_mime : undefined) ?? "image/png";
        const bytes = b64 ? base64ToBytes(b64) : FALLBACK_PNG;
        return new Response(bytes as unknown as BodyInit, {
          headers: {
            "content-type": mime,
            "cache-control": "public, max-age=300",
          },
        });
      },
    },
  },
});