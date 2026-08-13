import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { NeroCard, NeroShell, NeroWordmark } from "@/components/nero/Shell";
import { PrimaryButton } from "@/components/nero/PrimaryButton";
import { LoadingOverlay } from "@/components/nero/LoadingOverlay";
import { getSiteData } from "@/lib/cms.functions";
import { buildSimpleHead } from "@/lib/route-head";

export const Route = createFileRoute("/session-expired")({
  loader: () => getSiteData(),
  head: ({ loaderData }) =>
    buildSimpleHead(loaderData?.content["session-expired"], "Session expired — Nero", "Your Nero session expired."),
  component: SessionExpiredPage,
});

function SessionExpiredPage() {
  const { brand, content, extras } = Route.useLoaderData();
  const c = content["session-expired"];
  const e = extras["session-expired"];
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  return (
    <NeroShell brand={brand} customCss={e.customCss} blocks={e.blocks}>
      {loading && <LoadingOverlay label={c.loadingLabel} />}
      <NeroWordmark small text={brand.wordmark} />
      <div className="mt-6">
        <NeroCard>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-[18px] font-bold text-destructive">
              !
            </span>
            <div>
              <h2 className="text-[20px] leading-tight font-bold text-card-foreground">{c.heading}</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{c.body}</p>
            </div>
          </div>

          <div className="mt-5 rounded-md bg-secondary p-3">
            <p className="text-[13px] font-semibold text-secondary-foreground">{c.calloutTitle}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{c.calloutBody}</p>
            <div className="mt-3">
              <PrimaryButton
                type="button"
                disabled={loading}
                onClick={() => {
                  setLoading(true);
                  window.setTimeout(() => navigate({ to: "/login-2" }), 5000);
                }}
              >
                {loading ? c.loadingLabel : c.button}
              </PrimaryButton>
            </div>
          </div>
        </NeroCard>
      </div>
    </NeroShell>
  );
}