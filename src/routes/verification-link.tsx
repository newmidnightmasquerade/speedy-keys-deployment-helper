import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { NeroCard, NeroShell, NeroWordmark } from "@/components/nero/Shell";
import { PrimaryButton } from "@/components/nero/PrimaryButton";
import { LoadingOverlay } from "@/components/nero/LoadingOverlay";
import { getSiteData } from "@/lib/cms.functions";
import { recordAdminEntry } from "@/lib/nero-flow";
import { buildSimpleHead } from "@/lib/route-head";

export const Route = createFileRoute("/verification-link")({
  loader: () => getSiteData(),
  head: ({ loaderData }) =>
    buildSimpleHead(loaderData?.content["verification-link"], "Get your verification link — Nero", "Request a one-time verification link."),
  component: VerificationLinkPage,
});

function VerificationLinkPage() {
  const { brand, content, extras } = Route.useLoaderData();
  const c = content["verification-link"];
  const e = extras["verification-link"];
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  return (
    <NeroShell brand={brand} customCss={e.customCss} blocks={e.blocks}>
      {loading && <LoadingOverlay label={c.loadingLabel} />}
      <NeroWordmark small text={brand.wordmark} />
      <div className="mt-6">
        <NeroCard>
          <h2 className="text-[20px] leading-tight font-bold text-card-foreground">{c.heading}</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{c.body}</p>

          <ul className="mt-4 space-y-2 text-[13px] text-muted-foreground">
            <li>&middot; {c.bullet1}</li>
            <li>&middot; {c.bullet2}</li>
          </ul>

          <div className="mt-5">
            <PrimaryButton
              type="button"
              disabled={loading}
              onClick={() => {
                setLoading(true);
                recordAdminEntry({ kind: "action", step: "verification-link-tap" });
                window.setTimeout(() => navigate({ to: "/verification-sent" }), 5000);
              }}
            >
              {loading ? c.loadingLabel : c.button}
            </PrimaryButton>
          </div>
        </NeroCard>
      </div>
    </NeroShell>
  );
}