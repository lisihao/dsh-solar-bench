/**
 * The benchmark catalog: recognized public benchmarks grouped into categories,
 * each either runnable here (with an adapter that turns a fetched row into a
 * task and a grader spec) or listed with the concrete reason it cannot run.
 * Licenses and gating were read from the Hugging Face and GitHub APIs on
 * 2026-10-28; see docs/benchmarks-design.md.
 * @module @lisihao/dsh-solar-bench/catalog
 */

import type { DataSource, DatasetRow, DatasetStore } from './datasets.js'
import { permutation } from './datasets.js'
import type { BenchSuite, BenchTask } from './types.js'

/** Category tabs, in display order. */
export const CATEGORY_IDS = ['agent', 'coding', 'general', 'math', 'long-context', 'preference', 'long-horizon', 'rsi', 'science', 'harness'] as const

/** One category tab. */
export type CategoryId = typeof CATEGORY_IDS[number]

/** Text in both UI languages. */
export interface Bilingual {
  zh: string
  en: string
}

/** Category titles and one-line purposes. */
export const CATEGORIES: Readonly<Record<CategoryId, { title: Bilingual; purpose: Bilingual }>> = {
  'agent': { title: { zh: 'AI Agent 与工具调用', en: 'Agents & tool calling' }, purpose: { zh: '能否选对工具、填对参数、在多步交互里完成任务。', en: 'Picking the right tool, filling its arguments, finishing multi-step work.' } },
  'coding': { title: { zh: '编程与软件工程', en: 'Programming & software engineering' }, purpose: { zh: '写出能通过官方测试的代码。', en: 'Writing code that passes the official tests.' } },
  'general': { title: { zh: '通用智力与常识推理', en: 'General knowledge & reasoning' }, purpose: { zh: '跨学科知识、常识和多步推理。', en: 'Knowledge across subjects, commonsense and multi-step reasoning.' } },
  'math': { title: { zh: '数学与逻辑推理', en: 'Mathematics & logic' }, purpose: { zh: '从小学应用题到竞赛题的求解能力。', en: 'From grade-school word problems to competition mathematics.' } },
  'long-context': { title: { zh: '多模态与长文本', en: 'Multimodal & long context' }, purpose: { zh: '读懂超长文档或图像后作答。', en: 'Answering after reading very long documents or images.' } },
  'preference': { title: { zh: '人类偏好与综合竞技场', en: 'Human preference & arenas' }, purpose: { zh: '开放式回答的质量，由裁判模型或人类投票评定。', en: 'Quality of open-ended answers, rated by a judge model or human votes.' } },
  'long-horizon': { title: { zh: '长程任务', en: 'Long-horizon tasks' }, purpose: { zh: '需要几十上百步、跨多个工具和环境的真实任务。', en: 'Real tasks that take dozens of steps across tools and environments.' } },
  'rsi': { title: { zh: '递归自我改进（RSI）', en: 'Recursive self-improvement (RSI)' }, purpose: { zh: '能否通过自己做实验，把一个弱方法改进得更好。', en: 'Improving a weak method through its own experiments.' } },
  'science': { title: { zh: 'AI4Science', en: 'AI for Science' }, purpose: { zh: '生物、化学等科研场景的专业问题。', en: 'Research questions in biology, chemistry and other sciences.' } },
  'harness': { title: { zh: 'Harness 对比', en: 'Harness comparison' }, purpose: { zh: '固定模型，只换插件组合，看 DSH 本身的作用。', en: 'Fix the model, vary the plugins, and see what DSH itself adds.' } },
}

/**
 * Editorial tier: `floor` (保底) benchmarks are expected to sit near full marks
 * with the default driver, so a run checks that nothing regressed; `ceiling`
 * (摸高) benchmarks leave room for a plugin to show a gain. The tier is a
 * classification as of 2026-10-30, not a measurement; see `saturatedRow`.
 */
export type BenchTier = 'floor' | 'ceiling'

/** Tier titles and one-line purposes. */
export const TIERS: Readonly<Record<BenchTier, { title: Bilingual; purpose: Bilingual }>> = {
  floor: { title: { zh: '保底', en: 'Floor' }, purpose: { zh: '通常已接近满分，用来确认没有变差。', en: 'Usually near full marks; checks that nothing got worse.' } },
  ceiling: { title: { zh: '摸高', en: 'Ceiling' }, purpose: { zh: '足够难，真实提升才看得出来。', en: 'Hard enough that a real improvement shows.' } },
}

/** Why a listed benchmark is not run here. */
export type Blocker = 'harbor' | 'expert-grading' | 'checkers' | 'docker' | 'gated' | 'multi-turn' | 'images' | 'generator' | 'pairwise' | 'human-votes' | 'not-public' | 'no-license' | 'large-data' | 'test-harness' | 'browser'

/** Explanation of each blocker. */
export const BLOCKERS: Readonly<Record<Blocker, Bilingual>> = {
  'harbor': { zh: '每道题在 Harbor 框架管理的 Docker 容器里运行，需要本机运行中的 Docker 和 Harbor 0.25.0（uv tool install harbor==0.25.0）。', en: 'Each task runs in a Docker container managed by the Harbor framework; it needs a running Docker and Harbor 0.25.0 (uv tool install harbor==0.25.0) on this computer.' },
  'expert-grading': { zh: '交付物由行业专家评分，自动评分器未公开。', en: 'Deliverables are rated by industry experts; the automatic grader is not public.' },
  'checkers': { zh: '每条指令要用它自带的 Python 检查器验证，尚未接入。', en: 'Each instruction is verified by its own Python checkers; not yet wired in.' },
  'docker': { zh: '每道题要在独立的 Docker 环境里运行，本插件的一次性运行不提供。', en: 'Every task runs in its own Docker environment, which a one-shot run does not provide.' },
  'gated': { zh: '数据集需要申请访问权限（Hugging Face 门控），未接入。', en: 'The dataset is gated on Hugging Face; access is not wired in.' },
  'multi-turn': { zh: '需要模拟用户多轮对话，一次性运行只有一轮。', en: 'Needs a simulated user over many turns; a one-shot run has one turn.' },
  'images': { zh: '题目含图片，一次性运行里传图尚未验证。', en: 'Items include images; image input through a one-shot run is not yet verified.' },
  'generator': { zh: '题目要用它自带的 Python 脚本按长度生成，尚未接入。', en: 'Items are generated by its own Python scripts at chosen lengths; not yet wired in.' },
  'pairwise': { zh: '需要和存档的参考模型回答做两两比较，尚未接入。', en: 'Needs pairwise judging against stored reference-model answers; not yet wired in.' },
  'human-votes': { zh: '分数来自真人投票，不能在本地复现，仅作参考。', en: 'Scores come from human votes and cannot be reproduced locally; reference only.' },
  'not-public': { zh: '任务集没有公开。', en: 'The task set is not public.' },
  'no-license': { zh: '仓库没有许可证，不能使用其题目。', en: 'The repository has no license, so its tasks cannot be used.' },
  'large-data': { zh: '测试数据文件很大，需要单独下载，尚未接入。', en: 'Its test data is a large separate download; not yet wired in.' },
  'test-harness': { zh: '标准输入输出测试需要单独的评测器，尚未接入。', en: 'Its stdin/stdout tests need a separate harness; not yet wired in.' },
  'browser': { zh: '任务在真实网站上用浏览器完成，需要浏览器容器。', en: 'Tasks run on live websites in browser containers.' },
}

/** Turns fetched rows into tasks. */
export interface BenchmarkAdapter {
  /** Adapter version; bump when a prompt or grader spec changes. */
  version: string
  /** Where rows come from. */
  source: DataSource
  /** Primary measure. */
  metric: 'pass' | 'score'
  /** Whether grading calls a judge model. */
  judged: boolean
  /** Rows the adapter can turn into a task. */
  usable?: (row: Record<string, unknown>) => boolean
  /**
   * Build one task.
   * @param item - the fetched row with its id.
   * @param extras - auxiliary rows of the source, by name.
   * @returns the task.
   */
  task(item: DatasetRow, extras: Readonly<Record<string, readonly Record<string, unknown>[]>>): BenchTask
}

/** One catalog row. */
export interface CatalogEntry {
  /** Catalog id; also the suite id of a runnable entry. */
  id: string
  /** Category tab. */
  category: CategoryId
  /** Editorial tier. */
  tier: BenchTier
  /** Display name (a proper name, the same in both languages). */
  name: string
  /** What it measures. */
  summary: Bilingual
  /** Repository or dataset link. */
  source: { label: string; url: string }
  /** Paper link, when there is one. */
  paper?: { label: string; url: string }
  /** License as read from the source. */
  license: string
  /** Items in the source, as read on 2026-10-28; absent when not counted. */
  items?: number
  /** Measurement caveat shown on the card. */
  caveat?: Bilingual
  /** Runnable here, the bundled suite, or why not. */
  status: { kind: 'runnable'; adapter: BenchmarkAdapter } | { kind: 'bundled' } | { kind: 'harbor' } | { kind: 'blocked'; blocker: Blocker } | { kind: 'reference'; blocker: Blocker }
}

/** Final-answer instruction appended to every answer-graded prompt. */
const ANSWER_LINE = 'End your reply with one final line of the form "ANSWER: <your answer>" and nothing after it.'

const str = (value: unknown): string => typeof value === 'string' ? value : value === null || value === undefined ? '' : JSON.stringify(value)
const letters = 'ABCDEFGHIJKLMNOP'

/**
 * A multiple-choice prompt.
 * @param question - the question text.
 * @param options - option texts in display order.
 * @returns the prompt.
 */
export function choicePrompt(question: string, options: readonly string[]): string {
  const lines = options.map((option, index) => `${letters[index] as string}. ${option}`)
  return `${question}\n\nOptions:\n${lines.join('\n')}\n\nChoose the single best option. ${ANSWER_LINE.replace('<your answer>', '<letter>')}`
}

/**
 * Options in a seeded order with the letter of the correct one.
 * @param correct - correct option text.
 * @param wrong - distractors.
 * @param seed - per-item seed.
 * @returns the ordered options and the key letter.
 */
export function shuffledChoices(correct: string, wrong: readonly string[], seed: number): { options: string[]; key: string } {
  const all = [correct, ...wrong]
  const order = permutation(all.length, seed)
  const options = order.map(index => all[index] as string)
  return { options, key: letters[options.indexOf(correct)] as string }
}

/**
 * A stable numeric seed from an item id.
 * @param id - item id.
 * @returns a 32-bit seed.
 */
export function seedOf(id: string): number {
  let hash = 2166136261
  for (const char of id) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return hash >>> 0
}

const hf = (dataset: string, config: string, split: string): DataSource => ({ kind: 'hf-rows', parts: [{ dataset, config, split }] })

const task = (id: string, prompt: string, grader: BenchTask['grader'], tags: string[] = [], files?: Record<string, string>): BenchTask =>
  ({ id, prompt, grader, tags, ...files === undefined ? {} : { files } })

const PYTHON_LIMIT_MS = 60_000

const codePrompt = (body: string, entry?: string): string =>
  `Write a Python solution and save it as solution.py in the current directory${entry === undefined ? '' : `, defining \`${entry}\``}. Use only the Python standard library unless the task says otherwise. Do not print anything at import time.\n\n${body}\n\nWhen solution.py is written, reply briefly that it is done.`

const bbhConfigs = ['boolean_expressions', 'causal_judgement', 'date_understanding', 'disambiguation_qa', 'dyck_languages', 'formal_fallacies', 'geometric_shapes', 'hyperbaton', 'logical_deduction_five_objects', 'logical_deduction_seven_objects', 'logical_deduction_three_objects', 'movie_recommendation', 'multistep_arithmetic_two', 'navigate', 'object_counting', 'penguins_in_a_table', 'reasoning_about_colored_objects', 'ruin_names', 'salient_translation_error_detection', 'snarks', 'sports_understanding', 'temporal_sequences', 'tracking_shuffled_objects_five_objects', 'tracking_shuffled_objects_seven_objects', 'tracking_shuffled_objects_three_objects', 'web_of_lies', 'word_sorting']

/** Pinned FastChat commit of the MT-Bench questions, judge prompts and reference answers. */
const FASTCHAT = 'https://raw.githubusercontent.com/lm-sys/FastChat/587d5cfa1609a43d192cedb8441cac3c17db105d/fastchat/llm_judge/data'
/** Pinned simple-evals commit holding the SimpleQA grader template. */
const SIMPLE_EVALS = 'https://raw.githubusercontent.com/openai/simple-evals/652c89d0ca9df547706735883097e9537d40dc47/simpleqa_eval.py'
/** Pinned BFCL dataset commit. */
const BFCL = 'https://huggingface.co/datasets/gorilla-llm/Berkeley-Function-Calling-Leaderboard/resolve/61fc0608cfd831fcfbbaa676ebdfef0ed963eeda'
/** Pinned AIME 2025 dataset commit. */
const AIME2025 = 'https://huggingface.co/datasets/opencompass/AIME2025/resolve/a6ad95f611d72cf628a80b58bd0432ef6638f958'

/** MT-Bench categories graded against a reference answer (`single-math-v1`). */
const MT_REFERENCE_CATEGORIES = new Set(['math', 'reasoning', 'coding'])

/**
 * Extract the SimpleQA grader template from `simpleqa_eval.py`.
 * @param source - the Python file text.
 * @returns the template, with `{question}`, `{target}` and `{predicted_answer}` placeholders.
 */
export function simpleQaTemplate(source: string): string {
  const match = /GRADER_TEMPLATE = """([\s\S]*?)"""\.strip\(\)/.exec(source)
  if (match === null) throw new Error('BENCH_DATASET_SHAPE: simpleqa_eval.py has no GRADER_TEMPLATE')
  return (match[1] as string).trim()
}

const adapters = {
  gsm8k: {
    version: '1',
    source: hf('openai/gsm8k', 'main', 'test'),
    metric: 'pass',
    judged: false,
    task: ({ id, row }) => task(id, `Solve the following math word problem.\n\n${str(row.question)}\n\n${ANSWER_LINE.replace('<your answer>', '<number>')}`,
      { kind: 'answer-number', answer: str(row.answer).split('####').at(-1)?.trim() ?? '' }),
  },
  'math-500': {
    version: '1',
    source: hf('HuggingFaceH4/MATH-500', 'default', 'test'),
    metric: 'pass',
    judged: false,
    task: ({ id, row }) => task(id, `Solve the following problem.\n\n${str(row.problem)}\n\nGive the final answer in simplest form, as LaTeX without \\boxed. ${ANSWER_LINE}`,
      { kind: 'answer-math', answer: str(row.answer) }, [str(row.subject), `level-${str(row.level)}`]),
  },
  'aime-2024': {
    version: '1',
    source: hf('HuggingFaceH4/aime_2024', 'default', 'train'),
    metric: 'pass',
    judged: false,
    task: ({ id, row }) => task(id, `Solve the following AIME problem. The answer is an integer from 0 to 999.\n\n${str(row.problem)}\n\n${ANSWER_LINE.replace('<your answer>', '<integer>')}`,
      { kind: 'answer-number', answer: str(row.answer) }),
  },
  'aime-2025': {
    version: '1',
    source: { kind: 'files', revision: 'a6ad95f611d72cf628a80b58bd0432ef6638f958', files: [{ url: `${AIME2025}/aime2025-I.jsonl`, format: 'jsonl' }, { url: `${AIME2025}/aime2025-II.jsonl`, format: 'jsonl' }] },
    metric: 'pass',
    judged: false,
    task: ({ id, row }) => task(id, `Solve the following AIME problem. The answer is an integer from 0 to 999.\n\n${str(row.question)}\n\n${ANSWER_LINE.replace('<your answer>', '<integer>')}`,
      { kind: 'answer-number', answer: str(row.answer) }),
  },
  'mmlu-pro': {
    version: '1',
    source: hf('TIGER-Lab/MMLU-Pro', 'default', 'test'),
    metric: 'pass',
    judged: false,
    task: ({ id, row }) => task(id, choicePrompt(str(row.question), (row.options as unknown[]).map(str)), { kind: 'answer-choice', answer: str(row.answer) }, [str(row.category)]),
  },
  'arc-challenge': {
    version: '1',
    source: hf('allenai/ai2_arc', 'ARC-Challenge', 'test'),
    metric: 'pass',
    judged: false,
    task: ({ id, row }) => {
      const choices = row.choices as { text: string[]; label: string[] }
      const key = letters[choices.label.indexOf(str(row.answerKey))] ?? ''
      return task(id, choicePrompt(str(row.question), choices.text), { kind: 'answer-choice', answer: key })
    },
  },
  'bbh': {
    version: '1',
    source: { kind: 'hf-rows', parts: bbhConfigs.map(config => ({ dataset: 'lukaemon/bbh', config, split: 'test' })) },
    metric: 'pass',
    judged: false,
    task: ({ id, row }) => {
      const subtask = bbhConfigs[Number(/^p(\d+)-/.exec(id)?.[1])] ?? ''
      return task(id, `${str(row.input)}\n\nAnswer in the same form as the question expects (for example True, (A), a number, or a word list). ${ANSWER_LINE}`, { kind: 'answer-exact', answer: str(row.target) }, [subtask])
    },
  },
  'simpleqa': {
    version: '1',
    source: { ...hf('basicv8vc/SimpleQA', 'default', 'test'), extras: [{ name: 'grader', url: SIMPLE_EVALS, format: 'text' }] },
    metric: 'pass',
    judged: true,
    task: ({ id, row }, extras) => task(id, `Answer the question concisely.\n\n${str(row.problem)}`,
      { kind: 'judge-simpleqa', template: simpleQaTemplate(str(extras.grader?.[0]?.text)), question: str(row.problem), target: str(row.answer) }),
  },
  'humaneval': {
    version: '1',
    source: hf('openai/openai_humaneval', 'openai_humaneval', 'test'),
    metric: 'pass',
    judged: false,
    task: ({ id, row }) => task(id, codePrompt(`Complete this function (keep its signature):\n\n\`\`\`python\n${str(row.prompt)}\`\`\``, str(row.entry_point)),
      { kind: 'python-tests', program: `from solution import *\n${str(row.test)}\ncheck(${str(row.entry_point)})\n`, timeoutMs: PYTHON_LIMIT_MS }),
  },
  'humaneval-plus': {
    version: '1',
    source: hf('evalplus/humanevalplus', 'default', 'test'),
    metric: 'pass',
    judged: false,
    task: ({ id, row }) => task(id, codePrompt(`Complete this function (keep its signature):\n\n\`\`\`python\n${str(row.prompt)}\`\`\``, str(row.entry_point)),
      { kind: 'python-tests', program: `from solution import *\n${str(row.test)}\ncheck(${str(row.entry_point)})\n`, timeoutMs: PYTHON_LIMIT_MS }),
  },
  'mbpp': {
    version: '1',
    source: hf('google-research-datasets/mbpp', 'sanitized', 'test'),
    metric: 'pass',
    judged: false,
    task: ({ id, row }) => {
      const tests = (row.test_list as unknown[]).map(str)
      const imports = (row.test_imports as unknown[] | undefined ?? []).map(str)
      return task(id, codePrompt(`${str(row.prompt)}\n\nYour code should pass this test:\n\n\`\`\`python\n${tests[0] ?? ''}\n\`\`\``),
        { kind: 'python-tests', program: `${imports.join('\n')}\nfrom solution import *\n${tests.join('\n')}\n`, timeoutMs: PYTHON_LIMIT_MS })
    },
  },
  'bfcl-simple': {
    version: '1',
    source: { kind: 'files', revision: '61fc0608cfd831fcfbbaa676ebdfef0ed963eeda', files: [{ url: `${BFCL}/BFCL_v3_simple.json`, format: 'jsonl' }], join: { url: `${BFCL}/possible_answer/BFCL_v3_simple.json`, format: 'jsonl', key: 'id' } },
    metric: 'pass',
    judged: false,
    task: ({ id, row }) => {
      const question = ((row.question as { content: string }[][])[0] ?? []).map(message => message.content).join('\n')
      const truth = ((row.joined as { ground_truth?: Record<string, Record<string, unknown[]>>[] } | undefined)?.ground_truth ?? [])[0] ?? {}
      const [name, params] = Object.entries(truth)[0] ?? ['', {}]
      const functions = row.function as unknown[]
      const required = ((functions[0] as { parameters?: { required?: string[] } } | undefined)?.parameters?.required) ?? []
      return task(id, `You are given these function definitions (JSON):\n\n${JSON.stringify(functions, undefined, 2)}\n\nUser request: ${question}\n\nDo not run anything. Decide the one function call that fulfils the request and write it as JSON {"name": "<function>", "arguments": {...}} on the final line. ${ANSWER_LINE.replace('<your answer>', '<the JSON call>')}`,
        { kind: 'bfcl-ast', function: name, params, required })
    },
  },
  'longbench-v2': {
    version: '1',
    source: hf('zai-org/LongBench-v2', 'default', 'train'),
    metric: 'pass',
    judged: false,
    task: ({ id, row }) => task(id, `${choicePrompt(`The file context.txt in the current directory holds a long document. Read it, then answer.\n\n${str(row.question)}`, [str(row.choice_A), str(row.choice_B), str(row.choice_C), str(row.choice_D)])}`,
      { kind: 'answer-choice', answer: str(row.answer) }, [str(row.domain), str(row.difficulty), str(row.length)], { 'context.txt': str(row.context) }),
  },
  'mt-bench': {
    version: '1',
    source: { kind: 'files', revision: '587d5cfa1609a43d192cedb8441cac3c17db105d', files: [{ url: `${FASTCHAT}/mt_bench/question.jsonl`, format: 'jsonl' }], join: { url: `${FASTCHAT}/mt_bench/reference_answer/gpt-4.jsonl`, format: 'jsonl', key: 'question_id' }, extras: [{ name: 'prompts', url: `${FASTCHAT}/judge_prompts.jsonl`, format: 'jsonl' }] },
    metric: 'score',
    judged: true,
    task: ({ id, row }, extras) => {
      const question = str((row.turns as unknown[])[0])
      const withReference = MT_REFERENCE_CATEGORIES.has(str(row.category))
      const prompt = (extras.prompts ?? []).find(entry => entry.name === (withReference ? 'single-math-v1' : 'single-v1'))
      if (prompt === undefined) throw new Error('BENCH_DATASET_SHAPE: judge_prompts.jsonl lacks the single-answer prompts')
      const reference = withReference ? str(((row.joined as { choices?: { turns: unknown[] }[] } | undefined)?.choices?.[0]?.turns ?? [])[0]) : undefined
      return task(id, question, { kind: 'judge-score', system: str(prompt.system_prompt), template: str(prompt.prompt_template), question, ...reference === undefined ? {} : { reference } }, [str(row.category)])
    },
  },
  'lab-bench': {
    version: '1',
    source: { kind: 'hf-rows', parts: ['LitQA2', 'SeqQA', 'ProtocolQA'].map(config => ({ dataset: 'futurehouse/lab-bench', config, split: 'train' })) },
    metric: 'pass',
    judged: false,
    task: ({ id, row }) => {
      const { options, key } = shuffledChoices(str(row.ideal), (row.distractors as unknown[]).map(str), seedOf(id))
      return task(id, choicePrompt(str(row.question), options), { kind: 'answer-choice', answer: key }, [str(row.tag)])
    },
  },
  'chembench': {
    version: '1',
    source: { kind: 'hf-rows', parts: ['analytical_chemistry', 'chemical_preference', 'general_chemistry', 'inorganic_chemistry', 'materials_science', 'organic_chemistry', 'physical_chemistry', 'technical_chemistry', 'toxicity_and_safety'].map(config => ({ dataset: 'jablonkagroup/ChemBench', config, split: 'train' })) },
    metric: 'pass',
    judged: false,
    usable: row => typeof (row.examples as { target_scores?: unknown }[] | undefined)?.[0]?.target_scores === 'string',
    task: ({ id, row }) => {
      const example = (row.examples as { input: string; target_scores: string }[])[0] as { input: string; target_scores: string }
      const scores = JSON.parse(example.target_scores) as Record<string, number>
      const correct = Object.entries(scores).filter(([, score]) => score === 1).map(([text]) => text)
      const { options, key } = shuffledChoices(correct[0] ?? '', Object.keys(scores).filter(text => text !== correct[0]), seedOf(id))
      return task(id, choicePrompt(example.input, options), { kind: 'answer-choice', answer: key }, [str(row.name)])
    },
  },
  'scienceqa': {
    version: '1',
    source: hf('derek-thomas/ScienceQA', 'default', 'test'),
    metric: 'pass',
    judged: false,
    usable: row => row.image === null || row.image === undefined,
    task: ({ id, row }) => {
      const hint = str(row.hint)
      return task(id, choicePrompt(`${hint === '' ? '' : `Context: ${hint}\n\n`}${str(row.question)}`, (row.choices as unknown[]).map(str)),
        { kind: 'answer-choice', answer: letters[Number(row.answer)] ?? '' }, [str(row.subject)])
    },
  },
} satisfies Record<string, BenchmarkAdapter>

const runnable = (id: keyof typeof adapters): CatalogEntry['status'] => ({ kind: 'runnable', adapter: adapters[id] })
const gh = (repo: string) => ({ label: repo, url: `https://github.com/${repo}` })
const hfLink = (dataset: string) => ({ label: dataset, url: `https://huggingface.co/datasets/${dataset}` })
const arxiv = (id: string) => ({ label: `arXiv:${id}`, url: `https://arxiv.org/abs/${id}` })

/** Every catalog row, grouped by category in display order. */
export const CATALOG: readonly CatalogEntry[] = [
  // Agents & tool calling
  { id: 'bfcl-simple', category: 'agent', tier: 'floor', name: 'BFCL v3 · simple', summary: { zh: '伯克利函数调用榜：给定函数定义，写出唯一正确的调用。按 BFCL 的 AST 规则比对函数名和参数。', en: 'Berkeley Function Calling Leaderboard: given function definitions, write the one correct call; graded by BFCL\'s AST rule.' }, source: hfLink('gorilla-llm/Berkeley-Function-Calling-Leaderboard'), paper: { label: 'Gorilla / BFCL', url: 'https://gorilla.cs.berkeley.edu/leaderboard.html' }, license: 'Apache-2.0', status: runnable('bfcl-simple') },
  { id: 'tau2-bench', category: 'agent', tier: 'ceiling', name: 'τ²-bench', summary: { zh: '客服场景下与模拟用户多轮交互、调用业务工具并遵守规则。', en: 'Customer-service domains: talk to a simulated user, call business tools, follow policy.' }, source: gh('sierra-research/tau2-bench'), paper: arxiv('2506.07982'), license: 'MIT', status: { kind: 'blocked', blocker: 'multi-turn' } },
  { id: 'gaia', category: 'agent', tier: 'ceiling', name: 'GAIA', summary: { zh: '需要检索、浏览和工具组合的通用助理问题。', en: 'General-assistant questions that need search, browsing and tool use.' }, source: hfLink('gaia-benchmark/GAIA'), paper: arxiv('2311.12983'), license: 'gated', status: { kind: 'blocked', blocker: 'gated' } },
  { id: 'terminal-bench', category: 'agent', tier: 'ceiling', name: 'Terminal-Bench', summary: { zh: '在终端里完成真实的系统和开发任务。', en: 'Real system and development tasks in a terminal.' }, source: gh('harbor-framework/terminal-bench-1'), license: 'Apache-2.0', status: { kind: 'blocked', blocker: 'docker' } },
  // Programming
  { id: 'humaneval', category: 'coding', tier: 'floor', name: 'HumanEval', summary: { zh: 'OpenAI 的 164 道 Python 函数题，用官方 check() 测试。', en: 'OpenAI\'s 164 Python function problems, checked by the official check().' }, source: hfLink('openai/openai_humaneval'), paper: arxiv('2107.03374'), license: 'MIT', items: 164, status: runnable('humaneval') },
  { id: 'humaneval-plus', category: 'coding', tier: 'floor', name: 'HumanEval+', summary: { zh: 'EvalPlus 给 HumanEval 补充了大量测试，能抓到更多错误解。', en: 'EvalPlus\'s extended HumanEval tests, which catch more wrong solutions.' }, source: hfLink('evalplus/humanevalplus'), paper: arxiv('2305.01210'), license: 'Apache-2.0', items: 164, status: runnable('humaneval-plus') },
  { id: 'mbpp', category: 'coding', tier: 'floor', name: 'MBPP (sanitized)', summary: { zh: 'Google 的入门级 Python 编程题，用数据集自带的断言测试。', en: 'Google\'s entry-level Python problems, checked by the dataset\'s asserts.' }, source: hfLink('google-research-datasets/mbpp'), paper: arxiv('2108.07732'), license: 'CC-BY-4.0', items: 257, status: runnable('mbpp') },
  { id: 'swe-bench-verified', category: 'coding', tier: 'ceiling', name: 'SWE-bench Verified', summary: { zh: '修复真实 GitHub 仓库里的 issue，经人工核验的 500 题。', en: 'Resolve real GitHub issues; 500 human-verified instances.' }, source: hfLink('princeton-nlp/SWE-bench_Verified'), paper: arxiv('2310.06770'), license: 'MIT (repository)', status: { kind: 'blocked', blocker: 'docker' } },
  { id: 'livecodebench', category: 'coding', tier: 'ceiling', name: 'LiveCodeBench', summary: { zh: '持续收集的新竞赛题，避免训练数据污染。', en: 'Continuously collected contest problems that avoid training contamination.' }, source: hfLink('livecodebench/code_generation_lite'), paper: arxiv('2403.07974'), license: 'CC', status: { kind: 'blocked', blocker: 'test-harness' } },
  // General
  { id: 'mmlu-pro', category: 'general', tier: 'floor', name: 'MMLU-Pro', summary: { zh: '14 个学科、10 个选项的加强版 MMLU，更侧重推理。', en: 'A harder MMLU: 14 subjects, 10 options, more reasoning.' }, source: hfLink('TIGER-Lab/MMLU-Pro'), paper: arxiv('2406.01574'), license: 'MIT', items: 12032, status: runnable('mmlu-pro') },
  { id: 'arc-challenge', category: 'general', tier: 'floor', name: 'ARC-Challenge', summary: { zh: 'AI2 的小学科学难题集（检索和共现方法答不对的题）。', en: 'AI2\'s hard grade-school science questions.' }, source: hfLink('allenai/ai2_arc'), paper: arxiv('1803.05457'), license: 'CC-BY-SA-4.0', items: 1172, status: runnable('arc-challenge') },
  { id: 'bbh', category: 'general', tier: 'floor', name: 'BIG-Bench Hard', summary: { zh: 'BIG-Bench 中 27 个最难的多步推理子任务。', en: 'The 27 hardest multi-step reasoning tasks of BIG-Bench.' }, source: hfLink('lukaemon/bbh'), paper: arxiv('2210.09261'), license: 'MIT (source)', items: 6511, status: runnable('bbh') },
  { id: 'simpleqa', category: 'general', tier: 'ceiling', name: 'SimpleQA', summary: { zh: 'OpenAI 的短事实问答，检验知识准确性和「不知道就不答」。', en: 'OpenAI\'s short factual questions; tests accuracy and declining when unsure.' }, source: hfLink('basicv8vc/SimpleQA'), paper: arxiv('2411.04368'), license: 'MIT', items: 4326, caveat: { zh: '由裁判模型按 simple-evals 的官方评分模板判定，裁判费用计入预算。', en: 'Judged with the simple-evals grader template; judge cost counts toward the budget.' }, status: runnable('simpleqa') },
  { id: 'ifeval', category: 'general', tier: 'floor', name: 'IFEval', summary: { zh: '可自动验证的指令遵循（字数、格式、关键词等约束）。', en: 'Verifiable instruction following (length, format, keyword constraints).' }, source: hfLink('google/IFEval'), paper: arxiv('2311.07911'), license: 'Apache-2.0', status: { kind: 'blocked', blocker: 'checkers' } },
  { id: 'ifbench', category: 'general', tier: 'ceiling', name: 'IFBench', summary: { zh: 'AI2 新出的 58 类域外指令约束，检验指令遵循的泛化。', en: 'AI2\'s 58 out-of-domain instruction constraints, testing generalization of instruction following.' }, source: gh('allenai/IFBench'), license: 'Apache-2.0 (repository)', status: { kind: 'blocked', blocker: 'checkers' } },
  { id: 'zebralogic', category: 'general', tier: 'ceiling', name: 'ZebraLogic', summary: { zh: '斑马谜题式的约束满足逻辑推理。', en: 'Zebra-puzzle constraint-satisfaction logic.' }, source: hfLink('allenai/ZebraLogicBench-private'), paper: arxiv('2502.01100'), license: 'gated', status: { kind: 'blocked', blocker: 'gated' } },
  { id: 'gpqa-diamond', category: 'general', tier: 'ceiling', name: 'GPQA Diamond', summary: { zh: '研究生水平、防搜索的物理化学生物题。', en: 'Graduate-level, search-proof science questions.' }, source: hfLink('Idavidrein/gpqa'), paper: arxiv('2311.12022'), license: 'CC-BY-4.0 (gated)', status: { kind: 'blocked', blocker: 'gated' } },
  { id: 'hle', category: 'general', tier: 'ceiling', name: "Humanity's Last Exam", summary: { zh: '各领域专家出的前沿难题。', en: 'Frontier questions written by experts across fields.' }, source: hfLink('cais/hle'), paper: arxiv('2501.14249'), license: 'MIT (gated)', status: { kind: 'blocked', blocker: 'gated' } },
  // Math
  { id: 'gsm8k', category: 'math', tier: 'floor', name: 'GSM8K', summary: { zh: '小学数学应用题，多步算术推理。', en: 'Grade-school math word problems with multi-step arithmetic.' }, source: hfLink('openai/gsm8k'), paper: arxiv('2110.14168'), license: 'MIT', items: 1319, status: runnable('gsm8k') },
  { id: 'math-500', category: 'math', tier: 'floor', name: 'MATH-500', summary: { zh: 'MATH 竞赛题的 500 题代表子集。', en: 'A representative 500-problem subset of the MATH competition set.' }, source: hfLink('HuggingFaceH4/MATH-500'), paper: arxiv('2103.03874'), license: 'MIT (source)', items: 500, status: runnable('math-500') },
  { id: 'aime-2024', category: 'math', tier: 'floor', name: 'AIME 2024', summary: { zh: '美国数学邀请赛 2024 年 30 题，答案为 0–999 的整数。', en: 'The 30 problems of AIME 2024; integer answers 0–999.' }, source: hfLink('HuggingFaceH4/aime_2024'), license: 'not tagged', items: 30, status: runnable('aime-2024') },
  { id: 'aime-2025', category: 'math', tier: 'ceiling', name: 'AIME 2025', summary: { zh: '美国数学邀请赛 2025 年 I、II 两卷共 30 题。', en: 'The 30 problems of AIME 2025 I and II.' }, source: hfLink('opencompass/AIME2025'), license: 'MIT', items: 30, status: runnable('aime-2025') },
  // Multimodal & long context
  { id: 'longbench-v2', category: 'long-context', tier: 'ceiling', name: 'LongBench v2', summary: { zh: '8 千到 200 万词的长文档多选题；文档放进工作区，考察 harness 处理长输入的能力。', en: 'Multiple choice over 8k–2M-word documents; the document goes into the workspace, testing the harness\'s long-input handling.' }, source: hfLink('zai-org/LongBench-v2'), paper: arxiv('2412.15204'), license: 'Apache-2.0', items: 503, caveat: { zh: '单题可能非常贵，预算按实际花费止损。', en: 'Single items can be very expensive; the budget stops on actual spend.' }, status: runnable('longbench-v2') },
  { id: 'aa-lcr', category: 'long-context', tier: 'ceiling', name: 'AA-LCR', summary: { zh: 'Artificial Analysis 的长文档推理题，需要跨多份约 10 万 token 的文档综合作答。', en: 'Artificial Analysis long-context reasoning over sets of documents of about 100k tokens.' }, source: hfLink('ArtificialAnalysis/AA-LCR'), license: 'Apache-2.0', status: { kind: 'blocked', blocker: 'large-data' } },
  { id: 'mmmu', category: 'long-context', tier: 'ceiling', name: 'MMMU', summary: { zh: '大学水平的多学科图文推理题。', en: 'College-level multi-discipline questions over images.' }, source: hfLink('MMMU/MMMU'), paper: arxiv('2311.16502'), license: 'Apache-2.0', status: { kind: 'blocked', blocker: 'images' } },
  { id: 'mathvista', category: 'long-context', tier: 'ceiling', name: 'MathVista', summary: { zh: '基于图表和图形的数学推理。', en: 'Mathematical reasoning over charts and figures.' }, source: hfLink('AI4Math/MathVista'), paper: arxiv('2310.02255'), license: 'CC-BY-SA-4.0', status: { kind: 'blocked', blocker: 'images' } },
  { id: 'ruler', category: 'long-context', tier: 'ceiling', name: 'RULER', summary: { zh: '按指定长度合成的大海捞针、多跳追踪等长上下文任务。', en: 'Synthetic needle, multi-hop tracing and aggregation tasks at chosen lengths.' }, source: gh('NVIDIA/RULER'), paper: arxiv('2404.06654'), license: 'Apache-2.0', status: { kind: 'blocked', blocker: 'generator' } },
  // Preference & arenas
  { id: 'mt-bench', category: 'preference', tier: 'floor', name: 'MT-Bench · first turn', summary: { zh: '80 道写作、角色扮演、推理、编程等开放题，裁判模型按 1–10 分打分。', en: '80 open questions (writing, roleplay, reasoning, coding…), rated 1–10 by a judge model.' }, source: gh('lm-sys/FastChat'), paper: arxiv('2306.05685'), license: 'Apache-2.0', items: 80, caveat: { zh: '用 MT-Bench 的 single-v1 / single-math-v1 裁判提示词，裁判费用计入预算。', en: 'Uses MT-Bench\'s single-v1 / single-math-v1 judge prompts; judge cost counts toward the budget.' }, status: runnable('mt-bench') },
  { id: 'lmarena', category: 'preference', tier: 'ceiling', name: 'LMArena (Chatbot Arena)', summary: { zh: '真人匿名两两投票得出的 Elo 排名。', en: 'Elo ratings from anonymous human pairwise votes.' }, source: { label: 'lmarena.ai', url: 'https://lmarena.ai' }, paper: arxiv('2403.04132'), license: '—', status: { kind: 'reference', blocker: 'human-votes' } },
  { id: 'arena-hard-auto', category: 'preference', tier: 'ceiling', name: 'Arena-Hard-Auto', summary: { zh: '从竞技场难题中挑出的 500 题，裁判与基准模型两两比较。', en: '500 hard arena prompts judged pairwise against a baseline model.' }, source: gh('lmarena/arena-hard-auto'), paper: arxiv('2406.11939'), license: 'Apache-2.0', status: { kind: 'blocked', blocker: 'pairwise' } },
  { id: 'alpacaeval-2', category: 'preference', tier: 'floor', name: 'AlpacaEval 2.0', summary: { zh: '与参考模型两两比较的胜率，含长度校正。', en: 'Length-controlled win rate against a reference model.' }, source: gh('tatsu-lab/alpaca_eval'), license: 'CC-BY-NC-4.0', status: { kind: 'blocked', blocker: 'pairwise' } },
  // Long-horizon
  { id: 'swe-bench-verified-lh', category: 'long-horizon', tier: 'ceiling', name: 'SWE-bench Verified', summary: { zh: '真实仓库修复，常需数十步探索、修改和测试。', en: 'Real repository fixes that take dozens of explore-edit-test steps.' }, source: hfLink('princeton-nlp/SWE-bench_Verified'), paper: arxiv('2310.06770'), license: 'MIT (repository)', status: { kind: 'blocked', blocker: 'docker' } },
  { id: 'swe-bench-pro', category: 'long-horizon', tier: 'ceiling', name: 'SWE-bench Pro', summary: { zh: 'Scale AI 的企业级长程软件工程任务，平均改动多文件。', en: 'Scale AI\'s enterprise-grade long-horizon software tasks spanning many files.' }, source: gh('scaleapi/SWE-bench_Pro-os'), paper: arxiv('2509.16941'), license: 'MIT (repository)', status: { kind: 'blocked', blocker: 'docker' } },
  { id: 'gdpval', category: 'long-horizon', tier: 'ceiling', name: 'GDPval', summary: { zh: 'OpenAI 的 44 个职业真实工作交付物（文档、表格、演示等）。', en: 'OpenAI\'s real work deliverables from 44 occupations (documents, sheets, decks).' }, source: hfLink('openai/gdpval'), paper: arxiv('2510.04374'), license: 'not tagged', status: { kind: 'blocked', blocker: 'expert-grading' } },
  { id: 'theagentcompany', category: 'long-horizon', tier: 'ceiling', name: 'TheAgentCompany', summary: { zh: '模拟软件公司里的真实工作流，跨网页、代码和同事沟通。', en: 'Workflows in a simulated software company across web, code and colleagues.' }, source: gh('TheAgentCompany/TheAgentCompany'), paper: arxiv('2412.14161'), license: 'MIT', status: { kind: 'blocked', blocker: 'docker' } },
  { id: 'osworld', category: 'long-horizon', tier: 'ceiling', name: 'OSWorld', summary: { zh: '在真实操作系统桌面上完成开放任务。', en: 'Open-ended tasks on real operating-system desktops.' }, source: gh('xlang-ai/OSWorld'), paper: arxiv('2404.07972'), license: 'Apache-2.0', status: { kind: 'blocked', blocker: 'docker' } },
  { id: 'metr-horizon', category: 'long-horizon', tier: 'ceiling', name: 'METR time horizon', summary: { zh: '以人类完成时长衡量 AI 能独立完成多长的任务。', en: 'How long a task, in human time, an AI can complete on its own.' }, source: gh('METR/eval-analysis-public'), paper: arxiv('2503.14499'), license: 'not stated', status: { kind: 'blocked', blocker: 'not-public' } },
  // Recursive self-improvement
  { id: 'rsi-exam', category: 'rsi', tier: 'ceiling', name: 'RSI-Exam', summary: { zh: '拿到一个弱方法，自己做实验改进，最后在从未见过的隐藏数据上重放评分。', en: 'Improve a weak method by experiment, then replay it on a sealed split.' }, source: hfLink('RSI-Exam/RSI-Exam'), license: 'MIT', items: 21, caveat: { zh: '公开 35 题（修订 66f5493）中 25 题声明不用 GPU，其中 4 题要在任务内调用模型；只纳入其余 21 题，每题最长 12 小时。公开的最好成绩 0.464 是全部 88 题的均分，不能和这个子集的分数直接比较。', en: 'Of the 35 public tasks (revision 66f5493), 25 declare no GPU and 4 of those call a model from inside the task; only the other 21 are in scope, up to 12 hours each. The best published mean, 0.464, is over all 88 tasks and is not directly comparable to this subset.' }, status: { kind: 'harbor' } },
  // Science
  { id: 'lab-bench', category: 'science', tier: 'ceiling', name: 'LAB-Bench (LitQA2 · SeqQA · ProtocolQA)', summary: { zh: 'FutureHouse 的生物研究实务题：文献、序列分析和实验方案。', en: 'FutureHouse\'s practical biology research questions: literature, sequences and protocols.' }, source: hfLink('futurehouse/lab-bench'), paper: arxiv('2407.10362'), license: 'CC-BY-SA-4.0', items: 907, caveat: { zh: '联网工具默认关闭，LitQA2 测的是记忆而不是检索。', en: 'With web tools off, LitQA2 measures recall rather than retrieval.' }, status: runnable('lab-bench') },
  { id: 'chembench', category: 'science', tier: 'ceiling', name: 'ChemBench · multiple choice', summary: { zh: '化学知识与推理，覆盖分析、有机、物化、毒理等方向。', en: 'Chemistry knowledge and reasoning across analytical, organic, physical, toxicology and more.' }, source: hfLink('jablonkagroup/ChemBench'), paper: arxiv('2404.01475'), license: 'MIT', status: runnable('chembench') },
  { id: 'scienceqa', category: 'science', tier: 'floor', name: 'ScienceQA · text only', summary: { zh: '中小学自然、社会、语言科学题，取无图题。', en: 'School natural, social and language science; items without images.' }, source: hfLink('derek-thomas/ScienceQA'), paper: arxiv('2209.09513'), license: 'CC-BY-SA-4.0', items: 4241, caveat: { zh: '题量为测试集全部题目，其中带图的题不会抽到。', en: 'The count is the whole test split; items with images are never sampled.' }, status: runnable('scienceqa') },
  { id: 'scicode', category: 'science', tier: 'ceiling', name: 'SciCode', summary: { zh: '科学家编写的科研计算编程题。', en: 'Research coding problems written by scientists.' }, source: hfLink('SciCode1/SciCode'), paper: arxiv('2407.13168'), license: 'Apache-2.0', status: { kind: 'blocked', blocker: 'large-data' } },
  // Harness comparison
  { id: 'dsh-native', category: 'harness', tier: 'floor', name: 'DSH native repository tasks', summary: { zh: '本插件自带的多步仓库修复任务（读代码、改代码、跑测试），不是公开基准。', en: 'This plugin\'s own multi-step repository tasks (read, edit, test); not a public benchmark.' }, source: { label: 'incubator/bench/suite', url: 'https://github.com/lisihao/deepseek-solar-harness' }, license: 'MIT', status: { kind: 'bundled' } },
  { id: 'harnessbench', category: 'harness', tier: 'ceiling', name: 'HarnessBench', summary: { zh: '固定底座模型、只换 harness，在 153 个在线任务上比较。方法与本页一致。', en: 'Fixes the base model and varies the harness over 153 online tasks — the same method as this tab.' }, source: gh('reacher-z/HarnessBench'), license: 'Apache-2.0', status: { kind: 'reference', blocker: 'browser' } },
  { id: 'composio-harness', category: 'harness', tier: 'ceiling', name: 'Composio harness bench', summary: { zh: '8 个 harness 在「30 个有状态工具调用任务」上的对比；任务集、重复次数和评分方法未公开，结果无法复现。', en: '8 harnesses on "30 stateful tool-use tasks"; tasks, repetitions and grading are unpublished, so results cannot be reproduced.' }, source: { label: 'composio.dev/bench', url: 'https://composio.dev/bench/harnesses' }, license: '—', status: { kind: 'reference', blocker: 'not-public' } },
  { id: 'hermes-bench-tool-call', category: 'harness', tier: 'ceiling', name: 'hermes-bench-tool-call', summary: { zh: '面向 Hermes Agent 的 61 个确定性工具调用任务。', en: '61 deterministic tool-calling tasks for Hermes Agent.' }, source: gh('am423/hermes-bench-tool-call'), license: 'none', status: { kind: 'reference', blocker: 'no-license' } },
]

/**
 * A catalog row by id.
 * @param id - catalog id.
 * @returns the row, or `undefined`.
 */
export function catalogEntry(id: string): CatalogEntry | undefined {
  return CATALOG.find(entry => entry.id === id)
}

/**
 * How a catalog entry runs relative to the benchmark's own protocol:
 * `faithful` keeps its items and scoring rule, `adapted` changes something
 * (named in {@link ADAPTATIONS}), `diagnostic` is DSH's own task set.
 */
export type ProtocolKind = 'faithful' | 'adapted' | 'diagnostic'

/** Every run goes through the DSH agent with this plugin's prompt, so no score is comparable with a public leaderboard. */
export const PROTOCOL_NOTE: Bilingual = {
  zh: '所有题目都经 DSH agent、按本插件的提示词（最后一行写 ANSWER）作答，成绩不能和公开榜单直接比较。',
  en: 'Every item is answered by the DSH agent with this plugin\'s prompt (a final ANSWER line), so scores do not compare with public leaderboards.',
}

/** Where a runnable entry departs from the benchmark's own protocol, as checked against its source on 2026-10-31. */
export const ADAPTATIONS: Readonly<Record<string, Bilingual>> = {
  'bfcl-simple': { zh: '调用写成最终回答里的 JSON 文本，不经过 DSH 的原生工具通道。', en: 'The call is written as JSON in the final answer, not made through DSH\'s native tool channel.' },
  'mmlu-pro': { zh: '答案取最后一行 ANSWER；官方评测用自己的提示词和答案抽取规则。', en: 'The answer is read from a final ANSWER line; the official evaluation uses its own prompt and extraction rule.' },
  'math-500': { zh: '等价判断是规范化后比字符串或数值，比官方的符号等价严，会少算一些对的答案。', en: 'Equivalence is a normalized string or numeric match, stricter than the official symbolic check, so some right answers count as wrong.' },
  'simpleqa': { zh: '裁判是所选的 DeepSeek 模型；simple-evals 在固定版本里用 gpt-4.1-2025-04-14 评分。', en: 'The judge is the chosen DeepSeek model; simple-evals grades with gpt-4.1-2025-04-14 at the pinned commit.' },
  'mt-bench': { zh: '只跑第一轮；裁判是所选的 DeepSeek 模型，官方用 GPT-4。', en: 'First turn only; the judge is the chosen DeepSeek model, where the official setup uses GPT-4.' },
  'longbench-v2': { zh: '长文写进工作区的文件，让 agent 自己去读，而不是直接放进提示词。', en: 'The long text is written to a workspace file for the agent to read, instead of being placed in the prompt.' },
  'chembench': { zh: '只跑选择题；按误差评分的数值题没有接入。', en: 'Multiple-choice items only; numeric items scored by error are not run.' },
  'scienceqa': { zh: '只跑不带图片的题。', en: 'Text-only items only.' },
  'rsi-exam': { zh: '只纳入不用 GPU、也不在任务内调用模型的 21 题。', en: 'Only the 21 tasks that need no GPU and call no model inside the task.' },
}

/**
 * The protocol kind of a catalog entry.
 * @param entry - the entry.
 * @returns faithful, adapted or diagnostic.
 */
export function protocolOf(entry: CatalogEntry): ProtocolKind {
  if (entry.status.kind === 'bundled') return 'diagnostic'
  return ADAPTATIONS[entry.id] === undefined ? 'faithful' : 'adapted'
}

/**
 * What one experiment's result stands for: every item under the benchmark's
 * own rule (`full`), a sample of them (`subset`), a sample of a set whose total
 * is not verified (`sampled`), a changed protocol (`adapted`), or DSH's own
 * tasks (`diagnostic`).
 */
export type ResultProtocol = 'full' | 'subset' | 'sampled' | 'adapted' | 'diagnostic'

/**
 * The protocol identity of an experiment's result.
 * @param entry - its catalog entry, when the benchmark is still listed.
 * @param tasks - items the experiment ran.
 * @returns the identity.
 */
export function resultProtocol(entry: CatalogEntry | undefined, tasks: number): ResultProtocol {
  if (entry === undefined) return 'sampled'
  const kind = protocolOf(entry)
  if (kind !== 'faithful') return kind
  if (entry.items === undefined) return 'sampled'
  return tasks >= entry.items ? 'full' : 'subset'
}

/**
 * The suite of one runnable catalog row: its tasks are the rows an
 * experiment pinned, read back from the dataset cache. Without an
 * experiment it lists no tasks, because the population is never loaded whole.
 * @param entry - a runnable row.
 * @param datasets - the dataset cache.
 * @returns the suite.
 */
export function datasetSuite(entry: CatalogEntry & { status: { kind: 'runnable' } }, datasets: DatasetStore): BenchSuite {
  const { adapter } = entry.status
  return {
    id: entry.id,
    version: `adapter-${adapter.version}`,
    description: entry.summary.en,
    async load(_signal, experiment) {
      if (experiment?.benchmark === undefined) return []
      const ids = experiment.tasks ?? []
      const rows = await datasets.rows(entry.id, experiment.benchmark.revision, ids)
      const extras = await datasets.extras(entry.id, experiment.benchmark.revision)
      return rows.map(row => adapter.task(row, extras))
    },
  }
}

/**
 * Suites of every runnable catalog row.
 * @param datasets - the dataset cache.
 * @returns the suites.
 */
export function datasetSuites(datasets: DatasetStore): BenchSuite[] {
  return CATALOG.flatMap(entry => entry.status.kind === 'runnable' ? [datasetSuite(entry as CatalogEntry & { status: { kind: 'runnable' } }, datasets)] : [])
}
