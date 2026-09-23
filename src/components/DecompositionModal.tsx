import { useState, useEffect } from "react";
import { X, Check, Edit2, RotateCcw, Calendar } from "lucide-react";
import { Task } from "@/types";

interface DecompositionModalProps {
    isOpen: boolean;
    onClose: () => void;
    originalTaskText: string;
    subtasks: { text: string; category: string; dueDate?: string | null; dateType?: "due" | "scheduled"; priority?: string }[];
    onConfirm: (tasks: { text: string; category: string; dueDate?: string | null; dateType?: "due" | "scheduled"; priority?: string }[]) => void;
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
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setEditedSubtasks(subtasks);
        setIsSubmitting(false);
    }, [subtasks, isOpen]);

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

    const handleConfirm = () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        onConfirm(editedSubtasks);
    };

    const isSingle = editedSubtasks.length === 1;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 dark:bg-black/40 backdrop-blur-md">
            <div className="bg-card rounded-2xl shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col border border-border">
                <div className="p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {isSingle ? "Organize Task?" : "Break Down Task?"}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {isSingle 
                                ? `AI suggests these details for "${originalTaskText}":`
                                : `AI suggests breaking "${originalTaskText}" into these steps:`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {editedSubtasks.map((task, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-neutral-800/50 rounded-xl border border-black/5 dark:border-white/10"
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
                                <div className="flex flex-wrap items-center gap-2">
                                    <input
                                        type="text"
                                        value={task.category}
                                        onChange={(e) => handleCategoryChange(index, e.target.value)}
                                        className="bg-transparent border-none p-0 text-xs text-gray-500 dark:text-gray-400 focus:ring-0 placeholder-gray-400 w-24"
                                        placeholder="Category"
                                    />
                                    {task.dueDate && (
                                        <div className="flex items-center gap-1 text-xs font-medium text-[#0A84FF] dark:text-[#409CFF] bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-md">
                                            <Calendar className="w-3 h-3" />
                                            {task.dateType === 'due' ? "Due: " : "At: "}
                                            {new Date(task.dueDate).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                        </div>
                                    )}
                                    {task.priority && (
                                        <div className="text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-md">
                                            {task.priority}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Edit2 className="w-4 h-4 text-gray-400 opacity-50" />
                        </div>
                    ))}
                </div>

                <div className="p-6 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-4 bg-gray-50/50 dark:bg-neutral-900/50 rounded-b-2xl">
                    <button
                        onClick={onUseOriginal}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                    >
                        <RotateCcw className="w-4 h-4" />
                        No, keep original
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#0A84FF] hover:bg-[#007AFF] active:scale-[0.98] text-white rounded-xl text-sm font-medium transition-colors shadow-sm shadow-purple-200 dark:shadow-none disabled:opacity-50 disabled:cursor-wait"
                    >
                        <Check className="w-4 h-4" />
                        {isSubmitting ? "Saving..." : (isSingle ? "Accept Changes" : "Confirm Breakdown")}
                    </button>
                </div>
            </div>
        </div>
    );
}
