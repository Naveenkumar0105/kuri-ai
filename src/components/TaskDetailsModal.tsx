"use client";

import { useState, useEffect } from "react";
import { Task, Category } from "@/types";
import { X, Calendar, Flag, Tag, AlignLeft, Save, ChevronDown, Search } from "lucide-react";
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
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        setEditedTask(task);
        setNewCategory("");
        setIsCreatingCategory(false);
        setIsDropdownOpen(false);
        setSearchQuery("");
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
    
    const MAIN_CATEGORIES = ["Work", "Personal", "Shopping", "Health"];
    // Ensure unique categories, exclude "All", include the task's current category, and "Uncategorized"
    const allCategories = Array.from(new Set([...categories, editedTask?.category || "Uncategorized", "Uncategorized"])).filter(c => c !== "All" && c !== "All Tasks");
    
    // Sort: Main categories first (in specific order or alphabetical), then user categories alphabetically
    const uniqueCategories = [
        "Uncategorized",
        ...MAIN_CATEGORIES.filter(c => allCategories.includes(c)),
        ...allCategories.filter(c => c !== "Uncategorized" && !MAIN_CATEGORIES.includes(c)).sort((a, b) => a.localeCompare(b))
    ];


    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 dark:bg-black/40 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                        <h2 className="text-[17px] font-semibold tracking-tight text-gray-900 dark:text-white">Task Details</h2>
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
                                {isCreatingCategory ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newCategory}
                                            onChange={(e) => setNewCategory(e.target.value)}
                                            placeholder="Enter new category name"
                                            autoFocus
                                            className="flex-1 p-3 bg-secondary rounded-xl border-none focus:ring-2 focus:ring-[#0A84FF] text-foreground"
                                        />
                                        <button
                                            onClick={() => {
                                                if (newCategory.trim()) {
                                                    const n = newCategory.trim();
                                                    const normalized = n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
                                                    setEditedTask({ ...editedTask, category: normalized });
                                                    setIsCreatingCategory(false);
                                                }
                                            }}
                                            className="px-4 py-2 bg-[#5E5CE6] text-white rounded-xl font-medium hover:bg-[#5E5CE6]/90"
                                        >
                                            Add
                                        </button>
                                        <button
                                            onClick={() => setIsCreatingCategory(false)}
                                            className="px-4 py-2 bg-secondary text-muted-foreground rounded-xl font-medium hover:text-foreground"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            className="w-full flex items-center justify-between p-3 bg-secondary rounded-xl text-foreground text-left focus:ring-2 focus:ring-[#0A84FF] focus:outline-none"
                                        >
                                            <span className="truncate">{editedTask.category || "Uncategorized"}</span>
                                            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isDropdownOpen && "rotate-180")} />
                                        </button>
                                        
                                        <AnimatePresence>
                                            {isDropdownOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="absolute z-10 w-full mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden flex flex-col max-h-64"
                                                >
                                                    <div className="p-2 border-b border-border flex items-center gap-2">
                                                        <Search className="w-4 h-4 text-muted-foreground" />
                                                        <input 
                                                            type="text" 
                                                            autoFocus
                                                            placeholder="Search categories..."
                                                            value={searchQuery}
                                                            onChange={e => setSearchQuery(e.target.value)}
                                                            className="flex-1 bg-transparent border-none text-sm text-foreground focus:ring-0 p-1"
                                                        />
                                                    </div>
                                                    <div className="overflow-y-auto p-1.5 flex-1">
                                                        {uniqueCategories
                                                            .filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
                                                            .map(cat => (
                                                                <button
                                                                    key={cat}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setEditedTask({ ...editedTask, category: cat });
                                                                        setIsDropdownOpen(false);
                                                                    }}
                                                                    className={cn(
                                                                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                                                                        editedTask.category === cat ? "bg-[#5E5CE6]/10 text-[#5E5CE6] font-medium" : "text-foreground hover:bg-secondary"
                                                                    )}
                                                                >
                                                                    {cat}
                                                                </button>
                                                            ))}
                                                        {uniqueCategories.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                                                            <p className="text-center text-sm text-muted-foreground py-3">No categories found</p>
                                                        )}
                                                    </div>
                                                    <div className="p-1.5 border-t border-border">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setIsDropdownOpen(false);
                                                                setIsCreatingCategory(true);
                                                            }}
                                                            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#5E5CE6] hover:bg-[#5E5CE6]/10 transition-colors"
                                                        >
                                                            + Create New Category
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
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
                                className="w-full p-4 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl border-none focus:ring-2 focus:ring-[#0A84FF] focus:ring-opacity-50 text-gray-900 dark:text-white min-h-[120px] resize-none"
                                placeholder="Add more details about this task..."
                            />
                        </div>

                        {/* Created Date */}
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <Calendar className="w-4 h-4" />
                                <span>Created on {new Date(editedTask.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>

                            <button
                                onClick={async () => {
                                    const res = await fetch(`/api/tasks/${editedTask.id}/sync-calendar`, { method: "POST" });
                                    if (res.ok) {
                                        alert("Successfully added to Google Calendar!");
                                    } else {
                                        const data = await res.json();
                                        alert(data.error || "Failed to sync.");
                                    }
                                }}
                                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                                title="Add to Google Calendar"
                            >
                                <Calendar className="w-4 h-4" />
                                Add to Calendar
                            </button>
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
                            className="px-5 py-2.5 text-sm font-medium text-white bg-[#0A84FF] hover:bg-[#007AFF] active:scale-[0.98] rounded-xl transition-colors shadow-lg shadow-purple-500/20 flex items-center gap-2"
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
