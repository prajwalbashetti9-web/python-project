"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpenText, Braces, FileJson2, KeyRound, Lock, ShieldCheck, Users } from "lucide-react";
import type { EndpointDef } from "@/lib/api-registry";
import { MethodBadge, StatusChip } from "@/components/method-badge";
import { JsonView } from "@/components/json-view";
import { TryConsole } from "./try-console";
import { AuthorizeModal, decodeClaims, type AuthState } from "./authorize-modal";

type Group = { tag: string; endpoints: EndpointDef[] };

const TAG_ICONS = { Authentication: Users, Books: BookOpenText, System: FileJson2 } as const;

function AuthNote({ auth }: { auth: EndpointDef["auth"] }) {
  if (auth === "none")
    return <span className="rounded-full bg-m-get/10 px-3 py-1 font-mono text-[10.5px] text-m-get">public — no credentials</span>;
  if (auth === "user")
    return <span className="flex items-center gap-1.5 rounded-full bg-gilt-400/10 px-3 py-1 font-mono text-[10.5px] text-gilt-300"><Lock size={10} /> Bearer JWT required</span>;
  return <span className="flex items-center gap-1.5 rounded-full bg-ember-400/10 px-3 py-1 font-mono text-[10.5px] text-ember-400"><ShieldCheck size={10} /> Bearer JWT + owner / admin RBAC</span>;
}

function ParamTable({ ep }: { ep: EndpointDef }) {
  const params = [...(ep.pathParams ?? []), ...(ep.queryParams ?? [])];
  if (params.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-cream-100/[0.08]">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-cream-100/[0.07] bg-ink-950/80 font-mono text-[9.5px] uppercase tracking-[0.18em] text-cream-600">
            <th className="px-4 py-2.5 font-medium">parameter</th>
            <th className="hidden px-4 py-2.5 font-medium sm:table-cell">in</th>
            <th className="hidden px-4 py-2.5 font-medium sm:table-cell">type</th>
            <th className="px-4 py-2.5 font-medium">required</th>
            <th className="px-4 py-2.5 font-medium">description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((param) => (
            <tr key={param.name} className="border-b border-cream-100/[0.04] last:border-0">
              <td className="whitespace-nowrap px-4 py-3 align-top font-mono text-[12px] text-gilt-300">{param.name}</td>
              <td className="hidden px-4 py-3 align-top font-mono text-[11px] text-cream-600 sm:table-cell">{param.in}</td>
              <td className="hidden px-4 py-3 align-top font-mono text-[11px] text-m-put sm:table-cell">{param.type}</td>
              <td className="px-4 py-3 align-top font-mono text-[11px]">
                {param.in === "path" || param.required ? <span className="text-ember-400">yes</span> : <span className="text-cream-600">no{param.default !== undefined ? ` · default ${param.default}` : ""}</span>}
              </td>
              <td className="px-4 py-3 align-top text-[12px] leading-relaxed text-cream-500">{param.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DefinitionPanel({ ep }: { ep: EndpointDef }) {
  return (
    <div className="space-y-8">
      {/* header */}
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <MethodBadge method={ep.method} />
          <code className="font-mono text-[17px] font-semibold tracking-tight text-cream-100">
            {ep.path.split(/(\{\w+\})/g).map((part, i) =>
              /^\{\w+\}$/.test(part) ? (
                <span key={i} className="text-gilt-300">{part}</span>
              ) : (
                <span key={i}>{part}</span>
              ),
            )}
          </code>
          <AuthNote auth={ep.auth} />
        </div>
        <h2 className="mt-4 font-display text-3xl font-black text-cream-100">{ep.summary}</h2>
        <p className="mt-3 text-[13.5px] leading-relaxed text-cream-500">{ep.description}</p>
      </div>

      {/* parameters */}
      <section>
        <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-cream-400">Parameters</h3>
        <ParamTable ep={ep} />
        {!ep.pathParams && !ep.queryParams && (
          <p className="rounded-xl border border-cream-100/[0.07] px-4 py-3 font-mono text-[11.5px] text-cream-600">
            no parameters — call as-is
          </p>
        )}
      </section>

      {/* request body */}
      {ep.body && (
        <section>
          <h3 className="mb-3 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-cream-400">
            Request body
            <span className="rounded bg-cream-100/[0.07] px-2 py-0.5 text-[9.5px] normal-case tracking-normal text-cream-500">
              {ep.body.contentType ?? "application/json"}
            </span>
          </h3>
          <div className="overflow-hidden rounded-xl border border-cream-100/[0.08]">
            <table className="w-full text-left">
              <tbody>
                {ep.body.fields.map((field) => (
                  <tr key={field.name} className="border-b border-cream-100/[0.04] last:border-0">
                    <td className="w-[38%] px-4 py-2.5 align-top">
                      <span className="font-mono text-[12px] text-gilt-300">{field.name}</span>
                      <span className={`ml-2 font-mono text-[10.5px] ${field.required ? "text-ember-400" : "text-cream-600"}`}>
                        {field.required ? "required" : "optional"}
                      </span>
                    </td>
                    <td className="w-[14%] px-4 py-2.5 align-top font-mono text-[11px] text-m-put">{field.type}</td>
                    <td className="px-4 py-2.5 align-top text-[12px] leading-relaxed text-cream-500">{field.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 rounded-xl border border-cream-100/[0.07] bg-ink-950 p-4">
            <p className="mb-2 font-mono text-[9.5px] uppercase tracking-[0.2em] text-cream-600">example value</p>
            <JsonView value={ep.body.example} />
          </div>
        </section>
      )}

      {/* responses */}
      <section>
        <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-cream-400">Responses</h3>
        <div className="space-y-2.5">
          {ep.responses.map((response) => (
            <details
              key={response.status}
              className="group overflow-hidden rounded-xl border border-cream-100/[0.08] bg-ink-950/50"
              open={response.status === 200 || response.status === 201}
            >
              <summary className="flex cursor-pointer items-center gap-3 px-4 py-3">
                <StatusChip status={response.status} />
                <span className="flex-1 text-[12.5px] text-cream-400">{response.description}</span>
                {response.example !== undefined && <span className="font-mono text-[10px] text-cream-600 group-open:hidden">example ▸</span>}
              </summary>
              {response.example !== undefined && (
                <div className="border-t border-cream-100/[0.06] bg-ink-950 p-4">
                  <JsonView value={response.example} />
                </div>
              )}
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

export function DocsClient({ groups }: { groups: Group[] }) {
  const flat = groups.flatMap((group) => group.endpoints);
  const [selectedId, setSelectedId] = useState(flat[0]?.id ?? "");
  const [auth, setAuth] = useState<AuthState>({ token: null, user: null });
  const [authOpen, setAuthOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  /* restore session from localStorage (and drop expired tokens) */
  useEffect(() => {
    try {
      const token = localStorage.getItem("folio.token");
      const rawUser = localStorage.getItem("folio.user");
      if (token && rawUser) {
        const claims = decodeClaims(token);
        if (claims && typeof claims.exp === "number" && claims.exp * 1000 < Date.now()) {
          localStorage.removeItem("folio.token");
          localStorage.removeItem("folio.user");
        } else {
          setAuth({ token, user: JSON.parse(rawUser) });
        }
      }
    } catch { /* ignore */ }
  }, []);

  const applyAuth = useCallback((state: AuthState) => {
    setAuth(state);
    try {
      if (state.token && state.user) {
        localStorage.setItem("folio.token", state.token);
        localStorage.setItem("folio.user", JSON.stringify(state.user));
      } else {
        localStorage.removeItem("folio.token");
        localStorage.removeItem("folio.user");
      }
    } catch { /* ignore */ }
  }, []);

  /* hash-driven selection */
  useEffect(() => {
    const apply = () => {
      const hash = window.location.hash.slice(1);
      if (hash === "authorize") {
        setAuthOpen(true);
        return;
      }
      if (flat.some((ep) => ep.id === hash)) setSelectedId(hash);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [flat]);

  const select = useCallback((id: string) => {
    setSelectedId(id);
    window.history.replaceState(null, "", `#${id}`);
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const current = flat.find((ep) => ep.id === selectedId) ?? flat[0];

  return (
    <>
      {/* ── sub-header toolbar ─────────────────────────────── */}
      <div className="sticky top-16 z-40 border-b border-cream-100/[0.06] bg-ink-950/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-5 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Braces size={15} className="shrink-0 text-gilt-400" />
            <span className="truncate font-mono text-[12px] text-cream-400">
              FOLIO REST API <span className="text-cream-600">· OpenAPI 3.1 · v1.0.0</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/api/openapi.json"
              target="_blank"
              className="hidden items-center gap-1.5 rounded-full border border-cream-100/10 px-3 py-1.5 font-mono text-[10.5px] text-cream-500 transition-colors hover:border-gilt-400/40 hover:text-gilt-300 sm:flex"
            >
              <FileJson2 size={11} /> raw spec
            </a>
            <button
              onClick={() => setAuthOpen(true)}
              className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-[11px] font-medium transition-all ${
                auth.token
                  ? "border border-m-get/40 bg-m-get/10 text-m-get"
                  : "border border-gilt-400/40 bg-gilt-400/10 text-gilt-300 hover:bg-gilt-400/20"
              }`}
            >
              <KeyRound size={11} />
              {auth.token ? (auth.user?.email ?? "authorized") : "Authorize"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-5 pb-28 pt-10 md:px-8">
        {/* intro */}
        <div className="mb-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gilt-500">Interactive reference</p>
          <h1 className="mt-3 font-display text-4xl font-black text-cream-100 md:text-5xl">
            Swagger-grade docs, <em className="font-light italic text-gilt-300">live-wired to the real API.</em>
          </h1>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-cream-500">
            Every definition below is rendered from the same registry that generates{" "}
            <a href="/api/openapi.json" className="text-gilt-300 underline decoration-gilt-400/40 underline-offset-4 hover:decoration-gilt-300">/api/openapi.json</a>.
            Fire requests directly — validations, JWT gating and RBAC all respond for real.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
          {/* sidebar */}
          <aside className="hidden lg:block">
            <nav className="sticky top-36 max-h-[calc(100vh-11rem)] space-y-7 overflow-y-auto pr-2">
              {groups.map((group) => {
                const Icon = TAG_ICONS[group.tag as keyof typeof TAG_ICONS] ?? BookOpenText;
                return (
                  <div key={group.tag}>
                    <p className="mb-2.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-cream-600">
                      <Icon size={12} className="text-gilt-500" /> {group.tag}
                    </p>
                    <div className="space-y-1">
                      {group.endpoints.map((ep) => (
                        <button
                          key={ep.id}
                          onClick={() => select(ep.id)}
                          className={`group flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-all ${
                            selectedId === ep.id
                              ? "border-gilt-400/30 bg-gilt-400/[0.08]"
                              : "border-transparent hover:border-cream-100/[0.07] hover:bg-cream-100/[0.03]"
                          }`}
                        >
                          <MethodBadge method={ep.method} size="sm" />
                          <span className={`min-w-0 flex-1 truncate font-mono text-[11px] ${selectedId === ep.id ? "text-cream-100" : "text-cream-500 group-hover:text-cream-300"}`}>
                            {ep.path.replace("/api/v1", "").replace("/api", "")}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </nav>
          </aside>

          {/* mobile endpoint strip */}
          <div className="-mx-5 mb-2 overflow-x-auto px-5 pb-2 lg:hidden">
            <div className="flex min-w-max gap-2">
              {flat.map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => select(ep.id)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-2 ${
                    selectedId === ep.id ? "border-gilt-400/40 bg-gilt-400/10" : "border-cream-100/10"
                  }`}
                >
                  <MethodBadge method={ep.method} size="sm" />
                  <span className="whitespace-nowrap font-mono text-[11px] text-cream-300">{ep.path.replace("/api/v1", "")}</span>
                </button>
              ))}
            </div>
          </div>

          {/* main definition + console */}
          <div ref={contentRef} className="min-w-0 scroll-mt-36">
            {current && (
              <div className="grid min-w-0 gap-8 xl:grid-cols-2">
                <DefinitionPanel ep={current} />
                <div className="xl:sticky xl:top-36 xl:self-start">
                  <TryConsole ep={current} auth={auth} onRequestAuth={() => setAuthOpen(true)} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AuthorizeModal open={authOpen} onClose={() => setAuthOpen(false)} auth={auth} onAuth={applyAuth} />
    </>
  );
}
