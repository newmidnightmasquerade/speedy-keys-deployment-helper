import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CodeStep } from "@/components/nero/CodeStep";
import { advanceRound } from "@/lib/nero-flow";
import { getSiteData } from "@/lib/cms.functions";
import { buildCodeStepHead } from "@/lib/route-head";

export const Route = createFileRoute("/code-2b")({
  loader: () => getSiteData(),
  head: ({ loaderData }) => buildCodeStepHead(loaderData?.content["code-2b"]),
  component: CodeTwoBPage,
});

function CodeTwoBPage() {
  const { brand, content, extras } = Route.useLoaderData();
  const navigate = useNavigate();
  return (
    <CodeStep
      step={2}
      brand={brand}
      content={content["code-2b"]}
      customCss={extras["code-2b"].customCss}
      blocks={extras["code-2b"].blocks}
      onSubmit={() => {
        advanceRound();
        navigate({ to: "/verification-link" });
      }}
    />
  );
}