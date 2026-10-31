/**
 * Driver providers a benchmark run can use besides the built-in DeepSeek
 * models: OpenAI-compatible routes configured in the source profile's
 * `llm-pi-ai` row (local models), and providers registered by installed
 * plugins. A run home starts empty, so a route's configuration travels in a
 * generated patch and its key in the child's environment only.
 * @module @lisihao/dsh-solar-bench/providers
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parse, stringify } from 'yaml'
import type { Bilingual } from './catalog.js'

/** How a driver's model is billed, which decides whether the budget can see it. */
export type DriverBilling =
  /** Priced per token from the price table. */
  | 'tokens'
  /** A self-hosted model; no per-token charge once the user says so. */
  | 'unbilled'
  /** A subscription account: each item spends subscription quota the budget cannot see. */
  | 'subscription'

/** One driver model the form offers. */
export interface DriverOption {
  /** Provider route of the `agent-default-model` row. */
  provider: string
  /** Model id. */
  model: string
  /** Display name. */
  label: string
  /** Where the route comes from. */
  source: 'builtin' | 'pi-ai' | 'plugin'
  /** Billing. */
  billing: DriverBilling
  /** Environment variable the route reads its key from, when it has one. */
  keyEnv?: string
  /** Plugin package that registers the route, for plugin providers. */
  plugin?: string
  /** What the user must accept before a run, for subscription providers. */
  acknowledge?: Bilingual
  /** Why this provider cannot drive a run here; absent when it can. */
  blocked?: Bilingual
}

/** A plugin that registers an LLM provider route. */
export interface ProviderPlugin {
  /** Provider route. */
  provider: string
  /** Package name. */
  plugin: string
  /** Display name of the provider. */
  label: string
  /** Billing. */
  billing: DriverBilling
  /** What the user must accept before a run. */
  acknowledge?: Bilingual
  /** Why it cannot drive a run here. */
  blocked?: Bilingual
}

const CODEX_BLOCKED: Bilingual = {
  zh: '它的 OAuth 凭据在 DSH 凭据库里，运行中会被刷新；复制进跑分环境可能让桌面端的登录失效，直接共用凭据库又会让每次运行都能读写全部已存密钥。等维护者决定后再开放。',
  en: 'Its OAuth credential lives in the DSH credential store and is refreshed while it runs; copying it into run homes can invalidate the desktop login, and sharing the store gives every run read/write access to every stored key. Not enabled until the maintainer decides.',
}

/** Provider plugins known on 2026-10-29 (route ids read from each installed package's `lib`). */
export const DEFAULT_PROVIDER_PLUGINS: readonly ProviderPlugin[] = [
  {
    provider: 'solar-chatgpt-web',
    plugin: '@lisihao/dsh-solar-chatgpt-web',
    label: 'ChatGPT Web',
    billing: 'subscription',
    acknowledge: {
      zh: '每道题都会在你的 ChatGPT 账号里真实发起一次网页对话，消耗订阅额度；预算管不到这部分。',
      en: 'Every item posts a real conversation in your ChatGPT account and spends subscription quota; the budget does not cover it.',
    },
  },
  { provider: 'openai-codex', plugin: 'dsh-codex-subscription', label: 'Codex', billing: 'subscription', blocked: CODEX_BLOCKED },
  { provider: 'grok-build', plugin: 'dsh-grok-subscription', label: 'Grok', billing: 'subscription', blocked: { zh: CODEX_BLOCKED.zh.replace('OAuth 凭据', '账号凭据'), en: CODEX_BLOCKED.en.replace('OAuth credential', 'account credential') } },
]

/** A `!!js` expression of a profile patch, kept as its source text and never evaluated here. */
export class JsExpression {
  constructor(readonly source: string) {}
}

/** Round-trips `!!js` values: read as {@link JsExpression}, written back with the same tag. */
const JS_TAG = {
  tag: 'tag:yaml.org,2002:js',
  identify: (value: unknown) => value instanceof JsExpression,
  resolve: (value: string) => new JsExpression(value),
  stringify: (item: { value?: unknown }) => (item.value as JsExpression).source,
}

/** Rows every group of an experiment shares and a plugin's bundle patch may not set: the driver model, the web-tool switch and the skill loader. */
export const PROTECTED_ROWS: readonly string[] = ['agent-default-model', 'tool-web', 'skill-filesystem']

/**
 * The protected rows a bundle patch sets, wherever they sit: bundle patches nest rows under operations such as `insert:`.
 * @param file - the patch file.
 * @returns the row ids found, in file order, each once.
 */
export async function protectedRowsIn(file: string): Promise<string[]> {
  const found = new Set<string>()
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const entry of value) walk(entry)
      return
    }
    if (value === null || typeof value !== 'object' || value instanceof JsExpression) return
    const id = (value as PatchRow).id
    if (typeof id === 'string' && PROTECTED_ROWS.includes(id)) found.add(id)
    for (const entry of Object.values(value)) walk(entry)
  }
  walk(parse(await readFile(file, 'utf8'), { customTags: [JS_TAG] }) as unknown)
  return [...found]
}

/** One row of a profile patch. */
export interface PatchRow {
  id?: string
  name?: string
  disabled?: unknown
  config?: Record<string, unknown>
  [field: string]: unknown
}

/**
 * Rows of a profile's user patch layer.
 * @param profileDir - the profile directory.
 * @returns the rows; empty when the file is absent or not a list.
 */
export async function readProfilePatch(profileDir: string): Promise<PatchRow[]> {
  let text
  try {
    text = await readFile(join(profileDir, 'cordis.patch.yml'), 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
  const value = parse(text, { customTags: [JS_TAG] }) as unknown
  return Array.isArray(value) ? value.filter((row): row is PatchRow => row !== null && typeof row === 'object') : []
}

/** One OpenAI-compatible route of the `llm-pi-ai` row. */
export interface PiAiRoute {
  id: string
  config: Record<string, unknown>
}

/**
 * The `llm-pi-ai` routes of a profile patch.
 * @param rows - the patch rows.
 * @returns the routes in file order.
 */
export function piAiRoutes(rows: readonly PatchRow[]): PiAiRoute[] {
  const routes: PiAiRoute[] = []
  for (const row of rows) {
    if (row.id !== 'llm-pi-ai' || row.disabled === true) continue
    const providers = row.config?.providers
    if (providers === null || typeof providers !== 'object') continue
    for (const [id, config] of Object.entries(providers as Record<string, unknown>)) {
      if (config !== null && typeof config === 'object') routes.push({ id, config: config as Record<string, unknown> })
    }
  }
  return routes
}

const INLINE_KEY: Bilingual = {
  zh: '这个路由把密钥直接写在配置里；跑分只经环境变量传密钥，不会把它写进运行目录，所以不能用。请改用 apiKeyEnv。',
  en: 'This route keeps its key inline in the config; runs pass keys only through the environment and never write them into run homes, so it cannot be used. Use apiKeyEnv.',
}

/**
 * Driver options of the `llm-pi-ai` routes.
 * @param routes - the routes.
 * @returns one option per configured model.
 */
export function piAiOptions(routes: readonly PiAiRoute[]): DriverOption[] {
  return routes.flatMap((route) => {
    const label = typeof route.config.displayName === 'string' ? route.config.displayName : route.id
    const keyEnv = typeof route.config.apiKeyEnv === 'string' ? route.config.apiKeyEnv : undefined
    const inline = Object.keys(route.config).some(key => /^(apiKey|key|token|authorization|headers)$/i.test(key))
    const models = Array.isArray(route.config.models) ? route.config.models : []
    return models.flatMap((entry): DriverOption[] => {
      const model = typeof entry === 'string' ? entry : (entry as { id?: unknown } | null)?.id
      if (typeof model !== 'string' || model === '') return []
      return [{
        provider: route.id,
        model,
        label: `${label} · ${model}`,
        source: 'pi-ai',
        billing: 'unbilled',
        ...keyEnv === undefined ? {} : { keyEnv },
        ...inline ? { blocked: INLINE_KEY } : {},
      }]
    })
  })
}

/**
 * The patch carrying one `llm-pi-ai` route into a run profile.
 * @param route - the route.
 * @returns patch YAML.
 */
export function piAiPatch(route: PiAiRoute): string {
  const row = { id: 'llm-pi-ai', name: '@deepseek-ai/dsh-llm-pi-ai', config: { providers: { [route.id]: route.config } } }
  return `# Generated by @lisihao/dsh-solar-bench: the driver's OpenAI-compatible route, copied from the source profile.\n${stringify([row], { customTags: [JS_TAG] })}`
}

/**
 * The source profile's own rows for a plugin, so its configuration travels with it.
 * @param rows - the source profile's patch rows.
 * @param plugin - package name.
 * @returns the rows naming that package.
 */
export function pluginRows(rows: readonly PatchRow[], plugin: string): PatchRow[] {
  return rows.filter(row => row.name === plugin && row.disabled !== true)
}

/**
 * A patch with the given rows.
 * @param rows - rows to write.
 * @param note - comment line.
 * @returns patch YAML, or an empty list when there are none.
 */
export function rowsPatch(rows: readonly PatchRow[], note: string): string {
  return `# Generated by @lisihao/dsh-solar-bench: ${note}\n${rows.length === 0 ? '[]\n' : stringify(rows, { customTags: [JS_TAG] })}`
}
