import { JsonRpcProvider, Wallet, ContractFactory } from "ethers";
import { writeFileSync, readFileSync } from "fs";

async function main() {
  const provider = new JsonRpcProvider("http://127.0.0.1:8545");

  const deployerPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const wallet = new Wallet(deployerPrivateKey, provider);
  console.log("Deploying with:", await wallet.getAddress());

  const mockArtifact = JSON.parse(readFileSync("artifacts/contracts/mocks/MockV3Aggregator.sol/MockV3Aggregator.json", "utf8"));
  const paramifyArtifact = JSON.parse(readFileSync("artifacts/contracts/Paramify.sol/Paramify.json", "utf8"));

  const MockFactory = new ContractFactory(mockArtifact.abi, mockArtifact.bytecode, wallet);
  const mock = await MockFactory.deploy(8, 2000n * 10n ** 8n);
  await mock.waitForDeployment();
  const mockAddress = await mock.getAddress();
  console.log("MockV3Aggregator:", mockAddress);

  const ParamifyFactory = new ContractFactory(paramifyArtifact.abi, paramifyArtifact.bytecode, wallet);
  const paramify = await ParamifyFactory.deploy(mockAddress);
  await paramify.waitForDeployment();
  const paramifyAddress = await paramify.getAddress();
  console.log("Paramify:", paramifyAddress);

  writeFileSync("deployed-addresses.json", JSON.stringify({ Paramify: paramifyAddress, MockV3Aggregator: mockAddress, network: "localhost" }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


