// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol"; // Import the MerkleProof contract

contract MAXIsERC20 is ERC20, Ownable {
    bytes32 public merkleRoot; // Define a public variable to store the Merkle root hash
    uint256 private constant MINT_AMOUNT = 2 ether; // Define the amount of tokens to mint

    mapping(address => bool) private hasMinted; // Define a mapping to store whether an address has minted tokens

    constructor(
        address _initialOwner,
        bytes32 _merkleRoot
    ) ERC20("MAX A. Token", "MAX") Ownable(_initialOwner) {
        merkleRoot = _merkleRoot; // Set the Merkle root
    }

    /**
     * @notice change the Merkle root
     * @param _merkleRoot The new Merkle root
     */
    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot; // Set the Merkle root
    }

    /**
     * @notice check if an address is whitelisted or not
     * @param _account The address to check
     * @param _proof The Merkle proof
     * @return true if the address is whitelisted, false otherwise
     */

    function isWhitelisted(
        address _account,
        bytes32[] calldata _proof
    ) internal view returns (bool) {
        bytes32 leaf = keccak256(abi.encode(keccak256(abi.encode(_account)))); // Hash the address
        return MerkleProof.verify(_proof, merkleRoot, leaf); // Verify the Merkle proof
    }

    /**
     * @notice Allows a whitelisted address to mint tokens
     * @param _to The token receiver
     * @param _proof The Merkle proof
     */

    function mint(address _to, bytes32[] calldata _proof) external {
        require(
            isWhitelisted(msg.sender, _proof),
            "MAXIsERC20: Address is not whitelisted"
        );
        require(
            !hasMinted[msg.sender],
            "MAXIsERC20: Address has already minted tokens"
        );
        hasMinted[msg.sender] = true; // Mark the address as having minted tokens
        _mint(_to, MINT_AMOUNT); // Mint tokens
    }
}
