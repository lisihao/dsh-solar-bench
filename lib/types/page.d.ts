/**
 * The Benchmarks View of a conversation, in four tabs: 基准库 (category tabs of
 * cards, where a card starts an experiment with a sample, a driver, plugins to
 * compare and a budget), 运行记录 (every experiment), 对照分析 (the scoreboard,
 * comparisons, cost and speed) and 诊断与改进 (plugin health and the trend).
 */
import { type ReactElement } from 'react';
import type { BenchTier, CategoryId } from './catalog.js';
import type { BenchExperimentList, BenchLedgersApi } from './contracts.js';
import { type BenchT } from './format.js';
import type { BenchInsights, ScoreColumn } from './insights.js';
import type { BenchCatalogItem, BenchJobStatus, BenchRunChoices, BenchStartInput } from './runs.js';
/** The run controls as the page calls them. */
export interface BenchRunsApi {
    choices(): Promise<BenchRunChoices>;
    start(input: BenchStartInput): Promise<{
        experimentId: string;
    }>;
    status(): Promise<BenchJobStatus>;
    stop(): Promise<BenchJobStatus>;
}
/** Tier pills: 保底 (floor) and 摸高 (ceiling). */
export declare const TIER_PILL: Readonly<Record<BenchTier, (key?: string) => ReactElement>>;
/** Shown when the latest baseline of a pass-rate benchmark sits at 90% or more over at least 10 runs. */
export declare const SATURATED_PILL: (key?: string) => ReactElement;
/** Readable names for plugins, drivers and columns. */
interface Names {
    plugin: (name: string) => string;
    driver: (key: string) => string;
    column: (column: ScoreColumn, columns: readonly ScoreColumn[]) => string;
}
/** Shown on every tab when some ledgers could not be read. */
export declare function UnreadableNotice({ insights }: {
    readonly insights: BenchInsights | undefined;
}): ReactElement | null;
/** 对照分析: the scoreboard, its notes, the paired comparisons, and cost and speed. */
export declare function AnalysisTab({ insights, choices, names, onStartFirst }: {
    readonly insights: BenchInsights | undefined;
    readonly choices: BenchRunChoices;
    readonly names: Names;
    readonly onStartFirst: () => void;
}): ReactElement;
/** 诊断与改进: plugin health and the cross-version trend. */
export declare function DiagnosisTab({ insights, names, onStartFirst }: {
    readonly insights: BenchInsights | undefined;
    readonly names: Names;
    readonly onStartFirst: () => void;
}): ReactElement;
/** The form that configures and starts one experiment. */
export declare function RunForm({ item, choices, runs, onStarted, onCancel, job }: {
    readonly item: BenchCatalogItem;
    readonly choices: BenchRunChoices;
    readonly runs: BenchRunsApi;
    readonly onStarted: () => void;
    readonly onCancel: () => void;
    readonly job: BenchJobStatus | undefined;
}): ReactElement;
/** One catalog card. */
export declare function BenchmarkCard({ item, latest, saturated, onRun, active }: {
    readonly item: BenchCatalogItem;
    readonly latest: string | undefined;
    readonly saturated: boolean;
    readonly onRun: () => void;
    readonly active: boolean;
}): ReactElement;
/** 基准库: category tabs, each with its cards and the form that starts an experiment. */
export declare function LibraryTab({ category, onCategory, choices, insights, runs, onStarted, names, job }: {
    readonly category: CategoryId;
    readonly onCategory: (category: CategoryId) => void;
    readonly choices: BenchRunChoices;
    readonly insights: BenchInsights | undefined;
    readonly runs: BenchRunsApi;
    readonly onStarted: () => void;
    readonly names: Names;
    readonly job: BenchJobStatus | undefined;
}): ReactElement;
/** 运行记录: every experiment, newest first, filtered by category, each with its analysis on demand. */
export declare function RecordsTab({ choices, list, ledgers, t, job, onStartFirst }: {
    readonly choices: BenchRunChoices;
    readonly list: BenchExperimentList | undefined;
    readonly ledgers: BenchLedgersApi;
    readonly t: BenchT;
    readonly job: BenchJobStatus | undefined;
    readonly onStartFirst: () => void;
}): ReactElement;
/** The four top-level tabs. */
export type BenchTab = 'library' | 'records' | 'analysis' | 'diagnosis';
/** The whole Benchmarks View. */
export declare function BenchPage({ ledgers, runs, mountError, t }: {
    readonly ledgers: BenchLedgersApi | undefined;
    readonly runs: BenchRunsApi | undefined;
    readonly mountError: string | undefined;
    readonly t: BenchT;
}): ReactElement;
export {};
