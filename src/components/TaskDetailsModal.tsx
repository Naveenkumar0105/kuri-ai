"use client";

import { useState, useEffect } from "react";
import { Task, Category } from "@/types";
import { X, Calendar, Flag, Tag, AlignLeft, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TaskDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task | null;
    onUpdateTask: (updatedTask: Task) => void;
    categories: Category[];
}

export function TaskDetailsModal({
    isOpen,
    onClose,
    task,
    onUpdateTask,
    categories,
}: TaskDetailsModalProps) {
    const [editedTask, setEditedTask] = useState<Task | null>(null);
    const [newCategory, setNewCategory] = useState("");
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);

    useEffect(() => {
        setEditedTask(task);
        setNewCategory("");
        setIsCreatingCategory(false);
    }, [task]);

    if (!isOpen || !editedTask) return null;

    const handleSave = () => {
        if (editedTask) {
            onUpdateTask(editedTask);
            onClose();
        }
    };

    const priorities: { value: 'Low' | 'Medium' | 'High'; color: string }[] = [
        { value: 'Low', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
        { value: 'Medium', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
        { value: 'High', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    ];

    // Ensure unique categories and exclude "All"
    const uniqueCategories = Array.from(new Set(categories)).filter(c => c !== "All");

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Task Details</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6 overflow-y-auto flex-1">
                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</label>
                            <input
                                type="text"
                                value={editedTask.text}
                                onChange={(e) => setEditedTask({ ...editedTask, text: e.target.value })}
                                className="w-full text-xl font-bold bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-white placeholder-gray-400"
                                placeholder="Task title"
                            />
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <Tag className="w-3 h-3" /> Category
                            </label>
                            <div className="relative">
                                {!isCreatingCategory ? (
                                    <select
                                        value={editedTask.category}
                                        onChange={(e) => {
                                            if (e.target.value === "NEW_CATEGORY_OPTION") {
                                                setIsCreatingCategory(true);
                                            } else {
                                                setEditedTask({ ...editedTask, category: e.target.value });
                                            }
                                        }}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white appearance-none"
                                    >
                                        {uniqueCategories.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                        <option value="NEW_CATEGORY_OPTION">+ Create New Category</option>
                                    </select>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newCategory}
                                            onChange={(e) => setNewCategory(e.target.value)}
                                            placeholder="Enter new category name"
                                            autoFocus
                                            className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                                        />
                                        <button
                                            onClick={() => {
                                                if (newCategory.trim()) {
                                                    setEditedTask({ ...editedTask, category: newCategory.trim() });
                                                    setIsCreatingCategory(false);
                                                }
                                            }}
                                            className="px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700"
                                        >
                                            Add
                                        </button>
                                        <button
                                            onClick={() => setIsCreatingCategory(false)}
                                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Priority */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <Flag className="w-3 h-3" /> Priority
                            </label>
                            <div className="flex gap-2">
                                {priorities.map((p) => (
                                    <button
                                        key={p.value}
                                        onClick={() => setEditedTask({ ...editedTask, priority: p.value })}
                                        className={cn(
                                            "px-4 py-2 rounded-lg text-sm font-medium transition-all border-2",
                                            editedTask.priority === p.value
                                                ? `border-transparent ${p.color} ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-gray-200 dark:ring-gray-700`
                                                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        )}
                                    >
                                        {p.value}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <AlignLeft className="w-3 h-3" /> Description
                            </label>
                            <textarea
                                value={editedTask.description || ""}
                                onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                                className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white min-h-[120px] resize-none"
                                placeholder="Add more details about this task..."
                            />
                        </div>

                        {/* Created Date */}
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>Created on {new Date(editedTask.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-lg shadow-purple-500/20 flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Save Changes
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
