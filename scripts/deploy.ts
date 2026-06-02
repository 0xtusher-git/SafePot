import hre from "hardhat";

async function main() {
  const { ethers } = await hre.network.create();
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Hardcoded USDC contract address for Arc Testnet
  const usdcAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
  
  console.log("Using USDC address:", usdcAddress);

  const SafePot = await ethers.getContractFactory("SafePot");
  const safePot = await SafePot.deploy(usdcAddress);

  await safePot.waitForDeployment();

  const contractAddress = await safePot.getAddress();
  console.log("SafePot deployed to:", contractAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
