import sd from "@/data/concepts-sd.json";
import ai from "@/data/concepts-ai.json";
import bd from "@/data/breakdowns.json";
import ua from "@/data/usage-a.json";
import ub from "@/data/usage-b.json";
import d1 from "@/data/deep-1.json";
import d2 from "@/data/deep-2.json";
import d3 from "@/data/deep-3.json";
import nc from "@/data/concepts-new.json";
import nc2 from "@/data/concepts-new2.json";
import p1 from "@/data/concepts-p1.json";
import p2 from "@/data/concepts-p2.json";
import mathConcepts from "@/data/concepts-math.json";
import mathBasics from "@/data/concepts-math-basics.json";
import dl1 from "@/data/concepts-dl-1.json";
import dl2 from "@/data/concepts-dl-2.json";
import dl3 from "@/data/concepts-dl-3.json";
import dl4 from "@/data/concepts-dl-4.json";
import dl5 from "@/data/concepts-dl-5.json";
import dl6 from "@/data/concepts-dl-6.json";
import dl7 from "@/data/concepts-dl-7.json";
import math2 from "@/data/concepts-math-2.json";
import cml1 from "@/data/concepts-cml-1.json";
import cml2 from "@/data/concepts-cml-2.json";
import cml3 from "@/data/concepts-cml-3.json";
import aml1 from "@/data/concepts-aml-1.json";
import aml2 from "@/data/concepts-aml-2.json";
import rm from "@/data/concepts-rm.json";

export interface ConceptDef {
  id: string;
  phase: string;
  group: string;
  title: string;
  tagline: string;
  viz: string | null;
  explain: string;
  tradeoffs: string[];
  pitfalls: string[];
  interview: string[];
  use?: string[];
  avoid?: string[];
  qa?: { q: string; a: string }[];
  deep?: { title: string; body: string }[];
  compare?: { title: string; head: string[]; rows: string[][] }[];
  flows?: { title: string; hint?: string; nodes: { id: string; label: string; sub?: string; icon?: string }[]; steps: { at: string; note: string; ms?: number; tone?: "good" | "bad" | "warn" }[] }[];
}

const extra = { ...d1, ...d2, ...d3 } as Record<string, Partial<ConceptDef>>;

interface Usage { use: string[]; avoid: string[]; qa: { q: string; a: string }[] }
const usage = { ...ua, ...ub } as Record<string, Usage>;

export interface Problem {
  id: string;
  title: string;
  level: string;
  teaches: string;
  requirements: string[];
  design: string[];
  deepDives: string[];
}

export interface Tech {
  id: string;
  title: string;
  kind: string;
  what: string;
  useWhen: string[];
  internals: string[];
  watchOut: string[];
}

const merged: ConceptDef[] = [...(sd as ConceptDef[]), ...(nc as ConceptDef[]), ...(nc2 as ConceptDef[]), ...(p1 as ConceptDef[]), ...(p2 as ConceptDef[]), ...(mathConcepts as ConceptDef[]), ...(mathBasics as ConceptDef[]), ...(dl1 as ConceptDef[]), ...(dl2 as ConceptDef[]), ...(dl3 as ConceptDef[]), ...(dl4 as ConceptDef[]), ...(dl5 as ConceptDef[]), ...(dl6 as ConceptDef[]), ...(dl7 as ConceptDef[]), ...(math2 as ConceptDef[]), ...(cml1 as ConceptDef[]), ...(cml2 as ConceptDef[]), ...(cml3 as ConceptDef[]), ...(aml1 as ConceptDef[]), ...(aml2 as ConceptDef[]), ...(rm as ConceptDef[]), ...(ai as ConceptDef[])].map((c) => ({ ...c, ...(usage[c.id] ?? {}), ...(extra[c.id] ?? {}) }));

// Phase 01 is taught basics -> advanced: fixed order and numbered groups.
const G_EVAL = "3 · Evaluation (do this before trusting numbers)";
const G_DEEP = "5 · Math deepening";
const G_MODERN = "6 · Modern ML";
const G_REF = "8 · Complete math reference (every topic in one place)";
const G_RESEARCH = "7 · Research craft";
const MATH_PATH: [string, string?][] = [
  ["m-path"], ["m-vectors"], ["m-derivative"], ["m-prob-basics"],
  ["m-linreg"], ["m-logreg"], ["m-trees"], ["m-knn-svm-nb"], ["m-clustering"],
  ["m-cv-protocol"], ["ml-metrics", G_EVAL], ["m-nn-basics"],
  ["m-linalg-svd", G_DEEP], ["m-calc-backprop", G_DEEP], ["m-optimization", G_DEEP], ["m-prob-bayes", G_DEEP], ["m-info-theory", G_DEEP], ["m-softmax-ce", G_DEEP], ["m-generalization", G_DEEP],
  ["m-modern-dl", G_MODERN], ["m-generative", G_MODERN], ["m-rl-bayes", G_MODERN],
  ["m-stats-research", G_RESEARCH], ["m-reading-writing", G_RESEARCH],
  ["m-linalg-full", G_REF], ["m-calc-full", G_REF], ["m-prob-full", G_REF], ["m-stats-full", G_REF], ["m-optim-full", G_REF],
];
const DL_TRANSFORMER = "4 · The Transformer";
const DL_TOKENS = "5 · Tokens, embeddings and self-supervised learning";
const DL_SCALE = "12 · Training at scale";
const DL_POST = "13 · Post-training and efficiency";
const DL_RESEARCH = "14 · Research practice in deep learning";
const DL_PATH: [string, string?][] = [
  ["dl-path"],
  ["dl-activations"], ["dl-losses"], ["dl-normalization"], ["dl-regularization"], ["dl-optim-recipes"], ["dl-pytorch-debug"],
  ["dl-cnn"], ["dl-cnn-zoo"], ["dl-vision-modern"], ["dl-cv-tasks"],
  ["dl-rnn"], ["dl-attention"],
  ["dl-transformer-block"], ["attention-transformer", DL_TRANSFORMER], ["dl-transformer-zoo"], ["dl-efficient-attention"], ["dl-moe-ssm"],
  ["dl-tokenization"], ["tokenization", DL_TOKENS], ["dl-embeddings"], ["dl-selfsup"], ["dl-gnn"],
  ["dl-autoencoders"], ["dl-vae"], ["dl-gans"], ["dl-diffusion"],
  ["dl-nlp-classical"], ["dl-nlp-tasks"],
  ["dl-ts-classical"], ["dl-ts-deep"], ["dl-ts-anomaly"],
  ["dl-hybrid"],
  ["xai-map"], ["xai-shap-lime"], ["xai-pdp-gradcam"],
  ["adv-robustness"], ["adv-domain-fewshot"], ["adv-multitask-label"], ["adv-pinn-sciml"], ["adv-uq-bayesian"],
  ["dl-pretraining", DL_SCALE], ["dl-scaling", DL_SCALE], ["dl-distributed", DL_SCALE],
  ["dl-sft-peft", DL_POST], ["dl-alignment", DL_POST], ["dl-compression", DL_POST],
  ["dl-interp-robust", DL_RESEARCH], ["dl-experiments", DL_RESEARCH], ["dl-paper-writing", DL_RESEARCH],
];
const CML_PATH: [string, string?][] = [
  ["cml-map"], ["cml-python-lang"], ["cml-python-stack"], ["cml-eda-clean"], ["cml-scaling-encoding"], ["cml-imbalance-select"], ["cml-split-protocols"],
  ["cml-linear-poly"], ["cml-regularized"], ["cml-nonparam-reg"], ["cml-gpr"],
  ["cml-discriminant-nb"], ["cml-svm-kernels"], ["cml-perceptron-trees"],
  ["cml-clustering-zoo"], ["cml-hierarchical"], ["cml-dimred-linear"], ["cml-dimred-manifold"], ["cml-assoc-anomaly"],
  ["cml-ensembles"], ["cml-gbm-libs"],
  ["cml-learning-theory"], ["cml-cv-curves"], ["cml-hpo"],
  ["cml-metrics-clf"], ["cml-metrics-reg-cluster"],
];
const AML_PATH: [string, string?][] = [
  ["aml-kernels"], ["aml-em-gmm"], ["aml-hmm-crf"], ["aml-pgm"], ["aml-sampling-vi"],
  ["aml-metaheuristics"], ["aml-multiobjective"],
  ["aml-transfer-active-online"], ["aml-meta-automl"], ["aml-federated-privacy"], ["aml-causal-ml"],
  ["rl-mdp-dp"], ["rl-mc-td"], ["rl-deep-value"], ["rl-policy-gradient"],
];
const RM_PATH: [string, string?][] = [
  ["rm-method"], ["rm-slr-gap"],
  ["rm-experiment-design"], ["rm-stats-tests"], ["rm-model-comparison"],
  ["rm-paper-writing"], ["rm-publishing"],
  ["rm-tools-courses"], ["rm-roadmap-18"],
];
const PATHS: Record<string, [string, string?][]> = { "math-ml": MATH_PATH, "classical-ml": CML_PATH, "advanced-ml": AML_PATH, "deep-learning": DL_PATH, "research-methods": RM_PATH };

function ordered(all: ConceptDef[]): ConceptDef[] {
  const out = all.slice();
  for (const [phase, path] of Object.entries(PATHS)) {
    const rank = new Map(path.map(([id], i) => [id, i]));
    const regroup = new Map(path.filter(([, g]) => g).map(([id, g]) => [id, g as string]));
    const idx: number[] = [];
    all.forEach((x, i) => { if (x.phase === phase) idx.push(i); });
    const sorted = idx
      .map((i) => all[i])
      .map((x) => ({ ...x, group: regroup.get(x.id) ?? x.group }))
      .sort((a, b) => (rank.get(a.id) ?? 99) - (rank.get(b.id) ?? 99));
    idx.forEach((slot, k) => { out[slot] = sorted[k]; });
  }
  return out;
}
export const concepts: ConceptDef[] = ordered(merged);

export const conceptsFor = (phaseId: string) => concepts.filter((c) => c.phase === phaseId);

export const problems = (bd as { problems: Problem[] }).problems;
export const technologies = (bd as { technologies: Tech[] }).technologies;
