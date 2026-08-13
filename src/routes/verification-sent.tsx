import { createFileRoute, Link } from "@tanstack/react-router";
import { NeroCard, NeroShell, NeroWordmark } from "@/components/nero/Shell";
import { getSiteData } from "@/lib/cms.functions";
import { buildSimpleHead } from "@/lib/route-head";

export const Route = createFileRoute("/verification-sent")({
  loader: () => getSiteData(),
  head: ({ loaderData }) =>
    buildSimpleHead(loaderData?.content["verification-sent"], "Verification link sent — Nero", "Your Nero verification link was sent."),
  component: VerificationSentPage,
});

function VerificationSentPage() {
  const { brand, content, extras } = Route.useLoaderData();
  const c = content["verification-sent"];
  const e = extras["verification-sent"];
  return (
    <NeroShell brand={brand} customCss={e.customCss} blocks={e.blocks}>
      <NeroWordmark small text={brand.wordmark} />
      <div className="mt-6">
        <NeroCard>
          <div className="flex flex-col items-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-[22px] font-bold text-accent-foreground">
              &#10003;
            </span>
            <h2 className="mt-4 text-[20px] leading-tight font-bold text-card-foreground">{c.heading}</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{c.body}</p>
          </div>

          <div className="mt-5 rounded-md bg-secondary p-3 text-[13px] leading-relaxed text-secondary-foreground">
            {c.tip}
          </div>

          <p className="mt-5 text-center text-[14px] font-medium text-brand-link">
            <Link to="/verification-link">{c.resendLabel}</Link>
          </p>
          <p className="mt-2 text-center text-[13px] text-muted-foreground">
            <Link to="/login">{c.backLabel}</Link>
          </p>
        </NeroCard>
      </div>
    </NeroShell>
  );
}