/**
 * Experiment file parsing: YAML with `id`, `suite`, `profile`, `repetitions`,
 * optional `tasks`, and `variants` (each with optional `patches` relative to
 * the file and `env`).
 * @module @lisihao/dsh-solar-bench/experiment
 */
import type { Experiment } from './types.js';
/**
 * Read and validate an experiment file.
 * @param file - path to the YAML file; relative patch paths resolve against its directory.
 * @returns the resolved experiment with absolute patch paths.
 */
export declare function readExperiment(file: string): Promise<Experiment>;
