"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WalletDefault } from "@coinbase/onchainkit/wallet";
import { TaskList } from "@/components/TaskList";
import { ethers } from "ethers";
import { getContract } from "@/lib/taskBonsaiNFT";
import { useAccount, useWalletClient } from "wagmi";
import { TypeAnimation } from "react-type-animation";
import { motion } from "framer-motion";

export default function Home() {
  const [minting, setMinting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  return (
    <div className="relative min-h-screen bg-[#FFE8B6]">
      {/* Wallet button (top-right) */}
      <div className="absolute top-4 right-4">
        <div className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
          <WalletDefault />
        </div>
      </div>

      {/* Main content container, left-aligned */}
      <motion.div
        className="flex flex-col items-start justify-center h-full gap-4 p-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeInOut" }}
      >
        {/* Heading with minimal bottom margin */}
        <h1 className="text-5xl font-bold mb-0 text-left text-[#D99D81]">
          Welcome to <span className="text-[#5B913B]">BloomBonsai</span>
        </h1>

        {/* TypeAnimation in peach color (#D99D81) */}
        <TypeAnimation
          sequence={[
            "Connect your Coinbase Wallet to get started",
            2000,
            "Start your journey to a more productive you",
            2000,
            "BloomBonsai is a decentralized task management platform",
            2000,
            "Mint a Bonsai NFT for each task you complete and grow your garden",
            2000,
            "Base Layer 2 + IPFS for decentralized storage and accountability",
            2000,
            "Cross-platform. Future expansions: more customization & gamification",
            2000,
          ]}
          speed={40}
          style={{ color: "#D99D81", fontSize: "1.75rem", maxWidth: "80%", marginTop: "-0.5rem" }}
          repeat={Infinity}
        />

        {/* Task List (incomplete tasks now show in a 2-col grid on wider screens) */}
        <TaskList />

        {/* Button to Plant Bonsai */}
        <button
          onClick={() => router.push("/plant-bonsai")}
          className="bg-[#5B913B] text-white px-6 py-3 rounded-lg hover:bg-green-700 mt-4"
        >
          Plant a New Bonsai
        </button>
      </motion.div>
    </div>
  );
}
