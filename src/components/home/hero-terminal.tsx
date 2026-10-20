"use client";

import { useEffect, useRef, useState } from "react";

type Beat = { text: string; kind: "cmd" | "ok" | "err" | "comment" };

const SCRIPT: Beat[] = [
  { text: "$ folio GET /api/v1/books?genre=Fantasy&limit=3", kind: "cmd" },
  { text: "→ 200 OK · 7 titles · 11 ms", kind: "ok" },
  { text: '$ folio POST /api/v1/books  -d \'{"title":"…"}\'', kind: "cmd" },
  { text: '→ 401 { "detail": "Not authenticated" }', kind: "err" },
  { text: "$ folio auth login demo@folio.dev", kind: "cmd" },
  { text: "→ 200 { access_token: eyJhbGci…", kind: "ok" },
  { text: "$ folio POST /api/v1/books  ✦ bearer attached", kind: "cmd" },
  { text: '→ 201 Created · isbn 9780451524935', kind: "ok" },
  { text: "$ folio DELETE /api/v1/books/3f52a7b1…", kind: "cmd" },
  { text: "→ 403 { detail: Forbidden — owner/admin only }", kind: "err" },
  { text: "# RBAC in action — admins may proceed", kind: "comment" },
];

const KIND_STYLE: Record<Beat["kind"], string> = {
  cmd: "text-cream-100",
  ok: "text-m-get",
  err: "text-m-delete",
  comment: "text-cream-600 italic",
};

export function HeroTerminal() {
  const [lines, setLines] = useState<{ text: string; kind: Beat["kind"]; done: boolean }[]>([]);
  const [liveBook, setLiveBook] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let beat = 0;
    let char = 0;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (cancelled) return;
      const current = SCRIPT[beat];
      if (!current) {
        setLiveBook(null);
        timer = setTimeout(() => {
          setLines([]);
          beat = 0;
          char = 0;
          tick();
        }, 6500);
        return;
      }
      const speed = current.kind === "cmd" ? 26 : 6;
      char += 1;
      const slice = current.text.slice(0, char);
      const isNewLine = char === 1;
      setLines((prev) => {
        const next = [...prev];
        if (isNewLine || next.length === 0) {
          next.push({ text: slice, kind: current.kind, done: false });
        } else {
          next[next.length - 1] = { text: slice, kind: current.kind, done: false };
        }
        return next.slice(-8);
      });
      if (char >= current.text.length) {
        if (current.text.startsWith("→ 201")) setLiveBook("The Stone Atlas");
        setLines((prev) => {
          const next = [...prev];
          if (next.length > 0) next[next.length - 1] = { ...next[next.length - 1], done: true };
          return next;
        });
        beat += 1;
        char = 0;
        timer = setTimeout(tick, beat === SCRIPT.length ? 1800 : 380);
      } else {
        timer = setTimeout(tick, speed);
      }
    };

    timer = setTimeout(tick, 900);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const lastIsCmd = lines.length > 0 && !lines[lines.length - 1].done && lines[lines.length - 1].kind === "cmd";

  return (
    <div className="overflow-hidden rounded-xl border border-cream-100/10 bg-ink-900 shadow-glow">
      <div className="flex items-center justify-between border-b border-cream-100/[0.07] px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-m-delete/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-gilt-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-m-get/70" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-cream-600">
          folio@localhost:3000 — zsh
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-m-get">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-m-get" />
          LIVE
        </span>
      </div>
      <div ref={scrollRef} className="h-[264px] space-y-2.5 p-5 font-mono text-[12.5px] leading-relaxed">
        {lines.map((line, i) => (
          <p key={i} className={`${KIND_STYLE[line.kind]} ${i === lines.length - 1 && lastIsCmd ? "cursor-blink" : ""}`}>
            {line.text}
          </p>
        ))}
        {liveBook && (
          <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-m-get/30 bg-m-get/10 px-3 py-1.5 text-[11px] text-m-get">
            ✳ shelved: “{liveBook}” — row persisted to PostgreSQL
          </div>
        )}
        {lines.length === 0 && <p className="cursor-blink text-cream-500">$</p>}
      </div>
    </div>
  );
}
