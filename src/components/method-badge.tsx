export const METHOD_COLORS: Record<string, string> = {
  GET: "#56d99a",
  POST: "#eab54e",
  PUT: "#6db9f0",
  DELETE: "#ef7f8d",
};

export function MethodBadge({ method, size = "md" }: { method: string; size?: "sm" | "md" }) {
  const color = METHOD_COLORS[method] ?? "#c4b596";
  return (
    <span
      className={`inline-flex select-none items-center justify-center rounded-md font-mono font-semibold tracking-wider ${
        size === "sm" ? "h-5 min-w-12 px-1.5 text-[10px]" : "h-6 min-w-14 px-2 text-[11px]"
      }`}
      style={{
        color,
        backgroundColor: `${color}1f`,
        border: `1px solid ${color}45`,
      }}
    >
      {method}
    </span>
  );
}

export function StatusChip({ status }: { status: number }) {
  const color =
    status >= 200 && status < 300
      ? "#56d99a"
      : status >= 400 && status < 500
        ? "#eab54e"
        : "#ef7f8d";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold"
      style={{ color, backgroundColor: `${color}1a`, border: `1px solid ${color}40` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {status}
    </span>
  );
}
