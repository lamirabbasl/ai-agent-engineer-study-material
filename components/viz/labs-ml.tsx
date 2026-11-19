"use client";

import { useMemo, useState } from "react";
import { Viz, Slider, Btn, Stat, rng } from "./ui";

const W = 520;
const H = 260;
const gauss = (r: () => number) => (r() + r() + r() + r() - 2) * 1.2;

/* ============ ROC / PR / confusion-matrix metric lab ============ */
function erf(x: number) {
  const s = Math.sign(x); x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x));
}
const Phi = (z: number) => 0.5 * (1 + erf(z / Math.SQRT2));

export function RocLab() {
  const [sep, setSep] = useState(1.5);
  const [thr, setThr] = useState(0.8);
  const [prev, setPrev] = useState(0.2);
  const N = 1000;
  const P = N * prev, Ng = N - P;
  const tpr = (t: number) => 1 - Phi(t - sep);
  const fpr = (t: number) => 1 - Phi(t);
  const ts = Array.from({ length: 81 }, (_, i) => -4 + (i / 80) * 9);
  const roc = ts.map((t) => [fpr(t), tpr(t)]);
  const TP = tpr(thr) * P, FN = P - TP, FP = fpr(thr) * Ng, TN = Ng - FP;
  const prec = TP + FP > 0 ? TP / (TP + FP) : 1;
  const rec = TP / P, spec = TN / Ng;
  const f1 = prec + rec > 0 ? (2 * prec * rec) / (prec + rec) : 0;
  const acc = (TP + TN) / N;
  const mccD = Math.sqrt((TP + FP) * (TP + FN) * (TN + FP) * (TN + FN));
  const mcc = mccD > 0 ? (TP * TN - FP * FN) / mccD : 0;
  const pe = ((TP + FP) * (TP + FN) + (FN + TN) * (FP + TN)) / (N * N);
  const kappa = (acc - pe) / (1 - pe || 1);
  let auc = 0;
  for (let i = 1; i < roc.length; i++) auc += Math.abs(roc[i][0] - roc[i - 1][0]) * (roc[i][1] + roc[i - 1][1]) / 2;
  const pr = ts.map((t) => { const tp = tpr(t) * P, fp = fpr(t) * Ng; return [tpr(t), tp + fp > 0 ? tp / (tp + fp) : 1]; });
  const X = (v: number, o: number) => o + v * 200;
  const Y = (v: number) => 230 - v * 200;
  const pdf = (x: number, m: number) => Math.exp(-0.5 * (x - m) ** 2) / Math.sqrt(2 * Math.PI);
  return (
    <Viz title="Classification metrics lab: threshold, ROC, PR, confusion matrix" hint="Negative scores ~ N(0,1), positive ~ N(sep,1). Move the decision threshold: precision/recall/F1/MCC change, ROC AUC does not (it is threshold-free). Lower the prevalence and watch accuracy lie while precision collapses.">
      <div className="viz-row">
        <Slider label="class separation" value={sep} min={0} max={4} step={0.1} onChange={setSep} show={(v) => v.toFixed(1)} />
        <Slider label="threshold" value={thr} min={-3} max={5} step={0.1} onChange={setThr} show={(v) => v.toFixed(1)} />
        <Slider label="positive prevalence" value={prev} min={0.01} max={0.5} step={0.01} onChange={setPrev} show={(v) => `${(v * 100).toFixed(0)}%`} />
      </div>
      <svg viewBox="0 0 520 250" className="viz-svg" role="img" aria-label="ROC and PR curves">
        <rect x={20} y={30} width={200} height={200} fill="none" stroke="var(--line)" />
        <polyline fill="none" stroke="var(--orange)" strokeWidth={2.2} points={roc.map(([a, b]) => `${X(a, 20)},${Y(b)}`).join(" ")} />
        <line x1={20} y1={230} x2={220} y2={30} stroke="var(--line)" strokeDasharray="4 4" />
        <circle cx={X(fpr(thr), 20)} cy={Y(tpr(thr))} r={6} fill="#3b82f6" />
        <text x={20} y={20} fontSize={12} fill="var(--muted)">ROC (x: FPR, y: TPR) AUC={auc.toFixed(3)}</text>
        <rect x={290} y={30} width={200} height={200} fill="none" stroke="var(--line)" />
        <polyline fill="none" stroke="#16a34a" strokeWidth={2.2} points={pr.map(([a, b]) => `${X(a, 290)},${Y(b)}`).join(" ")} />
        <line x1={290} y1={Y(prev)} x2={490} y2={Y(prev)} stroke="var(--line)" strokeDasharray="4 4" />
        <circle cx={X(rec, 290)} cy={Y(prec)} r={6} fill="#3b82f6" />
        <text x={290} y={20} fontSize={12} fill="var(--muted)">PR (x: recall, y: precision)</text>
      </svg>
      <svg viewBox="0 0 520 90" className="viz-svg" role="img" aria-label="score distributions">
        {ts.slice(0, 80).map((t, i) => <g key={i}><rect x={10 + i * 6.2} y={80 - pdf(t, 0) * (1 - prev) * 150} width={6} height={pdf(t, 0) * (1 - prev) * 150} fill="rgba(239,68,68,0.5)" /><rect x={10 + i * 6.2} y={80 - pdf(t, sep) * prev * 150} width={6} height={pdf(t, sep) * prev * 150} fill="rgba(22,163,74,0.55)" /></g>)}
        <line x1={10 + ((thr + 4) / 9) * 496} y1={0} x2={10 + ((thr + 4) / 9) * 496} y2={85} stroke="#3b82f6" strokeWidth={2} />
      </svg>
      <div className="viz-stats">
        <Stat label="TP / FP" value={`${TP.toFixed(0)} / ${FP.toFixed(0)}`} />
        <Stat label="FN / TN" value={`${FN.toFixed(0)} / ${TN.toFixed(0)}`} />
        <Stat label="accuracy" value={acc.toFixed(3)} tone={prev < 0.1 && acc > 0.9 ? "warn" : "good"} />
        <Stat label="precision" value={prec.toFixed(3)} />
        <Stat label="recall (sensitivity)" value={rec.toFixed(3)} />
        <Stat label="specificity" value={spec.toFixed(3)} />
        <Stat label="F1" value={f1.toFixed(3)} />
        <Stat label="balanced acc" value={((rec + spec) / 2).toFixed(3)} />
        <Stat label="MCC" value={mcc.toFixed(3)} />
        <Stat label="Cohen's kappa" value={kappa.toFixed(3)} />
      </div>
    </Viz>
  );
}

/* ============ Q-learning gridworld ============ */
const GS = 5;
const ACT = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // up right down left
const ARROW = ["↑", "→", "↓", "←"];
export function QLearnLab() {
  const [alpha, setAlpha] = useState(0.5);
  const [gamma, setGamma] = useState(0.9);
  const [eps, setEps] = useState(0.2);
  const [ep, setEp] = useState(0);
  const [seed, setSeed] = useState(1);
  const goal = [4, 0], pit = [4, 2], wall = [2, 2];
  const q = useMemo(() => {
    const r = rng(seed);
    const Q = Array.from({ length: GS * GS }, () => [0, 0, 0, 0]);
    const step = (x: number, y: number, a: number) => {
      let nx = x + ACT[a][0], ny = y + ACT[a][1];
      if (nx < 0 || ny < 0 || nx >= GS || ny >= GS || (nx === wall[0] && ny === wall[1])) { nx = x; ny = y; }
      let rw = -0.04, done = false;
      if (nx === goal[0] && ny === goal[1]) { rw = 1; done = true; }
      if (nx === pit[0] && ny === pit[1]) { rw = -1; done = true; }
      return { nx, ny, rw, done };
    };
    for (let e = 0; e < ep; e++) {
      let x = 0, y = 4;
      for (let t = 0; t < 60; t++) {
        const s = y * GS + x;
        const a = r() < eps ? Math.floor(r() * 4) : Q[s].indexOf(Math.max(...Q[s]));
        const { nx, ny, rw, done } = step(x, y, a);
        const ns = ny * GS + nx;
        Q[s][a] += alpha * (rw + (done ? 0 : gamma * Math.max(...Q[ns])) - Q[s][a]);
        x = nx; y = ny;
        if (done) break;
      }
    }
    return Q;
  }, [ep, alpha, gamma, eps, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const c = 46;
  const vmax = Math.max(0.01, ...q.map((a) => Math.max(...a)));
  return (
    <Viz title="Q-learning gridworld" hint="Agent starts bottom-left (S), wants the green goal, must avoid the red pit, wall in the middle. Update: Q(s,a) ← Q + α[r + γ·max Q(s′,·) − Q]. Train episodes and watch the greedy policy (arrows) and value heat emerge. Try ε=0 (no exploration) or γ=0 (myopic).">
      <div className="viz-row">
        <Slider label="α learning rate" value={alpha} min={0.05} max={1} step={0.05} onChange={setAlpha} show={(v) => v.toFixed(2)} />
        <Slider label="γ discount" value={gamma} min={0} max={0.99} step={0.01} onChange={setGamma} show={(v) => v.toFixed(2)} />
        <Slider label="ε explore" value={eps} min={0} max={1} step={0.05} onChange={setEps} show={(v) => v.toFixed(2)} />
      </div>
      <div className="viz-row">
        <Btn kind="primary" onClick={() => setEp((e) => e + 10)}>Train +10 episodes</Btn>
        <Btn onClick={() => setEp((e) => e + 200)}>+200</Btn>
        <Btn onClick={() => { setEp(0); setSeed((s) => s + 1); }}>Reset</Btn>
      </div>
      <svg viewBox="0 0 270 240" className="viz-svg" style={{ maxWidth: 360 }} role="img" aria-label="Gridworld">
        {Array.from({ length: GS * GS }, (_, s) => {
          const x = s % GS, y = Math.floor(s / GS);
          const best = Math.max(...q[s]);
          const isW = x === wall[0] && y === wall[1], isG = x === goal[0] && y === goal[1], isP = x === pit[0] && y === pit[1];
          return (
            <g key={s}>
              <rect x={5 + x * c} y={5 + y * c} width={c - 2} height={c - 2} rx={6} fill={isW ? "var(--muted)" : isG ? "rgba(22,163,74,0.6)" : isP ? "rgba(239,68,68,0.6)" : `rgba(249,115,22,${Math.max(0, Math.min(0.85, best / vmax)) * 0.8 + 0.06})`} />
              {!isW && !isG && !isP && ep > 0 && <text x={5 + x * c + c / 2 - 1} y={5 + y * c + c / 2 + 7} textAnchor="middle" fontSize={20} fill="var(--text)">{ARROW[q[s].indexOf(best)]}</text>}
              {x === 0 && y === 4 && <text x={10} y={20 + y * c + 14} fontSize={11} fill="var(--text)">S</text>}
              {isG && <text x={5 + x * c + c / 2} y={5 + y * c + c / 2 + 5} textAnchor="middle" fontSize={13} fill="var(--text)">+1</text>}
              {isP && <text x={5 + x * c + c / 2} y={5 + y * c + c / 2 + 5} textAnchor="middle" fontSize={13} fill="var(--text)">−1</text>}
            </g>
          );
        })}
      </svg>
      <div className="viz-stats"><Stat label="episodes" value={String(ep)} /><Stat label="max Q at start" value={Math.max(...q[20]).toFixed(2)} /></div>
    </Viz>
  );
}

/* ============ Metaheuristics: PSO / GA / simulated annealing on a multimodal landscape ============ */
const land = (x: number, y: number) => {
  const a = x * 2.2, b = y * 2.2;
  return 20 + (a * a - 10 * Math.cos(2 * Math.PI * a) + b * b - 10 * Math.cos(2 * Math.PI * b)) * 0.5 - 20; // shifted Rastrigin-like
};
export function MetaheuristicLab() {
  const [algo, setAlgo] = useState<"pso" | "ga" | "sa">("pso");
  const [iter, setIter] = useState(0);
  const [seed, setSeed] = useState(2);
  const [pop, setPop] = useState(20);
  const sim = useMemo(() => {
    const r = rng(seed);
    const rnd = () => (r() * 2 - 1) * 2;
    const hist: { pts: number[][]; best: number }[] = [];
    if (algo === "pso") {
      let P = Array.from({ length: pop }, () => [rnd(), rnd()]);
      let V = P.map(() => [0, 0]);
      let pb = P.map((p) => p.slice()), pbv = P.map((p) => land(p[0], p[1]));
      let gi = pbv.indexOf(Math.min(...pbv));
      let gb = pb[gi].slice();
      for (let t = 0; t <= iter; t++) {
        hist.push({ pts: P.map((p) => p.slice()), best: land(gb[0], gb[1]) });
        P = P.map((p, i) => {
          V[i] = V[i].map((v, d) => 0.72 * v + 1.5 * r() * (pb[i][d] - p[d]) + 1.5 * r() * (gb[d] - p[d]));
          const np = p.map((v, d) => Math.max(-2, Math.min(2, v + V[i][d])));
          const f = land(np[0], np[1]);
          if (f < pbv[i]) { pbv[i] = f; pb[i] = np.slice(); if (f < land(gb[0], gb[1])) gb = np.slice(); }
          return np;
        });
      }
    } else if (algo === "ga") {
      let P = Array.from({ length: pop }, () => [rnd(), rnd()]);
      for (let t = 0; t <= iter; t++) {
        const fit = P.map((p) => land(p[0], p[1]));
        hist.push({ pts: P.map((p) => p.slice()), best: Math.min(...fit) });
        const idx = fit.map((f, i) => [f, i]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
        const elite = idx.slice(0, 2).map((i) => P[i]);
        const pick = () => { const a = Math.floor(r() * P.length), b = Math.floor(r() * P.length); return fit[a] < fit[b] ? P[a] : P[b]; };
        const next = elite.map((e) => e.slice());
        while (next.length < pop) {
          const p1 = pick(), p2 = pick(), w = r();
          next.push([0, 1].map((d) => Math.max(-2, Math.min(2, w * p1[d] + (1 - w) * p2[d] + (r() < 0.2 ? (r() - 0.5) * 0.8 : 0)))));
        }
        P = next;
      }
    } else {
      let cur = [rnd(), rnd()], fc = land(cur[0], cur[1]), best = fc;
      for (let t = 0; t <= iter * 5; t++) {
        const T = Math.max(0.01, 3 * Math.pow(0.97, t));
        const cand = cur.map((v) => Math.max(-2, Math.min(2, v + (r() - 0.5) * 0.6)));
        const fn = land(cand[0], cand[1]);
        if (fn < fc || r() < Math.exp(-(fn - fc) / T)) { cur = cand; fc = fn; }
        best = Math.min(best, fc);
        if (t % 5 === 0) hist.push({ pts: [cur.slice()], best });
      }
    }
    return hist;
  }, [algo, iter, seed, pop]);
  const last = sim[sim.length - 1];
  const X = (v: number) => W / 2 + v * 100;
  const Y = (v: number) => H / 2 - v * 58;
  const cells: React.ReactElement[] = [];
  for (let i = 0; i < 52; i++) for (let j = 0; j < 30; j++) {
    const x = -2.6 + (i / 51) * 5.2, y = -1.5 + (j / 29) * 3;
    const v = Math.min(1, Math.max(0, land(x, y * 1.33) / 25));
    cells.push(<rect key={`${i}-${j}`} x={X(x) - 5} y={Y(y) - 4.5} width={10} height={9} fill={`rgba(249,115,22,${0.04 + (1 - v) * 0.5})`} />);
  }
  return (
    <Viz title="Metaheuristics: particle swarm, genetic algorithm, simulated annealing" hint="Minimise a multimodal (Rastrigin-like) surface with many local minima; the global optimum is at the centre (bright). PSO: velocity pulled to personal+global best. GA: selection, crossover, mutation, elitism. SA: accepts worse moves with prob exp(−Δ/T), cooling T.">
      <div className="viz-row">
        {(["pso", "ga", "sa"] as const).map((k) => <Btn key={k} on={algo === k} onClick={() => { setAlgo(k); setIter(0); }}>{k === "pso" ? "Particle Swarm" : k === "ga" ? "Genetic Algorithm" : "Simulated Annealing"}</Btn>)}
        <Slider label="population" value={pop} min={5} max={60} onChange={setPop} />
      </div>
      <div className="viz-row">
        <Btn kind="primary" onClick={() => setIter((i) => Math.min(i + 1, 60))}>Step</Btn>
        <Btn onClick={() => setIter((i) => Math.min(i + 10, 60))}>+10</Btn>
        <Btn onClick={() => { setIter(0); setSeed((s) => s + 1); }}>New start</Btn>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg" role="img" aria-label="Optimisation landscape">
        {cells}
        {last.pts.map((p, i) => <circle key={i} cx={X(p[0])} cy={Y(p[1] / 1.33)} r={4} fill="#3b82f6" stroke="var(--text)" strokeWidth={0.5} />)}
      </svg>
      <div className="viz-stats"><Stat label="iteration" value={String(iter)} /><Stat label="best fitness (0 = global optimum)" value={Math.max(0, last.best).toFixed(3)} tone={last.best < 0.5 ? "good" : "warn"} /></div>
    </Viz>
  );
}

/* ============ Hyper-parameter search: grid vs random ============ */
export function HyperSearchLab() {
  const [budget, setBudget] = useState(16);
  const [seed, setSeed] = useState(4);
  // score depends strongly on lr (x) and weakly on the second parameter (y): a narrow ridge in x
  const score = (x: number, y: number) => Math.exp(-((x - 0.63) ** 2) / 0.003) * 0.85 + 0.1 * Math.exp(-((y - 0.4) ** 2) / 0.2);
  const k = Math.max(1, Math.round(Math.sqrt(budget)));
  const grid = useMemo(() => { const p: number[][] = []; for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) p.push([(i + 0.5) / k, (j + 0.5) / k]); return p; }, [k]);
  const rand = useMemo(() => { const r = rng(seed); return Array.from({ length: k * k }, () => [r(), r()]); }, [k, seed]);
  const best = (ps: number[][]) => Math.max(...ps.map((p) => score(p[0], p[1])));
  const sx = (v: number, o: number) => o + v * 220;
  const sy = (v: number) => 230 - v * 200;
  return (
    <Viz title="Hyper-parameter search: grid vs random" hint="Only the horizontal parameter (think: learning rate) matters; the vertical one barely does. A grid wastes its budget testing the same few horizontal values; random search tests k² distinct values of the important one. Resample to see variance.">
      <div className="viz-row"><Slider label="budget (trials)" value={budget} min={4} max={100} onChange={setBudget} /><Btn onClick={() => setSeed((s) => s + 1)}>Resample random</Btn></div>
      <svg viewBox="0 0 520 250" className="viz-svg" role="img" aria-label="Grid vs random search">
        {[10, 280].map((ox, gi) => (
          <g key={gi}>
            <rect x={ox} y={30} width={220} height={200} fill="none" stroke="var(--line)" />
            {Array.from({ length: 44 }, (_, i) => <rect key={i} x={ox + (0.63 - 0.05 + (i % 11) * 0.01) * 220 - 0} y={30} width={2.2} height={200} fill="rgba(249,115,22,0.12)" />)}
            {(gi === 0 ? grid : rand).map((p, i) => <circle key={i} cx={sx(p[0], ox)} cy={sy(p[1])} r={4} fill={gi === 0 ? "#3b82f6" : "#16a34a"} />)}
            <text x={ox} y={20} fontSize={12} fill="var(--muted)">{gi === 0 ? "Grid" : "Random"}: best score {best(gi === 0 ? grid : rand).toFixed(3)}</text>
          </g>
        ))}
      </svg>
      <div className="viz-stats"><Stat label="grid best" value={best(grid).toFixed(3)} /><Stat label="random best" value={best(rand).toFixed(3)} tone={best(rand) > best(grid) ? "good" : "warn"} /><Stat label="distinct values of important param (grid / random)" value={`${k} / ${k * k}`} /></div>
    </Viz>
  );
}

/* ============ AdaBoost with decision stumps ============ */
export function BoostLab() {
  const [rounds, setRounds] = useState(1);
  const pts = useMemo(() => {
    const r = rng(9);
    return Array.from({ length: 40 }, () => { const x = r() * 2 - 1, y = r() * 2 - 1; return { x, y, c: x * x + y * y < 0.45 || (x + 0.6) * (x + 0.6) + (y - 0.6) * (y - 0.6) < 0.12 ? 1 : -1 }; });
  }, []);
  const model = useMemo(() => {
    const w = pts.map(() => 1 / pts.length);
    const stumps: { d: number; t: number; s: number; a: number }[] = [];
    const weights: number[][] = [w.slice()];
    for (let m = 0; m < 12; m++) {
      let best = { d: 0, t: 0, s: 1, e: 2 };
      for (let d = 0; d < 2; d++) for (let t = -0.9; t <= 0.9; t += 0.1) for (const s of [1, -1]) {
        let e = 0;
        pts.forEach((p, i) => { const v = d === 0 ? p.x : p.y; const pr = (v > t ? 1 : -1) * s; if (pr !== p.c) e += w[i]; });
        if (e < best.e) best = { d, t, s, e };
      }
      const e = Math.max(1e-9, Math.min(1 - 1e-9, best.e));
      const a = 0.5 * Math.log((1 - e) / e);
      stumps.push({ d: best.d, t: best.t, s: best.s, a });
      let z = 0;
      pts.forEach((p, i) => { const v = best.d === 0 ? p.x : p.y; const pr = (v > best.t ? 1 : -1) * best.s; w[i] *= Math.exp(-a * p.c * pr); z += w[i]; });
      for (let i = 0; i < w.length; i++) w[i] /= z;
      weights.push(w.slice());
    }
    return { stumps, weights };
  }, [pts]);
  const F = (x: number, y: number) => model.stumps.slice(0, rounds).reduce((s, st) => s + st.a * ((st.d === 0 ? x : y) > st.t ? 1 : -1) * st.s, 0);
  const err = pts.filter((p) => Math.sign(F(p.x, p.y)) !== p.c).length / pts.length;
  const X = (v: number) => W / 2 + v * 100, Y = (v: number) => H / 2 - v * 105;
  const cells: React.ReactElement[] = [];
  for (let i = 0; i < 40; i++) for (let j = 0; j < 20; j++) {
    const x = -1.2 + (i / 39) * 2.4, y = -1 + (j / 19) * 2;
    cells.push(<rect key={`${i}-${j}`} x={X(x) - 3.2} y={Y(y) - 5.5} width={6.5} height={11} fill={F(x, y) > 0 ? "rgba(249,115,22,0.22)" : "rgba(59,130,246,0.2)"} />);
  }
  const w = model.weights[Math.min(rounds - 1, model.weights.length - 1)];
  return (
    <Viz title="AdaBoost: boosting weak stumps into a strong classifier" hint="Each round fits a decision stump on re-weighted data: misclassified points get bigger (shown as larger dots) so the next stump focuses on them. Final prediction is the α-weighted vote. Watch the training error fall and the boundary become non-linear.">
      <div className="viz-row"><Slider label="boosting rounds" value={rounds} min={1} max={12} onChange={setRounds} /></div>
      <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg" role="img" aria-label="AdaBoost decision regions">
        {cells}
        {pts.map((p, i) => <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={3 + w[i] * 70} fill={p.c > 0 ? "#f97316" : "#3b82f6"} stroke="var(--text)" strokeWidth={0.6} opacity={0.9} />)}
      </svg>
      <div className="viz-stats"><Stat label="training error" value={`${(err * 100).toFixed(1)}%`} tone={err === 0 ? "good" : "warn"} /><Stat label="last stump weight α" value={model.stumps[rounds - 1].a.toFixed(2)} /></div>
    </Viz>
  );
}

/* ============ SVM: margin, C and the kernel trick ============ */
export function SVMLab() {
  const [C, setC] = useState(1);
  const [ring, setRing] = useState(false);
  const [feat, setFeat] = useState(false);
  const pts = useMemo(() => {
    const r = rng(ring ? 21 : 13);
    return Array.from({ length: 50 }, (_, i) => {
      if (ring) { const th = r() * 6.28, rad = i % 2 ? 0.35 + r() * 0.2 : 0.85 + r() * 0.2; return { x: rad * Math.cos(th), y: rad * Math.sin(th), c: i % 2 ? 1 : -1 }; }
      const c = i % 2 ? 1 : -1; return { x: c * 0.5 + gauss(r) * 0.3, y: c * 0.35 + gauss(r) * 0.3, c };
    });
  }, [ring]);
  const phi = (p: { x: number; y: number }) => (feat ? [p.x, p.y, 2 * (p.x * p.x + p.y * p.y)] : [p.x, p.y, 0]);
  const model = useMemo(() => {
    let w = [0, 0, 0], b = 0;
    const lam = 1 / (C * pts.length);
    for (let t = 1; t <= 1500; t++) {
      const eta = 1 / (lam * (t + 10));
      const i = (t * 7) % pts.length;
      const p = pts[i], f = phi(p);
      const m = p.c * (w[0] * f[0] + w[1] * f[1] + w[2] * f[2] + b);
      w = w.map((v) => v * (1 - eta * lam));
      if (m < 1) { w = w.map((v, d) => v + eta * p.c * f[d]); b += eta * p.c * 0.1; }
    }
    return { w, b };
  }, [pts, C, feat]); // eslint-disable-line react-hooks/exhaustive-deps
  const score = (p: { x: number; y: number }) => { const f = phi(p); return model.w[0] * f[0] + model.w[1] * f[1] + model.w[2] * f[2] + model.b; };
  const err = pts.filter((p) => Math.sign(score(p)) !== p.c).length / pts.length;
  const sv = pts.filter((p) => p.c * score(p) <= 1.05).length;
  const X = (v: number) => W / 2 + v * 110, Y = (v: number) => H / 2 - v * 105;
  const cells: React.ReactElement[] = [];
  for (let i = 0; i < 40; i++) for (let j = 0; j < 20; j++) {
    const x = -1.3 + (i / 39) * 2.6, y = -1.1 + (j / 19) * 2.2;
    const s = score({ x, y });
    cells.push(<rect key={`${i}-${j}`} x={X(x) - 3.5} y={Y(y) - 5.5} width={7} height={11} fill={Math.abs(s) < 1 ? "rgba(120,120,120,0.22)" : s > 0 ? "rgba(249,115,22,0.18)" : "rgba(59,130,246,0.16)"} />);
  }
  return (
    <Viz title="SVM: margin, soft-margin C and the kernel (feature-map) trick" hint="Grey band = the margin (|score|<1). Small C = wide margin, tolerates errors; large C = narrow margin, fits hard. Switch to ring data: a linear SVM fails, but adding the feature x²+y² (what an RBF/polynomial kernel does implicitly) makes it separable.">
      <div className="viz-row">
        <Slider label="C (log10)" value={Math.log10(C)} min={-2} max={3} step={0.25} onChange={(v) => setC(10 ** v)} show={(v) => `1e${v.toFixed(1)}`} />
        <Btn on={ring} onClick={() => setRing((v) => !v)}>data: {ring ? "ring (not linear)" : "two blobs"}</Btn>
        <Btn on={feat} onClick={() => setFeat((v) => !v)}>add feature x²+y² {feat ? "ON" : "OFF"}</Btn>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg" role="img" aria-label="SVM boundary">
        {cells}
        {pts.map((p, i) => <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={p.c * score(p) <= 1.05 ? 6 : 3.5} fill={p.c > 0 ? "#f97316" : "#3b82f6"} stroke="var(--text)" strokeWidth={p.c * score(p) <= 1.05 ? 1.6 : 0.5} />)}
      </svg>
      <div className="viz-stats"><Stat label="training error" value={`${(err * 100).toFixed(0)}%`} tone={err < 0.05 ? "good" : "bad"} /><Stat label="support vectors (ringed)" value={String(sv)} /></div>
    </Viz>
  );
}
