import rollupPluginCommonjs from "@rollup/plugin-commonjs"
import rollupPluginJson from "@rollup/plugin-json"
import rollupPluginNodeResolve from "@rollup/plugin-node-resolve"
import builtins from "builtin-modules"
import * as path from "path"
import { rollup, RollupWarning } from "rollup"

function isCircDepWarnFromThirdPartyDep(warning: RollupWarning): boolean {
  if (process.env.DEBUG) return false
  if (warning.code !== "CIRCULAR_DEPENDENCY") return false
  if (warning.importer?.includes("node_modules")) return true
  return false
}

function isEvalWarnFromThirdPartyDep(warning: RollupWarning): boolean {
  if (process.env.DEBUG) return false
  if (warning.code !== "EVAL") return false
  if (warning.id?.includes("node_modules")) return true
  return false
}

rollup({
  onwarn(warning, warn) {
    // console.log(warning)
    if (isCircDepWarnFromThirdPartyDep(warning)) return
    if (isEvalWarnFromThirdPartyDep(warning)) return
    warn(warning)
  },
  input: path.join(process.cwd(), "node_modules", ".build", "index.js"),
  treeshake: true,
  external: [...builtins],
  plugins: [
    rollupPluginJson(),
    rollupPluginNodeResolve(),
    rollupPluginCommonjs({
      namedExports: {
        "nexus/dist/index.js": ["schema", "settings"],
      },
      // dynamicRequireTargets: ["pino-pretty"],
      ignore: ["pino-pretty", "@microsoft/typescript-etw", "prettier"],
    }),
  ],
})
  .then((rolledup) => {
    console.log("rolled up")
    return rolledup.write({
      file: path.join(process.cwd(), "dist-bundle", "bundle.js"),
      format: "commonjs",
      // dir: path.join(program.getCompilerOptions().outDir!, ".."),
    })
  })
  .then((rolledout) => {
    console.log("done")
  })
  .catch(console.error)
