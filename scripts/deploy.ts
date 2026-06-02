import hre from "hardhat";

async function main() {
  const { ethers } = await hre.network.create();
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  
  if (!deployer) {
    throw new Error("No deployer account found! Please add your PRIVATE_KEY to the .env file.");
  }
  
  console.log("Deploying contracts with the account:", deployer.address);

  // Arc Testnet: USDC is the native gas token, exposed as ERC-20 via precompile.
  const usdcAddress = "0x3600000000000000000000000000000000000000";
  
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
