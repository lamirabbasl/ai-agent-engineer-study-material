"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useProgress } from "@/lib/progress";
import { conceptsFor, problems } from "@/lib/concepts";
import { LEVEL_LABEL, PHASE_META, Phase, TRACKS, Topic, TrackId, phasesOf } from "@/lib/roadmap";
import Journey from "./Journey";
import { Answer, CodeBlock, Rich } from "./Rich";


type Filter = "all" | "todo" | "doing" | "done";
type TopicTab = "skills" | "deep" | "qs" | "notes";
type CpTab = "know" | "do" | "cfg";

const pct = (d: number, t: number) => (t === 0 ? 0 : Math.round((d / t) * 100));

function topicStats(t: Topic, done: Record<string, string>) {
  return {
    done: t.items.filter((i) => done[i.id]).length,
    total: t.items.length,
    qDone: t.questions.filter((i) => done[i.id]).length,
    qTotal: t.questions.length,
  };
}

function phaseStats(p: Phase, done: Record<string, string>) {
  let d = 0, total = 0, q = 0, qTotal = 0, topicsDone = 0;
  for (const t of p.topics) {
    const s = topicStats(t, done);
    d += s.done; total += s.total; q += s.qDone; qTotal += s.qTotal;
    if (s.total > 0 && s.done === s.total) topicsDone++;
  }
  const cpItems = [...p.checkpoint.mustKnow, ...p.checkpoint.mustDo];
  const cpDone = cpItems.filter((i) => done[i.id]).length;
  return {
    done: d + cpDone, total: total + cpItems.length, q, qTotal, topicsDone, topics: p.topics.length,
    cpDone, cpTotal: cpItems.length,
  };
}

function Ring({ value, size = 56, stroke = 5, color, children }: { value: number; size?: number; stroke?: number; color: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * value) / 100} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dashoffset .5s ease" }} />
      </svg>
      <div className="ring-label">{children}</div>
    </div>
  );
}

function Check({ checked, onChange, children, className, answer }: { checked: boolean; onChange: () => void; children: React.ReactNode; className?: string; answer?: string }) {
  return (
    <li>
      <label className={className}>
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span className="box" />
        <span className={checked ? "txt done" : "txt"}>{children}</span>
      </label>
      <Answer body={answer} />
    </li>
  );
}

export default function Roadmap({ track = "ai" }: { track?: TrackId }) {
  const phases = phasesOf(track);
  const T = TRACKS[track];
  const { progress, done, saveState, toggle, setMany, setNote, replace, reset: resetAll } = useProgress();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [openPhases, setOpenPhases] = useState<Set<string>>(new Set());
  const [openTopics, setOpenTopics] = useState<Set<string>>(new Set());
  const [topicTab, setTopicTab] = useState<Record<string, TopicTab>>({});
  const [cpTab, setCpTab] = useState<Record<string, CpTab>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => phases.map((p) => phaseStats(p, done)), [done, phases]);
  const fractions = useMemo(() => stats.map((s) => (s.total ? s.done / s.total : 0)), [stats]);

  const totals = useMemo(() => {
    const t = { d: 0, total: 0, q: 0, qTotal: 0, topicsDone: 0, topics: 0, phasesDone: 0 };
    stats.forEach((s) => {
      t.d += s.done; t.total += s.total; t.q += s.q; t.qTotal += s.qTotal; t.topicsDone += s.topicsDone; t.topics += s.topics;
      if (s.total && s.done === s.total) t.phasesDone++;
    });
    return t;
  }, [stats]);

  const streak = useMemo(() => {
    const days = new Set(Object.values(done).map((iso) => iso.slice(0, 10)));
    let n = 0;
    const d = new Date();
    if (!days.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
    while (days.has(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }, [done, phases]);

  const today = useMemo(() => {
    const k = new Date().toISOString().slice(0, 10);
    return Object.values(done).filter((iso) => iso.startsWith(k)).length;
  }, [done, phases]);

  const next = useMemo(() => {
    for (const p of phases) {
      for (const t of p.topics) {
        const item = t.items.find((i) => !done[i.id]);
        if (item) return { phase: p, topic: t as Topic | null, text: item.text };
      }
      const cp = [...p.checkpoint.mustKnow, ...p.checkpoint.mustDo].find((i) => !done[i.id]);
      if (cp) return { phase: p, topic: null, text: cp.text };
    }
    return null;
  }, [done, phases]);

  const q = query.trim().toLowerCase();

  const visible = useMemo(() => {
    return phases
      .map((p) => {
        const topics = p.topics.filter((t) => {
          const s = topicStats(t, done);
          const status: Filter = s.done === 0 ? "todo" : s.done === s.total ? "done" : "doing";
          if (filter !== "all" && status !== filter) return false;
          if (!q) return true;
          const hay = [t.title, t.summary, ...t.items.map((i) => i.text), ...t.questions.map((i) => i.text), ...t.concepts.map((c) => c.title + " " + c.body)].join(" ").toLowerCase();
          return hay.includes(q);
        });
        return { phase: p, topics };
      })
      .filter((x) => x.topics.length > 0);
  }, [done, filter, q, phases]);

  const toggleSet = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) =>
    setter((s) => { const n = new Set(s); if (n.has(key)) n.delete(key); else n.add(key); return n; });

  const scrollTo = (id: string) => setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);

  const selectPhase = (id: string) => {
    setQuery(""); setFilter("all");
    setOpenPhases((s) => new Set(s).add(id));
    scrollTo(`phase-${id}`);
  };

  const goNext = () => {
    if (!next) return;
    setQuery(""); setFilter("all");
    setOpenPhases((s) => new Set(s).add(next.phase.id));
    if (next.topic) {
      setOpenTopics((s) => new Set(s).add(next.topic!.key));
      scrollTo(`topic-${next.topic.key}`);
    } else scrollTo(`cp-${next.phase.id}`);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ ...progress, updatedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "progress.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = async (file: File) => {
    try {
      const j = JSON.parse(await file.text());
      if (!j || typeof j.done !== "object") throw new Error("bad");
      replace({ version: 1, done: j.done, notes: j.notes ?? {} });
    } catch { alert("That file is not a valid progress.json."); }
  };

  const reset = () => { if (confirm("Reset ALL progress and notes? This cannot be undone.")) resetAll(); };

  const overall = pct(totals.d, totals.total);

  return (
    <main className="wrap">
      <header className="hero">
        <div className="hero-text">
          <p className="eyebrow"><span className="pip" /> Your study platform</p>
          <h1>{T.title[0]} <span className="grad">{T.title[1]}</span></h1>
          <p className="lede">
            {phases.length} phases · {totals.topics} topics · {totals.total} skills · {totals.qTotal} interview questions. {T.lede}
          </p>
          <div className="actions">
            <button className="btn primary" onClick={goNext} disabled={!next}>{next ? "Continue where I left off →" : "All done 🎉"}</button>
            <button className="btn" onClick={exportJson}>Export</button>
            <button className="btn" onClick={() => fileRef.current?.click()}>Import</button>
            <button className="btn ghost" onClick={reset}>Reset</button>
            <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
          </div>
          {next && <p className="nextup"><b>Next up</b> · {PHASE_META[next.phase.id]?.icon} {next.phase.title} — {next.text}</p>}
          <p className={`save save-${saveState}`}>
            <span className="dot" />
            {saveState === "loading" && "Loading…"}
            {saveState === "saving" && "Saving…"}
            {saveState === "file" && "Saved to data/progress.json"}
            {saveState === "browser" && "Saved in this browser only (file API unavailable)"}
          </p>
        </div>
        <div className="hero-stats">
          <Ring value={overall} size={168} stroke={13} color="url(#g)">
            <span className="big">{overall}%</span>
            <span className="small">complete</span>
          </Ring>
          <svg width="0" height="0" aria-hidden>
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </header>

      <section className="tiles" aria-label="Stats">
        <div className="tile"><b>{totals.d}<i>/{totals.total}</i></b><span>skills mastered</span></div>
        <div className="tile"><b>{totals.phasesDone}<i>/{phases.length}</i></b><span>phases complete</span></div>
        <div className="tile"><b>{totals.q}<i>/{totals.qTotal}</i></b><span>questions practiced</span></div>
        <div className="tile hot"><b>{streak}</b><span>day streak 🔥 · {today} today</span></div>
      </section>

      <section className="card journey-card">
        <div className="sec-head">
          <h3>Your journey</h3>
          <div className="legend">
            {(["foundation", "core", "advanced", "interview"] as const).map((l) => (
              <span key={l} className={`lv lv-${l}`}>{LEVEL_LABEL[l]}</span>
            ))}
          </div>
        </div>
        <Journey phases={phases} fractions={fractions} onSelect={selectPhase} />
      </section>

      <section className="controls" aria-label="Filters">
        <input className="search" placeholder="Search topics, skills, deep dives, questions…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search" />
        <div className="seg">
          {(["all", "todo", "doing", "done"] as Filter[]).map((f) => (
            <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f === "todo" ? "Not started" : f === "doing" ? "In progress" : "Done"}
            </button>
          ))}
        </div>
        <div className="seg">
          <button onClick={() => setOpenPhases(new Set(phases.map((p) => p.id)))}>Expand</button>
          <button onClick={() => { setOpenPhases(new Set()); setOpenTopics(new Set()); }}>Collapse</button>
        </div>
      </section>

      <div className="road">
        {visible.length === 0 && <p className="empty">Nothing matches. Try another search or filter.</p>}
        {visible.map(({ phase, topics }) => {
          const s = stats[phase.index];
          const v = pct(s.done, s.total);
          const open = openPhases.has(phase.id) || !!q;
          const complete = v === 100;
          const meta = PHASE_META[phase.id];
          const tab = cpTab[phase.id] ?? "know";
          const showCp = filter === "all" && !q;
          return (
            <section key={phase.id} id={`phase-${phase.id}`} className={`stop ${complete ? "complete" : ""}`}>
              <div className="node">
                <Ring value={v} size={56} stroke={5} color="var(--orange)">
                  <span className="emo">{complete ? "✓" : meta.icon}</span>
                </Ring>
              </div>
              <div className="card phase">
                <button className="phase-head" onClick={() => toggleSet(setOpenPhases, phase.id)} aria-expanded={open}>
                  <div className="ph-main">
                    <div className="ph-top">
                      <span className="num">Phase {phase.index + 1}</span>
                      <span className={`lv lv-${phase.level}`}>{LEVEL_LABEL[phase.level]}</span>
                      {complete && <span className="done-pill">Complete</span>}
                    </div>
                    <h2>{phase.title}</h2>
                    <p>{phase.tagline}</p>
                    <div className="pills">
                      <span>{s.topicsDone}/{s.topics} topics</span>
                      <span>{s.done}/{s.total} skills</span>
                      <span>{s.q}/{s.qTotal} questions</span>
                      <span>{phase.checkpoint.configs.length} configs</span>
                    </div>
                    <div className="bar"><i style={{ width: `${v}%` }} /></div>
                  </div>
                  <span className="pct">{v}%</span>
                  <span className={`chev ${open ? "open" : ""}`} aria-hidden>›</span>
                </button>

                <div className="ph-foot">
                  <Link href={"/phase/" + phase.id} className="study-link">Open study page →</Link>
                  <span>{conceptsFor(phase.id).length > 0 ? conceptsFor(phase.id).length + " interactive concepts" + (phase.id === "system-design" ? ", " + problems.length + " problem breakdowns, tech cheat sheets" : "") + " · deep dives, configs" : "deep dives, questions, configs"}</span>
                </div>

                {open && (
                  <div className="topics">
                    {topics.map((t) => {
                      const ts = topicStats(t, done);
                      const tv = pct(ts.done, ts.total);
                      const tOpen = openTopics.has(t.key);
                      const tt = topicTab[t.key] ?? "skills";
                      const setTT = (x: TopicTab) => setTopicTab((m) => ({ ...m, [t.key]: x }));
                      return (
                        <article key={t.key} id={`topic-${t.key}`} className={`topic ${tv === 100 ? "tdone" : ""}`}>
                          <button className="topic-head" onClick={() => toggleSet(setOpenTopics, t.key)} aria-expanded={tOpen}>
                            <span className="tcheck" aria-hidden>{tv === 100 ? "✓" : ""}</span>
                            <span className="ttitle"><b>{t.title}</b><small>{t.summary}</small></span>
                            <span className="tprog">{ts.done}/{ts.total}</span>
                            <span className={`chev sm ${tOpen ? "open" : ""}`} aria-hidden>›</span>
                          </button>
                          <div className="tbar"><i style={{ width: `${tv}%` }} /></div>

                          {tOpen && (
                            <div className="tbody">
                              <div className="tabs" role="tablist">
                                <button role="tab" aria-selected={tt === "skills"} className={tt === "skills" ? "on" : ""} onClick={() => setTT("skills")}>Skills <em>{ts.done}/{ts.total}</em></button>
                                <button role="tab" aria-selected={tt === "deep"} className={tt === "deep" ? "on" : ""} onClick={() => setTT("deep")} disabled={t.concepts.length === 0}>Deep dive <em>{t.concepts.length}</em></button>
                                <button role="tab" aria-selected={tt === "qs"} className={tt === "qs" ? "on" : ""} onClick={() => setTT("qs")} disabled={t.questions.length === 0}>Interview <em>{ts.qDone}/{ts.qTotal}</em></button>
                                <button role="tab" aria-selected={tt === "notes"} className={tt === "notes" ? "on" : ""} onClick={() => setTT("notes")}>Notes &amp; links</button>
                              </div>

                              {tt === "skills" && (
                                <>
                                  <div className="row-actions">
                                    <button className="mini" onClick={() => setMany(t.items.map((i) => i.id), true)}>Mark all</button>
                                    <button className="mini" onClick={() => setMany(t.items.map((i) => i.id), false)}>Clear</button>
                                  </div>
                                  <ul className="checks">
                                    {t.items.map((i) => <Check key={i.id} checked={!!done[i.id]} onChange={() => toggle(i.id)}>{i.text}</Check>)}
                                  </ul>
                                </>
                              )}

                              {tt === "deep" && t.concepts.map((c, idx) => (
                                <details key={c.title} className="concept" open={idx === 0}>
                                  <summary>{c.title}</summary>
                                  <Rich body={c.body} />
                                </details>
                              ))}

                              {tt === "qs" && (
                                <ul className="checks q">
                                  {t.questions.map((i) => <Check key={i.id} checked={!!done[i.id]} onChange={() => toggle(i.id)} answer={i.answer}>{i.text}</Check>)}
                                </ul>
                              )}

                              {tt === "notes" && (
                                <>
                                  {t.resources.length > 0 && (
                                    <>
                                      <h4>Resources</h4>
                                      <div className="res">
                                        {t.resources.map((r) => (
                                          <a key={r} href={`https://www.google.com/search?q=${encodeURIComponent(r)}`} target="_blank" rel="noreferrer">{r} ↗</a>
                                        ))}
                                      </div>
                                    </>
                                  )}
                                  <h4>My notes</h4>
                                  <textarea className="notes" placeholder="Gaps, links, things to revisit…" value={progress.notes[t.key] ?? ""} onChange={(e) => setNote(t.key, e.target.value)} />
                                </>
                              )}
                            </div>
                          )}
                        </article>
                      );
                    })}

                    {showCp && (
                      <section id={`cp-${phase.id}`} className="checkpoint">
                        <div className="cp-head">
                          <span className="flag">🚩</span>
                          <div>
                            <h3>Phase {phase.index + 1} checkpoint</h3>
                            <p>Don&rsquo;t move on until you can tick all of this. {s.cpDone}/{s.cpTotal} done.</p>
                          </div>
                        </div>
                        <div className="tabs cp-tabs" role="tablist">
                          <button className={tab === "know" ? "on" : ""} onClick={() => setCpTab((m) => ({ ...m, [phase.id]: "know" }))}>Must know <em>{phase.checkpoint.mustKnow.filter((i) => done[i.id]).length}/{phase.checkpoint.mustKnow.length}</em></button>
                          <button className={tab === "do" ? "on" : ""} onClick={() => setCpTab((m) => ({ ...m, [phase.id]: "do" }))}>Must build <em>{phase.checkpoint.mustDo.filter((i) => done[i.id]).length}/{phase.checkpoint.mustDo.length}</em></button>
                          <button className={tab === "cfg" ? "on" : ""} onClick={() => setCpTab((m) => ({ ...m, [phase.id]: "cfg" }))}>Configs &amp; code <em>{phase.checkpoint.configs.length}</em></button>
                        </div>
                        {tab === "know" && <ul className="checks">{phase.checkpoint.mustKnow.map((i) => <Check key={i.id} checked={!!done[i.id]} onChange={() => toggle(i.id)}>{i.text}</Check>)}</ul>}
                        {tab === "do" && <ul className="checks">{phase.checkpoint.mustDo.map((i) => <Check key={i.id} checked={!!done[i.id]} onChange={() => toggle(i.id)}>{i.text}</Check>)}</ul>}
                        {tab === "cfg" && (
                          <div className="cfgs">
                            <p className="cfg-hint">Be able to write these from memory (or explain every line). Copy them as a starting point.</p>
                            {phase.checkpoint.configs.map((c) => <CodeBlock key={c.title} code={c.code} lang={c.lang} title={c.title} note={c.note} />)}
                          </div>
                        )}
                      </section>
                    )}
                  </div>
                )}
              </div>
            </section>
          );
        })}
        <div className="finish">
          <div className="flag-big">🏁</div>
          <div><b>{T.finish[0]}</b><span>{T.finish[1]}</span></div>
        </div>
      </div>

      <footer className="foot">Progress is stored in <code>data/progress.json</code> and mirrored in your browser. Edit the roadmap in <code>data/phases/*.json</code>, <code>data/checkpoints-*.json</code> and <code>data/deep-dives-*.json</code>.</footer>
    </main>
  );
}
