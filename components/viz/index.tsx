"use client";

import { RequestPath, Estimator, LoadBalancer, CacheSim, GatewayFlow } from "./network";
import { ConsistentHash, Replication, Quorum, Bloom, Queues, FanOut, Contention, Proximity } from "./data";
import { TokenBucket, CircuitBreaker, RetryStorm, Saga, Raft } from "./resilience";
import { RateLimitCompare } from "./ratelimit";
import { OptimizerLab, MatrixLab, KLLab, BiasVarianceLab, SoftmaxLab, SignificanceLab, BackpropLab, GD1DLab, KMeansLab } from "./math";
import { ConvLab, AttentionLab, BPELab, TrainMemLab, ScheduleLab } from "./dl";
import { RocLab, QLearnLab, MetaheuristicLab, HyperSearchLab, BoostLab, SVMLab } from "./labs-ml";
import { TimeSeriesLab, PermBootLab, ImbalanceLab, PCALab, HMMLab, DiffusionLab, FedLab, XAILab, AssocLab, HierLab } from "./labs-more";
import { Batching, KvCache, RagPipeline, AgentLoop } from "./ai";

const REGISTRY: Record<string, () => React.ReactElement> = {
  "request-path": () => <RequestPath />,
  estimator: () => <Estimator />,
  "load-balancer": () => <LoadBalancer />,
  cache: () => <CacheSim />,
  gateway: () => <GatewayFlow />,
  "consistent-hash": () => <ConsistentHash />,
  replication: () => <Replication />,
  quorum: () => <Quorum />,
  bloom: () => <Bloom />,
  queues: () => <Queues />,
  fanout: () => <FanOut />,
  contention: () => <Contention />,
  proximity: () => <Proximity />,
  "ratelimit-compare": () => <RateLimitCompare />,
  "token-bucket": () => <TokenBucket />,
  "circuit-breaker": () => <CircuitBreaker />,
  "retry-storm": () => <RetryStorm />,
  saga: () => <Saga />,
  raft: () => <Raft />,
  batching: () => <Batching />,
  "kv-cache": () => <KvCache />,
  "rag-pipeline": () => <RagPipeline />,
  "agent-loop": () => <AgentLoop />,
  "optimizer-lab": () => <OptimizerLab />,
  "matrix-lab": () => <MatrixLab />,
  "kl-lab": () => <KLLab />,
  "bias-variance": () => <BiasVarianceLab />,
  "softmax-lab": () => <SoftmaxLab />,
  "significance-lab": () => <SignificanceLab />,
  "backprop-lab": () => <BackpropLab />,
  "gd-1d": () => <GD1DLab />,
  "roc-lab": () => <RocLab />,
  "qlearn-lab": () => <QLearnLab />,
  "meta-lab": () => <MetaheuristicLab />,
  "hypersearch-lab": () => <HyperSearchLab />,
  "boost-lab": () => <BoostLab />,
  "svm-lab": () => <SVMLab />,
  "timeseries-lab": () => <TimeSeriesLab />,
  "permboot-lab": () => <PermBootLab />,
  "imbalance-lab": () => <ImbalanceLab />,
  "pca-lab": () => <PCALab />,
  "hmm-lab": () => <HMMLab />,
  "diffusion-lab": () => <DiffusionLab />,
  "fed-lab": () => <FedLab />,
  "xai-lab": () => <XAILab />,
  "assoc-lab": () => <AssocLab />,
  "hier-lab": () => <HierLab />,
  "conv-lab": () => <ConvLab />,
  "attention-lab": () => <AttentionLab />,
  "bpe-lab": () => <BPELab />,
  "trainmem-lab": () => <TrainMemLab />,
  "schedule-lab": () => <ScheduleLab />,
  "kmeans-lab": () => <KMeansLab />,
};

export function VizByKey({ k }: { k: string }) {
  const f = REGISTRY[k];
  return f ? f() : null;
}
