"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OpenAI from "openai";
import { Task, Subtask, ModelID } from "@/types/types";
import { WalletDefault } from "@coinbase/onchainkit/wallet";
import { useAccount, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import { getContract } from "@/lib/taskBonsaiNFT";
import crypto from "crypto";
import { motion } from "framer-motion";
import { useGrid } from "@/app/context/gridContext"; // Adjust the path as needed

export default function PlantBonsai() {
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const router = useRouter();

  const { grid, setGrid } = useGrid(); // Access grid and setGrid
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskName.trim()) {
      setError("Task Name is required.");
      return;
    }

    if (!isConnected || !walletClient) {
      setError("Please connect your wallet to plant a Bonsai.");
      return;
    }
    
    const provider = new ethers.BrowserProvider(walletClient as any);
    const signer = await provider.getSigner();
    const contract = await getContract(signer);
    setLoading(true);
    setError(null);

    const nftCount = await getNFTCount(contract, address+"");
    console.log(`The owner has ${nftCount} NFTs.`);


    try {
      const prompt = 
`Prompt: Task Breakdown Tree Generator

System Instruction:
You are an AI assistant that helps users break down tasks into structured, actionable subtasks. Your goal is to generate a three-level task tree in JSON format, ensuring:

The root task is broken into a suitable number of high-level subtasks (up to a maximum of four).

Each of those subtasks can have a suitable number of child subtasks (up to a maximum of four).

The final level contains the most granular steps (leaf nodes), with a suitable number of subtasks (up to four per parent node).

All tasks should be clear, actionable, and logically sequenced.

User Input Example:

{
  "task": "Plan a birthday party"
}

Expected Output Format:

{
  "task": "Plan a birthday party",
  "subtasks": [
    {
      "task": "Choose a date and venue",
      "subtasks": [
        { "task": "Check everyone's availability", "subtasks": [] },
        { "task": "Book the venue", "subtasks": [] }
      ]
    },
    {
      "task": "Send out invitations",
      "subtasks": [
        { "task": "Create a guest list", "subtasks": [] },
        { "task": "Design the invitation", "subtasks": [] },
        { "task": "Send invitations", "subtasks": [] }
      ]
    },
    {
      "task": "Plan food and drinks",
      "subtasks": [
        { "task": "Decide on a menu", "subtasks": [] },
        { "task": "Order catering or groceries", "subtasks": [] }
      ]
    },
    {
      "task": "Arrange entertainment and activities",
      "subtasks": [
        { "task": "Book a DJ or music", "subtasks": [] },
        { "task": "Plan games or activities", "subtasks": [] },
        { "task": "Set up decorations", "subtasks": [] }
      ]
    }
  ]
}

Final Instructions to the LLM:

Ensure exactly three levels in the tree.

Each level should have a suitable number of subtasks (up to four per parent node, but not necessarily all four).

The output must be in valid JSON format.

Subtasks should be meaningful and logically sequenced.

Task: ${taskName} ${description.trim() ? description : ""}.`; // Use your prompt here

      const client = new OpenAI({
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
      });
    
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });
    
      console.log("AI Response:", response);
    
      // Convert AI response to Task Tree
      const taskTree = parseAIResponseToTaskTree(response, nftCount);
      console.log("Transformed Task Tree:", taskTree);

      const treeId = generateTaskTreeHash(taskTree);

      console.log(treeId);

      const newCoords = getNewCoords(grid);
      const newTree = {
        owner: address, // Replace with actual owner ID
        treeId: treeId,
        species: randomSpecimen(), // TODO: randomize
        growthStage: "1", // Example growth stage
        row: newCoords.row, // Replace with actual row
        col: newCoords.col, // Replace with actual column
        assignedTask: JSON.stringify(taskTree), // Full task tree
        metadataCID: "exampleCID", // Replace with actual metadata CID if available
      };
  
      // Send POST request to save the tree to the database
      const dbResponse = await fetch("/api/trees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTree),
      });
  
      const dbData = await dbResponse.json();
      // console.log("Database Response:", dbData);

  
      if (!dbData.success) {
        throw new Error("Failed to save the tree to the database.");
      } else {
        setGrid((prevGrid) => {
          const updatedGrid = [...prevGrid];
          updatedGrid[newCoords.row][newCoords.col] = {
            specimen: newTree.species,
            stage: newTree.growthStage,
          };
          return updatedGrid;
        });
  
        setMinting(true);
        const provider = new ethers.BrowserProvider(walletClient as any);
        const signer = await provider.getSigner();
        const contract = await getContract(signer);
  
        const network = await provider.getNetwork();
        if (Number(network.chainId) !== 84532) {
          throw new Error("Switch to Base Sepolia in Coinbase Wallet.");
        }
  
        console.log("Minting NFT with metadata pointer:", treeId);
  
        const tx = await contract.mintBonsai(address, treeId); // Use the tree hash as the metadata pointer
        setTxHash(tx.hash);
        console.log("Transaction Sent:", tx.hash);
  
        // Wait for confirmation
        await tx.wait();
        console.log("NFT Minted!"); 

        router.push("/garden")
      }
  
      // // Update state with the new task tree
      // setTasks((prevTasks) => [...prevTasks, taskTree]);
    } catch (error) {
      console.error("Error processing AI response:", error);    
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      // Fade in from top
      initial={{ opacity: 0, y: -40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="relative min-h-screen bg-[#FFE8B6]"
    >
      {/* Wallet Button (top-right) */}
      <div className="absolute top-4 right-4 w-40">
        <div className="overflow-hidden bg-green-600 rounded-md hover:bg-green-700">
          <WalletDefault />
        </div>
      </div>

      {/* Main container for the title, form, error, home icon */}
      <div className="flex flex-col items-center justify-center min-h-screen gap-8">
        {/* Title */}
        <h1 className="text-5xl font-bold">
          {/* “Plant Your New” in peach */}
          <span className="text-[#D99D81]">Plant Your New </span>

          {/* Bonsai in green, plus the icon, aligned baseline */}
          <span className="text-[#5B913B] inline-flex items-baseline gap-2">
            Bonsai
            {/* New bonsai icon - same color #5B913B; sized for text alignment */}
            <img
              src="https://img.icons8.com/?size=100&id=NbTixWMtHl74&format=png&color=5B913B"
              alt="Bonsai Icon"
              style={{
                width: "1em",
                height: "1em",
                marginBottom: "-0.1em", // optional nudge
              }}
            />
          </span>
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-1/3">
          <input
            type="text"
            placeholder="Task Name"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            className="px-4 py-2 rounded-lg border-2 border-[#D99D81] focus:outline-none focus:border-[#77B254]"
          />
          <textarea
            placeholder="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="px-4 py-2 h-24 rounded-lg border-2 border-[#D99D81] focus:outline-none focus:border-[#77B254]"
          />
          <button
            type="submit"
            disabled={loading || !isConnected}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
              loading || !isConnected
                ? "bg-[#D99D81] cursor-not-allowed"
                : "bg-[#77B254] hover:bg-[#5B913B]"
            }`}
          >
            {loading ? "Planting..." : "Plant Bonsai"}
          </button>
        </form>

        {error && (
          <p className="mt-2 text-sm font-semibold text-red-600">⚠️ {error}</p>
        )}

        {/* Home icon with a bolder outline in #D99D81, animate on hover */}
        <motion.button
          onClick={() => router.push("/")}
          whileHover={{ scale: 1.1, y: -2 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <svg
            width="52"
            height="52"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#D99D81"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* A bolder house path */}
            <path d="M3 9.75l9-7.5 9 7.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.75z" />
            <path d="M9 22V12h6v10" />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ------------------ Helper Functions -------------------- */

function parseAIResponseToTaskTree(aiResponse: any, count: any): Task {
  // Extract the main task from the AI response
  const mainTask = aiResponse.choices[0].message.content;
  const cleanedJsonString = mainTask
  .replace(/^```json/, "") // Remove the starting ```json
  .replace(/```$/, "");    // Remove the ending ```

  const parsedTask = JSON.parse(cleanedJsonString);

  // Recursive function to convert the AI response tree to the Subtask structure
  const convertToSubtask = (node: any, parentId: string, childIndex: any): Subtask => {
    const id = `${parentId}-${childIndex}`; // Generate a unique ID
    return {
      id,
      title: node.task,
      isComplete: false,
      subtasks: node.subtasks
        ? node.subtasks.map((child: any, index: any) => convertToSubtask(child, id, index + 1))
        : [],
    };
  };

  // Main task transformation
  return {
    id: count,
    title: parsedTask.task,
    description: "",
    isComplete: false,
    subtasks: parsedTask.subtasks.map((subtask: any, index: any) =>
      convertToSubtask(subtask, count, index + 1)
    ),
  };
}


function generateTaskTreeHash(taskTree: any) {
  // Convert the object to a JSON string
  const jsonString = JSON.stringify(taskTree);

  // Generate SHA-256 hash
  const hash = crypto.createHash('sha256').update(jsonString).digest('hex');
  return hash;
}

//TODO: search and return empty spot on grid
function getNewCoords(grid: (ModelID | null)[][]): { row: number; col: number } {
  console.log(grid)
  const emptySpots: { row: number; col: number }[] = [];

  // Find all empty spots
  grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell === null) {
        emptySpots.push({ row: rowIndex, col: colIndex });
      }
    });
  });

  if (emptySpots.length === 0) {
    throw new Error("No empty spots available on the grid.");
  }

  // Pick a random empty spot
  const randomIndex = Math.floor(Math.random() * emptySpots.length);
  return emptySpots[randomIndex];
}


function randomSpecimen() {
  return "ashtree";
}


async function getNFTCount(contract: any, ownerAddress: string): Promise<number> {
  try {
    if (!contract) throw new Error("Contract instance is required");

    // Call the balanceOf function
    const balance = await contract.balanceOf(ownerAddress);
    return Number(balance); // Convert from BigNumber to a regular number
  } catch (error) {
    console.error("Error fetching NFT count:", error);
    throw error;
  }
}
