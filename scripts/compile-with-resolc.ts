/**
 * Compile all Solidity contracts under ./contracts using @parity/resolc
 * and emit Hardhat-compatible artifacts into ./artifacts/contracts/**.
 *
 * Output JSON strictly follows Hardhat's "hh-sol-artifact-1" schema
 * with required bytecode fields so Ignition can deploy.
 */

import { compile } from "@parity/resolc";
import { promises as fs } from "fs";
import * as path from "path";

type SourceUnit = { content: string };
type SourcesMap = Record<string, SourceUnit>;

const ROOT = process.cwd();
const CONTRACTS_DIR = path.join(ROOT, "contracts");
const ARTIFACTS_DIR = path.join(ROOT, "artifacts", "contracts");

// Contracts that should be deployable (require non-empty bytecode)
const DEPLOYABLE_SET = new Set<string>([
  "Paramify",
  "MockV3Aggregator",
  "SimpleTest",
  "MinimalTest",
  "MinimalTestContract",
  "Lock",
]);

async function collectSolFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const solFiles: string[] = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) solFiles.push(...(await collectSolFiles(full)));
    else if (e.isFile() && e.name.endsWith(".sol")) solFiles.push(full);
  }
  return solFiles;
}

async function buildSourcesMap(files: string[]): Promise<SourcesMap> {
  const sources: SourcesMap = {};
  for (const f of files) {
    const relFromRoot = path.relative(ROOT, f).replace(/\\/g, "/");
    const content = await fs.readFile(f, "utf8");
    sources[relFromRoot] = { content };
  }
  return sources;
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

// Normalize various resolc output shapes into bytes
function extractBytecodeFields(c: any) {
  // resolc may emit bytecode in different locations; try all known shapes
  const rawBytecode =
    c?.evm?.bytecode?.object ??
    c?.bytecode?.object ??
    c?.bytecode ??
    c?.bin ??
    "";

  const rawDeployedBytecode =
    c?.evm?.deployedBytecode?.object ??
    c?.deployedBytecode?.object ??
    c?.deployedBytecode ??
    "";

  return {
    bytecode: normalizeHex(rawBytecode),
    deployedBytecode: normalizeHex(rawDeployedBytecode),
  };
}

function normalizeHex(v: any): string {
  if (typeof v !== "string" || v.length === 0) return "0x";
  const hex = v.startsWith("0x") ? v : `0x${v}`;
  return hex.toLowerCase();
}

function ensureDeployableBytecode(contractName: string, bytecode: string): string {
  // Some interfaces or abstract contracts will have "0x"
  // For deployable contracts ensure we did get non-empty bytecode
  if (DEPLOYABLE_SET.has(contractName) && (bytecode === "0x" || bytecode === "0x0")) {
    throw new Error(`Missing bytecode for deployable contract ${contractName}. Check resolc output mapping.`);
  }
  return bytecode;
}

async function writeArtifacts(out: any) {
  const contracts = out?.contracts || {};
  const compilerVersion = out?.version || "0.8.x";

  for (const sourceName of Object.keys(contracts)) {
    const contractMap = contracts[sourceName];

    const relFromContracts = sourceName.startsWith("contracts/")
      ? sourceName.substring("contracts/".length)
      : path.basename(sourceName);

    for (const contractName of Object.keys(contractMap)) {
      const c = contractMap[contractName];

      const abi = c?.abi ?? c?.ABI ?? [];
      const { bytecode, deployedBytecode } = extractBytecodeFields(c);

      const finalBytecode = ensureDeployableBytecode(contractName, bytecode);

      const metadata = c?.metadata ? tryParseJSON(c.metadata) : undefined;

      const artifact = {
        _format: "hh-sol-artifact-1",
        contractName,
        sourceName,
        abi,
        bytecode: finalBytecode,
        deployedBytecode: deployedBytecode || "0x",
        linkReferences: {},
        deployedLinkReferences: {},
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        compiler: {
          name: "resolc",
          version: compilerVersion,
        },
      };

      const artifactDir = path.join(ARTIFACTS_DIR, path.dirname(relFromContracts));
      const artifactPath = path.join(artifactDir, `${contractName}.json`);
      await ensureDir(artifactDir);
      await fs.writeFile(artifactPath, JSON.stringify(artifact, null, 2), "utf8");
      console.log(`✓ Wrote artifact: ${path.relative(ROOT, artifactPath)}`);
    }
  }
}

function tryParseJSON(s?: string): any | undefined {
  if (!s) return undefined;
  try {
    return JSON.parse(s);
  } catch {
    return undefined;
  }
}

async function main() {
  console.log("🔧 Compiling contracts with @parity/resolc ...");

  await ensureDir(ARTIFACTS_DIR);
  const files = await collectSolFiles(CONTRACTS_DIR);
  if (files.length === 0) {
    console.log("No .sol files found under ./contracts");
    return;
  }

  const sources = await buildSourcesMap(files);

  const out = await compile(sources);

  await writeArtifacts(out);

  console.log("✅ Resolc compilation completed.");
}

main().catch((err) => {
  console.error("❌ Resolc compilation failed:", err);
  process.exit(1);
});