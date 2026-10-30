/** English and Simplified Chinese copy for the benchmark settings page. `{name}` marks a value filled in at render time. */
/** English dictionary. */
export declare const en: {
    readonly nav: "Benchmarks";
    readonly runTitle: "New experiment";
    readonly suite: "Suite";
    readonly tasksLabel: "Tasks ({selected}/{total})";
    readonly selectAll: "All";
    readonly selectNone: "None";
    readonly pluginsLabel: "Plugins to compare with the baseline";
    readonly noPlugins: "No third-party plugin is enabled in the desktop profile.";
    readonly repetitions: "Repetitions";
    readonly maxUsd: "Spending limit (USD)";
    readonly plan: "{runs} runs: {tasks} tasks × {variants} variants (baseline + {plugins} plugins) × {reps}";
    readonly fewTasks: "With fewer than {min} tasks the comparison will say \"too few tasks to judge\".";
    readonly noCredential: "No DeepSeek API key is configured. Set it on the Models settings page first.";
    readonly start: "Start (calls the model and costs money)";
    readonly starting: "Starting…";
    readonly stop: "Stop";
    readonly stopping: "Stopping…";
    readonly progressTitle: "Run";
    readonly stateRunning: "Running";
    readonly stateFinished: "Finished";
    readonly stateStopped: "Stopped";
    readonly stateFailed: "Failed";
    readonly progress: "{done} / {total} runs · spent ${spent} of ${max}";
    readonly runningNow: "Now: {cells}";
    readonly outcomePass: "pass";
    readonly outcomeFail: "fail";
    readonly outcomeTimeout: "timeout";
    readonly outcomeInvalid: "unmeasurable";
    readonly logTitle: "Live log";
    readonly resultsTitle: "Results";
    readonly baselineName: "Baseline (no plugin)";
    readonly guideDescription: "Compare plugins on coding tasks: success, tokens, cost and time.";
    readonly title: "Benchmarks";
    readonly intro: "Each plugin is compared with the baseline on the same tasks.";
    readonly refresh: "Refresh";
    readonly refreshing: "Refreshing…";
    readonly loading: "Loading…";
    readonly loadFailed: "Could not read the benchmark records";
    readonly serviceMissing: "The benchmark plugin is not running on this computer.";
    readonly empty: "No experiments yet. Start one above.";
    readonly unreadable: "Some experiment records could not be read:";
    readonly runsCount: "{count} runs";
    readonly experimentHeading: "Experiment {id} · suite {suite}";
    readonly baselineNote: "Baseline: {variant}";
    readonly comparisonsTitle: "Compared with the baseline";
    readonly noComparisons: "This experiment has only a baseline, so there is nothing to compare.";
    readonly verdictImproved: "Better than the baseline";
    readonly verdictRegressed: "Worse than the baseline";
    readonly verdictEquivalent: "No meaningful difference";
    readonly verdictUnderpowered: "Not enough evidence yet";
    readonly verdictInsufficient: "Too few tasks to judge";
    readonly verdictUnreliable: "Not comparable";
    readonly explainImproved: "Success rate {delta} across {tasks} tasks ({level}% interval {low} to {high}).";
    readonly explainRegressed: "Success rate {delta} across {tasks} tasks ({level}% interval {low} to {high}).";
    readonly explainEquivalent: "Success rate {delta}, within ±{margin} ({level}% interval {low} to {high}).";
    readonly explainUnderpowered: "Success rate {delta} ({level}% interval {low} to {high}). Differences under about {mde} cannot be detected yet; add tasks or repetitions.";
    readonly explainInsufficient: "{tasks} tasks could be compared; at least {min} are needed.";
    readonly explainUnreliable: "Unmeasurable runs differ: {variant} {here}, baseline {base}. Check the run errors before reading the result.";
    readonly costDelta: "Cost per task {value}";
    readonly timeDelta: "Time per task {value}";
    readonly variantsTitle: "Variants";
    readonly variant: "Variant";
    readonly runs: "Runs";
    readonly success: "Success";
    readonly anyRep: "Passed once";
    readonly everyRep: "Passed every time";
    readonly unmeasurable: "Unmeasurable";
    readonly costPerRun: "Cost per run";
    readonly timePerRun: "Time per run";
    readonly timeTitle: "Where the time goes";
    readonly timeModel: "Model";
    readonly timeTools: "Tools";
    readonly timeHarness: "Harness and plugins";
    readonly timeEmpty: "No measured runs yet.";
    readonly paretoTitle: "Success versus cost";
    readonly paretoCaption: "Variants on the front are not beaten on both success and cost.";
    readonly paretoEmpty: "No variant has priced runs yet; add model prices to see this chart.";
    readonly paretoFront: "On the front";
    readonly matrixTitle: "Pass rate by task";
    readonly task: "Task";
    readonly notRun: "not run";
    readonly flakyTitle: "Results that changed between repetitions";
    readonly flakyEntry: "{variant}: {tasks}";
};
/** Translator keys shared by both dictionaries. */
export type BenchLocaleKey = keyof typeof en;
/** Simplified Chinese dictionary. */
export declare const zh: Record<BenchLocaleKey, string>;
/**
 * The app's document language; read on every call because the app sets
 * `<html lang>` after client plugins are applied.
 * @returns `zh` or `en`.
 */
export declare function currentLanguage(): 'zh' | 'en';
