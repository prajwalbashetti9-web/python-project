import Link from "next/link";
import { BookKey, Braces, Library, TerminalSquare } from "lucide-react";

export function SiteNav({ active }: { active: "home" | "docs" | "catalog" }) {
  const link = (href: string, label: string, key: string, Icon: typeof Library) => (
    <Link
      key={href}
      href={href}
      className={`group flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] transition-colors ${
        active === key
          ? "bg-cream-100/10 text-cream-100"
          : "text-cream-500 hover:bg-cream-100/5 hover:text-cream-200"
      }`}
    >
      <Icon size={14} strokeWidth={2.2} className={active === key ? "text-gilt-400" : "text-cream-600 group-hover:text-gilt-400"} />
      {label}
    </Link>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-cream-100/[0.06] bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 md:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-gilt-400/30 bg-gilt-400/10 font-display text-lg font-black text-gilt-400">
            F
          </span>
          <span className="leading-tight">
            <span className="block font-display text-[15px] font-bold tracking-wide text-cream-100">
              FOLIO
            </span>
            <span className="block font-mono text-[9.5px] uppercase tracking-[0.22em] text-cream-600">
              Bookstore REST API
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {link("/catalog", "Catalogue", "catalog", Library)}
          {link("/docs", "API Reference", "docs", TerminalSquare)}
          {link("/swagger", "OpenAPI (Swagger)", "swagger", Braces)}
        </nav>

        <Link
          href="/docs#authorize"
          className="flex items-center gap-2 rounded-full border border-gilt-400/40 bg-gilt-400/10 px-4 py-2 font-mono text-[12px] font-medium text-gilt-300 transition-all hover:border-gilt-400/70 hover:bg-gilt-400/20"
        >
          <BookKey size={13} />
          <span className="hidden sm:inline">Get a token</span>
          <span className="sm:hidden">Token</span>
        </Link>
      </div>
    </header>
  );
}
