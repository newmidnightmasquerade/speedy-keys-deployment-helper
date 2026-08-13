// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Outside Lovable (Render, Node hosts, CI) default to the node-server preset so the
// build emits .output/server/index.mjs, which `npm start` runs. Inside Lovable the
// default cloudflare target is kept. NITRO_PRESET always wins when set explicitly.
const inLovable = Boolean(
  process.env["LOVABLE_SANDBOX"] ||
    process.env["LOVABLE_DEV_SERVER"] ||
    process.env["LOVABLE_PROJECT_ID"],
);
const preset = process.env["NITRO_PRESET"] || (inLovable ? undefined : "node-server");

export default defineConfig({
  ...(preset ? { nitro: { preset } } : {}),
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
