/**
 * The benchmark catalog: every benchmark the plugin knows, classified as
 * floor (保底: near saturation, checks that nothing regressed) or ceiling
 * (摸高: hard enough that improvements stay visible), with what running it
 * needs on this machine. Suites registered with `solarBenchmarks` run from
 * the form; external benchmarks are listed with their requirements and how
 * far their integration has come. Only benchmarks that run on this Mac
 * without GPUs or model training are listed. Facts below were read from each project's
 * own repository, dataset card or paper on 2026-10-29.
 * @module @lisihao/dsh-solar-bench/catalog
 */
import type { BenchTier } from './types.js';
/** Text in both page languages. */
export interface BenchText {
    zh: string;
    en: string;
}
/** Something an external benchmark needs on this machine. */
export type BenchRequirement = 'docker' | 'harbor';
/**
 * How far an external benchmark is integrated: `planned` means the Harbor
 * runner that will run it with DSH as the agent is not built yet.
 */
export type BenchIntegration = 'planned';
/** One external benchmark. */
export interface BenchCatalogEntry {
    id: string;
    name: string;
    tier: BenchTier;
    tags: string[];
    summary: BenchText;
    /** Project page or repository. */
    source: string;
    license: string;
    /** Pinned revision of the task set this entry describes. */
    revision?: string;
    harness: string;
    hardware: BenchText;
    timePerTask: BenchText;
    /** Published scores, which is what places the entry in its tier. */
    evidence: BenchText;
    requires: BenchRequirement[];
    integration: BenchIntegration;
    /** What the planned integration still lacks. */
    note: BenchText;
}
/** External benchmarks, in display order within each tier. */
export declare const BENCH_CATALOG: readonly BenchCatalogEntry[];
/** What this machine has for external benchmarks. */
export interface BenchEnvironment {
    docker: boolean;
    harbor: boolean;
}
/** Probes, injectable for tests. */
export interface EnvironmentProbes {
    run(command: string, args: readonly string[], timeoutMs: number): Promise<boolean>;
    exists(path: string): Promise<boolean>;
    env: NodeJS.ProcessEnv;
    home: string;
}
/**
 * Check this machine for a running Docker and for Harbor. A GUI app's
 * PATH often lacks Homebrew and `~/.local/bin`, so those are searched too.
 * @param probes - injectable probes.
 * @returns what is available.
 */
export declare function probeEnvironment(probes?: EnvironmentProbes): Promise<BenchEnvironment>;
/**
 * Requirements an entry still lacks on this machine.
 * @param entry - the catalog entry.
 * @param environment - the probe result.
 * @returns the missing requirements.
 */
export declare function missingRequirements(entry: BenchCatalogEntry, environment: BenchEnvironment): BenchRequirement[];
/** Baseline success at or above this, over enough runs, reads as saturated. */
export declare const SATURATION_SUCCESS = 0.9;
/** Fewest baseline runs that can show saturation. */
export declare const SATURATION_MIN_RUNS = 10;
