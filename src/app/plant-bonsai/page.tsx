"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OpenAI from "openai";
import { Task, Subtask } from "@/types/types";
import { WalletDefault } from "@coinbase/onchainkit/wallet";
import { useAccount, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import { getContract } from "@/lib/taskBonsaiNFT";
import crypto from "crypto";

export default function PlantBonsai() {
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const router = useRouter();

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

    setLoading(true);
    setError(null);

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
      const taskTree = parseAIResponseToTaskTree(response);
      console.log("Transformed Task Tree:", taskTree);

      const treeId = generateTaskTreeHash(taskTree);

      console.log(treeId);

      const newCoords = getNewCoords();
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
      console.log("Database Response:", dbData);
  
      if (!dbData.success) {
        throw new Error("Failed to save the tree to the database.");
      } else {
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
    <div className="relative min-h-screen bg-gray-50">
      {/* Wallet Connection Info */}
      <div className="absolute top-4 right-4">
        <div className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
          <WalletDefault />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen gap-8">
        <h1 className="text-2xl font-semibold">Plant a New Bonsai</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4 w-1/3">
          <input
            type="text"
            placeholder="Task Name"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
          <textarea
            placeholder="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          ></textarea>
          <button
            type="submit"
            disabled={loading || !isConnected} // Disable button if loading or not connected
            className={`px-6 py-3 rounded-lg text-white ${
              loading || !isConnected
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Planting..." : "Plant Bonsai"}
          </button>
        </form>
        {error && <p className="mt-4 text-red-500">⚠️ {error}</p>}
        <button
          onClick={() => router.push("/")}
          className="mt-4 text-blue-600 underline"
        >
          Back to Home
        </button>
      </div>
    </div>
  );


}


function parseAIResponseToTaskTree(aiResponse: any): Task {
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
    id: "1",
    title: parsedTask.task,
    description: "",
    isComplete: false,
    subtasks: parsedTask.subtasks.map((subtask: any, index: any) =>
      convertToSubtask(subtask, "1", index + 1)
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
function getNewCoords() {
  return {"row": 0, "col": 0};
}

function randomSpecimen() {
  return "Willow";
}