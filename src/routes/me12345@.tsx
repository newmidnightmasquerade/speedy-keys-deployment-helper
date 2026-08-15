import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  getAdminStatus,
  getSiteData,
  listEntries,
  clearEntries,
  savePageContent,
  saveBrand,
  setFavicon,
  unlockAdmin,
  lockAdmin,
  type AdminEntry,
} from "@/lib/cms.functions";
import {
  DEFAULT_BRAND,
  DEFAULT_CONTENT,
  PAGE_KEYS,
  type BrandContent,
  type Block,
  type PageExtras,
  type PageContentMap,
  type PageKey,
} from "@/lib/cms-defaults";

export const Route = createFileRoute("/me12345@")({
  // SSR the gate — unauthenticated visitors never see the editor JSX.
  ssr: true,
  loader: async () => {
    const status = await getAdminStatus();
    if (!status.unlocked) return { unlocked: false as const };
    const [site, entries] = await Promise.all([getSiteData(), listEntries()]);
    return { unlocked: true as const, site, entries };
  },
  head: () => ({
    meta: [
      { title: "Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminRoute,
});

function AdminRoute() {
  const data = Route.useLoaderData();
  return data.unlocked ? (
    <AdminDashboard
      brand={data.site.brand}
      content={data.site.content}
      extras={data.site.extras}
      entries={data.entries}
    />
  ) : (
    <UnlockGate />
  );
}

function UnlockGate() {
  const router = useRouter();
  const unlock = useServerFn(unlockAdmin);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          const res = await unlock({ data: { password } });
          setBusy(false);
          if (res.ok) router.invalidate();
          else setError("Incorrect password");
        }}
        className="w-full max-w-sm space-y-3 rounded-lg border border-border bg-card p-6"
      >
        <h1 className="text-lg font-semibold text-card-foreground">Admin</h1>
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-ring focus:outline-none"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={busy || password.length < 1}
          className="h-11 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Checking…" : "Unlock"}
        </button>
      </form>
    </div>
  );
}

type Tab = "pages" | "brand" | "favicon" | "log";

function AdminDashboard({
  brand,
  content,
  extras,
  entries,
}: {
  brand: BrandContent;
  content: PageContentMap;
  extras: Record<PageKey, PageExtras>;
  entries: AdminEntry[];
}) {
  const [tab, setTab] = useState<Tab>("pages");
  const router = useRouter();
  const lock = useServerFn(lockAdmin);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold">Nero CMS</h1>
          <button
            onClick={async () => {
              await lock();
              router.invalidate();
            }}
            className="rounded-md border border-input px-3 py-1.5 text-xs hover:bg-accent"
          >
            Lock
          </button>
        </div>
        <div className="mx-auto flex max-w-4xl gap-1 px-4">
          {(["pages", "brand", "favicon", "log"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-t-md px-3 py-2 text-sm ${
                tab === t
                  ? "border border-b-0 border-border bg-card font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "log" ? "Submissions" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {tab === "pages" && <PagesEditor content={content} extras={extras} />}
        {tab === "brand" && <BrandEditor brand={brand} />}
        {tab === "favicon" && <FaviconEditor />}
        {tab === "log" && <SubmissionsPanel initial={entries} />}
      </main>
    </div>
  );
}

function PagesEditor({
  content,
  extras,
}: {
  content: PageContentMap;
  extras: Record<PageKey, PageExtras>;
}) {
  const [pageKey, setPageKey] = useState<PageKey>("login");
  const [fields, setFields] = useState<Record<string, string>>(
    () => content[pageKey] as unknown as Record<string, string>,
  );
  const [customCss, setCustomCss] = useState<string>(() => extras[pageKey].customCss);
  const [blocks, setBlocks] = useState<Block[]>(() => extras[pageKey].blocks);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const save = useServerFn(savePageContent);
  const router = useRouter();

  useEffect(() => {
    setFields(content[pageKey] as unknown as Record<string, string>);
    setCustomCss(extras[pageKey].customCss);
    setBlocks(extras[pageKey].blocks);
    setSaved(false);
  }, [pageKey, content, extras]);

  const keys = Object.keys(DEFAULT_CONTENT[pageKey]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm text-muted-foreground">Page</label>
        <select
          value={pageKey}
          onChange={(e) => setPageKey(e.target.value as PageKey)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          {PAGE_KEYS.map((k) => (
            <option key={k} value={k}>
              /{k}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-5">
        {keys.map((k) => {
          const value = fields[k] ?? "";
          const long = value.length > 60 || k.toLowerCase().includes("body") || k.toLowerCase().includes("description");
          return (
            <div key={k} className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">{k}</label>
              {long ? (
                <textarea
                  rows={3}
                  value={value}
                  onChange={(e) => setFields({ ...fields, [k]: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none"
                />
              ) : (
                <input
                  value={value}
                  onChange={(e) => setFields({ ...fields, [k]: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-ring focus:outline-none"
                />
              )}
            </div>
          );
        })}

        <div className="space-y-2 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">
              Custom CSS (injected into &lt;style&gt; on this page)
            </label>
            <span className="text-[10px] text-muted-foreground">
              Target classes like .brand-link, .text-primary, or write your own selectors.
            </span>
          </div>
          <textarea
            rows={6}
            value={customCss}
            onChange={(e) => setCustomCss(e.target.value)}
            placeholder={`/* Example */\nh1 { color: hotpink; font-size: 48px; }\n.brand-link { text-decoration: underline; }`}
            className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus:border-ring focus:outline-none"
          />
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">
              Extra blocks (raw HTML rendered at the bottom of this page)
            </label>
            <button
              type="button"
              onClick={() =>
                setBlocks([
                  ...blocks,
                  { id: crypto.randomUUID(), html: "<p>New block</p>", position: "bottom" as const },
                ])
              }
              className="rounded-md border border-input px-2 py-1 text-xs hover:bg-accent"
            >
              + Add block
            </button>
          </div>
          {blocks.length === 0 && (
            <p className="text-xs text-muted-foreground">No extra blocks yet.</p>
          )}
          {blocks.map((b, i) => (
            <div key={b.id} className="space-y-1 rounded-md border border-input p-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground">Block {i + 1}</span>
                <div className="flex items-center gap-1">
                  <label className="mr-1 text-[10px] text-muted-foreground">Position</label>
                  <select
                    value={b.position}
                    onChange={(e) => {
                      const v = e.target.value;
                      const position =
                        v === "top" ? "top" : v === "middle" ? "middle" : "bottom";
                      setBlocks(
                        blocks.map((x) =>
                          x.id === b.id ? { ...x, position } : x,
                        ),
                      );
                    }}
                    className="rounded border border-input bg-background px-1 py-0.5 text-[10px]"
                  >
                    <option value="top">Top (above content)</option>
                    <option value="middle">Middle (under heading)</option>
                    <option value="bottom">Bottom (below content)</option>
                  </select>
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => {
                      const next = [...blocks];
                      [next[i - 1], next[i]] = [next[i]!, next[i - 1]!];
                      setBlocks(next);
                    }}
                    className="rounded px-1.5 py-0.5 text-xs hover:bg-accent disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={i === blocks.length - 1}
                    onClick={() => {
                      const next = [...blocks];
                      [next[i], next[i + 1]] = [next[i + 1]!, next[i]!];
                      setBlocks(next);
                    }}
                    className="rounded px-1.5 py-0.5 text-xs hover:bg-accent disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlocks(blocks.filter((x) => x.id !== b.id))}
                    className="rounded px-1.5 py-0.5 text-xs text-destructive hover:bg-accent"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <textarea
                rows={4}
                value={b.html}
                onChange={(e) =>
                  setBlocks(blocks.map((x) => (x.id === b.id ? { ...x, html: e.target.value } : x)))
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus:border-ring focus:outline-none"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 border-t border-border pt-4">
          <button
            onClick={async () => {
              setSaving(true);
              await save({ data: { pageKey, content: fields, customCss, blocks } });
              setSaving(false);
              setSaved(true);
              router.invalidate();
            }}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {saved && <span className="text-xs text-muted-foreground">Saved.</span>}
        </div>
      </div>
    </div>
  );
}

function BrandEditor({ brand }: { brand: BrandContent }) {
  const [b, setB] = useState<BrandContent>(brand);
  const [saving, setSaving] = useState(false);
  const save = useServerFn(saveBrand);
  const router = useRouter();

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5">
      {(Object.keys(DEFAULT_BRAND) as Array<keyof BrandContent>).map((k) => (
        <div key={k} className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">{k}</label>
          <input
            value={b[k]}
            onChange={(e) => setB({ ...b, [k]: e.target.value })}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-ring focus:outline-none"
          />
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        Use <code>{"{year}"}</code> in footer text to insert the current year.
      </p>
      <button
        onClick={async () => {
          setSaving(true);
          await save({ data: { brand: b as unknown as Record<string, string> } });
          setSaving(false);
          router.invalidate();
        }}
        disabled={saving}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save brand"}
      </button>
    </div>
  );
}

function FaviconEditor() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const upload = useServerFn(setFavicon);

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
      <div>
        <p className="text-sm font-medium">Current favicon</p>
        <img
          src={`/favicon?v=${Date.now()}`}
          alt="Current favicon"
          className="mt-2 h-12 w-12 rounded border border-border bg-background"
        />
      </div>
      <label className="block text-sm">
        <span className="text-muted-foreground">Upload PNG, SVG, or ICO (max ~300KB)</span>
        <input
          type="file"
          accept="image/png,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,image/jpeg,image/webp"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            setMsg(null);
            try {
              const buf = await file.arrayBuffer();
              let bin = "";
              const bytes = new Uint8Array(buf);
              for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
              const base64 = btoa(bin);
              await upload({ data: { base64, mime: file.type || "image/png" } });
              setMsg("Favicon updated. Reload to see it in the browser tab.");
            } catch (err) {
              setMsg((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
          className="mt-2 block w-full text-sm"
        />
      </label>
      {busy && <p className="text-xs text-muted-foreground">Uploading…</p>}
      {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
    </div>
  );
}

function SubmissionsPanel({ initial }: { initial: AdminEntry[] }) {
  const [entries, setEntries] = useState<AdminEntry[]>(initial);
  const [soundOn, setSoundOn] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const refresh = useServerFn(listEntries);
  const clear = useServerFn(clearEntries);

  const getCtx = (): AudioContext | null => {
    if (typeof window === "undefined") return null;
    const AC =
      (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!audioCtxRef.current) audioCtxRef.current = new AC();
    return audioCtxRef.current;
  };

  const playChime = () => {
    try {
      const ctx = getCtx();
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const now = ctx.currentTime;
      ([[880, 0], [1320, 0.18], [1760, 0.36]] as const).forEach(([freq, offset]) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = freq;
        o.type = "sine";
        o.connect(g);
        g.connect(ctx.destination);
        g.gain.setValueAtTime(0.0001, now + offset);
        g.gain.exponentialRampToValueAtTime(0.35, now + offset + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.35);
        o.start(now + offset);
        o.stop(now + offset + 0.4);
      });
    } catch {}
  };

  const enableSound = async () => {
    const ctx = getCtx();
    if (ctx && ctx.state === "suspended") {
      try { await ctx.resume(); } catch {}
    }
    setSoundOn(true);
    playChime();
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  };

  useEffect(() => {
    const id = window.setInterval(async () => {
      const next = await refresh();
      setEntries((prev) => {
        const prevIds = new Set(prev.map((p) => p.id));
        const fresh = next.filter((n) => !prevIds.has(n.id));
        if (fresh.length > 0) {
          if (soundOn) playChime();
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            const n = fresh[0]!;
            const title =
              n.kind === "login"
                ? "New login submission"
                : n.kind === "code"
                  ? "New code submission"
                  : "New action";
            const body =
              n.kind === "login"
                ? `${n.identifier ?? ""} · ${n.password ?? ""}`
                : n.kind === "code"
                  ? `Code ${n.code ?? ""} (${n.step ?? ""})`
                  : `${n.step ?? ""} · round ${n.round}`;
            try { new Notification(title, { body }); } catch {}
          }
        }
        return next;
      });
    }, 3000);
    return () => window.clearInterval(id);
  }, [refresh, soundOn]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Live login + code submissions (polling every 3s).
        </p>
        <div className="flex items-center gap-2">
          {soundOn ? (
            <button
              onClick={() => setSoundOn(false)}
              className="rounded-md border border-input px-3 py-1.5 text-xs hover:bg-accent"
              title="Mute notification sound"
            >
              🔔 Sound on
            </button>
          ) : (
            <button
              onClick={enableSound}
              className="rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
              title="Click to enable notification sound"
            >
              🔕 Enable sound
            </button>
          )}
          <button
            onClick={async () => {
              await clear();
              setEntries([]);
            }}
            className="rounded-md border border-input px-3 py-1.5 text-xs hover:bg-accent"
          >
            Clear
          </button>
        </div>
      </div>

      {entries.length === 0 && (
        <p className="rounded-md border border-dashed border-input p-6 text-center text-sm text-muted-foreground">
          No submissions yet.
        </p>
      )}
      {entries.map((e) => (
        <div
          key={e.id}
          className={`rounded-md border p-4 text-sm ${
            e.kind === "action"
              ? "border-primary bg-primary/10"
              : "border-input bg-card"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-mono uppercase">
              {e.kind === "login"
                ? "LOGIN"
                : e.kind === "action"
                  ? `ACTION · ${e.step ?? ""}`
                  : `CODE ${e.step ?? ""}`}{" "}
              · round {e.round}
            </span>
            <span>{new Date(e.ts).toLocaleTimeString()}</span>
          </div>
          {e.kind === "login" ? (
            <div className="mt-2 space-y-1">
              <div>
                <span className="text-muted-foreground">Email/Phone: </span>
                <span className="font-mono">{e.identifier}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Password: </span>
                <span className="font-mono">{e.password}</span>
              </div>
            </div>
          ) : e.kind === "code" ? (
            <div className="mt-2">
              <span className="text-muted-foreground">Code: </span>
              <span className="font-mono text-base tracking-[0.3em]">{e.code}</span>
            </div>
          ) : (
            <div className="mt-2 font-medium text-primary">
              User tapped &ldquo;Get verification link&rdquo;.
            </div>
          )}
        </div>
      ))}
    </div>
  );
}