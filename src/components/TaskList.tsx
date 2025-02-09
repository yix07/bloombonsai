"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Task, ModelID } from "@/types/types";
import { useAccount } from "wagmi";
import { TaskEntry } from "@/components/TaskEntry";
import { Button } from "@/components/ui/button";
import { useGrid } from "@/app/context/gridContext"; // Import useGrid hook
import { spec } from "node:test/reporters";

const BackArrow: React.FC<{ onClick: () => void }> = ({ onClick }) => {
    return (
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.1, x: -2 }} // Hover effect
        whileTap={{ scale: 0.9 }} // Tap effect
        transition={{ type: "spring", stiffness: 300 }}
        className="flex items-center justify-center mb-4" // Styling for alignment
        style={{
          background: "none", // No background
          border: "none", // No border
          cursor: "pointer",
          outline: "none",
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15 18L9 12L15 6"
            stroke="#5B913B" // Green color
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M21 12H9"
            stroke="#5B913B" // Green color
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.button>
    );
  };
  
  export default BackArrow;

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [treeIdMap, setTreeIdMap] = useState<Map<string, string>>(new Map());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const { grid, setGrid } = useGrid(); // Access grid and its setter

  useEffect(() => {
    if (!isConnected || !address) return;

    const fetchTasks = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/trees?owner=${address}`);
        if (!response.ok) {
          throw new Error("Failed to fetch tasks");
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || "Unknown error occurred");
        }

        const newTreeIdMap = new Map<string, string>();

        // Process fetched tasks and populate treeIdMap
        const newGrid: (ModelID | null)[][] = Array.from({ length: 5 }, () =>
          Array(5).fill(null)
        );
        

        const fetchedTasks = data.data.map((tree: any): Task => {
          const task = JSON.parse(tree.assignedTask);
          const mid = {specimen: tree.species, stage: tree.growthStage};
          newGrid[tree.row][tree.col] = mid;
          // console.log(newGrid[tree.row][tree.col]);
          newTreeIdMap.set(task.id, tree.treeId); // Map task.id to tree.treeId
          return task;
        });

        setTreeIdMap(newTreeIdMap); // Update the state with the new map
        setTasks(fetchedTasks);
        setGrid(newGrid); // Update the grid state with the new grid
      } catch (err: any) {
        console.error("Error fetching tasks:", err);
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [isConnected, address]);

  const updateTask = (updatedTask: Task) => {
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
  };
  
  if (loading) return <p>Loading tasks...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  const activeTasks = tasks.filter((t) => !t.isComplete);

  return (
    <div className="w-full mt-4">
      {selectedTask ? (
        // 2-column layout if a task is selected
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left side for your 3D model placeholder */}
          <div className="p-4 flex items-center justify-center bg-white rounded-lg shadow-sm">
            <p className="text-gray-600 text-center">
              3D Model Goes Here
            </p>
          </div>

          {/* Right side for the expanded TaskEntry */}
          <div>
          <BackArrow onClick={() => setSelectedTask(null)} />
          <TaskEntry
              task={selectedTask}
              treeId={treeIdMap.get(selectedTask.id) || ""}
              onUpdateTask={(updatedTask) => {
                updateTask(updatedTask);
                setSelectedTask(updatedTask);
              }}
            />
            {/* <Button
              onClick={() => setSelectedTask(null)}
              className="mb-4 bg-[#5B913B] text-white hover:bg-[#4a7e34]">
            
              Back to Task List
            </Button> */}
          </div>
        </div>
      ) : (
        // Show incomplete tasks as 2 columns
        <div>
          <h2 className="text-xl font-bold mb-4 text-[#5B913B]">Active Tasks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {activeTasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  onClick={() => setSelectedTask(task)}
                  // PEACH border (#D99D81), CREAM inside (#FFE8B6)
                  className="cursor-pointer p-4 rounded-lg shadow-sm 
                             border-2 border-[#D99D81] bg-[#FFE8B6] 
                             hover:bg-[#f7dbab]" // slightly darker cream on hover
                >
                  <h3 className="text-lg font-semibold text-[#333]">{task.title}</h3>
                  <p className="text-[#333]">
                    {task.subtasks.filter((subtask) => subtask.isComplete).length} /{" "}
                    {task.subtasks.length} subtasks completed
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
