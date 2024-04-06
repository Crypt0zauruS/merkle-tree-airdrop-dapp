import { ethers } from "hardhat";

// Types
import { MAXIsERC20 } from "../typechain-types"; // Import the typechain type
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

// Whitelisted addresses
import { whitelisted } from "../utils/whitelisted";

async function main() {
  let contract: MAXIsERC20;
  let merkleTree: StandardMerkleTree<string[]>;
  merkleTree = StandardMerkleTree.of(whitelisted, ["address"], {
    sortLeaves: true,
  });

  const [owner] = await ethers.getSigners(); // connect() not needed as owner is default signer
  contract = await ethers.deployContract("MAXIsERC20", [
    owner.address,
    merkleTree.root,
  ]);

  await contract.waitForDeployment();
  console.log(
    `Contract deployed to: ${contract.target} with merkle root: ${merkleTree.root}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
