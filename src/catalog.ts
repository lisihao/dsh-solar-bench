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

import { execFile } from 'node:child_process'
import { access } from 'node:fs/promises'
import { homedir } from 'node:os'
import { delimiter, join } from 'node:path'
import type { BenchTier } from './types.js'

/** Text in both page languages. */
export interface BenchText {
  zh: string
  en: string
}

/** Something an external benchmark needs on this machine. */
export type BenchRequirement = 'docker' | 'harbor'

/**
 * How far an external benchmark is integrated: `planned` means the Harbor
 * runner that will run it with DSH as the agent is not built yet.
 */
export type BenchIntegration = 'planned'

/** One external benchmark. */
export interface BenchCatalogEntry {
  id: string
  name: string
  tier: BenchTier
  tags: string[]
  summary: BenchText
  /** Project page or repository. */
  source: string
  license: string
  /** Pinned revision of the task set this entry describes. */
  revision?: string
  harness: string
  hardware: BenchText
  timePerTask: BenchText
  /** Published scores, which is what places the entry in its tier. */
  evidence: BenchText
  requires: BenchRequirement[]
  integration: BenchIntegration
  /** What the planned integration still lacks. */
  note: BenchText
}

/** External benchmarks, in display order within each tier. */
export const BENCH_CATALOG: readonly BenchCatalogEntry[] = [
  {
    id: 'terminal-bench-2',
    name: 'Terminal-Bench 2.0',
    tier: 'ceiling',
    tags: ['coding', 'terminal'],
    summary: { zh: '在真实终端环境里完成多步骤工程任务。', en: 'Multi-step engineering tasks in real terminal environments.' },
    source: 'https://github.com/laude-institute/terminal-bench-2',
    license: 'Apache-2.0 (Harbor)',
    revision: 'terminal-bench@2.0',
    harness: 'Harbor',
    hardware: { zh: '本机 Docker，无需 GPU', en: 'Local Docker, no GPU' },
    timePerTask: { zh: '每题数分钟到一小时', en: 'Minutes to an hour per task' },
    evidence: { zh: '尚未读到前沿 agent 在 2.0 上的公开分数；RSIBench-Data 论文（arXiv 2607.25886）中微调后的 Qwen3.5-35B 检查点最好 20.22%。', en: 'No frontier-agent score on 2.0 was read; in the RSIBench-Data paper (arXiv 2607.25886) the best fine-tuned Qwen3.5-35B checkpoint scored 20.22%.' },
    requires: ['docker', 'harbor'],
    integration: 'planned',
    note: { zh: '等待 Harbor 运行器（让 DSH 作为 Harbor 的 agent）完成。', en: 'Waits for the Harbor runner that makes DSH a Harbor agent.' },
  },
  {
    id: 'rsi-exam',
    name: 'RSI-Exam',
    tier: 'ceiling',
    tags: ['rsi'],
    summary: {
      zh: '递归自我改进：拿到一个弱方法，自己做实验改进，最后在从未见过的隐藏数据上重放评分。公开 35 题，这里只用其中 27 道只需 CPU 的题。',
      en: 'Recursive self-improvement: improve a weak method by experiment, then replay it on a sealed split. Of the 35 public tasks, only the 27 CPU-only ones are used here.',
    },
    source: 'https://huggingface.co/datasets/RSI-Exam/RSI-Exam',
    license: 'MIT',
    revision: '66f54935eaa576e27dae446f74c2ce17875c14da',
    harness: 'Harbor',
    hardware: {
      zh: '本机 Docker，无需 GPU；需要 GPU 或 TPU 的 8 题不在范围内',
      en: 'Local Docker, no GPU; the 8 tasks that need a GPU or TPU are out of scope',
    },
    timePerTask: { zh: '每题最长 12 小时', en: 'Up to 12 hours per task' },
    evidence: {
      zh: '全部 88 题上最好的 Opus 5 均分 0.464，没有 agent 达到 0.6 参考线。这是全题集均分，只跑 CPU 题得到的分数不能直接和它比。',
      en: 'Best mean over all 88 tasks is Opus 5 at 0.464; no agent reaches the 0.6 reference. That is a full-set mean, so a CPU-only subset score is not directly comparable.',
    },
    requires: ['docker', 'harbor'],
    integration: 'planned',
    note: {
      zh: '官方 README 支持 DeepSeek 端点（运行时放行 api.deepseek.com）。等待 Harbor 运行器完成；运行器会按任务的 GPU 需求过滤，只跑 27 道 CPU 题。',
      en: 'The official README supports a DeepSeek endpoint (api.deepseek.com opened at run time). Waits for the Harbor runner, which will filter tasks by their GPU requirement and run only the 27 CPU tasks.',
    },
  },
]

/** What this machine has for external benchmarks. */
export interface BenchEnvironment {
  docker: boolean
  harbor: boolean
}

/** Probes, injectable for tests. */
export interface EnvironmentProbes {
  run(command: string, args: readonly string[], timeoutMs: number): Promise<boolean>
  exists(path: string): Promise<boolean>
  env: NodeJS.ProcessEnv
  home: string
}

const defaultProbes: EnvironmentProbes = {
  run: (command, args, timeoutMs) => new Promise((resolve) => {
    execFile(command, args, { timeout: timeoutMs }, error => resolve(error === null))
  }),
  exists: path => access(path).then(() => true, () => false),
  env: process.env,
  home: homedir(),
}

/**
 * Check this machine for a running Docker and for Harbor. A GUI app's
 * PATH often lacks Homebrew and `~/.local/bin`, so those are searched too.
 * @param probes - injectable probes.
 * @returns what is available.
 */
export async function probeEnvironment(probes: EnvironmentProbes = defaultProbes): Promise<BenchEnvironment> {
  const dirs = [...(probes.env.PATH ?? '').split(delimiter), '/opt/homebrew/bin', '/usr/local/bin', join(probes.home, '.local', 'bin'), join(probes.home, '.orbstack', 'bin')]
    .filter((dir, index, all) => dir !== '' && all.indexOf(dir) === index)
  const find = async (name: string): Promise<string | undefined> => {
    for (const dir of dirs) if (await probes.exists(join(dir, name))) return join(dir, name)
    return undefined
  }
  const docker = await find('docker')
  return {
    docker: docker !== undefined && await probes.run(docker, ['info', '--format', '{{.ServerVersion}}'], 5000),
    harbor: await find('harbor') !== undefined,
  }
}

/**
 * Requirements an entry still lacks on this machine.
 * @param entry - the catalog entry.
 * @param environment - the probe result.
 * @returns the missing requirements.
 */
export function missingRequirements(entry: BenchCatalogEntry, environment: BenchEnvironment): BenchRequirement[] {
  return entry.requires.filter(requirement => !environment[requirement])
}

/** Baseline success at or above this, over enough runs, reads as saturated. */
export const SATURATION_SUCCESS = 0.9
/** Fewest baseline runs that can show saturation. */
export const SATURATION_MIN_RUNS = 10
