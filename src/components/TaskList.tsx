"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Task, Subtask } from "@/types/types";


// type Subtask = {
//   id: string;
//   title: string;
//   isComplete: boolean;
//   subtasks?: Subtask[];
// };

// type Task = {
//   id: string;
//   title: string;
//   description: string;
//   isComplete: boolean;
//   subtasks: Subtask[];
// };

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Plan Wedding Budget",
    description: "Break down the wedding budget into smaller, manageable goals.",
    isComplete: false,
    subtasks: [
      {
        id: "1-1",
        title: "Research venues",
        isComplete: false,
        subtasks: [
          { id: "1-1-1", title: "Find local venues", isComplete: false },
          { id: "1-1-2", title: "Compare pricing", isComplete: false },
        ],
      },
      {
        id: "1-2",
        title: "Set a budget for catering",
        isComplete: false,
      },
    ],
  },
];

export function TaskList() {
  const [tasks, setTasks] = useState(initialTasks);

  // Recursive function to count completed subtasks
  const countCompleted = (subtasks: Subtask[]): { completed: number; total: number } => {
    const total = subtasks.length;
    const completed = subtasks.filter((subtask) => {
      if (subtask.subtasks) {
        return subtask.isComplete || countCompleted(subtask.subtasks).completed === subtask.subtasks.length;
      }
      return subtask.isComplete;
    }).length;
    return { completed, total };
  };

  // Recursive function to toggle completion of subtasks and sub-subtasks
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

        if (updatedSubtask.subtasks) {
          const allSubSubtasksComplete = updatedSubtask.subtasks.every(
            (subSubtask) => subSubtask.isComplete
          );
          updatedSubtask.isComplete = allSubSubtasksComplete;
        }

        return updatedSubtask;
      } else {
        return {
          ...subtask,
          subtasks: subtask.subtasks
            ? toggleSubtaskCompletion(subtask.subtasks, subtaskId)
            : undefined,
        };
      }
    });
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? { ...task, isComplete: !task.isComplete }
          : {
              ...task,
              subtasks: toggleSubtaskCompletion(task.subtasks, taskId),
            }
      )
    );
  };

  const activeTasks = tasks.filter((task) => !task.isComplete);
  const completedTasks = tasks.filter((task) => task.isComplete);

  return (
    <div className="space-y-8">
      {/* Active Tasks Section */}
      <div>
        <h2 className="text-xl font-bold">Active Tasks</h2>
        <AnimatePresence>
          {activeTasks.map((task) => {
            const { completed, total } = countCompleted(task.subtasks);
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border shadow-sm mb-4">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                      {task.title} ({completed}/{total})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{task.description}</p>
                    <Accordion type="single" collapsible className="mt-4">
                      {task.subtasks.map((subtask) => {
                        const { completed, total } = countCompleted(
                          subtask.subtasks || []
                        );
                        return (
                          <AccordionItem key={subtask.id} value={subtask.id}>
                            <AccordionTrigger>
                              {subtask.title} ({completed}/{total})
                            </AccordionTrigger>
                            <AccordionContent>
                              {subtask.subtasks ? (
                                <ul className="list-disc list-inside">
                                  {subtask.subtasks.map((subSubtask) => (
                                    <li
                                      key={subSubtask.id}
                                      className="flex items-center justify-between"
                                    >
                                      <span
                                        className={
                                          subSubtask.isComplete
                                            ? "line-through text-gray-500"
                                            : ""
                                        }
                                      >
                                        {subSubtask.title}
                                      </span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          setTasks((prevTasks) =>
                                            prevTasks.map((task) =>
                                              task.id === task.id
                                                ? {
                                                    ...task,
                                                    subtasks:
                                                      toggleSubtaskCompletion(
                                                        task.subtasks,
                                                        subSubtask.id
                                                      ),
                                                  }
                                                : task
                                            )
                                          )
                                        }
                                      >
                                        {subSubtask.isComplete ? "Undo" : "Complete"}
                                      </Button>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-gray-600">
                                  No subtasks available.
                                </p>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={() => toggleTaskCompletion(task.id)}>
                      {task.isComplete ? "Mark as Incomplete" : "Mark as Complete"}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Completed Tasks Section */}
      <div>
        <h2 className="text-xl font-bold">Completed Tasks</h2>
        <AnimatePresence>
          {completedTasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border shadow-sm bg-gray-100 mb-4">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    {task.title} ({countCompleted(task.subtasks).completed}/
                    {countCompleted(task.subtasks).total})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{task.description}</p>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    onClick={() => toggleTaskCompletion(task.id)}
                  >
                    Mark as Incomplete
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}





