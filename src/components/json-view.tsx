/* Bespoke JSON syntax highlighter — no runtime dependency. */

import type { ReactNode } from "react";

const TOKEN_RE =
  /("(?:\\.|[^"\\])*")(\s*:)?(\s*,)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\]])|(:)|(,)/g;

const COLOR = {
  key: "#e7d9b8",
  string: "#9fd8a8",
  number: "#eab54e",
  literal: "#6db9f0",
  punctuation: "#6f6653",
};

export function JsonView({ value, compact = false }: { value: unknown; compact?: boolean }) {
  let source: string;
  try {
    source = JSON.stringify(value, null, compact ? 0 : 2);
  } catch {
    source = String(value);
  }

  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;

  let key = 0;
  while ((match = TOKEN_RE.exec(source)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <span key={key++}>{source.slice(lastIndex, match.index)}</span>,
      );
    }
    const [full, str, colonAndSpace, trailingComma, literal, num, brace, colon, comma] = match;
    if (str !== undefined) {
      const isKey = colonAndSpace !== undefined;
      const isEnd = trailingComma !== undefined;
      nodes.push(
        <span key={key++}>
          <span style={{ color: isKey ? COLOR.key : COLOR.string }}>{str}</span>
          {colonAndSpace && <span style={{ color: COLOR.punctuation }}>{colonAndSpace}</span>}
          {isEnd && <span style={{ color: COLOR.punctuation }}>{trailingComma}</span>}
        </span>,
      );
    } else if (literal !== undefined) {
      nodes.push(
        <span key={key++} style={{ color: COLOR.literal }}>{full}</span>,
      );
    } else if (num !== undefined) {
      nodes.push(
        <span key={key++} style={{ color: COLOR.number }}>{full}</span>,
      );
    } else if (brace || colon || comma) {
      nodes.push(
        <span key={key++} style={{ color: COLOR.punctuation }}>{full}</span>,
      );
    }
    lastIndex = TOKEN_RE.lastIndex;
  }
  if (lastIndex < source.length) {
    nodes.push(<span key={key++}>{source.slice(lastIndex)}</span>);
  }

  return (
    <code className="block whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed">
      {nodes}
    </code>
  );
}
