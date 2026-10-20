"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, Copy, KeyRound, Loader2, LogOut, ShieldCheck, UserRound, X } from "lucide-react";
import { JsonView } from "@/components/json-view";

export type AuthUser = { id: string; name: string; email: string; role: string };
export type AuthState = { token: string | null; user: AuthUser | null };

const SEEDED = [
  { label: "demo reader · role user", email: "demo@folio.dev", password: "reader-123" },
  { label: "admin · role admin", email: "admin@folio.dev", password: "shelf-admin" },
];

export function decodeClaims(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    return JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

export function AuthorizeModal({
  open,
  onClose,
  auth,
  onAuth,
}: {
  open: boolean;
  onClose: () => void;
  auth: AuthState;
  onAuth: (state: AuthState) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        mode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            mode === "login"
              ? { email: form.email, password: form.password }
              : { name: form.name, email: form.email, password: form.password },
          ),
        },
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const detail = Array.isArray(data?.detail)
          ? data.detail.map((d: { msg: string }) => d.msg).join(" · ")
          : data?.detail ?? `HTTP ${res.status}`;
        setError(String(detail));
        setBusy(false);
        return;
      }
      onAuth({ token: data.access_token, user: data.user });
    } catch {
      setError("Network error — is the server running?");
    }
    setBusy(false);
  };

  const signOut = () => {
    onAuth({ token: null, user: null });
  };

  const copyToken = async () => {
    if (!auth.token) return;
    await navigator.clipboard.writeText(auth.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const claims = auth.token ? decodeClaims(auth.token) : null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-cream-100/10 bg-ink-900 shadow-panel"
          >
            <div className="flex items-center justify-between border-b border-cream-100/[0.07] px-6 py-4">
              <div className="flex items-center gap-2.5">
                <KeyRound size={16} className="text-gilt-400" />
                <span className="font-display text-lg font-bold text-cream-100">Authorize</span>
              </div>
              <button onClick={onClose} className="rounded-md p-1.5 text-cream-500 hover:bg-cream-100/5 hover:text-cream-200">
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-6">
              {auth.token && auth.user ? (
                <>
                  <div className="flex items-center gap-3 rounded-xl border border-m-get/25 bg-m-get/[0.07] p-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gilt-400/15 font-display text-base font-bold text-gilt-300">
                      {auth.user.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-cream-100">{auth.user.name}</p>
                      <p className="truncate font-mono text-[11px] text-cream-500">{auth.user.email}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider ${
                      auth.user.role === "admin" ? "bg-ember-400/15 text-ember-400" : "bg-m-get/15 text-m-get"
                    }`}>
                      {auth.user.role}
                    </span>
                  </div>

                  <div className="mt-4 rounded-xl border border-cream-100/[0.08] bg-ink-950 p-4">
                    <p className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cream-600">
                      <BadgeCheck size={12} className="text-m-get" /> signed claims
                    </p>
                    {claims && <JsonView value={claims} compact />}
                  </div>

                  <button
                    onClick={copyToken}
                    className="mt-4 flex w-full items-center justify-between gap-3 rounded-xl border border-cream-100/[0.08] bg-ink-950 px-4 py-3 text-left transition-colors hover:border-gilt-400/30"
                  >
                    <span className="truncate font-mono text-[11px] text-cream-400">{auth.token}</span>
                    {copied ? <BadgeCheck size={14} className="shrink-0 text-m-get" /> : <Copy size={14} className="shrink-0 text-cream-500" />}
                  </button>

                  <button
                    onClick={signOut}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-m-delete/30 bg-m-delete/[0.06] px-4 py-3 text-[13px] font-medium text-m-delete transition-colors hover:bg-m-delete/[0.12]"
                  >
                    <LogOut size={14} /> Sign out & revoke locally
                  </button>
                  <p className="mt-3 text-center font-mono text-[10px] text-cream-600">
                    Bearer token is attached automatically to protected endpoints in the console.
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-5 grid grid-cols-2 rounded-lg border border-cream-100/[0.08] bg-ink-950 p-1">
                    {(["login", "register"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => { setMode(tab); setError(null); }}
                        className={`rounded-md py-2 text-[13px] font-medium capitalize transition-colors ${
                          mode === tab ? "bg-gilt-400/15 text-gilt-300" : "text-cream-500 hover:text-cream-200"
                        }`}
                      >
                        {tab === "login" ? "Log in" : "Register"}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {mode === "register" && (
                      <label className="block">
                        <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-cream-600">name</span>
                        <input
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="Marguerite Yourcenar"
                          className="w-full rounded-lg border border-cream-100/10 bg-ink-950 px-3.5 py-2.5 text-[14px] text-cream-100 placeholder:text-cream-600 focus:border-gilt-400/50 focus:outline-none"
                        />
                      </label>
                    )}
                    <label className="block">
                      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-cream-600">email</span>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="reader@library.dev"
                        className="w-full rounded-lg border border-cream-100/10 bg-ink-950 px-3.5 py-2.5 text-[14px] text-cream-100 placeholder:text-cream-600 focus:border-gilt-400/50 focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-cream-600">password · ≥ 8 chars</span>
                      <input
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && submit()}
                        placeholder="••••••••"
                        className="w-full rounded-lg border border-cream-100/10 bg-ink-950 px-3.5 py-2.5 text-[14px] text-cream-100 placeholder:text-cream-600 focus:border-gilt-400/50 focus:outline-none"
                      />
                    </label>
                  </div>

                  {error && (
                    <p className="mt-3 rounded-lg border border-m-delete/30 bg-m-delete/[0.08] px-3.5 py-2.5 font-mono text-[11px] leading-relaxed text-m-delete">
                      {error}
                    </p>
                  )}

                  <button
                    onClick={submit}
                    disabled={busy}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gilt-400 px-4 py-3 text-[14px] font-semibold text-ink-950 transition-colors hover:bg-gilt-300 disabled:opacity-60"
                  >
                    {busy ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                    {mode === "login" ? "POST /api/v1/auth/login" : "POST /api/v1/auth/register"}
                  </button>

                  <div className="mt-5 rounded-xl border border-cream-100/[0.08] bg-ink-950 p-4">
                    <p className="mb-2.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cream-600">
                      <UserRound size={12} className="text-gilt-500" /> seeded accounts — one-click fill
                    </p>
                    <div className="space-y-2">
                      {SEEDED.map((seed) => (
                        <button
                          key={seed.email}
                          onClick={() => setForm({ ...form, email: seed.email, password: seed.password })}
                          className="flex w-full items-center justify-between rounded-lg border border-cream-100/[0.07] px-3 py-2 text-left transition-colors hover:border-gilt-400/40"
                        >
                          <span className="font-mono text-[11px] text-cream-300">{seed.email}</span>
                          <span className="font-mono text-[10px] text-cream-600">{seed.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
