import p00 from "@/data/phases/00-foundations.json";
import p01 from "@/data/phases/01-math-ml.json";
import p01b from "@/data/phases/01b-classical-ml.json";
import p01c from "@/data/phases/01c-advanced-ml.json";
import p02 from "@/data/phases/02-deep-learning.json";
import p02b from "@/data/phases/02b-research-methods.json";
import p03 from "@/data/phases/03-llm-engineering.json";
import p04 from "@/data/phases/04-rag.json";
import p05 from "@/data/phases/05-agents.json";
import p06 from "@/data/phases/06-evals-observability.json";
import p07 from "@/data/phases/07-safety-security.json";
import p08 from "@/data/phases/08-backend-data.json";
import p09 from "@/data/phases/09-devops-cloud.json";
import p10 from "@/data/phases/10-mlops.json";
import p11 from "@/data/phases/11-system-design.json";
import p12 from "@/data/phases/12-interview-career.json";
import cpA from "@/data/checkpoints-a.json";
import cpB from "@/data/checkpoints-b.json";
import ddA from "@/data/deep-dives-a.json";
import ddB from "@/data/deep-dives-b.json";
import ddC from "@/data/deep-dives-c.json";
import dsaTrack from "@/data/tracks/dsa.json";
import feTrack from "@/data/tracks/frontend.json";

export type TrackId = "ai" | "dsa" | "frontend";

export const TRACKS: Record<TrackId, { href: string; nav: string; title: [string, string]; lede: string; finish: [string, string] }> = {
  ai: {
    href: "/", nav: "🤖 AI", title: ["Road to", "Senior AI & Agent Engineer"],
    lede: "Every phase ends with a checkpoint: what you must know, what you must build, and the configs you should be able to write.",
    finish: ["Senior AI & Agent Engineer", "You made it. Go get the offer."],
  },
  dsa: {
    href: "/dsa", nav: "🧩 DSA", title: ["Road to", "Passing the Coding Round"],
    lede: "Patterns, not problem counts. Each phase gives the pattern, a template you should write from memory, and problems to drill on HackerRank or LeetCode.",
    finish: ["Coding round ready", "Edge cases first, then code. Go pass it."],
  },
  frontend: {
    href: "/frontend", nav: "🎨 Frontend", title: ["Road to", "Frontend Interview Ready"],
    lede: "JavaScript, TypeScript, HTML/CSS, React, the browser and testing: what graduate frontend tests and interviews actually ask, with code to write by hand.",
    finish: ["Frontend interview ready", "Talk through your thinking. You've built this for years."],
  },
};

export type Level = "foundation" | "core" | "advanced" | "interview";

export interface Concept {
  title: string;
  body: string;
}
export interface Entry {
  id: string;
  text: string;
  answer?: string;
}
export interface Topic {
  key: string;
  id: string;
  title: string;
  summary: string;
  items: Entry[];
  questions: Entry[];
  resources: string[];
  concepts: Concept[];
}
export interface Phase {
  id: string;
  track: TrackId;
  index: number;
  title: string;
  tagline: string;
  level: Level;
  color: string;
  topics: Topic[];
  checkpoint: Checkpoint;
}

interface RawTopic {
  id: string;
  title: string;
  summary: string;
  items: string[];
  questions?: (string | { q: string; a: string })[];
  resources?: string[];
  concepts?: Concept[];
}
interface RawPhase {
  id: string;
  title: string;
  tagline: string;
  level: string;
  color: string;
  topics: RawTopic[];
  icon?: string;
  short?: string;
  checkpoint?: RawCheckpoint;
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

const raw: Record<TrackId, RawPhase[]> = {
  ai: [p00, p01, p01b, p01c, p02, p02b, p03, p04, p05, p06, p07, p08, p09, p10, p11, p12] as RawPhase[],
  dsa: dsaTrack as RawPhase[],
  frontend: feTrack as RawPhase[],
};

export interface Config {
  title: string;
  lang: string;
  note?: string;
  code: string;
}
export interface Checkpoint {
  mustKnow: Entry[];
  mustDo: Entry[];
  configs: Config[];
}
interface RawCheckpoint {
  mustKnow: string[];
  mustDo: string[];
  configs: Config[];
}

const checkpointsRaw = { ...cpA, ...cpB } as Record<string, RawCheckpoint>;
const deepDives = { ...ddA, ...ddB, ...ddC } as Record<string, Concept[]>;

const LEVEL_COLOR: Record<Level, string> = {
  foundation: "#f59e0b",
  core: "#f97316",
  advanced: "#ea580c",
  interview: "#c2410c",
};

export const PHASE_META: Record<string, { icon: string; short: string }> = {
  foundations: { icon: "🧱", short: "Foundations" },
  "math-ml": { icon: "📐", short: "Math & ML" },
  "deep-learning": { icon: "🧠", short: "Deep Learning" },
  "llm-engineering": { icon: "💬", short: "LLM Eng" },
  rag: { icon: "🔎", short: "RAG" },
  agents: { icon: "🤖", short: "Agents" },
  "evals-observability": { icon: "📊", short: "Evals" },
  "safety-security": { icon: "🛡️", short: "Security" },
  "backend-data": { icon: "🗄️", short: "Backend" },
  "devops-cloud": { icon: "☁️", short: "DevOps" },
  mlops: { icon: "⚙️", short: "MLOps" },
  "system-design": { icon: "🏗️", short: "System Design" },
  "interview-career": { icon: "🎯", short: "Interview" },
};

const build = (track: TrackId) => raw[track].map((p, index): Phase => {
  const cp = p.checkpoint ?? checkpointsRaw[p.id];
  if (p.icon) PHASE_META[p.id] = { icon: p.icon, short: p.short ?? p.title };
  return {
    id: p.id,
    track,
    index,
    title: p.title,
    tagline: p.tagline,
    level: p.level as Level,
    color: LEVEL_COLOR[p.level as Level],
    topics: p.topics.map((t) => {
      const key = `${p.id}.${t.id}`;
      return {
        key,
        id: t.id,
        title: t.title,
        summary: t.summary,
        items: t.items.map((text) => ({ id: `${key}.i.${slug(text)}`, text })),
        questions: (t.questions ?? []).map((x) => {
          const [text, answer] = typeof x === "string" ? [x, undefined] : [x.q, x.a];
          return { id: `${key}.q.${slug(text)}`, text, answer };
        }),
        resources: t.resources ?? [],
        concepts: [...(t.concepts ?? []), ...(deepDives[key] ?? [])],
      };
    }),
    checkpoint: cp
      ? {
          mustKnow: cp.mustKnow.map((text) => ({ id: `${p.id}.cp.k.${slug(text)}`, text })),
          mustDo: cp.mustDo.map((text) => ({ id: `${p.id}.cp.d.${slug(text)}`, text })),
          configs: cp.configs,
        }
      : { mustKnow: [], mustDo: [], configs: [] },
  };
});

const byTrack: Record<TrackId, Phase[]> = { ai: build("ai"), dsa: build("dsa"), frontend: build("frontend") };
export const phasesOf = (track: TrackId) => byTrack[track];
/** Every phase in every track (phase ids are unique across tracks). */
export const phases: Phase[] = [...byTrack.ai, ...byTrack.dsa, ...byTrack.frontend];
export const trackFromPath = (path: string): TrackId => {
  const id = path.startsWith("/phase/") ? path.slice(7) : null;
  if (id) return phases.find((p) => p.id === id)?.track ?? "ai";
  return path.startsWith("/dsa") ? "dsa" : path.startsWith("/frontend") ? "frontend" : "ai";
};

export const LEVEL_LABEL: Record<Level, string> = {
  foundation: "Foundation",
  core: "Core",
  advanced: "Advanced",
  interview: "Interview",
};

export interface Progress {
  version: 1;
  done: Record<string, string>;
  notes: Record<string, string>;
  updatedAt?: string;
}

export const emptyProgress = (): Progress => ({ version: 1, done: {}, notes: {} });
