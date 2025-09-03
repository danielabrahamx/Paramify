import { JsonRpcProvider, Wallet, parseEther, Contract } from "ethers";
import { readFileSync } from "fs";

async function main() {
  const provider = new JsonRpcProvider("http://127.0.0.1:8545");
  const deployerPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const wallet = new Wallet(deployerPrivateKey, provider);
  const { Paramify } = JSON.parse(readFileSync("deployed-addresses.json", "utf8"));

  const tx = await wallet.sendTransaction({ to: Paramify, value: parseEther("2") });
  await tx.wait();
  console.log("Funded Paramify with 2 ETH:", tx.hash);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


