"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LEVEL_LABEL, PHASE_META, Phase, TRACKS, Topic, phases, phasesOf } from "@/lib/roadmap";
import { phaseProgress, useProgress } from "@/lib/progress";
import { conceptsFor, problems, technologies } from "@/lib/concepts";
import ConceptCard from "./ConceptCard";
import Checkpoint from "./Checkpoint";
import { Answer, Rich } from "./Rich";
import Scenarios from "./Scenarios";
import Toc from "./Toc";
import { scenariosFor } from "@/lib/scenarios";

function TopicStudy({ t }: { t: Topic }) {
  const { done, toggle, setMany, progress, setNote } = useProgress();
  const d = t.items.filter((i) => done[i.id]).length;
  const v = t.items.length ? Math.round((d / t.items.length) * 100) : 0;
  return (
    <article id={`t-${t.id}`} className="study-topic">
      <header>
        <div>
          <h3>{t.title}</h3>
          <p>{t.summary}</p>
        </div>
        <span className="tprog">{d}/{t.items.length}</span>
      </header>
      <div className="tbar big"><i style={{ width: `${v}%` }} /></div>

      <div className="st-grid">
        <section>
          <div className="row-actions">
            <h4>Skills to master</h4>
            <span className="vsp" />
            <button className="mini" onClick={() => setMany(t.items.map((i) => i.id), true)}>Mark all</button>
            <button className="mini" onClick={() => setMany(t.items.map((i) => i.id), false)}>Clear</button>
          </div>
          <ul className="checks">
            {t.items.map((i) => (
              <li key={i.id}>
                <label>
                  <input type="checkbox" checked={!!done[i.id]} onChange={() => toggle(i.id)} />
                  <span className="box" />
                  <span className={done[i.id] ? "txt done" : "txt"}>{i.text}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
        <section>
          {t.questions.length > 0 && (
            <>
              <h4>Interview questions <span className="meta">({t.questions.filter((i) => done[i.id]).length}/{t.questions.length})</span></h4>
              <ul className="checks q">
                {t.questions.map((i) => (
                  <li key={i.id}>
                    <label>
                      <input type="checkbox" checked={!!done[i.id]} onChange={() => toggle(i.id)} />
                      <span className="box" />
                      <span className={done[i.id] ? "txt done" : "txt"}>{i.text}</span>
                    </label>
                    <Answer body={i.answer} />
                  </li>
                ))}
              </ul>
            </>
          )}
          {t.resources.length > 0 && (
            <>
              <h4>Resources</h4>
              <div className="res">
                {t.resources.map((r) => <a key={r} href={`https://www.google.com/search?q=${encodeURIComponent(r)}`} target="_blank" rel="noreferrer">{r} ↗</a>)}
              </div>
            </>
          )}
        </section>
      </div>

      {t.concepts.length > 0 && (
        <>
          <h4>Deep dives</h4>
          {t.concepts.map((c, idx) => (
            <details key={c.title} className="concept" open={idx === 0}>
              <summary>{c.title}</summary>
              <Rich body={c.body} />
            </details>
          ))}
        </>
      )}

      <h4>My notes</h4>
      <textarea className="notes" placeholder="Gaps, links, things to revisit…" value={progress.notes[t.key] ?? ""} onChange={(e) => setNote(t.key, e.target.value)} />
    </article>
  );
}

function Breakdowns() {
  const [filter, setFilter] = useState("All");
  const [open, setOpen] = useState<string | null>(null);
  const levels = ["All", "Easy", "Medium", "Hard"];
  const list = problems.filter((p) => filter === "All" || p.level === filter);
  return (
    <section id="problems" className="study-sec">
      <div className="sec-title"><h2>Problem breakdowns</h2><p>{problems.length} classic and AI-era designs. Each lists the requirements, the core design and the deep dives interviewers push on. Practice them out loud with the delivery framework.</p></div>
      <div className="seg" style={{ marginBottom: 12 }}>{levels.map((l) => <button key={l} className={filter === l ? "on" : ""} onClick={() => setFilter(l)}>{l}</button>)}</div>
      <div className="pgrid">
        {list.map((p) => (
          <article key={p.id} className={`pcard ${open === p.id ? "open" : ""}`}>
            <button onClick={() => setOpen(open === p.id ? null : p.id)} aria-expanded={open === p.id}>
              <span className={`plevel ${p.level}`}>{p.level}</span>
              <b>{p.title}</b>
              <small>{p.teaches}</small>
            </button>
            {open === p.id && (
              <div className="pbody">
                <h5>Requirements</h5><ul>{p.requirements.map((x) => <li key={x}>{x}</li>)}</ul>
                <h5>Core design</h5><ol>{p.design.map((x) => <li key={x}>{x}</li>)}</ol>
                <h5>Deep dives</h5><ul>{p.deepDives.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function Technologies() {
  return (
    <section id="technologies" className="study-sec">
      <div className="sec-title"><h2>Key technologies cheat sheets</h2><p>Know what each tool is for, how it works inside, and how it fails.</p></div>
      <div className="tgrid">
        {technologies.map((t) => (
          <article key={t.id} className="tcard">
            <header><b>{t.title}</b><span>{t.kind}</span></header>
            <p>{t.what}</p>
            <h5>Use when</h5><ul>{t.useWhen.map((x) => <li key={x}>{x}</li>)}</ul>
            <h5>Inside</h5><ul>{t.internals.map((x) => <li key={x}>{x}</li>)}</ul>
            <h5 className="w">Watch out</h5><ul className="warn">{t.watchOut.map((x) => <li key={x}>{x}</li>)}</ul>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function PhaseStudy({ phaseId }: { phaseId: string }) {
  const { done } = useProgress();
  const phase = phases.find((p) => p.id === phaseId) as Phase;
  const meta = PHASE_META[phase.id];
  const s = phaseProgress(phase, done);
  const v = s.total ? Math.round((s.done / s.total) * 100) : 0;
  const cs = conceptsFor(phase.id);
  const studied = cs.filter((c) => done[`concept.${c.id}`]).length;
  const track = phasesOf(phase.track);
  const prev = track[phase.index - 1];
  const next = track[phase.index + 1];
  const isSD = phase.id === "system-design";
  const scn = scenariosFor(phase.id);

  const groups = useMemo(() => {
    const m = new Map<string, typeof cs>();
    cs.forEach((c) => m.set(c.group, [...(m.get(c.group) ?? []), c]));
    return [...m.entries()];
  }, [cs]);

  const toc: { id: string; label: string; sub?: boolean }[] = [];
  if (cs.length) toc.push({ id: "lab", label: `Visual concept lab (${cs.length})` });
  if (cs.length > 3) groups.forEach(([g, list]) => list.forEach((c) => toc.push({ id: `c-${c.id}`, label: c.title, sub: true })));
  else cs.forEach((c) => toc.push({ id: `c-${c.id}`, label: c.title, sub: true }));
  if (scn.length) toc.push({ id: "scenarios", label: `Scenario playbooks (${scn.length})` });
  toc.push({ id: "topics", label: "Topics" });
  phase.topics.forEach((t) => toc.push({ id: `t-${t.id}`, label: t.title, sub: true }));
  if (isSD) { toc.push({ id: "problems", label: `Problem breakdowns (${problems.length})` }); toc.push({ id: "technologies", label: "Key technologies" }); }
  toc.push({ id: "checkpoint", label: "Checkpoint" });

  return (
    <main className="study">
      <aside className="toc" aria-label="On this page">
        <Link href={TRACKS[phase.track].href} className="toc-back">← Roadmap</Link>
        <Toc items={toc} />
      </aside>

      <div className="study-main">
        <header className="study-hero">
          <div className="study-ico">{meta.icon}</div>
          <div className="study-hero-text">
            <div className="ph-top"><span className="num">Phase {phase.index + 1} of {track.length}</span><span className={`lv lv-${phase.level}`}>{LEVEL_LABEL[phase.level]}</span></div>
            <h1>{phase.title}</h1>
            <p>{phase.tagline}</p>
            <div className="pills">
              <span>{s.done}/{s.total} skills</span>
              <span>{s.q}/{s.qTotal} questions</span>
              {cs.length > 0 && <span>{studied}/{cs.length} concepts understood</span>}
              <span>{phase.topics.length} topics</span>
            </div>
            <div className="bar"><i style={{ width: `${v}%` }} /></div>
          </div>
          <div className="study-pct">{v}%</div>
        </header>

        {cs.length > 0 && (
          <section id="lab" className="study-sec">
            <div className="sec-title">
              <h2>{isSD ? "Visual concept lab" : "Interactive concepts"}</h2>
              <p>{isSD ? "Every core system design idea, explained step by step with an interactive animation you can poke. Read, play, then tick “understood”." : "Hands-on visualizations for the trickiest ideas in this phase."}</p>
            </div>
            {groups.map(([g, list]) => (
              <div key={g} className="cgroup-block">
                {groups.length > 1 && <h3 className="cg-title">{g}</h3>}
                {list.map((c) => <ConceptCard key={c.id} c={c} />)}
              </div>
            ))}
          </section>
        )}

        {scn.length > 0 && <Scenarios list={scn} />}

        <section id="topics" className="study-sec">
          <div className="sec-title"><h2>Topics</h2><p>Checklists, deep dives, questions and notes for every topic in this phase.</p></div>
          {phase.topics.map((t) => <TopicStudy key={t.key} t={t} />)}
        </section>

        {isSD && <Breakdowns />}
        {isSD && <Technologies />}

        <Checkpoint phase={phase} />

        <nav className="pager">
          {prev ? <Link href={`/phase/${prev.id}`}><small>← Previous</small><b>{PHASE_META[prev.id].icon} {prev.title}</b></Link> : <span />}
          {next ? <Link href={`/phase/${next.id}`} className="r"><small>Next →</small><b>{PHASE_META[next.id].icon} {next.title}</b></Link> : <span />}
        </nav>
      </div>
    </main>
  );
}
