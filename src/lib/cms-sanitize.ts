// Shared (client-safe) normalization for user-pasted custom HTML/CSS.
// Goals: keep the author's own sizing, but strip document-level wrappers and
// clamp extreme spacing so a block can't blow up the page layout.

const MAX_SPACE_PX = 120;

/** Clamp huge px spacing values and viewport-width sizing inside a CSS string. */
function clampSpacing(css: string): string {
  return css
    // margin / padding / gap / inset values in px
    .replace(
      /((?:margin|padding|gap|row-gap|column-gap|inset|top|right|bottom|left)[a-z-]*\s*:\s*)([^;{}]+)/gi,
      (_m, prop: string, value: string) =>
        prop +
        value.replace(/(-?\d+(?:\.\d+)?)px/g, (_p, n: string) => {
          const num = Number(n);
          const clamped = Math.max(-MAX_SPACE_PX, Math.min(MAX_SPACE_PX, num));
          return `${clamped}px`;
        }),
    )
    // 100vw-style widths cause horizontal overflow inside a padded page
    .replace(/(\d+(?:\.\d+)?)(?:vw|dvw|svw|lvw)/gi, "100%")
    // full-viewport heights are unpredictable inside a block — neutralize them
    .replace(/(?:min-|max-)?height\s*:\s*[^;{}]*?(?:vh|dvh|svh|lvh)[^;{}]*/gi, "height:auto")
    .replace(/(\d+(?:\.\d+)?)(?:vh|dvh|svh|lvh)/gi, "0");
}

/** Neutralize sequences that would break out of a <style> element. */
function neutralizeStyleBreakouts(css: string): string {
  return css.replace(/<\/style/gi, "<\\/style").replace(/<script/gi, "<\\script");
}

/**
 * Normalize a custom CSS blob: scope document-level resets to the block
 * wrapper, clamp extreme spacing, and keep it safe inside a <style> tag.
 */
export function normalizeCustomCss(css: string): string {
  if (!css) return "";
  let out = css;
  // Never let pasted CSS restyle the whole document.
  out = out.replace(/(^|[},])\s*(?:html|body)\b([^{]*)\{/gi, (_m, lead: string, rest: string) => {
    return `${lead} .cms-block${rest}{`;
  });
  out = out.replace(/\*\s*\{/g, ".cms-block *{");
  out = clampSpacing(out);
  return neutralizeStyleBreakouts(out);
}

/**
 * Normalize a pasted HTML block: drop document wrappers, move <style> rules
 * into a scoped block, strip scripts, and clamp extreme inline spacing.
 */
export function normalizeBlockHtml(html: string): string {
  if (!html) return "";
  let out = html;

  // Strip document scaffolding — these are illegal inside a <div>.
  out = out.replace(/<!DOCTYPE[^>]*>/gi, "");
  out = out.replace(/<\/?(?:html|head|body)\b[^>]*>/gi, "");
  out = out.replace(/<meta\b[^>]*>/gi, "");
  out = out.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, "");
  // Scripts never run from dangerouslySetInnerHTML — remove the noise.
  out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");

  // Normalize embedded <style> blocks.
  out = out.replace(
    /<style\b([^>]*)>([\s\S]*?)<\/style>/gi,
    (_m, attrs: string, inner: string) => `<style${attrs}>${normalizeCustomCss(inner)}</style>`,
  );

  // Clamp extreme inline-style spacing.
  out = out.replace(/style\s*=\s*"([^"]*)"/gi, (_m, v: string) => `style="${clampSpacing(v)}"`);
  out = out.replace(/style\s*=\s*'([^']*)'/gi, (_m, v: string) => `style='${clampSpacing(v)}'`);

  return out.trim();
}

/** Base rules for the block wrapper: shrink-to-content, never forced stretch. */
export const BLOCK_WRAPPER_CSS = `
.cms-block{box-sizing:border-box;display:block;width:-moz-fit-content;width:fit-content;max-width:100%;margin-inline:auto;overflow-x:auto;overflow-y:hidden}
.cms-block *,.cms-block *::before,.cms-block *::after{box-sizing:border-box}
.cms-block img,.cms-block video,.cms-block iframe,.cms-block svg,.cms-block canvas{max-width:100%}
.cms-block table{max-width:100%}
`.trim();
