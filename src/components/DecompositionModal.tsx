import { useState, useEffect } from "react";
import { X, Check, Edit2, RotateCcw } from "lucide-react";
import { Task } from "@/types";

interface DecompositionModalProps {
    isOpen: boolean;
    onClose: () => void;
    originalTaskText: string;
    subtasks: { text: string; category: string; dueDate?: string | null; dateType?: "due" | "scheduled" }[];
    onConfirm: (tasks: { text: string; category: string; dueDate?: string | null; dateType?: "due" | "scheduled" }[]) => void;
    onUseOriginal: () => void;
}

export function DecompositionModal({
    isOpen,
    onClose,
    originalTaskText,
    subtasks,
    onConfirm,
    onUseOriginal,
}: DecompositionModalProps) {
    const [editedSubtasks, setEditedSubtasks] = useState(subtasks);

    useEffect(() => {
        setEditedSubtasks(subtasks);
    }, [subtasks]);

    if (!isOpen) return null;

    const handleTextChange = (index: number, newText: string) => {
        const newSubtasks = [...editedSubtasks];
        newSubtasks[index].text = newText;
        setEditedSubtasks(newSubtasks);
    };

    const handleCategoryChange = (index: number, newCategory: string) => {
        const newSubtasks = [...editedSubtasks];
        newSubtasks[index].category = newCategory;
        setEditedSubtasks(newSubtasks);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-gray-100 dark:border-neutral-800">
                <div className="p-6 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Break Down Task?
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            AI suggests breaking "{originalTaskText}" into these steps:
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {editedSubtasks.map((task, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-neutral-800/50 rounded-xl border border-gray-100 dark:border-neutral-800"
                        >
                            <div className="mt-3 w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <input
                                    type="text"
                                    value={task.text}
                                    onChange={(e) => handleTextChange(index, e.target.value)}
                                    className="w-full bg-transparent border-none p-0 text-sm font-medium text-gray-900 dark:text-gray-100 focus:ring-0 placeholder-gray-400"
                                    placeholder="Task description"
                                />
                                <input
                                    type="text"
                                    value={task.category}
                                    onChange={(e) => handleCategoryChange(index, e.target.value)}
                                    className="w-full bg-transparent border-none p-0 text-xs text-gray-500 dark:text-gray-400 focus:ring-0 placeholder-gray-400"
                                    placeholder="Category"
                                />
                            </div>
                            <Edit2 className="w-4 h-4 text-gray-400 opacity-50" />
                        </div>
                    ))}
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between gap-4 bg-gray-50/50 dark:bg-neutral-900/50 rounded-b-2xl">
                    <button
                        onClick={onUseOriginal}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                        No, keep original
                    </button>
                    <button
                        onClick={() => onConfirm(editedSubtasks)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm shadow-purple-200 dark:shadow-none"
                    >
                        <Check className="w-4 h-4" />
                        Confirm Breakdown
                    </button>
                </div>
            </div>
        </div>
    );
}
