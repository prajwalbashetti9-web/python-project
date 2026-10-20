import Link from "next/link";
import { KeyRound, Layers, ShieldCheck } from "lucide-react";

const columns = [
  {
    icon: Layers,
    title: "Task 01 · Validation",
    body: "Schema-first request contracts. Failing payloads are rejected with a 422 loc/msg/type array.",
  },
  {
    icon: KeyRound,
    title: "Task 02 · JWT + RBAC",
    body: "bcrypt password hashing, HS256 tokens, and a getAuthUser() route dependency guarding mutations.",
  },
  {
    icon: ShieldCheck,
    title: "Task 03 · Persistence",
    body: "Relational Users → Books models in PostgreSQL, queried through an async ORM layer with joins.",
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-cream-100/[0.06] bg-ink-900">
      <div className="mx-auto max-w-[1400px] px-5 py-14 md:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          {columns.map((col) => (
            <div key={col.title} className="flex gap-4">
              <col.icon size={18} className="mt-0.5 shrink-0 text-gilt-400" />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cream-400">
                  {col.title}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-cream-600">{col.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-cream-100/[0.06] pt-6 md:flex-row md:items-center">
          <p className="font-mono text-[11px] tracking-wider text-cream-600">
            FOLIO v1.0.0 — Next.js Route Handlers · PostgreSQL (Drizzle ORM) · Zod · jose/JWT · bcrypt
          </p>
          <div className="flex gap-5 font-mono text-[11px] tracking-wider text-cream-500">
            <Link href="/docs" className="hover:text-gilt-300">/docs</Link>
            <Link href="/swagger" className="hover:text-gilt-300">/swagger</Link>
            <Link href="/catalog" className="hover:text-gilt-300">/catalog</Link>
            <Link href="/api/openapi.json" className="hover:text-gilt-300">/api/openapi.json</Link>
            <Link href="/api/health" className="hover:text-gilt-300">/api/health</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
