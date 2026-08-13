// Client-safe head builders. Only emit meta the admin actually set —
// there are NO built-in default SEO strings.
import type { CodeStepContent, PageContentMap } from "./cms-defaults";

function seoMeta(title: string, description: string) {
  const meta: Array<Record<string, string>> = [];
  if (title) {
    meta.push({ title });
    meta.push({ property: "og:title", content: title });
  }
  if (description) {
    meta.push({ name: "description", content: description });
    meta.push({ property: "og:description", content: description });
  }
  return { meta };
}

export function buildCodeStepHead(c: CodeStepContent | undefined) {
  return seoMeta(c?.seoTitle ?? "", c?.seoDescription ?? "");
}

export function buildSimpleHead<
  K extends keyof PageContentMap,
  T extends { seoTitle: string; seoDescription: string },
>(c: T | undefined, _fallbackTitle?: string, _fallbackDescription?: string, _k?: K) {
  return seoMeta(c?.seoTitle ?? "", c?.seoDescription ?? "");
}