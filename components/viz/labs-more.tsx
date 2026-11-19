"use client";

import { useMemo, useState } from "react";
import { Viz, Slider, Btn, Stat, rng } from "./ui";

const W = 520;
const H = 260;
const gauss = (r: () => number) => (r() + r() + r() + r() - 2) * 1.2;

/* ============ Time-series: components, moving average, ACF, differencing ============ */
export function TimeSeriesLab() {
  const [trend, setTrend] = useState(0.05);
  const [amp, setAmp] = useState(2);
  const [period, setPeriod] = useState(12);
  const [noise, setNoise] = useState(0.6);
  const [diff, setDiff] = useState(false);
  const N = 120;
  const series = useMemo(() => {
    const r = rng(3);
    return Array.from({ length: N }, (_, t) => trend * t + amp * Math.sin((2 * Math.PI * t) / period) + gauss(r) * noise);
  }, [trend, amp, period, noise]);
  const s = diff ? series.slice(1).map((v, i) => v - series[i]) : series;
  const win = period;
  const ma = s.map((_, i) => (i >= win - 1 ? s.slice(i - win + 1, i + 1).reduce((a, b) => a + b, 0) / win : NaN));
  const mean = s.reduce((a, b) => a + b, 0) / s.length;
  const varr = s.reduce((a, b) => a + (b - mean) ** 2, 0) / s.length;
  const acf = Array.from({ length: 31 }, (_, k) => s.slice(k).reduce((a, v, i) => a + (v - mean) * (s[i] - mean), 0) / (s.length * varr));
  const mn = Math.min(...s), mx = Math.max(...s);
  const X = (i: number) => 10 + (i / (s.length - 1)) * (W - 20);
  const Y = (v: number) => 120 - ((v - mn) / (mx - mn || 1)) * 100;
  const ci = 1.96 / Math.sqrt(s.length);
  const firstHalf = s.slice(0, s.length / 2).reduce((a, b) => a + b, 0) / (s.length / 2);
  const secondHalf = s.slice(s.length / 2).reduce((a, b) => a + b, 0) / (s.length / 2);
  const nonStat = Math.abs(secondHalf - firstHalf) > 0.5 * Math.sqrt(varr);
  return (
    <Viz title="Time series: trend, seasonality, noise, ACF, stationarity" hint="Series = trend + seasonal + noise. Orange = moving average over one period (estimates the trend). Bottom bars: autocorrelation; spikes at the seasonal period reveal seasonality; slow decay reveals non-stationarity. Toggle first-differencing to remove the trend.">
      <div className="viz-row">
        <Slider label="trend slope" value={trend} min={0} max={0.15} step={0.01} onChange={setTrend} show={(v) => v.toFixed(2)} />
        <Slider label="seasonal amplitude" value={amp} min={0} max={4} step={0.2} onChange={setAmp} show={(v) => v.toFixed(1)} />
        <Slider label="period" value={period} min={4} max={30} onChange={setPeriod} />
        <Slider label="noise" value={noise} min={0} max={2} step={0.1} onChange={setNoise} show={(v) => v.toFixed(1)} />
        <Btn on={diff} onClick={() => setDiff((v) => !v)}>first difference {diff ? "ON" : "OFF"}</Btn>
      </div>
      <svg viewBox="0 0 520 260" className="viz-svg" role="img" aria-label="Time series and ACF">
        <polyline fill="none" stroke="var(--muted)" strokeWidth={1.6} points={s.map((v, i) => `${X(i)},${Y(v)}`).join(" ")} />
        <polyline fill="none" stroke="var(--orange)" strokeWidth={2.4} points={ma.map((v, i) => (isNaN(v) ? "" : `${X(i)},${Y(v)}`)).filter(Boolean).join(" ")} />
        <line x1={10} y1={200} x2={510} y2={200} stroke="var(--line)" />
        {acf.map((a, k) => <rect key={k} x={14 + k * 16} y={a >= 0 ? 200 - a * 55 : 200} width={10} height={Math.abs(a) * 55} fill={Math.abs(a) > ci ? "#16a34a" : "var(--track)"} />)}
        <line x1={10} y1={200 - ci * 55} x2={510} y2={200 - ci * 55} stroke="#ef4444" strokeDasharray="3 3" />
        <text x={12} y={150} fontSize={11} fill="var(--muted)">ACF lags 0…30 (red = 95% noise band)</text>
      </svg>
      <div className="viz-stats"><Stat label="stationary (rough check)?" value={nonStat ? "no - mean drifts" : "approximately"} tone={nonStat ? "bad" : "good"} /><Stat label="lag-1 autocorr" value={acf[1].toFixed(2)} /><Stat label={`autocorr at lag ${period}`} value={(acf[period] ?? 0).toFixed(2)} /></div>
    </Viz>
  );
}

/* ============ Permutation test + bootstrap CI ============ */
export function PermBootLab() {
  const [delta, setDelta] = useState(0.8);
  const [n, setN] = useState(12);
  const [seed, setSeed] = useState(1);
  const data = useMemo(() => {
    const r = rng(seed * 17);
    return { a: Array.from({ length: n }, () => gauss(r)), b: Array.from({ length: n }, () => delta + gauss(r)) };
  }, [delta, n, seed]);
  const mean = (v: number[]) => v.reduce((x, y) => x + y, 0) / v.length;
  const obs = mean(data.b) - mean(data.a);
  const { perm, p, lo, hi } = useMemo(() => {
    const r = rng(99);
    const all = data.a.concat(data.b);
    const ps: number[] = [];
    for (let k = 0; k < 2000; k++) {
      const sh = all.slice();
      for (let i = sh.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [sh[i], sh[j]] = [sh[j], sh[i]]; }
      ps.push(mean(sh.slice(n)) - mean(sh.slice(0, n)));
    }
    const pv = ps.filter((v) => Math.abs(v) >= Math.abs(obs)).length / ps.length;
    const bs: number[] = [];
    for (let k = 0; k < 2000; k++) {
      const ra = Array.from({ length: n }, () => data.a[Math.floor(r() * n)]);
      const rb = Array.from({ length: n }, () => data.b[Math.floor(r() * n)]);
      bs.push(mean(rb) - mean(ra));
    }
    bs.sort((x, y) => x - y);
    return { perm: ps, p: pv, lo: bs[50], hi: bs[1949] };
  }, [data, n, obs]);
  const bins = 31, mn = -3, mx = 3;
  const hist = Array(bins).fill(0);
  perm.forEach((v) => { const i = Math.floor(((Math.max(mn, Math.min(mx - 1e-9, v)) - mn) / (mx - mn)) * bins); hist[i]++; });
  const hm = Math.max(...hist);
  const X = (v: number) => 10 + ((v - mn) / (mx - mn)) * 500;
  return (
    <Viz title="Permutation test and bootstrap confidence interval" hint="Null hypothesis: group labels don't matter. Shuffle the labels 2,000 times to build the null distribution of the mean difference (bars). The p-value is the fraction at least as extreme as your observed difference (blue line). The green band is a 95% bootstrap CI of the difference.">
      <div className="viz-row">
        <Slider label="true difference" value={delta} min={0} max={2} step={0.1} onChange={setDelta} show={(v) => v.toFixed(1)} />
        <Slider label="samples per group" value={n} min={4} max={60} onChange={setN} />
        <Btn onClick={() => setSeed((s) => s + 1)}>New sample</Btn>
      </div>
      <svg viewBox="0 0 520 170" className="viz-svg" role="img" aria-label="Permutation distribution">
        {hist.map((h, i) => <rect key={i} x={10 + (i / bins) * 500} y={140 - (h / hm) * 110} width={500 / bins - 1} height={(h / hm) * 110} fill={Math.abs(mn + ((i + 0.5) / bins) * (mx - mn)) >= Math.abs(obs) ? "rgba(239,68,68,0.55)" : "var(--track)"} />)}
        <line x1={X(obs)} y1={20} x2={X(obs)} y2={145} stroke="#3b82f6" strokeWidth={2.4} />
        <rect x={X(lo)} y={150} width={Math.max(2, X(hi) - X(lo))} height={8} fill="rgba(22,163,74,0.7)" />
        <line x1={X(0)} y1={20} x2={X(0)} y2={145} stroke="var(--line)" strokeDasharray="3 3" />
      </svg>
      <div className="viz-stats"><Stat label="observed difference" value={obs.toFixed(2)} /><Stat label="permutation p-value" value={p.toFixed(3)} tone={p < 0.05 ? "good" : "bad"} /><Stat label="95% bootstrap CI" value={`[${lo.toFixed(2)}, ${hi.toFixed(2)}]`} tone={lo > 0 || hi < 0 ? "good" : "warn"} /></div>
    </Viz>
  );
}

/* ============ Class imbalance: weights, oversampling, threshold ============ */
export function ImbalanceLab() {
  const [mode, setMode] = useState<"none" | "weight" | "over" | "smote">("none");
  const [ratio, setRatio] = useState(10);
  const [thr, setThr] = useState(0.5);
  const base = useMemo(() => {
    const r = rng(8);
    const maj = Array.from({ length: 100 }, () => ({ x: -0.4 + gauss(r) * 0.45, y: -0.1 + gauss(r) * 0.45, c: 0 }));
    const nm = Math.max(4, Math.round(100 / ratio));
    const min = Array.from({ length: nm }, () => ({ x: 0.45 + gauss(r) * 0.3, y: 0.2 + gauss(r) * 0.3, c: 1 }));
    return { maj, min };
  }, [ratio]);
  const train = useMemo(() => {
    const r = rng(5);
    let min = base.min.slice();
    if (mode === "over") { while (min.length < base.maj.length) min.push({ ...base.min[Math.floor(r() * base.min.length)] }); }
    if (mode === "smote") { while (min.length < base.maj.length) { const a = base.min[Math.floor(r() * base.min.length)], b = base.min[Math.floor(r() * base.min.length)], t = r(); min.push({ x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y), c: 1 }); } }
    return base.maj.concat(min);
  }, [base, mode]);
  const model = useMemo(() => {
    let w = [0, 0], b = 0;
    const wMin = mode === "weight" ? base.maj.length / base.min.length : 1;
    for (let it = 0; it < 400; it++) {
      let g = [0, 0], gb = 0;
      train.forEach((p) => { const z = w[0] * p.x * 3 + w[1] * p.y * 3 + b; const pr = 1 / (1 + Math.exp(-z)); const e = (pr - p.c) * (p.c ? wMin : 1); g[0] += e * p.x * 3; g[1] += e * p.y * 3; gb += e; });
      w = [w[0] - (0.3 * g[0]) / train.length, w[1] - (0.3 * g[1]) / train.length]; b -= (0.3 * gb) / train.length;
    }
    return { w, b };
  }, [train, mode, base]);
  const prob = (p: { x: number; y: number }) => 1 / (1 + Math.exp(-(model.w[0] * p.x * 3 + model.w[1] * p.y * 3 + model.b)));
  const all = base.maj.concat(base.min);
  const tp = base.min.filter((p) => prob(p) >= thr).length, fn = base.min.length - tp, fp = base.maj.filter((p) => prob(p) >= thr).length;
  const rec = tp / base.min.length, prec = tp + fp ? tp / (tp + fp) : 1;
  const acc = (all.length - fn - fp) / all.length;
  const X = (v: number) => W / 2 + v * 115, Y = (v: number) => H / 2 - v * 105;
  const cells: React.ReactElement[] = [];
  for (let i = 0; i < 40; i++) for (let j = 0; j < 20; j++) { const x = -1.3 + (i / 39) * 2.6, y = -1.1 + (j / 19) * 2.2; cells.push(<rect key={`${i}-${j}`} x={X(x) - 3.5} y={Y(y) - 5.5} width={7} height={11} fill={prob({ x, y }) >= thr ? "rgba(249,115,22,0.2)" : "rgba(59,130,246,0.12)"} />); }
  return (
    <Viz title="Imbalanced data: class weights, oversampling, SMOTE, threshold" hint="Blue = majority, orange = minority. With heavy imbalance the plain model predicts 'majority' almost everywhere: high accuracy, low recall. Try weights, random oversampling, SMOTE (interpolated synthetic points) and moving the threshold. Never resample the test set.">
      <div className="viz-row">
        {(["none", "weight", "over", "smote"] as const).map((m) => <Btn key={m} on={mode === m} onClick={() => setMode(m)}>{m === "none" ? "no fix" : m === "weight" ? "class weights" : m === "over" ? "random oversample" : "SMOTE"}</Btn>)}
      </div>
      <div className="viz-row"><Slider label="imbalance (majority : minority)" value={ratio} min={2} max={25} onChange={setRatio} show={(v) => `${v}:1`} /><Slider label="threshold" value={thr} min={0.05} max={0.95} step={0.05} onChange={setThr} show={(v) => v.toFixed(2)} /></div>
      <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg" role="img" aria-label="Imbalanced classification">
        {cells}
        {base.maj.map((p, i) => <circle key={`a${i}`} cx={X(p.x)} cy={Y(p.y)} r={2.6} fill="#3b82f6" opacity={0.7} />)}
        {train.filter((p, i) => i >= base.maj.length && i >= base.maj.length + base.min.length).map((p, i) => <circle key={`s${i}`} cx={X(p.x)} cy={Y(p.y)} r={2.6} fill="none" stroke="#f97316" />)}
        {base.min.map((p, i) => <circle key={`b${i}`} cx={X(p.x)} cy={Y(p.y)} r={4.5} fill="#f97316" stroke="var(--text)" strokeWidth={0.7} />)}
      </svg>
      <div className="viz-stats"><Stat label="accuracy" value={acc.toFixed(3)} tone="warn" /><Stat label="minority recall" value={rec.toFixed(2)} tone={rec > 0.7 ? "good" : "bad"} /><Stat label="minority precision" value={prec.toFixed(2)} /></div>
    </Viz>
  );
}

/* ============ PCA: principal axes of correlated data ============ */
export function PCALab() {
  const [rho, setRho] = useState(0.8);
  const [ang, setAng] = useState(30);
  const [k, setK] = useState(1);
  const pts = useMemo(() => {
    const r = rng(11);
    return Array.from({ length: 80 }, () => { const a = gauss(r) * 1.2, b = gauss(r) * 0.35 * (1 - rho * 0.7); const t = (ang * Math.PI) / 180; return [a * Math.cos(t) - b * Math.sin(t), a * Math.sin(t) + b * Math.cos(t)]; });
  }, [rho, ang]);
  const m = [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
  const c = pts.map((p) => [p[0] - m[0], p[1] - m[1]]);
  const sxx = c.reduce((s, p) => s + p[0] * p[0], 0) / c.length, syy = c.reduce((s, p) => s + p[1] * p[1], 0) / c.length, sxy = c.reduce((s, p) => s + p[0] * p[1], 0) / c.length;
  const tr = sxx + syy, det = sxx * syy - sxy * sxy, d = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
  const l1 = tr / 2 + d, l2 = tr / 2 - d;
  const th = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const v1 = [Math.cos(th), Math.sin(th)], v2 = [-Math.sin(th), Math.cos(th)];
  const recon = c.map((p) => { const z1 = p[0] * v1[0] + p[1] * v1[1], z2 = p[0] * v2[0] + p[1] * v2[1]; return k >= 2 ? [p[0], p[1]] : [z1 * v1[0], z1 * v1[1]].map((v, i) => v + (z2 * 0) * v2[i]); });
  const err = c.reduce((s, p, i) => s + (p[0] - recon[i][0]) ** 2 + (p[1] - recon[i][1]) ** 2, 0) / c.length;
  const X = (v: number) => W / 2 + v * 80, Y = (v: number) => H / 2 - v * 80;
  return (
    <Viz title="PCA: principal components, explained variance, reconstruction" hint="Blue = data. Orange arrow = PC1 (direction of maximum variance), green = PC2. Keep k=1 component and the data are projected onto PC1 (orange ticks): reconstruction error equals the discarded eigenvalue λ₂.">
      <div className="viz-row"><Slider label="correlation / elongation" value={rho} min={0} max={0.95} step={0.05} onChange={setRho} show={(v) => v.toFixed(2)} /><Slider label="rotation°" value={ang} min={0} max={170} step={5} onChange={setAng} /><Btn on={k === 1} onClick={() => setK(k === 1 ? 2 : 1)}>keep k = {k}</Btn></div>
      <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg" role="img" aria-label="PCA axes">
        {c.map((p, i) => <g key={i}><circle cx={X(p[0])} cy={Y(p[1])} r={3} fill="#3b82f6" opacity={0.7} />{k === 1 && <line x1={X(p[0])} y1={Y(p[1])} x2={X(recon[i][0])} y2={Y(recon[i][1])} stroke="rgba(249,115,22,0.35)" />}</g>)}
        <line x1={X(-v1[0] * Math.sqrt(l1) * 2.2)} y1={Y(-v1[1] * Math.sqrt(l1) * 2.2)} x2={X(v1[0] * Math.sqrt(l1) * 2.2)} y2={Y(v1[1] * Math.sqrt(l1) * 2.2)} stroke="#f97316" strokeWidth={3} />
        <line x1={X(-v2[0] * Math.sqrt(l2) * 2.2)} y1={Y(-v2[1] * Math.sqrt(l2) * 2.2)} x2={X(v2[0] * Math.sqrt(l2) * 2.2)} y2={Y(v2[1] * Math.sqrt(l2) * 2.2)} stroke="#16a34a" strokeWidth={3} />
      </svg>
      <div className="viz-stats"><Stat label="λ₁ (var PC1)" value={l1.toFixed(2)} /><Stat label="λ₂ (var PC2)" value={l2.toFixed(2)} /><Stat label="explained variance PC1" value={`${((l1 / (l1 + l2)) * 100).toFixed(0)}%`} tone="good" /><Stat label="reconstruction MSE" value={err.toFixed(3)} /></div>
    </Viz>
  );
}

/* ============ HMM: Viterbi decoding ============ */
export function HMMLab() {
  const [stay, setStay] = useState(0.8);
  const [acc, setAcc] = useState(0.8);
  const [obs, setObs] = useState([1, 1, 0, 1, 0, 0, 0]);
  const states = ["Rainy", "Sunny"];
  const A = [[stay, 1 - stay], [1 - stay, stay]];
  const B = [[acc, 1 - acc], [1 - acc, acc]]; // P(obs | state) obs: 1 = umbrella
  const emit = (s: number, o: number) => (o === 1 ? B[s][0] : B[s][1]);
  const res = useMemo(() => {
    const T = obs.length;
    const V: number[][] = [], bp: number[][] = [], alpha: number[][] = [];
    V[0] = [0, 1].map((s) => 0.5 * emit(s, obs[0]));
    alpha[0] = V[0].slice(); const z0 = alpha[0][0] + alpha[0][1]; alpha[0] = alpha[0].map((v) => v / z0);
    bp[0] = [0, 0];
    for (let t = 1; t < T; t++) {
      V[t] = []; bp[t] = [];
      alpha[t] = [0, 1].map((s) => (alpha[t - 1][0] * A[0][s] + alpha[t - 1][1] * A[1][s]) * emit(s, obs[t]));
      const z = alpha[t][0] + alpha[t][1]; alpha[t] = alpha[t].map((v) => v / z);
      for (const s of [0, 1]) { const c = [V[t - 1][0] * A[0][s], V[t - 1][1] * A[1][s]]; const b = c[0] >= c[1] ? 0 : 1; bp[t][s] = b; V[t][s] = c[b] * emit(s, obs[t]); }
      const zz = V[t][0] + V[t][1]; V[t] = V[t].map((v) => v / zz);
    }
    const path = Array(T).fill(0); path[T - 1] = V[T - 1][0] >= V[T - 1][1] ? 0 : 1;
    for (let t = T - 1; t > 0; t--) path[t - 1] = bp[t][path[t]];
    return { path, alpha };
  }, [obs, stay, acc]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Viz title="Hidden Markov Model: filtering and Viterbi decoding" hint="Hidden weather (Rainy/Sunny), observed umbrella (☂) or none. Click observation icons to flip them. 'Stay' = P(weather unchanged), 'accuracy' = P(umbrella | rain). The Viterbi path is the single most likely hidden sequence; the bars show the filtered probability of Rainy (forward algorithm).">
      <div className="viz-row"><Slider label="P(stay same weather)" value={stay} min={0.5} max={0.99} step={0.01} onChange={setStay} show={(v) => v.toFixed(2)} /><Slider label="emission accuracy" value={acc} min={0.5} max={0.99} step={0.01} onChange={setAcc} show={(v) => v.toFixed(2)} /></div>
      <div style={{ display: "grid", gridTemplateColumns: `80px repeat(${obs.length}, 1fr)`, gap: 6, alignItems: "center", margin: "10px 0" }}>
        <b style={{ fontSize: 12, color: "var(--muted)" }}>observed</b>
        {obs.map((o, i) => <button key={i} onClick={() => setObs((a) => a.map((x, j) => (j === i ? 1 - x : x)))} style={{ fontSize: 22, padding: 6, borderRadius: 10, border: "1px solid var(--line)", background: "var(--soft)", cursor: "pointer" }}>{o ? "☂" : "·"}</button>)}
        <b style={{ fontSize: 12, color: "var(--muted)" }}>P(Rainy | obs so far)</b>
        {res.alpha.map((a, i) => <div key={i} style={{ height: 34, background: "var(--track)", borderRadius: 6, position: "relative" }}><div style={{ position: "absolute", bottom: 0, width: "100%", height: `${a[0] * 100}%`, background: "#3b82f6", borderRadius: 6 }} /><span style={{ position: "absolute", top: 8, width: "100%", textAlign: "center", fontSize: 11, color: "var(--text)" }}>{a[0].toFixed(2)}</span></div>)}
        <b style={{ fontSize: 12, color: "var(--muted)" }}>Viterbi path</b>
        {res.path.map((s, i) => <div key={i} style={{ textAlign: "center", padding: 6, borderRadius: 10, background: s === 0 ? "rgba(59,130,246,0.3)" : "rgba(249,115,22,0.3)", fontSize: 13 }}>{s === 0 ? "🌧" : "☀"}</div>)}
      </div>
    </Viz>
  );
}

/* ============ Diffusion forward process ============ */
export function DiffusionLab() {
  const [t, setT] = useState(0);
  const T = 100;
  const beta = (i: number) => 0.0001 + (0.04 - 0.0001) * (i / T);
  let ab = 1;
  for (let i = 0; i < t; i++) ab *= 1 - beta(i);
  const pts = useMemo(() => {
    const r = rng(6);
    return Array.from({ length: 220 }, (_, i) => { const th = (i / 220) * Math.PI * 2; const ring = i % 2 ? [Math.cos(th) * 1.4, Math.sin(th) * 1.4] : [Math.cos(th) * 0.6, Math.sin(th) * 0.6]; return { x0: ring, e: [gauss(r), gauss(r)] }; });
  }, []);
  const X = (v: number) => W / 2 + v * 70, Y = (v: number) => H / 2 - v * 52;
  const curve = Array.from({ length: T + 1 }, (_, i) => { let a = 1; for (let j = 0; j < i; j++) a *= 1 - beta(j); return a; });
  return (
    <Viz title="Diffusion: the forward noising process" hint="x_t = √ᾱ_t · x₀ + √(1−ᾱ_t) · ε. At t=0 you see the data (two rings); as t grows the signal fades and the points become pure Gaussian noise. A diffusion model is trained to predict ε from x_t, then run in reverse to generate. The curve is ᾱ_t.">
      <div className="viz-row"><Slider label="timestep t" value={t} min={0} max={T} onChange={setT} /></div>
      <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg" role="img" aria-label="Noised data">
        {pts.map((p, i) => <circle key={i} cx={X(Math.sqrt(ab) * p.x0[0] + Math.sqrt(1 - ab) * p.e[0])} cy={Y(Math.sqrt(ab) * p.x0[1] + Math.sqrt(1 - ab) * p.e[1])} r={2.6} fill={i % 2 ? "#f97316" : "#3b82f6"} opacity={0.75} />)}
      </svg>
      <svg viewBox="0 0 520 70" className="viz-svg" role="img" aria-label="Alpha-bar schedule"><polyline fill="none" stroke="var(--orange)" strokeWidth={2} points={curve.map((v, i) => `${10 + (i / T) * 500},${60 - v * 50}`).join(" ")} /><circle cx={10 + (t / T) * 500} cy={60 - ab * 50} r={5} fill="#3b82f6" /></svg>
      <div className="viz-stats"><Stat label="ᾱ_t (signal kept)" value={ab.toFixed(3)} /><Stat label="noise std √(1−ᾱ)" value={Math.sqrt(1 - ab).toFixed(2)} /><Stat label="SNR ᾱ/(1−ᾱ)" value={(ab / Math.max(1e-9, 1 - ab)).toFixed(2)} /></div>
    </Viz>
  );
}

/* ============ Federated averaging with non-IID clients ============ */
export function FedLab() {
  const [E, setE] = useState(1);
  const [spread, setSpread] = useState(1.5);
  const [round, setRound] = useState(0);
  const opt = [-1, 0.2, 1].map((c) => c * spread); // client optima
  const sizes = [1, 1, 1];
  const traj = useMemo(() => {
    let w = 4;
    const out = [w];
    for (let rd = 0; rd < 30; rd++) {
      const ws = opt.map((o) => { let v = w; for (let e = 0; e < E; e++) v -= 0.3 * (v - o); return v; });
      w = ws.reduce((s, v, i) => s + v * sizes[i], 0) / sizes.reduce((a, b) => a + b, 0);
      out.push(w);
    }
    return out;
  }, [E, spread]); // eslint-disable-line react-hooks/exhaustive-deps
  const target = opt.reduce((a, b) => a + b, 0) / 3;
  const w = traj[Math.min(round, 30)];
  const X = (r: number) => 10 + (r / 30) * 500, Y = (v: number) => 130 - v * 18;
  return (
    <Viz title="Federated averaging (FedAvg) and non-IID drift" hint="Three clients each own a quadratic loss with a different optimum (their local data distribution). Each round: clients train E local steps from the global model, the server averages. More local steps E or more client heterogeneity makes clients drift; with E large the average converges to a biased point if clients have unequal weights.">
      <div className="viz-row"><Slider label="local steps E" value={E} min={1} max={30} onChange={setE} /><Slider label="client heterogeneity" value={spread} min={0} max={3} step={0.1} onChange={setSpread} show={(v) => v.toFixed(1)} /><Slider label="round" value={round} min={0} max={30} onChange={setRound} /></div>
      <svg viewBox="0 0 520 170" className="viz-svg" role="img" aria-label="FedAvg trajectory">
        {opt.map((o, i) => <g key={i}><line x1={10} y1={Y(o)} x2={510} y2={Y(o)} stroke="rgba(120,120,120,0.5)" strokeDasharray="4 4" /><text x={14} y={Y(o) - 4} fontSize={11} fill="var(--muted)">client {i + 1} optimum</text></g>)}
        <line x1={10} y1={Y(target)} x2={510} y2={Y(target)} stroke="#16a34a" strokeWidth={1.6} />
        <polyline fill="none" stroke="var(--orange)" strokeWidth={2.4} points={traj.map((v, r) => `${X(r)},${Y(v)}`).join(" ")} />
        <circle cx={X(round)} cy={Y(w)} r={5} fill="#3b82f6" />
      </svg>
      <div className="viz-stats"><Stat label="global model w" value={w.toFixed(3)} /><Stat label="centralised optimum (green)" value={target.toFixed(3)} /><Stat label="client drift per round (max |w_k − w|)" value={Math.max(...opt.map((o) => { let v = w; for (let e = 0; e < E; e++) v -= 0.3 * (v - o); return Math.abs(v - w); })).toFixed(2)} tone="warn" /></div>
    </Viz>
  );
}

/* ============ XAI: PDP / ICE / permutation importance / exact Shapley ============ */
const f3 = (x: number[]) => 3 * x[0] + 2 * x[1] * x[2] + (x[2] > 0.5 ? 1.5 : 0) + 0 * x[0];
export function XAILab() {
  const [feat, setFeat] = useState(0);
  const [inst, setInst] = useState([0.8, 0.9, 0.7]);
  const bg = useMemo(() => { const r = rng(2); return Array.from({ length: 60 }, () => [r(), r(), r()]); }, []);
  const names = ["x₁ (linear)", "x₂ (interacts with x₃)", "x₃ (step + interaction)"];
  const grid = Array.from({ length: 21 }, (_, i) => i / 20);
  const ice = bg.slice(0, 15).map((b) => grid.map((g) => f3(b.map((v, d) => (d === feat ? g : v)))));
  const pdp = grid.map((g) => bg.reduce((s, b) => s + f3(b.map((v, d) => (d === feat ? g : v))), 0) / bg.length);
  const mse = (rows: number[][]) => rows.reduce((s, r) => s + (f3(r) - (3 * r[0] + 2 * r[1] * r[2] + (r[2] > 0.5 ? 1.5 : 0))) ** 2, 0) / rows.length;
  void mse;
  const perm = [0, 1, 2].map((d) => { const r = rng(40 + d); const sh = bg.map((b) => b[d]); for (let i = sh.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [sh[i], sh[j]] = [sh[j], sh[i]]; } return bg.reduce((s, b, i) => s + (f3(b.map((v, k) => (k === d ? sh[i] : v))) - f3(b)) ** 2, 0) / bg.length; });
  const meanOut = bg.reduce((s, b) => s + f3(b), 0) / bg.length;
  const v = (S: number[]) => bg.reduce((s, b) => s + f3(b.map((x, d) => (S.includes(d) ? inst[d] : x))), 0) / bg.length;
  const subsets = [[], [0], [1], [2], [0, 1], [0, 2], [1, 2], [0, 1, 2]];
  const val = Object.fromEntries(subsets.map((S) => [S.join(","), v(S)]));
  const fact = [1, 1, 2, 6];
  const shap = [0, 1, 2].map((i) => { let s = 0; for (const S of subsets) { if (S.includes(i)) continue; const w = (fact[S.length] * fact[3 - S.length - 1]) / fact[3]; const Si = [...S, i].sort(); s += w * (val[Si.join(",")] - val[S.join(",")]); } return s; });
  const pm = Math.max(...perm), sm = Math.max(...shap.map(Math.abs), 0.01);
  const lo = Math.min(...ice.flat()), hi = Math.max(...ice.flat());
  const X = (g: number) => 10 + g * 240, Y = (y: number) => 130 - ((y - lo) / (hi - lo || 1)) * 110;
  return (
    <Viz title="Explainable AI: PDP, ICE, permutation importance, Shapley values" hint="Black-box f(x) = 3x₁ + 2x₂x₃ + 1.5·[x₃>0.5]. Left: ICE curves (grey, one per instance) and the PDP (orange, their average) for the chosen feature - ICE spread reveals interactions the PDP hides. Right: global permutation importance and exact local Shapley values for your instance (they sum to f(x) − E[f]).">
      <div className="viz-row">{[0, 1, 2].map((d) => <Btn key={d} on={feat === d} onClick={() => setFeat(d)}>{names[d]}</Btn>)}</div>
      <div className="viz-row">{[0, 1, 2].map((d) => <Slider key={d} label={`instance x${d + 1}`} value={inst[d]} min={0} max={1} step={0.05} onChange={(val2) => setInst((a) => a.map((x, j) => (j === d ? val2 : x)))} show={(q) => q.toFixed(2)} />)}</div>
      <svg viewBox="0 0 520 150" className="viz-svg" role="img" aria-label="ICE and PDP">
        <rect x={10} y={20} width={240} height={110} fill="none" stroke="var(--line)" />
        {ice.map((c, i) => <polyline key={i} fill="none" stroke="rgba(120,120,120,0.45)" points={c.map((y, k) => `${X(grid[k])},${Y(y)}`).join(" ")} />)}
        <polyline fill="none" stroke="var(--orange)" strokeWidth={3} points={pdp.map((y, k) => `${X(grid[k])},${Y(y)}`).join(" ")} />
        <text x={10} y={14} fontSize={11} fill="var(--muted)">ICE (grey) + PDP (orange) for {names[feat]}</text>
        {perm.map((p, d) => <g key={d}><text x={270} y={42 + d * 30} fontSize={11} fill="var(--muted)">perm-imp x{d + 1}</text><rect x={350} y={30 + d * 30} width={(p / pm) * 140} height={16} fill="#3b82f6" /></g>)}
      </svg>
      <div style={{ display: "grid", gap: 6, margin: "6px 0" }}>
        {shap.map((s, d) => <div key={d} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}><span style={{ width: 70, color: "var(--muted)" }}>SHAP x{d + 1}</span><div style={{ flex: 1, height: 16, background: "var(--track)", borderRadius: 4, position: "relative" }}><div style={{ position: "absolute", left: s >= 0 ? "50%" : `${50 + (s / sm) * 50}%`, width: `${(Math.abs(s) / sm) * 50}%`, height: "100%", background: s >= 0 ? "#f97316" : "#3b82f6", borderRadius: 4 }} /></div><span style={{ width: 50 }}>{s.toFixed(2)}</span></div>)}
      </div>
      <div className="viz-stats"><Stat label="E[f(x)] (base value)" value={meanOut.toFixed(2)} /><Stat label="f(instance)" value={f3(inst).toFixed(2)} /><Stat label="base + ΣSHAP" value={(meanOut + shap.reduce((a, b) => a + b, 0)).toFixed(2)} tone="good" /></div>
    </Viz>
  );
}

/* ============ Association rules ============ */
const TX = [["milk", "bread"], ["milk", "diapers", "beer", "bread"], ["milk", "diapers", "bread", "cola"], ["bread", "butter"], ["diapers", "beer"], ["milk", "bread", "butter"], ["milk", "diapers", "beer"], ["bread", "diapers", "beer", "cola"], ["milk", "bread", "diapers", "butter"], ["bread", "milk"]];
const ITEMS = ["milk", "bread", "diapers", "beer", "butter", "cola"];
export function AssocLab() {
  const [A, setA] = useState<string[]>(["diapers"]);
  const [B, setB] = useState<string[]>(["beer"]);
  const toggle = (set: (f: (a: string[]) => string[]) => void, it: string) => set((a) => (a.includes(it) ? a.filter((x) => x !== it) : [...a, it]));
  const n = TX.length;
  const has = (t: string[], s: string[]) => s.every((x) => t.includes(x));
  const cA = TX.filter((t) => has(t, A)).length, cB = TX.filter((t) => has(t, B)).length, cAB = TX.filter((t) => has(t, A) && has(t, B)).length;
  const sup = cAB / n, conf = cA ? cAB / cA : 0, lift = cB && cA ? conf / (cB / n) : 0;
  const conv = conf < 1 ? (1 - cB / n) / (1 - conf) : Infinity;
  return (
    <Viz title="Association rules: support, confidence, lift (Apriori basics)" hint="Pick the antecedent A (left) and consequent B (right) item sets. support = P(A∪B), confidence = P(B|A), lift = confidence / P(B): lift>1 means A and B co-occur more than chance, <1 less. Apriori prunes any itemset whose subset is infrequent.">
      <div className="viz-row"><b style={{ fontSize: 12 }}>A (if):</b>{ITEMS.map((i) => <Btn key={i} on={A.includes(i)} onClick={() => toggle(setA, i)}>{i}</Btn>)}</div>
      <div className="viz-row"><b style={{ fontSize: 12 }}>B (then):</b>{ITEMS.map((i) => <Btn key={i} on={B.includes(i)} onClick={() => toggle(setB, i)}>{i}</Btn>)}</div>
      <div style={{ display: "grid", gap: 4, fontSize: 12, margin: "8px 0" }}>{TX.map((t, i) => <div key={i} style={{ padding: "3px 8px", borderRadius: 6, background: has(t, A) && has(t, B) ? "rgba(22,163,74,0.25)" : has(t, A) ? "rgba(249,115,22,0.2)" : "var(--soft)" }}>#{i + 1}: {t.join(", ")}</div>)}</div>
      <div className="viz-stats"><Stat label="support" value={sup.toFixed(2)} /><Stat label="confidence" value={conf.toFixed(2)} /><Stat label="lift" value={lift.toFixed(2)} tone={lift > 1.1 ? "good" : lift < 0.9 ? "bad" : "warn"} /><Stat label="conviction" value={isFinite(conv) ? conv.toFixed(2) : "∞"} /></div>
    </Viz>
  );
}

/* ============ Hierarchical clustering ============ */
export function HierLab() {
  const [link, setLink] = useState<"single" | "complete" | "average">("single");
  const [cut, setCut] = useState(2);
  const pts = useMemo(() => [[-1.6, 0.8], [-1.3, 1.1], [-1.0, 0.6], [0.2, -0.2], [0.5, -0.5], [0.7, 0.0], [1.5, 1.0], [1.8, 0.7]], []);
  const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const merges = useMemo(() => {
    let cl: number[][] = pts.map((_, i) => [i]);
    const out: { a: number[]; b: number[]; h: number }[] = [];
    while (cl.length > 1) {
      let best = { i: 0, j: 1, d: Infinity };
      for (let i = 0; i < cl.length; i++) for (let j = i + 1; j < cl.length; j++) {
        const ds = cl[i].flatMap((p) => cl[j].map((q) => dist(pts[p], pts[q])));
        const d = link === "single" ? Math.min(...ds) : link === "complete" ? Math.max(...ds) : ds.reduce((a, b) => a + b, 0) / ds.length;
        if (d < best.d) best = { i, j, d };
      }
      out.push({ a: cl[best.i], b: cl[best.j], h: best.d });
      cl = cl.filter((_, k) => k !== best.i && k !== best.j).concat([[...cl[best.i], ...cl[best.j]]]);
    }
    return out;
  }, [link, pts]);
  const clusters = useMemo(() => { let cl: number[][] = pts.map((_, i) => [i]); merges.slice(0, pts.length - cut).forEach((m) => { cl = cl.filter((c) => c !== c && true); }); return null; }, [merges, pts, cut]);
  void clusters;
  const assign = useMemo(() => { const lab = pts.map((_, i) => i); merges.slice(0, pts.length - cut).forEach((m) => { const t = lab[m.a[0]], u = lab[m.b[0]]; for (let i = 0; i < lab.length; i++) if (lab[i] === u) lab[i] = t; }); return lab; }, [merges, pts, cut]);
  const col = ["#ef4444", "#3b82f6", "#16a34a", "#f59e0b", "#a855f7", "#0ea5e9", "#ec4899", "#14b8a6"];
  const ids = [...new Set(assign)];
  const order = useMemo(() => { const o: number[] = []; const rec = (set: number[]) => { if (set.length === 1) { o.push(set[0]); return; } const m = merges.find((x) => x.a.concat(x.b).length === set.length && set.every((s) => x.a.concat(x.b).includes(s))); if (m) { rec(m.a); rec(m.b); } }; rec(pts.map((_, i) => i)); return o; }, [merges, pts]);
  const pos: Record<string, [number, number]> = {};
  order.forEach((p, i) => { pos[String([p])] = [20 + i * 40, 0]; });
  const hmax = Math.max(...merges.map((m) => m.h));
  const lines: React.ReactElement[] = [];
  merges.forEach((m, k) => {
    const ka = String(m.a), kb = String(m.b);
    const pa = pos[ka] ?? [0, 0], pb = pos[kb] ?? [0, 0];
    const ha = m.a.length === 1 ? 0 : merges.find((x) => x.a.concat(x.b).length === m.a.length && m.a.every((s) => x_has(x, s)))?.h ?? 0;
    const hb = m.b.length === 1 ? 0 : merges.find((x) => x.a.concat(x.b).length === m.b.length && m.b.every((s) => x_has(x, s)))?.h ?? 0;
    const y = 120 - (m.h / hmax) * 100, ya = 120 - (ha / hmax) * 100, yb = 120 - (hb / hmax) * 100;
    lines.push(<g key={k} stroke="var(--text)" strokeWidth={1.4} fill="none"><path d={`M${pa[0]},${ya} V${y} H${pb[0]} V${yb}`} /></g>);
    pos[String(m.a.concat(m.b).sort((x, z) => x - z))] = [(pa[0] + pb[0]) / 2, y];
    pos[String(m.a.concat(m.b))] = [(pa[0] + pb[0]) / 2, y];
  });
  return (
    <Viz title="Hierarchical (agglomerative) clustering and dendrogram" hint="Start with every point as its own cluster and repeatedly merge the closest pair. Linkage defines 'closest': single = nearest members (chains), complete = farthest members (compact), average = mean pairwise. Cut the dendrogram to get k clusters.">
      <div className="viz-row">{(["single", "complete", "average"] as const).map((l) => <Btn key={l} on={link === l} onClick={() => setLink(l)}>{l} linkage</Btn>)}<Slider label="clusters k" value={cut} min={1} max={6} onChange={setCut} /></div>
      <svg viewBox="0 0 520 280" className="viz-svg" role="img" aria-label="Clusters and dendrogram">
        <g transform="translate(0,0)">{pts.map((p, i) => <circle key={i} cx={140 + p[0] * 70} cy={70 - p[1] * 40} r={7} fill={col[ids.indexOf(assign[i]) % 8]} stroke="var(--text)" strokeWidth={0.7} />)}</g>
        <g transform="translate(180,150)">{lines}{order.map((p, i) => <text key={i} x={20 + i * 40} y={133} fontSize={11} textAnchor="middle" fill="var(--muted)">{p + 1}</text>)}</g>
      </svg>
    </Viz>
  );
}
function x_has(x: { a: number[]; b: number[] }, s: number) { return x.a.includes(s) || x.b.includes(s); }
