import { ethers } from "hardhat";

async function main() {
  const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // Arc Testnet USDC

  console.log("Deploying SafePot contract...");
  const SafePot = await ethers.getContractFactory("SafePot");
  
  // Deploy the contract with USDC address
  const safePot = await SafePot.deploy(USDC_ADDRESS);
  await safePot.waitForDeployment();

  const address = await safePot.getAddress();
  console.log(`SafePot deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
