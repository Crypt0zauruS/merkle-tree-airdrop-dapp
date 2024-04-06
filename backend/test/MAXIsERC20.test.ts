import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect, assert } from "chai";
import { ethers } from "hardhat";

// Types
import { MAXIsERC20 } from "../typechain-types"; // Import the typechain type
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"; // Import the SignerWithAddress type
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

// Whitelisted addresses
import { whitelisted } from "../utils/whitelisted";

describe("MAXIsERC20 Tests", function () {
  let contract: MAXIsERC20;
  let owner: SignerWithAddress; // hardhat account 0, whitelisted
  let addr1: SignerWithAddress; // hardhat account 1, whitelisted
  let addr2: SignerWithAddress; // hardhat account 2, not whitelisted

  let merkleTree: StandardMerkleTree<string[]>;

  // Load the fixture
  async function deployContractFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    // merkle tree creation
    merkleTree = StandardMerkleTree.of(whitelisted, ["address"], {
      sortLeaves: true,
    });

    // Deploy the contract
    const contractFactory = await ethers.getContractFactory("MAXIsERC20");
    const contract = await contractFactory.deploy(
      owner.address,
      merkleTree.root
    );
    return { contract, merkleTree, owner, addr1, addr2 };
  }

  // deployment test
  describe("Deployment", function () {
    it("Should deploy the contract", async function () {
      const { contract, merkleTree, owner, addr1, addr2 } = await loadFixture(
        deployContractFixture
      );
      let contractMerkleTreeRoot = await contract.merkleRoot();
      assert(contractMerkleTreeRoot === merkleTree.root);
      let contractOwner = await contract.owner();
      assert(contractOwner === owner.address);
    });
  });

  describe("Mint", function () {
    it("Should not mint if not whitelisted | @openzeppelin/merkle-tree library test", async function () {
      const { contract, merkleTree, owner, addr1, addr2 } = await loadFixture(
        deployContractFixture
      );
      try {
        merkleTree.getProof([addr2.address]);
        expect.fail(
          "Expected an error 'Error: Leaf is not in tree' but none was thrown"
        );
      } catch (error) {
        const err = error as Error;
        expect(err.message).to.include("Leaf is not in tree");
      }
    });

    // test with an empty proof
    it("Should not mint if not whitelisted | contract test", async function () {
      const { contract, merkleTree, owner, addr1, addr2 } = await loadFixture(
        deployContractFixture
      );
      const proof: string[] = [];
      await expect(
        contract.connect(addr2).mint(addr2.address, proof)
      ).to.be.revertedWith("MAXIsERC20: Address is not whitelisted");
    });

    it("Should not mint tokens if tokens already minted", async function () {
      const { contract, merkleTree, owner, addr1, addr2 } = await loadFixture(
        deployContractFixture
      );
      const proof = merkleTree.getProof([addr1.address]);
      await contract.connect(addr1).mint(addr1.address, proof);
      await expect(
        contract.connect(addr1).mint(addr1.address, proof)
      ).to.be.revertedWith("MAXIsERC20: Address has already minted tokens");
    });

    it("Should mint tokens if whitelisted and not minted yet", async function () {
      const { contract, merkleTree, owner, addr1, addr2 } = await loadFixture(
        deployContractFixture
      );
      const proof = merkleTree.getProof([addr1.address]);
      await contract.connect(addr1).mint(addr1.address, proof);
      let balance = await contract.balanceOf(addr1.address);
      let expectedBalance = ethers.parseEther("2");
      assert(balance === expectedBalance);
    });
  });

  // set Merkle Root
  describe("setMerkleRoot", function () {
    it("Should not set merkle root if not owner", async function () {
      const { contract, merkleTree, owner, addr1, addr2 } = await loadFixture(
        deployContractFixture
      );
      await expect(
        contract.connect(addr1).setMerkleRoot(merkleTree.root)
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });

    it("Should set merkle root if owner", async function () {
      const { contract, merkleTree, owner, addr1, addr2 } = await loadFixture(
        deployContractFixture
      );
      // ask chatGPT to generate a random merkle tree root
      let newMerkleRoot =
        "0x5d06f4568574ffdc51d5e615b78a5a5899c6c2015aefde3703922ad5e33d1b4b";
      await contract.setMerkleRoot(newMerkleRoot);
      let contractMerkleRoot = await contract.merkleRoot();
      assert(contractMerkleRoot === newMerkleRoot);
    });
  });
});
