import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "FOLIO — Bookstore REST API",
  description:
    "Async CRUD REST API with schema-first validation, JWT auth & RBAC, and PostgreSQL persistence. Interactive OpenAPI docs included.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="grain min-h-dvh bg-ink-950 text-cream-100 antialiased">
        {children}
      </body>
    </html>
  );
}
