import { WalletDefault } from "@coinbase/onchainkit/wallet";
import { TaskList } from "@/components/TaskList"; // Import the TaskList component

export default function Home() {
  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Wallet button positioned at the top-right corner */}
      <div className="absolute top-4 right-4">
        <div className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
          <WalletDefault />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center justify-center h-full gap-8">
        <h1 className="text-2xl font-semibold">Welcome to BloomBonsai</h1>
        {/* Task Management List */}
        <TaskList />
      </div>
    </div>
  );
}


