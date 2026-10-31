/**
 * Driver providers a benchmark run can use besides the built-in DeepSeek
 * models: OpenAI-compatible routes configured in the source profile's
 * `llm-pi-ai` row (local models), and providers registered by installed
 * plugins. A run home starts empty, so a route's configuration travels in a
 * generated patch and its key in the child's environment only.
 * @module @lisihao/dsh-solar-bench/providers
 */
import type { Bilingual } from './catalog.js';
/** How a driver's model is billed, which decides whether the budget can see it. */
export type DriverBilling = 
/** Priced per token from the price table. */
'tokens'
/** A self-hosted model; no per-token charge once the user says so. */
 | 'unbilled'
/** A subscription account: each item spends subscription quota the budget cannot see. */
 | 'subscription';
/** One driver model the form offers. */
export interface DriverOption {
    /** Provider route of the `agent-default-model` row. */
    provider: string;
    /** Model id. */
    model: string;
    /** Display name. */
    label: string;
    /** Where the route comes from. */
    source: 'builtin' | 'pi-ai' | 'plugin';
    /** Billing. */
    billing: DriverBilling;
    /** Environment variable the route reads its key from, when it has one. */
    keyEnv?: string;
    /** Plugin package that registers the route, for plugin providers. */
    plugin?: string;
    /** What the user must accept before a run, for subscription providers. */
    acknowledge?: Bilingual;
    /** Why this provider cannot drive a run here; absent when it can. */
    blocked?: Bilingual;
}
/** A plugin that registers an LLM provider route. */
export interface ProviderPlugin {
    /** Provider route. */
    provider: string;
    /** Package name. */
    plugin: string;
    /** Display name of the provider. */
    label: string;
    /** Billing. */
    billing: DriverBilling;
    /** What the user must accept before a run. */
    acknowledge?: Bilingual;
    /** Why it cannot drive a run here. */
    blocked?: Bilingual;
}
/** Provider plugins known on 2026-10-29 (route ids read from each installed package's `lib`). */
export declare const DEFAULT_PROVIDER_PLUGINS: readonly ProviderPlugin[];
/** A `!!js` expression of a profile patch, kept as its source text and never evaluated here. */
export declare class JsExpression {
    readonly source: string;
    constructor(source: string);
}
/** Rows every group of an experiment shares and a plugin's bundle patch may not set: the driver model, the web-tool switch and the skill loader. */
export declare const PROTECTED_ROWS: readonly string[];
/**
 * The protected rows a bundle patch sets, wherever they sit: bundle patches nest rows under operations such as `insert:`.
 * @param file - the patch file.
 * @returns the row ids found, in file order, each once.
 */
export declare function protectedRowsIn(file: string): Promise<string[]>;
/** One row of a profile patch. */
export interface PatchRow {
    id?: string;
    name?: string;
    disabled?: unknown;
    config?: Record<string, unknown>;
    [field: string]: unknown;
}
/**
 * Rows of a profile's user patch layer.
 * @param profileDir - the profile directory.
 * @returns the rows; empty when the file is absent or not a list.
 */
export declare function readProfilePatch(profileDir: string): Promise<PatchRow[]>;
/** One OpenAI-compatible route of the `llm-pi-ai` row. */
export interface PiAiRoute {
    id: string;
    config: Record<string, unknown>;
}
/**
 * The `llm-pi-ai` routes of a profile patch.
 * @param rows - the patch rows.
 * @returns the routes in file order.
 */
export declare function piAiRoutes(rows: readonly PatchRow[]): PiAiRoute[];
/**
 * Driver options of the `llm-pi-ai` routes.
 * @param routes - the routes.
 * @returns one option per configured model.
 */
export declare function piAiOptions(routes: readonly PiAiRoute[]): DriverOption[];
/**
 * The patch carrying one `llm-pi-ai` route into a run profile.
 * @param route - the route.
 * @returns patch YAML.
 */
export declare function piAiPatch(route: PiAiRoute): string;
/**
 * The source profile's own rows for a plugin, so its configuration travels with it.
 * @param rows - the source profile's patch rows.
 * @param plugin - package name.
 * @returns the rows naming that package.
 */
export declare function pluginRows(rows: readonly PatchRow[], plugin: string): PatchRow[];
/**
 * A patch with the given rows.
 * @param rows - rows to write.
 * @param note - comment line.
 * @returns patch YAML, or an empty list when there are none.
 */
export declare function rowsPatch(rows: readonly PatchRow[], note: string): string;
