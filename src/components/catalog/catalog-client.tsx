"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookPlus,
  KeyRound,
  Loader2,
  LogOut,
  PencilLine,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { BookCover, COVER_KEYS, paletteFor } from "@/components/book-cover";
import { StatusChip } from "@/components/method-badge";

type Book = {
  id: string;
  title: string;
  author: string;
  genre: string;
  description: string;
  isbn: string;
  price: number;
  stock: number;
  published_year: number;
  cover: string;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
};

type Meta = { total: number; page: number; limit: number; pages: number; has_prev: boolean; has_next: boolean };
type AuthUser = { id: string; name: string; email: string; role: string };
type Toast = { id: number; status: number; title: string; body: string };

const EMPTY_FORM = {
  title: "",
  author: "",
  genre: "",
  description: "",
  isbn: "",
  price: "12.99",
  stock: "5",
  published_year: "2024",
  cover: "ink",
};

export default function CatalogClient() {
  const [auth, setAuth] = useState<{ token: string | null; user: AuthUser | null }>({ token: null, user: null });
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [sort, setSort] = useState("created_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ data: Book[]; meta: Meta } | null>(null);
  const [genres, setGenres] = useState<{ genre: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCall, setLastCall] = useState<{ url: string; status: number; ms: number } | null>(null);
  const [selected, setSelected] = useState<Book | null>(null);
  const [editor, setEditor] = useState<{ mode: "create" | "edit"; book?: Book } | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem("folio.token");
      const rawUser = localStorage.getItem("folio.user");
      if (token && rawUser) setAuth({ token, user: JSON.parse(rawUser) });
    } catch { /* ignore */ }
  }, []);

  const signOut = () => {
    localStorage.removeItem("folio.token");
    localStorage.removeItem("folio.user");
    setAuth({ token: null, user: null });
    toast(200, "Signed out", "Local bearer token discarded.");
  };

  const toast = useCallback((status: number, title: string, body: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-3), { id, status, title, body }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  const fetchBooks = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "12", sort, order });
    if (query.trim()) params.set("q", query.trim());
    if (genre) params.set("genre", genre);
    const url = `/api/v1/books?${params.toString()}`;
    const started = performance.now();
    try {
      const res = await fetch(url);
      const json = await res.json();
      setLastCall({ url, status: res.status, ms: performance.now() - started });
      if (res.ok) setData(json);
      else toast(res.status, "Search rejected", json?.detail ? JSON.stringify(json.detail) : "Unexpected error");
    } catch {
      toast(0, "Network error", "Could not reach the API");
    }
    setLoading(false);
  }, [page, query, genre, sort, order, toast]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void fetchBooks(), 240);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchBooks]);

  useEffect(() => {
    void fetch("/api/v1/books/genres")
      .then((res) => res.json())
      .then((json) => setGenres(json.data ?? []))
      .catch(() => undefined);
  }, []);

  const openEditor = (mode: "create" | "edit", book?: Book) => {
    if (!auth.token) {
      toast(401, "Not authenticated", "Authorize first — open the reference and issue a token.");
      return;
    }
    setFormErrors({});
    if (mode === "edit" && book) {
      setForm({
        title: book.title,
        author: book.author,
        genre: book.genre,
        description: book.description,
        isbn: book.isbn,
        price: String(book.price),
        stock: String(book.stock),
        published_year: String(book.published_year),
        cover: book.cover,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setEditor({ mode, book });
  };

  const saveBook = async () => {
    if (!editor || !auth.token) return;
    setSaving(true);
    setFormErrors({});
    const payload = {
      title: form.title,
      author: form.author,
      genre: form.genre,
      description: form.description,
      isbn: form.isbn.replace(/[-\s]/g, ""),
      price: Number(form.price),
      stock: Number(form.stock),
      published_year: Number(form.published_year),
      cover: form.cover,
    };
    const isEdit = editor.mode === "edit" && editor.book;
    const res = await fetch(isEdit ? `/api/v1/books/${editor.book!.id}` : "/api/v1/books", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify(payload),
    });
    const json = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) {
      if (res.status === 422 && Array.isArray(json?.detail)) {
        const mapped: Record<string, string> = {};
        for (const item of json.detail) {
          const field = item.loc?.[item.loc.length - 1];
          if (typeof field === "string" && !mapped[field]) mapped[field] = item.msg;
        }
        setFormErrors(mapped);
      }
      toast(res.status, "Save rejected", typeof json?.detail === "string" ? json.detail : "See field errors below");
      setSaving(false);
      return;
    }
    toast(res.status, editor.mode === "create" ? "Book shelved" : "Book replaced", json?.title ?? "");
    setEditor(null);
    setSaving(false);
    if (selected) setSelected(json);
    void fetchBooks({ silent: true });
  };

  const deleteBook = async () => {
    if (!selected || !auth.token) return;
    const res = await fetch(`/api/v1/books/${selected.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    if (res.status === 204) {
      toast(204, "Deleted — 204 No Content", selected.title);
      setSelected(null);
      setConfirmDelete(false);
      void fetchBooks({ silent: true });
    } else {
      const json = await res.json().catch(() => null);
      toast(res.status, "Delete rejected", json?.detail ?? `HTTP ${res.status}`);
      setConfirmDelete(false);
    }
  };

  const meta = data?.meta;
  const inputClass =
    "w-full rounded-lg border border-cream-100/10 bg-ink-950 px-3.5 py-2.5 text-[13.5px] text-cream-100 placeholder:text-cream-600 focus:border-gilt-400/50 focus:outline-none";
  const labelClass = "mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-cream-600";

  const fieldLabel: Record<string, string> = {
    title: "title", author: "author", genre: "genre", description: "description",
    isbn: "isbn", price: "price", stock: "stock", published_year: "published_year", cover: "cover",
  };

  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-28 pt-12 md:px-8">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gilt-500">Storefront · powered by GET /api/v1/books</p>
          <h1 className="mt-3 font-display text-4xl font-black text-cream-100 md:text-6xl">
            The <em className="font-light italic text-gilt-300">catalogue.</em>
          </h1>
          <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-cream-500">
            This entire page is a thin client over the REST API — filtering, pagination, mutations
            and role checks all travel through the same endpoints documented in the reference.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {auth.user ? (
            <div className="flex items-center gap-2.5 rounded-full border border-cream-100/10 py-1.5 pl-1.5 pr-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gilt-400/15 font-display text-[12px] font-bold text-gilt-300">
                {auth.user.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </span>
              <span className="leading-tight">
                <span className="block text-[12px] font-semibold text-cream-100">{auth.user.name}</span>
                <span className="block font-mono text-[9.5px] uppercase tracking-wider text-cream-600">{auth.user.role}</span>
              </span>
              <button onClick={signOut} title="Sign out" className="ml-1 text-cream-600 hover:text-m-delete">
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <Link
              href="/docs#authorize"
              className="flex items-center gap-2 rounded-full border border-gilt-400/40 bg-gilt-400/10 px-4 py-2.5 font-mono text-[11.5px] text-gilt-300 transition-colors hover:bg-gilt-400/20"
            >
              <KeyRound size={12} /> Authorize to mutate
            </Link>
          )}
          <button
            onClick={() => openEditor("create")}
            className="flex items-center gap-2 rounded-full bg-gilt-400 px-5 py-2.5 text-[13px] font-semibold text-ink-950 transition-colors hover:bg-gilt-300"
          >
            <BookPlus size={14} /> Shelve a book
          </button>
        </div>
      </div>

      {/* filter toolbar */}
      <div className="sticky top-16 z-30 mt-10 rounded-2xl border border-cream-100/10 bg-ink-900/90 p-3 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[220px] flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cream-600" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search title or author — maps to ?q="
              className={`${inputClass} !border-cream-100/[0.08] !bg-ink-950/70 py-2.5 pl-9`}
            />
          </div>
          <select
            value={genre}
            onChange={(e) => { setGenre(e.target.value); setPage(1); }}
            className="rounded-lg border border-cream-100/[0.08] bg-ink-950/70 px-3.5 py-2.5 text-[13px] text-cream-200 focus:border-gilt-400/50 focus:outline-none [&>option]:bg-ink-900"
          >
            <option value="">All genres</option>
            {genres.map((g) => (
              <option key={g.genre} value={g.genre}>{g.genre} · {g.count}</option>
            ))}
          </select>
          <select
            value={`${sort}:${order}`}
            onChange={(e) => { const [s, o] = e.target.value.split(":"); setSort(s); setOrder(o as "asc" | "desc"); }}
            className="rounded-lg border border-cream-100/[0.08] bg-ink-950/70 px-3.5 py-2.5 text-[13px] text-cream-200 focus:border-gilt-400/50 focus:outline-none [&>option]:bg-ink-900"
          >
            <option value="created_at:desc">Newest shelved</option>
            <option value="title:asc">Title A→Z</option>
            <option value="author:asc">Author A→Z</option>
            <option value="price:asc">Price low→high</option>
            <option value="price:desc">Price high→low</option>
            <option value="published_year:desc">Recently published</option>
            <option value="published_year:asc">Oldest first</option>
          </select>
          <span className="hidden items-center gap-2 rounded-lg border border-cream-100/[0.08] px-3 py-2.5 font-mono text-[11px] text-cream-600 md:flex">
            <SlidersHorizontal size={12} />
            {meta ? `${meta.total} titles` : "…"}
          </span>
        </div>
        {/* observability bar */}
        <div className="mt-2.5 flex items-center gap-3 rounded-lg border border-cream-100/[0.06] bg-ink-950/70 px-3.5 py-2">
          <span className="rounded bg-m-get/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-m-get">GET</span>
          <code className="min-w-0 flex-1 truncate font-mono text-[10.5px] text-cream-500">
            {lastCall?.url.replace("/api/v1", "") ?? "…"}
          </code>
          {lastCall && (
            <span className="shrink-0 font-mono text-[10px] text-cream-600">
              {lastCall.status} · {lastCall.ms.toFixed(0)}ms
            </span>
          )}
        </div>
      </div>

      {/* grid */}
      <div className="mt-9">
        {loading && !data ? (
          <div className="flex h-60 items-center justify-center">
            <Loader2 size={22} className="animate-spin text-gilt-400" />
          </div>
        ) : data && data.data.length === 0 ? (
          <div className="flex h-60 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-cream-100/15">
            <p className="font-display text-2xl text-cream-400">The shelf is empty.</p>
            <p className="font-mono text-[11px] text-cream-600">no rows matched that filter combination</p>
          </div>
        ) : (
          <div className={`grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 ${loading ? "opacity-60 transition-opacity" : ""}`}>
            {data?.data.map((book) => (
              <button
                key={book.id}
                onClick={() => { setSelected(book); setConfirmDelete(false); }}
                className="group text-left"
              >
                <div className="transition-transform duration-300 group-hover:-translate-y-2">
                  <BookCover title={book.title} author={book.author} cover={book.cover} />
                </div>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold text-cream-200 group-hover:text-gilt-300">{book.title}</p>
                    <p className="truncate text-[11px] text-cream-600">{book.author}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[12px] font-semibold text-gilt-300">${book.price.toFixed(2)}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* pagination */}
        {meta && meta.pages > 1 && (
          <div className="mt-14 flex items-center justify-center gap-4">
            <button
              disabled={!meta.has_prev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-2 rounded-full border border-cream-100/10 px-4 py-2 font-mono text-[11px] text-cream-400 transition-colors enabled:hover:border-gilt-400/40 enabled:hover:text-gilt-300 disabled:opacity-40"
            >
              <ArrowLeft size={12} /> prev
            </button>
            <span className="font-mono text-[11px] text-cream-500">page {meta.page} / {meta.pages}</span>
            <button
              disabled={!meta.has_next}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-2 rounded-full border border-cream-100/10 px-4 py-2 font-mono text-[11px] text-cream-400 transition-colors enabled:hover:border-gilt-400/40 enabled:hover:text-gilt-300 disabled:opacity-40"
            >
              next <ArrowRight size={12} />
            </button>
          </div>
        )}
      </div>

      {/* ══ detail drawer ══ */}
      <AnimatePresence>
        {selected && (
          <motion.div key="drawer-wrap" className="fixed inset-0 z-[70]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" onClick={() => setSelected(null)} />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 260 }}
              className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto border-l border-cream-100/10 bg-ink-900 shadow-panel"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-cream-100/[0.07] bg-ink-900/90 px-6 py-4 backdrop-blur">
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-cream-600">GET /api/v1/books/{selected.id.slice(0, 8)}…</span>
                <button onClick={() => setSelected(null)} className="rounded-md p-1.5 text-cream-500 hover:bg-cream-100/5">
                  <X size={16} />
                </button>
              </div>
              <div className="p-6">
                <div className="mx-auto w-40">
                  <BookCover title={selected.title} author={selected.author} cover={selected.cover} />
                </div>
                <h2 className="mt-6 text-center font-display text-2xl font-black text-cream-100">{selected.title}</h2>
                <p className="mt-1 text-center text-[13px] text-cream-500">{selected.author}</p>
                <p className="mx-auto mt-4 max-w-sm text-center text-[12.5px] leading-relaxed text-cream-500">{selected.description}</p>

                <div className="mt-6 grid grid-cols-3 gap-2">
                  {[
                    { label: "price", value: `$${selected.price.toFixed(2)}` },
                    { label: "stock", value: String(selected.stock) },
                    { label: "year", value: String(selected.published_year) },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-lg border border-cream-100/[0.07] bg-ink-950 p-3 text-center">
                      <p className="font-display text-lg font-bold text-gilt-300">{stat.value}</p>
                      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-cream-600">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 space-y-2 rounded-xl border border-cream-100/[0.07] bg-ink-950 p-4 font-mono text-[11px]">
                  {[
                    ["id", selected.id],
                    ["isbn", selected.isbn],
                    ["genre", selected.genre],
                    ["created_by", selected.created_by_name ?? "—"],
                    ["created_at", new Date(selected.created_at).toLocaleString()],
                    ["updated_at", new Date(selected.updated_at).toLocaleString()],
                  ].map(([key, value]) => (
                    <p key={key} className="flex justify-between gap-3">
                      <span className="shrink-0 text-cream-600">{key}</span>
                      <span className="truncate text-cream-400">{value}</span>
                    </p>
                  ))}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => openEditor("edit", selected)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-m-put/30 bg-m-put/[0.08] py-3 text-[13px] font-medium text-m-put transition-colors hover:bg-m-put/[0.15]"
                  >
                    <PencilLine size={14} /> PUT · edit
                  </button>
                  {confirmDelete ? (
                    <button
                      onClick={deleteBook}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-m-delete py-3 text-[13px] font-semibold text-ink-950 hover:brightness-110"
                    >
                      <Trash2 size={14} /> confirm DELETE
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (!auth.token) {
                          toast(401, "Not authenticated", "Authorize first — open the reference and issue a token.");
                          return;
                        }
                        setConfirmDelete(true);
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-m-delete/30 bg-m-delete/[0.07] py-3 text-[13px] font-medium text-m-delete transition-colors hover:bg-m-delete/[0.14]"
                    >
                      <Trash2 size={14} /> DELETE
                    </button>
                  )}
                </div>
                <p className="mt-3 text-center font-mono text-[9.5px] text-cream-600">
                  DELETE succeeds only for the owner or an admin — RBAC enforced server-side.
                </p>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ editor modal ══ */}
      <AnimatePresence>
        {editor && (
          <motion.div key="editor-wrap" className="fixed inset-0 z-[75] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={() => setEditor(null)} />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-cream-100/10 bg-ink-900 shadow-panel"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-cream-100/[0.07] bg-ink-900/95 px-6 py-4 backdrop-blur">
                <span className="font-mono text-[11px] text-cream-400">
                  {editor.mode === "create" ? "POST /api/v1/books" : `PUT /api/v1/books/${editor.book?.id.slice(0, 8)}…`}
                </span>
                <button onClick={() => setEditor(null)} className="rounded-md p-1.5 text-cream-500 hover:bg-cream-100/5">
                  <X size={16} />
                </button>
              </div>
              <div className="grid gap-4 p-6 sm:grid-cols-2">
                {(["title", "author"] as const).map((key) => (
                  <label key={key} className="block">
                    <span className={labelClass}>{fieldLabel[key]} *</span>
                    <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={inputClass} placeholder={key === "title" ? "A Field Guide to Fog" : "Imogen Caird"} />
                    {formErrors[key] && <p className="mt-1.5 font-mono text-[10.5px] text-m-delete">{formErrors[key]}</p>}
                  </label>
                ))}
                <label className="block">
                  <span className={labelClass}>genre *</span>
                  <input list="genre-options" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} className={inputClass} placeholder="Fantasy" />
                  <datalist id="genre-options">
                    {genres.map((g) => <option key={g.genre} value={g.genre} />)}
                  </datalist>
                  {formErrors.genre && <p className="mt-1.5 font-mono text-[10.5px] text-m-delete">{formErrors.genre}</p>}
                </label>
                <label className="block">
                  <span className={labelClass}>isbn * · digits only</span>
                  <input value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} className={inputClass} placeholder="9780316769488" />
                  {formErrors.isbn && <p className="mt-1.5 font-mono text-[10.5px] text-m-delete">{formErrors.isbn}</p>}
                </label>
                {(["price", "stock", "published_year"] as const).map((key) => (
                  <label key={key} className="block">
                    <span className={labelClass}>{fieldLabel[key]}{key !== "stock" ? " *" : ""}</span>
                    <input inputMode="decimal" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={inputClass} />
                    {formErrors[key] && <p className="mt-1.5 font-mono text-[10.5px] text-m-delete">{formErrors[key]}</p>}
                  </label>
                ))}
                <div className="sm:col-span-2">
                  <span className={labelClass}>cover palette</span>
                  <div className="flex flex-wrap gap-2">
                    {COVER_KEYS.slice(0, 18).map((key) => {
                      const palette = paletteFor(key, "");
                      return (
                        <button
                          key={key}
                          type="button"
                          title={key}
                          onClick={() => setForm({ ...form, cover: key })}
                          className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${form.cover === key ? "border-gilt-300" : "border-transparent"}`}
                          style={{ background: `linear-gradient(140deg, ${palette.bg[0]}, ${palette.bg[1]})`, boxShadow: `inset 0 0 0 2px ${palette.accent}66` }}
                        />
                      );
                    })}
                  </div>
                </div>
                <label className="block sm:col-span-2">
                  <span className={labelClass}>description</span>
                  <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} resize-y`} placeholder="A one-line synopsis…" />
                  {formErrors.description && <p className="mt-1.5 font-mono text-[10.5px] text-m-delete">{formErrors.description}</p>}
                </label>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-cream-100/[0.07] px-6 py-4">
                <p className="font-mono text-[10px] text-cream-600">payload validated against BookCreate — 422s map to fields</p>
                <button
                  onClick={saveBook}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-gilt-400 px-6 py-3 text-[13.5px] font-semibold text-ink-950 transition-colors hover:bg-gilt-300 disabled:opacity-60"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
                  {editor.mode === "create" ? "POST · create" : "PUT · replace"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ toasts ══ */}
      <div className="fixed bottom-5 right-5 z-[90] w-[min(92vw,380px)] space-y-2.5">
        <AnimatePresence>
          {toasts.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-start gap-3 rounded-xl border border-cream-100/10 bg-ink-900/95 p-4 shadow-panel backdrop-blur"
            >
              <StatusChip status={item.status} />
              <div className="min-w-0">
                <p className="text-[12.5px] font-semibold text-cream-100">{item.title}</p>
                <p className="truncate font-mono text-[10.5px] text-cream-500">{item.body}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
