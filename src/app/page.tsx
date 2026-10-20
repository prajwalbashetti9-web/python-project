import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  Database,
  Fingerprint,
  GitBranch,
  KeyRound,
  LibraryBig,
  Play,
  ScanLine,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { db } from "@/db";
import { books, users } from "@/db/schema";
import { sql } from "drizzle-orm";
import { ENDPOINTS } from "@/lib/api-registry";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { HeroTerminal } from "@/components/home/hero-terminal";
import { Reveal } from "@/components/home/reveal";
import { JsonView } from "@/components/json-view";
import { METHOD_COLORS } from "@/components/method-badge";

export const dynamic = "force-dynamic";

/* Live stats straight from PostgreSQL — the landing page reads the API's database. */
async function getStats() {
  try {
    const [bookStats] = await db
      .select({
        books_total: sql<number>`count(*)::int`,
        authors_total: sql<number>`count(distinct ${books.author})::int`,
        genres_total: sql<number>`count(distinct ${books.genre})::int`,
        avg_price: sql<number>`coalesce(round(avg(${books.price})::numeric, 2), 0)::float`,
        units: sql<number>`coalesce(sum(${books.stock}), 0)::int`,
      })
      .from(books);
    const [userStats] = await db
      .select({ users_total: sql<number>`count(*)::int` })
      .from(users);
    return { ...bookStats, users_total: userStats?.users_total ?? 0 };
  } catch {
    return { books_total: 0, authors_total: 0, genres_total: 0, avg_price: 0, units: 0, users_total: 0 };
  }
}

const TASKS = [
  {
    index: "01",
    icon: ScanLine,
    title: "Schema-first validation",
    spec: "Pydantic layer → Zod",
    body: "Every mutation payload is parsed against a strict BookCreate / UserRegister contract. Offenders get a 422 Unprocessable Entity whose detail array pinpoints loc, msg and type of each failing field.",
    sample: 'loc: ["body","price"] · msg: "Price must be ≥ 0"',
  },
  {
    index: "02",
    icon: KeyRound,
    title: "JWT auth & RBAC",
    spec: "python-jose → jose · passlib → bcrypt",
    body: "Passwords are hashed with bcrypt at cost 12. Login issues HS256 tokens carrying sub/email/role claims. A getAuthUser() route dependency — Depends(get_current_user) — guards every mutation; DELETE adds owner-or-admin RBAC.",
    sample: "Authorization: Bearer eyJhbGci…",
  },
  {
    index: "03",
    icon: Database,
    title: "ORM persistence",
    spec: "SQLAlchemy → Drizzle ORM + PostgreSQL",
    body: "State lives in relational tables — Users → Books with a real foreign key and joined creator names. No in-memory state: restart the server, the catalogue survives.",
    sample: "LEFT JOIN users ON books.created_by_id = users.id",
  },
];

function ShelfOfRoutes() {
  const shelfEndpoints = ENDPOINTS.filter((e) => e.tag !== "System");
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max items-end gap-[6px] px-2">
        {shelfEndpoints.map((ep, i) => {
          const color = METHOD_COLORS[ep.method];
          const heights = [232, 208, 246, 222, 238, 216, 240, 228, 212, 244];
          return (
            <Link
              key={ep.id}
              href={`/docs#${ep.id}`}
              className="group relative flex flex-col items-center"
              title={`${ep.method} ${ep.path}`}
            >
              <div
                className="relative flex w-[64px] items-center justify-center rounded-t-[3px] border transition-all duration-300 group-hover:-translate-y-2.5 group-hover:shadow-[0_18px_40px_-14px_rgba(0,0,0,0.8)]"
                style={{
                  height: heights[i % heights.length],
                  background: `linear-gradient(165deg, ${color}26 0%, #14110c 55%)`,
                  borderColor: `${color}40`,
                }}
              >
                <div
                  className="absolute inset-y-0 left-0 w-[7px] rounded-bl-[2px]"
                  style={{ background: `linear-gradient(90deg, rgba(0,0,0,0.5), transparent)` }}
                />
                <span
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-180 whitespace-nowrap font-mono text-[11px] tracking-wider text-cream-300 transition-colors group-hover:text-cream-100"
                  style={{ writingMode: "vertical-rl" }}
                >
                  {ep.path}
                </span>
                <span
                  className="absolute inset-x-2 top-2 rounded-sm py-0.5 text-center font-mono text-[8.5px] font-bold tracking-widest"
                  style={{ color, backgroundColor: `${color}22` }}
                >
                  {ep.method}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
      {/* the shelf */}
      <div className="mt-[-1px] h-3 min-w-max rounded-[2px] border border-gilt-600/40 bg-gradient-to-b from-[#3a2d12] via-[#2e2410] to-[#1a1409] shadow-[0_24px_40px_-16px_rgba(0,0,0,0.9)]" />
    </div>
  );
}

export default async function HomePage() {
  const stats = await getStats();

  return (
    <div className="relative min-h-dvh">
      <SiteNav active="home" />

      {/* ══════════ HERO ══════════ */}
      <section className="ruled relative overflow-hidden pt-32 md:pt-40">
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full opacity-60"
          style={{ background: "radial-gradient(closest-side, rgba(234,181,78,0.13), transparent)" }}
        />
        <div className="relative mx-auto grid max-w-[1400px] items-center gap-14 px-5 pb-24 md:px-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-cream-100/10 bg-ink-900 py-1.5 pl-2 pr-4 font-mono text-[11px] tracking-wider text-cream-400">
              <span className="rounded-full bg-m-get/15 px-2 py-0.5 text-m-get">v1.0.0</span>
              CRUD · JWT · RBAC · PostgreSQL · OpenAPI
            </div>
            <h1 className="font-display text-[13.5vw] font-black leading-[0.94] tracking-[-0.02em] text-cream-100 sm:text-6xl md:text-7xl xl:text-[86px]">
              A REST API,
              <br />
              <em className="font-light italic text-gilt-300">hand-bound.</em>
            </h1>
            <p className="mt-7 max-w-xl text-[15px] leading-relaxed text-cream-500">
              FOLIO is a fully asynchronous bookstore engine: strict schema validation, JWT-secured
              mutations with role-based access, and genuine relational persistence — all documented
              by a generated OpenAPI 3.1 spec and testable in your browser.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/docs"
                className="group inline-flex items-center gap-2.5 rounded-full bg-gilt-400 px-7 py-3.5 text-[14px] font-semibold text-ink-950 transition-all hover:bg-gilt-300"
              >
                <Play size={15} className="transition-transform group-hover:scale-110" />
                Open the interactive docs
              </Link>
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2.5 rounded-full border border-cream-100/15 px-7 py-3.5 text-[14px] font-medium text-cream-200 transition-colors hover:border-gilt-400/50 hover:text-gilt-300"
              >
                <LibraryBig size={15} />
                Browse the catalogue
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-5 font-mono text-[11px] text-cream-600">
              <span className="flex items-center gap-1.5"><Terminal size={12} className="text-gilt-500" /> 12 endpoints</span>
              <span className="h-3 w-px bg-cream-100/10" />
              <span className="flex items-center gap-1.5"><Fingerprint size={12} className="text-gilt-500" /> HS256 JWT</span>
              <span className="h-3 w-px bg-cream-100/10" />
              <span className="flex items-center gap-1.5"><GitBranch size={12} className="text-gilt-500" /> Users → Books RDB</span>
            </div>
          </div>
          <div className="relative">
            <HeroTerminal />
            <div className="pointer-events-none absolute -inset-8 -z-10 rounded-3xl bg-gilt-500/[0.05] blur-2xl" />
          </div>
        </div>

        {/* stats strip */}
        <div className="relative border-y border-cream-100/[0.07] bg-ink-900/60 backdrop-blur">
          <div className="mx-auto grid max-w-[1400px] grid-cols-2 divide-x divide-cream-100/[0.06] px-5 md:grid-cols-5 md:px-8">
            {[
              { label: "titles shelved", value: stats.books_total, fmt: (n: number) => String(n) },
              { label: "distinct authors", value: stats.authors_total, fmt: (n: number) => String(n) },
              { label: "genres indexed", value: stats.genres_total, fmt: (n: number) => String(n) },
              { label: "avg list price", value: stats.avg_price, fmt: (n: number) => `$${n.toFixed(2)}` },
              { label: "units in stock", value: stats.units, fmt: (n: number) => String(n) },
            ].map((stat, i) => (
              <div key={stat.label} className={`flex flex-col items-center gap-1 py-6 ${i >= 3 ? "hidden md:flex" : ""}`}>
                <span className="font-display text-2xl font-bold text-gilt-300 md:text-3xl">{stat.fmt(stat.value)}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-cream-600">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ TASKS ══════════ */}
      <section className="relative mx-auto max-w-[1400px] px-5 py-24 md:px-8 md:py-32">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gilt-500">The engineering brief</p>
          <h2 className="mt-4 max-w-2xl font-display text-4xl font-black leading-tight text-cream-100 md:text-5xl">
            Three tasks, <em className="font-light italic text-gilt-300">one spine.</em>
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {TASKS.map((task, i) => (
            <Reveal key={task.index} delay={i * 0.12}>
              <article className="group relative h-full overflow-hidden rounded-2xl border border-cream-100/[0.08] bg-ink-900 p-7 transition-colors duration-300 hover:border-gilt-400/30">
                <span className="pointer-events-none absolute -right-4 -top-8 font-display text-[120px] font-black leading-none text-cream-100/[0.04] transition-colors group-hover:text-gilt-400/[0.07]">
                  {task.index}
                </span>
                <task.icon size={22} className="text-gilt-400" />
                <h3 className="mt-5 font-display text-xl font-bold text-cream-100">{task.title}</h3>
                <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ember-400">{task.spec}</p>
                <p className="mt-4 text-[13.5px] leading-relaxed text-cream-500">{task.body}</p>
                <div className="mt-5 rounded-lg border border-cream-100/[0.07] bg-ink-950 px-3.5 py-2.5 font-mono text-[11px] text-cream-400">
                  {task.sample}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════════ SHELF OF ROUTES ══════════ */}
      <section className="relative border-y border-cream-100/[0.06] bg-ink-900/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1400px] px-5 md:px-8">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gilt-500">Routes</p>
              <h2 className="mt-4 font-display text-4xl font-black text-cream-100 md:text-5xl">
                The shelf <em className="font-light italic text-gilt-300">of routes.</em>
              </h2>
            </div>
            <Link href="/docs" className="group flex items-center gap-2 font-mono text-[12px] text-cream-400 hover:text-gilt-300">
              every spine opens in the live console
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
          <Reveal delay={0.15} className="mt-12">
            <ShelfOfRoutes />
          </Reveal>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[11px] text-cream-600">
            {Object.entries(METHOD_COLORS).map(([method, color]) => (
              <span key={method} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                {method}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CONTRACT ══════════ */}
      <section className="mx-auto max-w-[1400px] px-5 py-24 md:px-8 md:py-32">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gilt-500">The error contract</p>
          <h2 className="mt-4 max-w-3xl font-display text-4xl font-black leading-tight text-cream-100 md:text-5xl">
            Failure, <em className="font-light italic text-gilt-300">beautifully specified.</em>
          </h2>
          <p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-cream-500">
            Every rejection mirrors the FastAPI contract — a human-readable <code className="rounded bg-cream-100/10 px-1.5 py-0.5 font-mono text-[12px] text-gilt-300">detail</code> envelope,
            a <span className="text-cream-300">WWW-Authenticate</span> header on 401s, and a precise 422 array for schema violations. Clients can program against the errors.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {[
            {
              title: "401 · Missing bearer token",
              path: "POST /api/v1/books",
              payload: {
                status: 401,
                headers: { "www-authenticate": "Bearer" },
                body: { detail: "Not authenticated" },
              },
            },
            {
              title: "422 · Schema validation failed",
              path: "POST /api/v1/books",
              payload: {
                detail: [
                  { type: "greater_than_equal", loc: ["body", "price"], msg: "Price must be greater than or equal to 0" },
                  { type: "string_pattern_mismatch", loc: ["body", "isbn"], msg: "ISBN must be 10 or 13 digits (no hyphens)" },
                  { type: "missing", loc: ["body", "title"], msg: "Field required" },
                ],
              },
            },
          ].map((panel, i) => (
            <Reveal key={panel.title} delay={i * 0.12}>
              <div className="overflow-hidden rounded-xl border border-cream-100/[0.08] bg-ink-900">
                <div className="flex items-center justify-between border-b border-cream-100/[0.07] px-5 py-3">
                  <span className="font-mono text-[11px] text-cream-400">{panel.title}</span>
                  <span className="font-mono text-[10px] text-cream-600">{panel.path}</span>
                </div>
                <div className="p-5">
                  <JsonView value={panel.payload} />
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* CTA band */}
        <Reveal delay={0.1} className="mt-20">
          <div className="relative overflow-hidden rounded-3xl border border-gilt-400/20 bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950 px-8 py-14 md:px-16">
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-70"
              style={{ background: "radial-gradient(closest-side, rgba(234,181,78,0.16), transparent)" }}
            />
            <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
              <div>
                <ShieldCheck size={22} className="mb-4 text-gilt-400" />
                <h3 className="font-display text-3xl font-black leading-tight text-cream-100 md:text-4xl">
                  Ready to break things? <em className="font-light italic text-gilt-300">Try the console.</em>
                </h3>
                <p className="mt-3 max-w-lg text-[14px] text-cream-500">
                  Register a reader, hold a token, and fire authenticated requests — every status code is real and every row is persisted.
                </p>
              </div>
              <Link
                href="/docs#authorize"
                className="group flex shrink-0 items-center gap-3 rounded-full bg-cream-100 px-8 py-4 text-[14px] font-semibold text-ink-950 transition-colors hover:bg-gilt-300"
              >
                Issue me a token
                <ArrowDownRight size={16} className="transition-transform group-hover:rotate-45" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  );
}
