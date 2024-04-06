"use client";
import { useState, useEffect, use } from "react";
import {
  Flex,
  Text,
  Button,
  Spinner,
  useToast,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";

import {
  useAccount,
  useReadContract,
  type BaseError,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";

import { contractAddress, contractAbi, whitelisted } from "@/constants";

import { formatEther } from "viem";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

const Mint = () => {
  const { address } = useAccount();
  const toast = useToast();

  const [merkleProof, setMerkleProof] = useState<string[]>([]);
  const [merkleError, setMerkleError] = useState<string>("");

  // the total amount of tokens airdropped
  const {
    data: totalSupply,
    isLoading: totalSupplyLoading,
    refetch: refetchTotalSupply,
  } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: "totalSupply",
    account: address,
  });

  const formatTotalSupply = (supply: bigint | undefined) => {
    if (supply !== undefined) {
      return formatEther(supply);
    }
    return "0";
  };

  const {
    data: hash,
    error: airdropError,
    isPending,
    writeContract,
  } = useWriteContract();

  const getAirDrop = async () => {
    writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: "mint",
      account: address,
      args: [address, merkleProof],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  useEffect(() => {
    if (address) {
      try {
        const tree = StandardMerkleTree.of(whitelisted, ["address"], {
          sortLeaves: true,
        });
        const proof = tree.getProof([address]);
        setMerkleProof(proof);
      } catch {
        setMerkleError("You are not eligible for the airdrop");
      }
    }
  }, []);

  useEffect(() => {
    if (isConfirmed) {
      toast({
        title: "Airdrop claimed",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      refetchTotalSupply();
    }
  }, [isConfirmed]);

  return (
    <Flex direction="column" width={["100%", "100%", "50%", "50%"]}>
      {totalSupplyLoading ? (
        <Flex justifyContent="center">
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="blue.500"
            size="xl"
          />
        </Flex>
      ) : (
        <>
          <Flex justifyContent="center">
            <Text mt="1rem">
              Amount Airdrop given:{" "}
              <Text as="b">
                {formatTotalSupply(totalSupply as bigint | undefined)} MAX
              </Text>
            </Text>
          </Flex>
          {merkleError ? (
            <Alert status="error" mt="1rem">
              <AlertIcon />
              {merkleError}
            </Alert>
          ) : (
            <>
              {hash && (
                <Alert status="success" mt="1rem">
                  <AlertIcon />
                  Hash of the airdrop transaction: {hash}
                </Alert>
              )}

              {isConfirming && (
                <Alert status="success" mt="1rem">
                  <AlertIcon />
                  Waiting for confirmation...
                </Alert>
              )}

              {isConfirmed && (
                <Alert status="success" mt="1rem">
                  <AlertIcon />
                  Check your wallet for the airdrop
                </Alert>
              )}

              {airdropError && (
                <Alert status="error" mt="1rem">
                  <AlertIcon />
                  Error:{" "}
                  {(airdropError as BaseError).shortMessage ||
                    airdropError.message}
                </Alert>
              )}

              <Button onClick={() => getAirDrop()} mt="1rem">
                {isPending ? "Minting..." : "Claim Airdrop"}
              </Button>
            </>
          )}
        </>
      )}
    </Flex>
  );
};

export default Mint;
