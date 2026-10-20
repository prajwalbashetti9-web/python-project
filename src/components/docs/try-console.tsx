"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Copy,
  History,
  Link2,
  Loader2,
  Lock,
  Play,
  Wand2,
} from "lucide-react";
import type { EndpointDef } from "@/lib/api-registry";
import { JsonView } from "@/components/json-view";
import { METHOD_COLORS, MethodBadge, StatusChip } from "@/components/method-badge";
import type { AuthState } from "./authorize-modal";

type Execution = {
  status: number;
  ms: number;
  bytes: number;
  body: unknown;
  raw: string;
  headers: [string, string][];
};

type HistoryItem = { method: string; url: string; status: number; ms: number };

export function TryConsole({
  ep,
  auth,
  onRequestAuth,
}: {
  ep: EndpointDef;
  auth: AuthState;
  onRequestAuth: () => void;
}) {
  const [pathValues, setPathValues] = useState<Record<string, string>>({});
  const [queryValues, setQueryValues] = useState<Record<string, { on: boolean; value: string }>>({});
  const [bodyText, setBodyText] = useState("");
  const [encoding, setEncoding] = useState<"json" | "form">("json");
  const [result, setResult] = useState<Execution | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"response" | "curl">("response");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copied, setCopied] = useState(false);

  /* reset builder state whenever the selected endpoint changes */
  useEffect(() => {
    const p: Record<string, string> = {};
    for (const param of ep.pathParams ?? []) p[param.name] = String(param.example ?? "");
    setPathValues(p);
    const q: Record<string, { on: boolean; value: string }> = {};
    for (const param of ep.queryParams ?? []) {
      q[param.name] = {
        on: param.default !== undefined,
        value: String(param.default ?? param.example ?? ""),
      };
    }
    setQueryValues(q);
    setBodyText(ep.body ? JSON.stringify(ep.body.example, null, 2) : "");
    setEncoding("json");
    setResult(null);
    setTab("response");
  }, [ep]);

  const resolvedPath = useMemo(() => {
    return ep.path.replace(/\{(\w+)\}/g, (_, name) => pathValues[name] || `{${name}}`);
  }, [ep, pathValues]);

  const resolvedQuery = useMemo(() => {
    const params = new URLSearchParams();
    for (const param of ep.queryParams ?? []) {
      const state = queryValues[param.name];
      if (state?.on && state.value !== "") params.set(param.name, state.value);
    }
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [ep, queryValues]);

  const url = resolvedPath + resolvedQuery;
  const needsAuth = ep.auth !== "none";
  const hasToken = Boolean(auth.token);

  const curlCommand = useMemo(() => {
    const lines = [`curl -X ${ep.method} 'http://localhost:3000${url}'`];
    const contentType = encoding === "form" ? "application/x-www-form-urlencoded" : "application/json";
    if (ep.body) lines.push(`  -H 'Content-Type: ${contentType}'`);
    if (needsAuth && hasToken) lines.push(`  -H 'Authorization: Bearer ${auth.token}'`);
    if (ep.body && bodyText.trim()) {
      if (encoding === "form") {
        try {
          const obj = JSON.parse(bodyText);
          const form = new URLSearchParams();
          for (const [k, v] of Object.entries(obj)) form.set(k === "email" ? "username" : k, String(v));
          lines.push(`  -d '${form.toString()}'`);
        } catch { /* keep */ }
      } else {
        lines.push(`  -d '${bodyText.replace(/\n\s*/g, " ")}'`);
      }
    }
    return lines.join(" \\\n");
  }, [ep, url, encoding, needsAuth, hasToken, auth.token, bodyText]);

  const execute = async () => {
    setBusy(true);
    const started = performance.now();
    try {
      const headers: Record<string, string> = {};
      let body: BodyInit | undefined;
      if (ep.body) {
        if (encoding === "form") {
          headers["Content-Type"] = "application/x-www-form-urlencoded";
          try {
            const obj = JSON.parse(bodyText);
            const form = new URLSearchParams();
            for (const [k, v] of Object.entries(obj)) form.set(k === "email" ? "username" : k, String(v));
            body = form.toString();
          } catch {
            body = "";
          }
        } else {
          headers["Content-Type"] = "application/json";
          body = bodyText;
        }
      }
      if (needsAuth && hasToken) headers["Authorization"] = `Bearer ${auth.token}`;

      const res = await fetch(url, { method: ep.method, headers, body });
      const ms = performance.now() - started;
      const raw = await res.text();
      let parsed: unknown = null;
      try {
        parsed = raw ? JSON.parse(raw) : null;
      } catch {
        parsed = raw;
      }
      const headerList: [string, string][] = [];
      res.headers.forEach((value, key) => headerList.push([key, value]));
      setResult({ status: res.status, ms, bytes: new Blob([raw]).size, body: parsed, raw, headers: headerList });
      setHistory((prev) => [{ method: ep.method, url, status: res.status, ms }, ...prev].slice(0, 7));
      setTab("response");
    } catch {
      setResult({ status: 0, ms: 0, bytes: 0, body: { detail: "Network error" }, raw: "", headers: [] });
    }
    setBusy(false);
  };

  /* ⌘/Ctrl + Enter fires the request from anywhere on the page */
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && !busy) {
        event.preventDefault();
        void execute();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const autofillLiveId = async () => {
    const res = await fetch("/api/v1/books?limit=1");
    const data = await res.json();
    const id = data?.data?.[0]?.id;
    if (id) {
      setPathValues((prev) => ({ ...prev, book_id: id }));
    }
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-cream-100/10 bg-ink-900 shadow-panel">
      {/* console header */}
      <div className="flex items-center justify-between border-b border-cream-100/[0.07] px-5 py-3">
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-cream-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-m-get" />
          try it · live console
        </span>
        {needsAuth && (
          <button
            onClick={hasToken ? undefined : onRequestAuth}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] transition-colors ${
              hasToken
                ? "bg-m-get/10 text-m-get"
                : "cursor-pointer bg-m-delete/10 text-m-delete hover:bg-m-delete/20"
            }`}
          >
            <Lock size={10} />
            {hasToken ? "bearer attached" : "token required →"}
          </button>
        )}
      </div>

      <div className="space-y-4 p-5">
        {/* URL preview */}
        <div className="flex items-center gap-2.5 rounded-lg border border-cream-100/[0.08] bg-ink-950 px-3.5 py-2.5">
          <MethodBadge method={ep.method} size="sm" />
          <code className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-cream-300">{url}</code>
          <button onClick={() => copy(url)} className="shrink-0 text-cream-600 hover:text-gilt-300" title="Copy URL">
            {copied ? <BadgeCheck size={13} className="text-m-get" /> : <Link2 size={13} />}
          </button>
        </div>

        {/* path params */}
        {(ep.pathParams ?? []).length > 0 && (
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cream-600">path parameters</p>
            {(ep.pathParams ?? []).map((param) => (
              <div key={param.name} className="mb-2 flex items-center gap-2">
                <code className="w-24 shrink-0 font-mono text-[11px] text-gilt-300">{param.name}</code>
                <input
                  value={pathValues[param.name] ?? ""}
                  onChange={(e) => setPathValues({ ...pathValues, [param.name]: e.target.value })}
                  className="min-w-0 flex-1 rounded-md border border-cream-100/10 bg-ink-950 px-3 py-2 font-mono text-[11.5px] text-cream-200 focus:border-gilt-400/50 focus:outline-none"
                  placeholder={param.description}
                />
                {param.name === "book_id" && (
                  <button
                    onClick={autofillLiveId}
                    className="flex shrink-0 items-center gap-1 rounded-md border border-gilt-400/30 bg-gilt-400/10 px-2 py-2 font-mono text-[10px] text-gilt-300 hover:bg-gilt-400/20"
                    title="Fetch a real id from the catalogue"
                  >
                    <Wand2 size={11} /> live id
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* query params */}
        {(ep.queryParams ?? []).length > 0 && (
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cream-600">query parameters</p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {(ep.queryParams ?? []).map((param) => {
                const state = queryValues[param.name];
                if (!state) return null;
                return (
                  <label
                    key={param.name}
                    className={`flex items-center gap-2 rounded-md border px-2 py-[7px] transition-colors ${
                      state.on ? "border-gilt-400/25 bg-gilt-400/[0.04]" : "border-cream-100/[0.07] opacity-55"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={state.on}
                      onChange={(e) => setQueryValues({ ...queryValues, [param.name]: { ...state, on: e.target.checked } })}
                      className="h-3 w-3 shrink-0 accent-gilt-400"
                    />
                    <code className="w-[86px] shrink-0 truncate font-mono text-[10.5px] text-cream-300">{param.name}</code>
                    {param.enum ? (
                      <select
                        value={state.value}
                        onChange={(e) => setQueryValues({ ...queryValues, [param.name]: { ...state, value: e.target.value } })}
                        className="min-w-0 flex-1 bg-transparent font-mono text-[11px] text-cream-200 focus:outline-none [&>option]:bg-ink-900"
                      >
                        {param.enum.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={state.value}
                        onChange={(e) => setQueryValues({ ...queryValues, [param.name]: { ...state, value: e.target.value } })}
                        className="min-w-0 flex-1 bg-transparent font-mono text-[11px] text-cream-200 focus:outline-none"
                        placeholder={param.example !== undefined ? String(param.example) : ""}
                      />
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* body */}
        {ep.body && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream-600">request body</p>
              {ep.id === "login" && (
                <div className="flex rounded-md border border-cream-100/10 p-0.5">
                  {(["json", "form"] as const).map((enc) => (
                    <button
                      key={enc}
                      onClick={() => setEncoding(enc)}
                      className={`rounded px-2 py-1 font-mono text-[9.5px] uppercase tracking-wider ${
                        encoding === enc ? "bg-gilt-400/20 text-gilt-300" : "text-cream-600"
                      }`}
                    >
                      {enc}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              spellCheck={false}
              rows={Math.min(12, bodyText.split("\n").length + 1)}
              className="w-full resize-y rounded-lg border border-cream-100/10 bg-ink-950 p-3.5 font-mono text-[11.5px] leading-relaxed text-cream-200 focus:border-gilt-400/50 focus:outline-none"
            />
            {ep.id === "login" && encoding === "form" && (
              <p className="mt-1.5 font-mono text-[10px] text-cream-600">
                json editor → sent as x-www-form-urlencoded (email → username alias)
              </p>
            )}
          </div>
        )}

        {/* send */}
        <button
          onClick={execute}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 text-[14px] font-bold transition-all hover:brightness-110 disabled:opacity-60"
          style={{
            backgroundColor: METHOD_COLORS[ep.method],
            color: ep.method === "GET" ? "#08130d" : "#0b0a08",
          }}
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Play size={15} />}
          {busy ? "sending…" : `Send ${ep.method} request`}
          {!busy && <span className="font-mono text-[10px] opacity-70">⌘↵</span>}
        </button>

        {/* tabs */}
        {(result || curlCommand) && (
          <div className="flex gap-1 rounded-lg border border-cream-100/[0.07] bg-ink-950 p-1">
            {(["response", "curl"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-md py-1.5 font-mono text-[11px] capitalize transition-colors ${
                  tab === t ? "bg-cream-100/10 text-cream-100" : "text-cream-600 hover:text-cream-300"
                }`}
              >
                {t === "curl" ? "cURL" : "Response"}
              </button>
            ))}
          </div>
        )}

        {tab === "curl" && (
          <div className="relative rounded-lg border border-cream-100/[0.07] bg-ink-950 p-4">
            <button onClick={() => copy(curlCommand)} className="absolute right-3 top-3 text-cream-600 hover:text-gilt-300" title="Copy cURL">
              {copied ? <BadgeCheck size={14} className="text-m-get" /> : <Copy size={14} />}
            </button>
            <pre className="whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-cream-400">{curlCommand}</pre>
          </div>
        )}

        {tab === "response" && result && (
          <div className="overflow-hidden rounded-lg border border-cream-100/[0.08] bg-ink-950">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-cream-100/[0.07] px-4 py-2.5">
              <StatusChip status={result.status} />
              <span className="font-mono text-[10.5px] text-cream-600">{result.ms.toFixed(0)} ms</span>
              <span className="font-mono text-[10.5px] text-cream-600">{result.bytes} B</span>
              {result.status >= 400 && <span className="font-mono text-[10px] text-m-delete">check the detail envelope ↓</span>}
            </div>
            <div className="max-h-[320px] overflow-y-auto p-4">
              {result.raw === "" ? (
                <p className="font-mono text-[11.5px] italic text-cream-600">
                  ∅ empty body — {result.status === 204 ? "204 No Content, by design" : "nothing returned"}
                </p>
              ) : (
                <JsonView value={result.body} />
              )}
            </div>
            {result.headers.length > 0 && (
              <details className="border-t border-cream-100/[0.06]">
                <summary className="cursor-pointer px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cream-600 hover:text-cream-400">
                  response headers · {result.headers.length}
                </summary>
                <div className="max-h-[160px] space-y-1 overflow-y-auto px-4 pb-3 font-mono text-[10.5px]">
                  {result.headers.map(([key, value]) => (
                    <p key={key} className="truncate">
                      <span className="text-gilt-500">{key}:</span> <span className="text-cream-500">{value}</span>
                    </p>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {/* history */}
        {history.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-cream-600">
              <History size={11} /> session history
            </p>
            <div className="space-y-1">
              {history.map((item, i) => (
                <div key={i} className="flex items-center gap-2 rounded-md border border-cream-100/[0.05] bg-ink-950/60 px-2.5 py-1.5">
                  <span
                    className="font-mono text-[10px] font-bold"
                    style={{ color: item.status >= 200 && item.status < 300 ? "#56d99a" : item.status >= 400 ? "#ef7f8d" : "#eab54e" }}
                  >
                    {item.status}
                  </span>
                  <span className="font-mono text-[10px] text-cream-600" style={{ color: METHOD_COLORS[item.method] }}>
                    {item.method}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-mono text-[10.5px] text-cream-500">{item.url}</span>
                  <span className="shrink-0 font-mono text-[10px] text-cream-600">{item.ms.toFixed(0)}ms</span>
                  <ArrowRight size={10} className="shrink-0 text-cream-600" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
