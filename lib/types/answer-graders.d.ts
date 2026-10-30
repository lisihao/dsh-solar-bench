/**
 * Graders of public benchmarks. Answer graders read the last `ANSWER:` line of
 * the root session's last assistant message; `python-tests` runs the dataset's
 * tests against the workspace's `solution.py`; judge graders ask the
 * experiment's judge model through {@link GradeInput.judge}.
 * @module @lisihao/dsh-solar-bench/answer-graders
 */
import type { BenchGrader, GradeInput } from './types.js';
/**
 * Text of the root session's last assistant message.
 * @param events - root session events.
 * @returns the joined text parts; empty when there is none.
 */
export declare function finalText(events: GradeInput['events']): string;
/**
 * The value of the last `ANSWER:` line, without Markdown emphasis or code ticks.
 * @param text - the final message.
 * @returns the answer, or `undefined` when no such line exists.
 */
export declare function parseAnswer(text: string): string | undefined;
/**
 * A choice letter from an answer such as `C`, `(C)`, `C.` or `C) text`.
 * @param answer - the parsed answer.
 * @returns the upper-case letter, or `undefined`.
 */
export declare function choiceLetter(answer: string): string | undefined;
/**
 * A number from an answer, ignoring `,`, `$`, `%`, units after the number, and a trailing period.
 * @param answer - the answer text.
 * @returns the value, or `undefined` when no number parses.
 */
export declare function numberOf(answer: string): number | undefined;
/**
 * Normalize a MATH answer: strip `\boxed{}`, `\left`/`\right`, `\!`, spaces,
 * degree marks, `\text{…}` units and dollar signs, and turn `\dfrac`/`\tfrac` into `\frac`.
 * @param answer - LaTeX answer.
 * @returns the normalized string.
 */
export declare function normalizeMath(answer: string): string;
/**
 * Whether two MATH answers match after {@link normalizeMath}, or as equal numbers.
 * @param given - the model's answer.
 * @param key - the reference answer.
 * @returns whether they match.
 */
export declare function mathEquivalent(given: string, key: string): boolean;
/**
 * Case- and space-insensitive form of a BBH answer.
 * @param text - answer text.
 * @returns the normalized form.
 */
export declare function normalizeExact(text: string): string;
/** `answer-choice`: the letter equals the key. */
export declare const choiceGrader: BenchGrader;
/** `answer-number`: numeric equality. */
export declare const numberGrader: BenchGrader;
/** `answer-math`: {@link mathEquivalent}. */
export declare const mathGrader: BenchGrader;
/** `answer-exact`: {@link normalizeExact} equality. */
export declare const exactGrader: BenchGrader;
/** File the python-tests grader writes its check program to, inside the workspace. */
export declare const CHECK_FILE = ".solar-bench-check.py";
/**
 * `python-tests`: run the dataset's tests against `solution.py` with the given interpreter.
 * @param python - absolute interpreter path (the app's bundled Python by default).
 * @returns the grader.
 */
export declare function pythonTestsGrader(python: string): BenchGrader;
/**
 * Whether one argument value matches an allowed value under BFCL's rules:
 * integers are accepted for floats, strings compare standardized, lists and
 * objects compare element-wise.
 * @param given - the model's value.
 * @param allowed - one allowed value.
 * @returns whether they match.
 */
export declare function bfclValueMatches(given: unknown, allowed: unknown): boolean;
/**
 * The call object in an answer: `{"name": …, "arguments": {…}}`, possibly inside a code fence.
 * @param text - the final message.
 * @returns the call, or `undefined`.
 */
export declare function parseCall(text: string): {
    name: string;
    arguments: Record<string, unknown>;
} | undefined;
/** `bfcl-ast`: BFCL's simple-category AST rule. */
export declare const bfclGrader: BenchGrader;
/**
 * Fill MT-Bench's single-answer template.
 * @param template - `prompt_template` from `judge_prompts.jsonl`.
 * @param values - question, answer and optional reference.
 * @returns the user message.
 */
export declare function fillMtBench(template: string, values: {
    question: string;
    answer: string;
    reference?: string;
}): string;
/** Score at or above which a judged answer counts in the pass column. */
export declare const JUDGE_PASS_RATING = 8;
/** `judge-score`: MT-Bench single-answer grading on 1–10; score is rating / 10. */
export declare const judgeScoreGrader: BenchGrader;
/** `judge-simpleqa`: SimpleQA's grader letter, A correct, B incorrect, C not attempted. */
export declare const judgeSimpleQaGrader: BenchGrader;
/**
 * Every public-benchmark grader.
 * @param python - interpreter for `python-tests`.
 * @returns the graders.
 */
export declare function answerGraders(python: string): BenchGrader[];
