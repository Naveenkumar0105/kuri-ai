"use client";

import { Task, Category } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Trash2, Calendar, Tag, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskListProps {
    tasks: Task[];
    onToggleTask: (id: string) => void;
    onDeleteTask: (id: string) => void;
    onTaskClick: (task: Task) => void;
    selectedCategory: Category | "All";
}

const CATEGORY_COLORS: Record<Category, string> = {
    Work: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    Personal: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    Shopping: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    Health: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    Uncategorized: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export function TaskList({ tasks, onToggleTask, onDeleteTask, onTaskClick, selectedCategory }: TaskListProps) {
    // If a specific category is selected, we just show those tasks.
    // If "All" is selected, we group them.

    const groupedTasks = selectedCategory === "All"
        ? tasks.reduce((acc, task) => {
            if (!acc[task.category]) acc[task.category] = [];
            acc[task.category].push(task);
            return acc;
        }, {} as Record<Category, Task[]>)
        : { [selectedCategory]: tasks };

    // Ensure we have at least an empty array for the selected category if no tasks exist
    if (selectedCategory !== "All" && !groupedTasks[selectedCategory]) {
        groupedTasks[selectedCategory as Category] = [];
    }

    const categoriesToShow = (selectedCategory === "All"
        ? Object.entries(groupedTasks)
        : [[selectedCategory, groupedTasks[selectedCategory as Category]]]) as [string, Task[]][];

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <Tag className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No tasks found</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {selectedCategory === "All"
                        ? "Start by adding a new task above."
                        : `No tasks in ${selectedCategory}. Add one to get started!`}
                </p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-8">
            {categoriesToShow.map(([category, categoryTasks]) => (
                (categoryTasks as Task[]).length > 0 && (
                    <motion.div
                        key={category}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        {selectedCategory === "All" && (
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                <span className={cn("px-3 py-1 rounded-full text-xs font-medium", CATEGORY_COLORS[category as Category])}>
                                    {category}
                                </span>
                                <span className="text-sm text-gray-400 font-normal">({(categoryTasks as Task[]).length})</span>
                            </h3>
                        )}

                        <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                            <AnimatePresence mode="popLayout">
                                {(categoryTasks as Task[]).map((task) => (
                                    <motion.div
                                        layout
                                        key={task.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className={cn(
                                            "group relative p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700",
                                            task.completed && "opacity-60 bg-gray-50 dark:bg-gray-900/50"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <div className="flex items-start gap-3">
                                                    <button
                                                        onClick={() => onToggleTask(task.id)}
                                                        className={cn(
                                                            "mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                                                            task.completed
                                                                ? "bg-green-500 border-green-500 text-white"
                                                                : "border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-500"
                                                        )}
                                                    >
                                                        {task.completed && <Check className="w-3 h-3" />}
                                                    </button>
                                                    <div
                                                        className="flex-1 min-w-0 cursor-pointer"
                                                        onClick={() => onTaskClick(task)}
                                                    >
                                                        <p className={cn(
                                                            "text-sm font-medium text-gray-900 dark:text-gray-100 truncate transition-all duration-200",
                                                            task.completed && "text-gray-400 dark:text-gray-500 line-through decoration-gray-400 dark:decoration-gray-500"
                                                        )}>
                                                            {task.text}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                                <Tag className="w-3 h-3" />
                                                                {task.category}
                                                            </span>
                                                            {task.priority && (
                                                                <span className={cn(
                                                                    "text-[10px] font-medium px-1.5 py-0.5 rounded-md flex items-center gap-1",
                                                                    task.priority === 'High' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                                                        task.priority === 'Medium' ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                                                            "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                                )}>
                                                                    {task.priority}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 pl-8">
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        {task.dueDate && (
                                                            <>
                                                                <span className="mx-1">•</span>
                                                                <span className={cn(
                                                                    "font-medium",
                                                                    task.dateType === 'due' ? "text-red-600 dark:text-red-400" : "text-purple-600 dark:text-purple-400"
                                                                )}>
                                                                    {task.dateType === 'due' ? "Due: " : "At: "}
                                                                    {new Date(task.dueDate).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                    {task.completed && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onToggleTask(task.id);
                                                            }}
                                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                            title="Undo"
                                                        >
                                                            <RotateCcw className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDeleteTask(task.id);
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    {task.dueDate && !task.completed && (
                                                        <a
                                                            href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(task.text)}&details=${encodeURIComponent(task.description || "")}&dates=${new Date(task.dueDate).toISOString().replace(/-|:|\.\d\d\d/g, "")}/${new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "")}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                                            title="Add to Google Calendar"
                                                        >
                                                            <Calendar className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )
            ))}
        </div>
    );
}
