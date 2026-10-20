import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import CatalogClient from "@/components/catalog/catalog-client";

export const metadata: Metadata = {
  title: "Catalogue — FOLIO Bookstore REST API",
  description:
    "A living storefront rendered entirely from the FOLIO REST API — filtering, pagination, and authenticated CRUD.",
};

export const dynamic = "force-dynamic";

export default function CatalogPage() {
  return (
    <div className="relative min-h-dvh pt-16">
      <SiteNav active="catalog" />
      <CatalogClient />
    </div>
  );
}
