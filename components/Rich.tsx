"use client";

import { useState } from "react";
import katex from "katex";

function tex(src: string, display: boolean) {
  try {
    return katex.renderToString(src, { displayMode: display, throwOnError: false, strict: false });
  } catch {
    return src;
  }
}

const INLINE = /(?<![\\$])\$(?![\s\d$])((?:[^$\n\\]|\\.)+?)(?<![\s\\])\$(?!\d)/g;

function Bold({ text }: { text: string }) {
  const bits = text.split(/\*\*(.+?)\*\*/g);
  return <>{bits.map((b, i) => (i % 2 ? <strong key={i}>{b}</strong> : b))}</>;
}

/** Renders text with inline $math$ spans and **bold**. */
export function Inline({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  INLINE.lastIndex = 0;
  while ((m = INLINE.exec(text))) {
    if (m.index > last) parts.push(<Bold key={"b" + last} text={text.slice(last, m.index)} />);
    parts.push(<span key={m.index} className="tex" dangerouslySetInnerHTML={{ __html: tex(m[1], false) }} />);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(<Bold key="bend" text={text.slice(last)} />);
  return <>{parts}</>;
}

export function CodeBlock({ code, lang, title, note }: { code: string; lang?: string; title?: string; note?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  };
  return (
    <figure className="code">
      <figcaption>
        <span className="code-title">{title ?? "snippet"}</span>
        {lang && <span className="code-lang">{lang}</span>}
        <button className="code-copy" onClick={copy} aria-label="Copy code">
          {copied ? "Copied" : "Copy"}
        </button>
      </figcaption>
      {note && <p className="code-note">{note}</p>}
      <pre>
        <code>{code}</code>
      </pre>
    </figure>
  );
}

type Block =
  | { t: "p"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "ol"; items: string[] }
  | { t: "code"; lang: string; code: string };

function parse(body: string): Block[] {
  const lines = body.split("\n");
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) buf.push(lines[i++]);
      i++;
      out.push({ t: "code", lang, code: buf.join("\n") });
    } else if (/^- /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^- /.test(lines[i])) items.push(lines[i++].slice(2));
      out.push({ t: "ul", items });
    } else if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) items.push(lines[i++].replace(/^\d+\. /, ""));
      out.push({ t: "ol", items });
    } else if (line.trim() === "") {
      i++;
    } else {
      const buf: string[] = [];
      while (i < lines.length && lines[i].trim() !== "" && !lines[i].startsWith("```") && !/^- /.test(lines[i]) && !/^\d+\. /.test(lines[i])) buf.push(lines[i++]);
      out.push({ t: "p", text: buf.join(" ") });
    }
  }
  return out;
}

export function Rich({ body }: { body: string }) {
  return (
    <div className="rich">
      {parse(body).map((b, idx) => {
        if (b.t === "p") return <p key={idx}><Inline text={b.text} /></p>;
        if (b.t === "ul") return <ul key={idx}>{b.items.map((x, j) => <li key={j}><Inline text={x} /></li>)}</ul>;
        if (b.t === "ol") return <ol key={idx}>{b.items.map((x, j) => <li key={j}><Inline text={x} /></li>)}</ol>;
        if (b.lang === "math") return <div key={idx} className="mathblock" dangerouslySetInnerHTML={{ __html: tex(b.code, true) }} />;
        return <CodeBlock key={idx} code={b.code} lang={b.lang} />;
      })}
    </div>
  );
}

export function Answer({ body }: { body?: string }) {
  if (!body) return null;
  return (
    <details className="answer">
      <summary>Show answer</summary>
      <Rich body={body} />
    </details>
  );
}
