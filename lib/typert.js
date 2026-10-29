// src/remote.ts
var PKG = "@lisihao/dsh-solar-bench";
var codec = (typeSymbol) => {
  const schema = { parse: (value) => value };
  return {
    mode: "strict",
    typeSymbol: `${PKG}#${typeSymbol}`,
    schema,
    create: () => schema,
    decode: (value) => value,
    encode: (value) => value
  };
};
var RPC_REMOTE = {
  package: PKG,
  descriptors: [
    {
      id: `${PKG}#solarBenchLedgers/list`,
      service: "solarBenchLedgers",
      namespace: "solarBenchLedgers",
      method: "list",
      invocation: { kind: "direct" },
      parameters: [],
      result: codec("BenchExperimentList")
    },
    {
      id: `${PKG}#solarBenchLedgers/detail`,
      service: "solarBenchLedgers",
      namespace: "solarBenchLedgers",
      method: "detail",
      invocation: { kind: "direct" },
      parameters: [{ name: "input", wire: "input", source: "json", codec: codec("BenchDetailInput") }],
      result: codec("BenchExperimentDetail")
    },
    ...[
      ["choices", void 0, "BenchRunChoices"],
      ["catalog", void 0, "BenchCatalog"],
      ["start", "BenchStartInput", "BenchStartResult"],
      ["status", void 0, "BenchJobStatus"],
      ["stop", void 0, "BenchJobStatus"]
    ].map(([method, input, result]) => ({
      id: `${PKG}#solarBenchRuns/${method}`,
      service: "solarBenchRuns",
      namespace: "solarBenchRuns",
      method,
      invocation: { kind: "direct" },
      parameters: input === void 0 ? [] : [{ name: "input", wire: "input", source: "json", codec: codec(input) }],
      result: codec(result)
    }))
  ]
};

// src/typert.ts
var TYPERT = {
  package: RPC_REMOTE.package,
  face: "host",
  schemas: [],
  model: { services: [
    { key: "solarBenchLedgers", exportName: "BenchLedgersControl", summary: "Benchmark experiments", jsDoc: "List experiment ledgers and read one experiment with its analysis." },
    { key: "solarBenchRuns", exportName: "BenchRunsControl", summary: "Benchmark runs", jsDoc: "Start, observe and stop one experiment at a time." }
  ].map((service) => ({ ...service, tags: [], description: "Owner-only benchmark controls", members: RPC_REMOTE.descriptors.filter((value) => value.service === service.key).map((value) => ({ name: value.method, kind: "method", signature: "(input?: unknown): Promise<unknown>" })), types: [] })), events: [], objects: [] },
  invocations: RPC_REMOTE.descriptors
};
export {
  TYPERT
};
//# sourceMappingURL=typert.js.map
