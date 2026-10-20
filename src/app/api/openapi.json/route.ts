import { buildOpenAPISpec } from "@/lib/openapi";

export const dynamic = "force-dynamic";

/** The auto-generated OpenAPI 3.1 document powering /docs. */
export async function GET() {
  return new Response(JSON.stringify(buildOpenAPISpec(), null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
