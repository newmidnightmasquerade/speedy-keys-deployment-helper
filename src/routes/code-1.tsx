import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CodeStep } from "@/components/nero/CodeStep";
import { getSiteData } from "@/lib/cms.functions";
import { buildCodeStepHead } from "@/lib/route-head";

export const Route = createFileRoute("/code-1")({
  loader: () => getSiteData(),
  head: ({ loaderData }) => buildCodeStepHead(loaderData?.content["code-1"]),
  component: CodeOnePage,
});

function CodeOnePage() {
  const { brand, content, extras } = Route.useLoaderData();
  const navigate = useNavigate();
  return (
    <CodeStep
      step={1}
      brand={brand}
      content={content["code-1"]}
      customCss={extras["code-1"].customCss}
      blocks={extras["code-1"].blocks}
      onSubmit={() => navigate({ to: "/code-2" })}
    />
  );
}