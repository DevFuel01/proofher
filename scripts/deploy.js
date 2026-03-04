const hre = require("hardhat");

async function main() {
  const ProofHer = await hre.ethers.deployContract("ProofHer");

  await ProofHer.waitForDeployment();

  console.log(
    `ProofHer contract deployed to ${ProofHer.target}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
