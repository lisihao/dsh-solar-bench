/**
 * Command-line entry. The desktop profile installs plugins without their
 * `@deepseek-ai/*` peers (the app shares its own copies), so a plain `node`
 * process cannot resolve them from the plugin directory. This bootstrap adds
 * a resolve hook that retries those specifiers from the host module tree —
 * the official app's bundled runtime by default, or `DSH_SOLAR_BENCH_HOST_MODULES`
 * — and then loads the real command.
 * @module @lisihao/dsh-solar-bench/cli
 */
export {};
