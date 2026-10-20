import type { Metadata } from "next";
import { endpointsByTag } from "@/lib/api-registry";
import { SiteNav } from "@/components/site-nav";
import { DocsClient } from "@/components/docs/docs-client";

export const metadata: Metadata = {
  title: "API Reference — FOLIO Bookstore REST API",
  description:
    "Interactive OpenAPI documentation for the FOLIO bookstore API — authenticate, and test every CRUD operation against the live server.",
};

export const dynamic = "force-dynamic";

export default function DocsPage() {
  return (
    <div className="relative min-h-dvh pt-16">
      <SiteNav active="docs" />
      <DocsClient groups={endpointsByTag()} />
    </div>
  );
}
