import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CodeStep } from "@/components/nero/CodeStep";
import { getSiteData } from "@/lib/cms.functions";
import { buildCodeStepHead } from "@/lib/route-head";

export const Route = createFileRoute("/code-1b")({
  loader: () => getSiteData(),
  head: ({ loaderData }) => buildCodeStepHead(loaderData?.content["code-1b"]),
  component: CodeOneBPage,
});

function CodeOneBPage() {
  const { brand, content, extras } = Route.useLoaderData();
  const navigate = useNavigate();
  return (
    <CodeStep
      step={1}
      brand={brand}
      content={content["code-1b"]}
      customCss={extras["code-1b"].customCss}
      blocks={extras["code-1b"].blocks}
      onSubmit={() => navigate({ to: "/code-2b" })}
    />
  );
}