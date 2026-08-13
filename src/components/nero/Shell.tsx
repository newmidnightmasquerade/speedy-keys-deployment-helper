import { createContext, useContext, type ReactNode } from "react";
import type { BrandContent, Block } from "@/lib/cms-defaults";
import { DEFAULT_BRAND } from "@/lib/cms-defaults";
import {
  BLOCK_WRAPPER_CSS,
  normalizeBlockHtml,
  normalizeCustomCss,
} from "@/lib/cms-sanitize";

const BlocksCtx = createContext<Block[]>([]);

function BlockList({ blocks, className }: { blocks: Block[]; className?: string }) {
  if (blocks.length === 0) return null;
  return (
    <div className={className}>
      {blocks.map((b) => (
        <div
          key={b.id}
          className="cms-block"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: normalizeBlockHtml(b.html) }}
        />
      ))}
    </div>
  );
}

export function NeroMiddleBlocks() {
  const blocks = useContext(BlocksCtx).filter((b) => b.position === "middle");
  return <BlockList blocks={blocks} className="my-4 space-y-4" />;
}

export function NeroShell({
  children,
  brand = DEFAULT_BRAND,
  customCss,
  blocks,
}: {
  children: ReactNode;
  brand?: BrandContent;
  customCss?: string | undefined;
  blocks?: Block[] | undefined;
}) {
  const year = String(new Date().getFullYear());
  const footer1 = brand.footer1.replace("{year}", year);
  const footer2 = brand.footer2.replace("{year}", year);
  const rawCss = [brand.customCss ?? "", customCss ?? ""].filter(Boolean).join("\n");
  const combinedCss = [BLOCK_WRAPPER_CSS, rawCss ? normalizeCustomCss(rawCss) : ""]
    .filter(Boolean)
    .join("\n");
  const allBlocks = blocks ?? [];
  const topBlocks = allBlocks.filter((b) => b.position === "top");
  const bottomBlocks = allBlocks.filter((b) => b.position === "bottom" || (b.position !== "top" && b.position !== "middle"));
  return (
    <BlocksCtx.Provider value={allBlocks}>
      <div className="flex min-h-screen flex-col overflow-x-hidden bg-background font-sans">
        {combinedCss ? (
          <style
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: combinedCss }}
          />
        ) : null}
        <main className="flex flex-1 flex-col items-center px-4 pt-10 pb-8">
          <div className="w-full max-w-[400px]">
            <BlockList blocks={topBlocks} className="mb-6 space-y-4" />
            {children}
            <BlockList blocks={bottomBlocks} className="mt-6 space-y-4" />
          </div>
        </main>
        <footer className="pb-8 text-center text-[11px] text-muted-foreground">
          <p>{footer1}</p>
          <p className="mt-1">{footer2}</p>
        </footer>
      </div>
    </BlocksCtx.Provider>
  );
}

export function NeroWordmark({
  small = false,
  text = DEFAULT_BRAND.wordmark,
}: {
  small?: boolean;
  text?: string;
}) {
  return (
    <>
      <h1
        className={
          small
            ? "text-center text-3xl font-bold tracking-tight text-primary"
            : "text-center text-5xl font-bold tracking-tight text-primary"
        }
      >
        {text}
      </h1>
      <NeroMiddleBlocks />
    </>
  );
}

export function NeroCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      {children}
    </div>
  );
}