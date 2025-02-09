"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // ✅ Import useRouter for navigation
import { WalletDefault } from "@coinbase/onchainkit/wallet";
import { TaskList } from "@/components/TaskList";
import { ethers } from "ethers";
import { getContract } from "@/lib/taskBonsaiNFT";
import { useAccount, useWalletClient } from "wagmi"; // ✅ Import wagmi hooks

export default function Home() {
  const [minting, setMinting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); // ✅ Initialize useRouter

  const { address, isConnected } = useAccount(); // ✅ Get connected wallet address
  const { data: walletClient } = useWalletClient(); // ✅ Get wallet client from WalletConnect

  const mintNFT = async () => {
    try {
      if (!isConnected || !walletClient) {
        throw new Error("Please connect your Coinbase Wallet first.");
      }

      setMinting(true);
      setError(null);
      setTxHash(null);

      // ✅ Use wagmi to create an ethers provider from the WalletConnect client
      const provider = new ethers.BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();
      const contract = await getContract(signer);

      // ✅ Convert `bigint` to `number` before comparing
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== 84532) {
        throw new Error("Switch to Base Sepolia in Coinbase Wallet.");
      }

      // Convert "Hello, World!" to a hash for metadata storage
      const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("Hello, World!"));

      // Send the mint transaction
      const tx = await contract.mintBonsai(await signer.getAddress(), metadataHash);
      setTxHash(tx.hash);
      console.log("Transaction Sent:", tx.hash);

      // Wait for confirmation
      await tx.wait();
      console.log("NFT Minted!");

    } catch (err: any) {
      console.error("Minting Error:", err);
      setError(err.message);
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Wallet button */}
      <div className="absolute top-4 right-4">
        <div className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
          <WalletDefault />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center justify-center h-full gap-8">
        <h1 className="text-2xl font-semibold">Welcome to BloomBonsai</h1>
        <TaskList />

        {/* Mint Button */}
        <button
          onClick={mintNFT}
          disabled={minting}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
        >
          {minting ? "Minting..." : "Mint NFT with 'Hello, World!'"}
        </button>

        {txHash && (
          <p className="mt-3 text-green-500">
            ✅ NFT Minted!{" "}
            <a
              href={`https://sepolia.basescan.org/tx/${txHash}`}
              target="_blank"
              className="text-blue-600 underline"
            >
              View on BaseScan
            </a>
          </p>
        )}

        {error && <p className="mt-3 text-red-500">⚠️ {error}</p>}

        {/* New Button to Navigate to Plant Bonsai Page */}
        <button
          onClick={() => router.push("/plant-bonsai")}
          className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 mt-4"
        >
          Plant a New Bonsai
        </button>
      </div>
    </div>
  );
}
