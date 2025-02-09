"use client";

import { useState } from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Task, Subtask } from "@/types/types";
import { motion } from "framer-motion";

type TaskEntryProps = {
  task: Task;
  treeId: string;
  onUpdateTask: (updatedTask: Task) => void;
  onBack?: () => void;  // <--- optional callback to mimic "Back to Task List"
};

export function TaskEntry({
  task,
  treeId,
  onUpdateTask,
  onBack // we use this if you want the icon to actually go back
}: TaskEntryProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recursively count completed subtasks (all levels)
  const countCompleted = (subtasks: Subtask[]): { completed: number; total: number } => {
    let completed = 0;
    let total = 0;

    function recurse(subs: Subtask[]) {
      subs.forEach((s) => {
        total += 1;
        if (s.isComplete) {
          completed += 1;
        }
        if (s.subtasks && s.subtasks.length > 0) {
          recurse(s.subtasks);
        }
      });
    }
    recurse(subtasks);

    return { completed, total };
  };

  // Recursively toggle subtask completions
  const toggleSubtaskCompletion = (subtasks: Subtask[], subtaskId: string): Subtask[] => {
    return subtasks.map((subtask) => {
      if (subtask.id === subtaskId) {
        const updatedSubtask = {
          ...subtask,
          isComplete: !subtask.isComplete,
          subtasks: subtask.subtasks
            ? toggleSubtaskCompletion(subtask.subtasks, subtaskId)
            : undefined,
        };

        // If it has children, check if they are all done
        if (updatedSubtask.subtasks && updatedSubtask.subtasks.length > 0) {
          const allChildrenComplete = updatedSubtask.subtasks.every((child) => child.isComplete);
          updatedSubtask.isComplete = allChildrenComplete;
        }

        return updatedSubtask;
      } else {
        const updated = {
          ...subtask,
          subtasks: subtask.subtasks
            ? toggleSubtaskCompletion(subtask.subtasks, subtaskId)
            : undefined,
        };

        // Check children completeness
        if (updated.subtasks && updated.subtasks.length > 0) {
          const allChildrenComplete = updated.subtasks.every((child) => child.isComplete);
          updated.isComplete = allChildrenComplete;
        }
        return updated;
      }
    });
  };

  // Persist changes to the DB
  const updateTaskInDatabase = async (updatedTask: Task) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Updated Task Before Sending:", updatedTask);
      console.log("ID:", treeId);

      const response = await fetch("/api/trees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          treeId,
          assignedTask: JSON.stringify(updatedTask),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task in the database");
      }

      console.log("Task successfully updated in the database");
    } catch (err: any) {
      console.error("Error updating task:", err);
      setError(err.message || "An error occurred while updating the task.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle the entire root task
  const toggleTaskCompletion = () => {
    const updatedTask = {
      ...task,
      isComplete: !task.isComplete,
      subtasks: toggleSubtaskCompletion(task.subtasks, task.id),
    };
    onUpdateTask(updatedTask);
    updateTaskInDatabase(updatedTask);
  };

  const { completed, total } = countCompleted(task.subtasks);

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.3 }}
    >
      {/* Card with peach border, cream background if you want it consistent: */}
      <Card className="border-2 border-[#D99D81] bg-[#FFE8B6] shadow-sm mb-4 rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {task.title} ({completed}/{total})
          </CardTitle>
        </CardHeader>

        <CardContent>
    {task.description && <p className="mb-4">{task.description}</p>}

    {/* Accordion: no extra border around each item, slightly larger spacing */}
    <Accordion
      className="bg-[#FFE8B6] p-4 space-y-4"
      type="single"
      collapsible
    >
      {task.subtasks.map((subtask) => {
        const { completed, total } = countCompleted(subtask.subtasks || []);
        return (
          <AccordionItem
            key={subtask.id}
            value={subtask.id}
            // remove border, just a subtle background or none:
            className="mb-2 border border-[#D99D81] bg-[#FFE8B6] rounded-lg"
          >
            <AccordionTrigger className="hover:bg-[#f7dbab] px-2 py-1 rounded-md border-b border-[#D99D81]">
              {subtask.title} ({completed}/{total})
            </AccordionTrigger>
            <AccordionContent className="px-2 py-2">
              {subtask.subtasks && subtask.subtasks.length > 0 ? (
                <ul className="list-disc list-inside space-y-2 px-2">
                  {subtask.subtasks.map((subSubtask) => (
                    <li
                      key={subSubtask.id}
                      className="flex items-center justify-between"
                    >
                      <span
                        className={
                          subSubtask.isComplete ? "line-through text-gray-500" : ""
                        }
                      >
                        {subSubtask.title}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const updatedTask = {
                            ...task,
                            subtasks: toggleSubtaskCompletion(task.subtasks, subSubtask.id),
                          };
                          onUpdateTask(updatedTask);
                          updateTaskInDatabase(updatedTask);
                        }}
                        disabled={loading}
                        className="border-[#D99D81] text-black hover:bg-[#f7dbab] hover:text-[#333] bg-[#FFE8B6]"
                      >
                        {subSubtask.isComplete ? "Undo" : "Complete"}
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">No subtasks available.</p>
              )}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  </CardContent>

        <CardFooter className="flex items-center justify-between">
          {/* Mark as Complete button in green */}
          <Button
            onClick={toggleTaskCompletion}
            disabled={loading}
            className="bg-[#5B913B] text-white hover:bg-[#4a7e34]"
          >
            {task.isComplete ? "Mark as Incomplete" : "Mark as Complete"}
          </Button>

          {error && <p className="text-red-500 mt-2">{error}</p>}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
