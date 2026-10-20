/* Deterministic, hand-built book artwork — every row in the catalogue  */
/* carries a `cover` palette key; this renders real SVG binding art.    */

type Palette = { bg: [string, string]; ink: string; accent: string };

const PALETTES: Record<string, Palette> = {
  ink: { bg: ["#1a1712", "#0f0d0a"], ink: "#e8ddc4", accent: "#eab54e" },
  ember: { bg: ["#3a1e12", "#1c0f0a"], ink: "#f2dfc8", accent: "#e08a4f" },
  sand: { bg: ["#4a3a20", "#241a0e"], ink: "#efe3c2", accent: "#d9a545" },
  dawn: { bg: ["#33222a", "#171014"], ink: "#f0dcd8", accent: "#e9a06b" },
  crimson: { bg: ["#401418", "#1d0a0c"], ink: "#f2d8cc", accent: "#e0574f" },
  bone: { bg: ["#3d372c", "#1c1913"], ink: "#f2ead6", accent: "#cbb98a" },
  stone: { bg: ["#2e2c28", "#141311"], ink: "#e2ddce", accent: "#a8a190" },
  frost: { bg: ["#24343d", "#10181d"], ink: "#dcedf2", accent: "#79bddb" },
  mist: { bg: ["#2b3038", "#14161a"], ink: "#dfe4ea", accent: "#9fb4c9" },
  night: { bg: ["#1b2340", "#0c0f1d"], ink: "#dfe3f2", accent: "#8ba0e8" },
  orbit: { bg: ["#2b1f3d", "#130e1d"], ink: "#e6dcf2", accent: "#b48fe0" },
  moss: { bg: ["#22301f", "#0f150d"], ink: "#dfe9d2", accent: "#8fbc6a" },
  sepia: { bg: ["#3a2c18", "#1a1309"], ink: "#ecdfc2", accent: "#c99a4e" },
  burgundy: { bg: ["#3c1a24", "#1a0c11"], ink: "#eedad6", accent: "#c96a72" },
  void: { bg: ["#101014", "#070708"], ink: "#d8d8e2", accent: "#6a6f9e" },
  gold: { bg: ["#413012", "#1d1607"], ink: "#f4e8c9", accent: "#e2b23f" },
  rust: { bg: ["#402013", "#1c0d07"], ink: "#f0dcc9", accent: "#d1793f" },
  poppy: { bg: ["#40172a", "#1c0a13"], ink: "#f2d9e2", accent: "#e2547e" },
  slate: { bg: ["#23282e", "#101214"], ink: "#dde2e6", accent: "#7f93a5" },
  ivory: { bg: ["#3c372a", "#191712"], ink: "#f2eedf", accent: "#bfb393" },
  ash: { bg: ["#2a2a2c", "#131314"], ink: "#e0e0da", accent: "#93937f" },
  evergreen: { bg: ["#12332a", "#081711"], ink: "#d6ecdd", accent: "#4fae7d" },
  wine: { bg: ["#37131c", "#17080d"], ink: "#eed5d9", accent: "#b34a5c" },
  ochre: { bg: ["#3f2d0d", "#1a1204"], ink: "#f2e5c4", accent: "#d09c2e" },
  noir: { bg: ["#161618", "#0a0a0b"], ink: "#dbdbd2", accent: "#c2b26a" },
};

export const COVER_KEYS = Object.keys(PALETTES);

function hashCode(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function paletteFor(cover: string | undefined, title: string): Palette {
  if (cover && PALETTES[cover]) return PALETTES[cover];
  const keys = Object.keys(PALETTES);
  return PALETTES[keys[hashCode(cover ?? title) % keys.length]];
}

export function BookCover({
  title,
  author,
  cover,
  className = "",
}: {
  title: string;
  author: string;
  cover?: string;
  className?: string;
}) {
  const palette = paletteFor(cover, title);
  const initials = title
    .split(/\s+/)
    .filter((w) => w.length > 0 && !/^(the|a|an|of|and)$/i.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <div
      className={`relative aspect-[2/3] w-full overflow-hidden rounded-[3px] ${className}`}
      style={{
        background: `linear-gradient(150deg, ${palette.bg[0]} 0%, ${palette.bg[1]} 78%)`,
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.06), 0 18px 40px -18px rgba(0,0,0,0.8)",
      }}
      aria-hidden
    >
      {/* spine */}
      <div
        className="absolute inset-y-0 left-0 w-[7%]"
        style={{
          background: "linear-gradient(90deg, rgba(0,0,0,0.55), rgba(0,0,0,0.15) 60%, transparent)",
        }}
      />
      <div
        className="absolute inset-y-0 left-[7%] w-px"
        style={{ background: "rgba(255,255,255,0.08)" }}
      />
      {/* border frame */}
      <div
        className="absolute inset-[9%_9%_9%_14%] rounded-[2px]"
        style={{ border: `1px solid ${palette.accent}33` }}
      />
      {/* monogram */}
      <div
        className="absolute left-[18%] top-[14%] font-display text-5xl font-black leading-none tracking-tight"
        style={{ color: `${palette.accent}e6` }}
      >
        {initials || "F"}
      </div>
      {/* title + author */}
      <div className="absolute inset-x-[18%] bottom-[12%]">
        <p
          className="font-display text-[13px] font-semibold leading-snug"
          style={{ color: palette.ink }}
        >
          {title.length > 42 ? `${title.slice(0, 40)}…` : title}
        </p>
        <p
          className="mt-1.5 text-[8.5px] uppercase tracking-[0.18em]"
          style={{ color: `${palette.ink}99` }}
        >
          {author}
        </p>
        <div
          className="mt-2 h-px w-8"
          style={{ background: `${palette.accent}80` }}
        />
      </div>
      {/* sheen */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(115deg, rgba(255,255,255,0.10) 0%, transparent 32%, transparent 70%, rgba(0,0,0,0.22) 100%)",
        }}
      />
    </div>
  );
}
