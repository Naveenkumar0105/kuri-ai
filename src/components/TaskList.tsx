"use client";

import { Task, Category } from "@/types";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, Flag, Trash2, Calendar, Tag, RotateCcw, ChevronRight, ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface TaskListProps {
    tasks: Task[];
    onToggleTask: (id: string) => void;
    onDeleteTask: (id: string) => void;
    onTaskClick: (task: Task) => void;
    selectedCategory: Category | "All Tasks";
    suggestOrganizeTaskIds: Set<string>;
    onOrganizeTask: (task: Task) => void;
}

interface TaskItemProps {
    task: Task;
    isSubtask?: boolean;
    showCategory?: boolean;
    getSubtasks: (parentId: string) => Task[];
    onToggleTask: (id: string) => void;
    onDeleteTask: (id: string) => void;
    onTaskClick: (task: Task) => void;
    suggestOrganize?: boolean;
    onOrganizeTask?: (task: Task) => void;
}

const TaskItem = ({ task, isSubtask = false, showCategory = false, getSubtasks, onToggleTask, onDeleteTask, onTaskClick, suggestOrganize, onOrganizeTask }: TaskItemProps) => {
    const subtasks = getSubtasks(task.id);
    const [isExpanded, setIsExpanded] = useState(true);
    const [visualCompleted, setVisualCompleted] = useState(task.completed);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const prefersReducedMotion = useReducedMotion();
    const duration = prefersReducedMotion ? 0 : 0.3;

    useEffect(() => {
        if (!isTransitioning) {
            setVisualCompleted(task.completed);
        }
    }, [task.completed, isTransitioning]);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isTransitioning) return;

        setIsTransitioning(true);
        const newCompleted = !visualCompleted;
        setVisualCompleted(newCompleted);

        setTimeout(() => {
            onToggleTask(task.id);
            setTimeout(() => setIsTransitioning(false), 50);
        }, prefersReducedMotion ? 0 : 300);
    };

    /* Format a due date as a single, human-readable string */
    const formatDueDate = (date: Date): string => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const isToday = date.toDateString() === now.toDateString();
        const isTomorrow = date.toDateString() === tomorrow.toDateString();

        const timeStr = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

        if (isToday) return `Today, ${timeStr}`;
        if (isTomorrow) return `Tomorrow, ${timeStr}`;
        return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    };

    const isOverdue = task.dueDate && task.dateType === 'due' && new Date(task.dueDate) < new Date() && !task.completed;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -8 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className={cn(
                "group relative flex flex-col rounded-lg transition-colors",
                "hover:bg-secondary/60 dark:hover:bg-secondary/40",
                !isSubtask && "border-b border-border/60 last:border-b-0",
                isSubtask && "ml-7",
                visualCompleted && "opacity-70"
            )}
        >
            <div className={cn("flex items-start gap-3 px-3", isSubtask ? "py-2" : "py-2.5")}>
            {/* Checkbox — 44px touch target wrapping a 20px visual circle */}
            <button
                onClick={handleToggle}
                disabled={isTransitioning}
                className={cn(
                    "flex-shrink-0 w-[44px] h-[44px] -m-3 flex items-center justify-center",
                    isTransitioning && "cursor-default"
                )}
                aria-label={visualCompleted ? "Mark as incomplete" : "Mark as complete"}
            >
                <div className={cn(
                    "w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-all duration-200",
                    visualCompleted
                        ? "bg-[#5E5CE6] border-[#5E5CE6] text-white"
                        : "border-border dark:border-[#48484A] hover:border-[#5E5CE6]"
                )}>
                    <AnimatePresence>
                        {visualCompleted && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ duration: prefersReducedMotion ? 0 : 0.15, type: "spring", stiffness: 500, damping: 30 }}
                            >
                                <Check className="w-3 h-3" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </button>

            {/* Task content */}
            <div
                className="flex-1 min-w-0 cursor-pointer pt-0.5"
                onClick={() => onTaskClick(task)}
            >
                <div className="flex items-center gap-2">
                    {subtasks.length > 0 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                            className="p-0.5 hover:bg-secondary rounded transition-colors text-muted-foreground"
                            aria-label={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
                        >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                    )}
                    <div className="relative flex-1 min-w-0">
                        <p className={cn(
                            "text-[15px] leading-snug font-medium truncate transition-colors duration-200",
                            visualCompleted ? "text-muted-foreground" : "text-foreground"
                        )}>
                            {task.text}
                        </p>
                        {visualCompleted && (
                            <motion.div
                                initial={false}
                                animate={{ width: "100%" }}
                                transition={{ duration }}
                                className="absolute left-0 top-1/2 h-[1px] bg-muted-foreground/50 origin-left"
                                style={{ marginTop: "-0.5px" }}
                            />
                        )}
                    </div>
                </div>

                {/* Metadata row — priority, due date, category (only when not grouped) */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[12px] font-medium text-muted-foreground">
                    {subtasks.length > 0 && (
                        <span className="flex items-center gap-1 font-semibold text-[#5E5CE6]">
                            {subtasks.filter(s => s.completed).length} of {subtasks.length} completed
                        </span>
                    )}
                    {subtasks.length > 0 && (task.priority || task.dueDate || showCategory) && <span className="text-border">·</span>}
                    {task.priority && (
                        <span className={cn(
                            "flex items-center gap-1",
                            task.priority === 'High' ? "text-[#EF4444]" :
                                task.priority === 'Medium' ? "text-[#F59E0B]" :
                                    "text-[#5E5CE6]"
                        )}>
                            <Flag className="w-3 h-3" />
                            {task.priority}
                        </span>
                    )}
                    {task.priority && task.dueDate && <span className="text-border">·</span>}
                    {task.dueDate && (
                        <span className={cn(
                            "flex items-center gap-1",
                            isOverdue && "text-[#EF4444] font-semibold"
                        )}>
                            <Calendar className="w-3 h-3" />
                            {formatDueDate(new Date(task.dueDate))}
                        </span>
                    )}
                    {showCategory && !isSubtask && (
                        <>
                            {(task.priority || task.dueDate) && <span className="text-border">·</span>}
                            <span className="flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                {task.category}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Hover actions */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pt-0.5">
                {suggestOrganize && !task.completed && onOrganizeTask && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onOrganizeTask(task); }}
                        className="p-1.5 text-muted-foreground hover:text-[#5E5CE6] hover:bg-[#5E5CE6]/10 rounded-lg transition-colors"
                        title="Organize with AI"
                        aria-label="Organize with AI"
                    >
                        <Sparkles className="w-4 h-4" />
                    </button>
                )}
                {task.completed && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleTask(task.id); }}
                        className="p-1.5 text-muted-foreground hover:text-[#5E5CE6] hover:bg-[#5E5CE6]/10 rounded-lg transition-colors"
                        title="Undo"
                        aria-label="Undo completion"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                )}
                <button
                    onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                    className="p-1.5 text-muted-foreground hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors"
                    title="Delete"
                    aria-label="Delete task"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
                {task.dueDate && !task.completed && (
                    <a
                        href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(task.text)}&details=${encodeURIComponent(task.description || "")}&dates=${new Date(task.dueDate).toISOString().replace(/-|:|\.\d\d\d/g, "")}/${new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-muted-foreground hover:text-[#5E5CE6] hover:bg-[#5E5CE6]/10 rounded-lg transition-colors"
                        title="Add to Google Calendar"
                        aria-label="Add to Google Calendar"
                    >
                        <Calendar className="w-4 h-4" />
                    </a>
                )}
            </div>

            </div>

            {/* Subtasks */}
            {subtasks.length > 0 && isExpanded && (
                <div className="flex flex-col w-full pb-2">
                    {subtasks.map(subtask => (
                        <TaskItem
                            key={subtask.id}
                            task={subtask}
                            isSubtask={true}
                            getSubtasks={getSubtasks}
                            onToggleTask={onToggleTask}
                            onDeleteTask={onDeleteTask}
                            onTaskClick={onTaskClick}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export function TaskList({ tasks, onToggleTask, onDeleteTask, onTaskClick, selectedCategory, suggestOrganizeTaskIds, onOrganizeTask }: TaskListProps) {
    const rootTasks = tasks.filter(t => !t.parentId || !tasks.some(p => p.id === t.parentId));
    const getSubtasks = (parentId: string) => tasks.filter(t => t.parentId === parentId);

    const isAllOrCompleted = selectedCategory === "All Tasks" || selectedCategory === "Completed";

    /* When viewing a specific category, don't show category badges on rows */
    const showCategoryOnRows = isAllOrCompleted;

        const normalizeCategory = (cat: string) => {
        const c = (cat || "Uncategorized").trim();
        return c.charAt(0).toUpperCase() + c.slice(1).toLowerCase();
    };

    const groupedTasks = isAllOrCompleted
        ? rootTasks.reduce((acc, task) => {
            const cat = normalizeCategory(task.category);
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(task);
            return acc;
        }, {} as Record<string, Task[]>)
        : { [selectedCategory]: rootTasks.filter(t => normalizeCategory(t.category) === selectedCategory) };

    if (isAllOrCompleted) {
        // nothing extra needed
    } else if (!groupedTasks[selectedCategory]) {
        groupedTasks[selectedCategory as Category] = [];
    }

    const categoriesToShow = (isAllOrCompleted
        ? Object.entries(groupedTasks)
        : [[selectedCategory, groupedTasks[selectedCategory as Category]]]) as [string, Task[]][];

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mb-4">
                    <Tag className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold text-foreground">No tasks found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    {selectedCategory === "All Tasks"
                        ? "Start by adding a new task above."
                        : `No tasks in ${selectedCategory}. Add one to get started!`}
                </p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            {categoriesToShow.map(([category, categoryTasks]) => (
                (categoryTasks as Task[]).length > 0 && (
                    <motion.div
                        key={category}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Section heading — only when grouped by category */}
                        {isAllOrCompleted && (
                            <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 px-3 mb-2">
                                {category}
                                <span className="font-normal">· {(categoryTasks as Task[]).length}</span>
                            </h3>
                        )}

                        <div className="flex flex-col bg-card rounded-xl border border-border overflow-hidden">
                            <AnimatePresence mode="popLayout">
                                {(categoryTasks as Task[]).map((task) => (
                                    <TaskItem
                                        key={task.id}
                                        task={task}
                                        showCategory={showCategoryOnRows}
                                        getSubtasks={getSubtasks}
                                        onToggleTask={onToggleTask}
                                        onDeleteTask={onDeleteTask}
                                        onTaskClick={onTaskClick}
                                        suggestOrganize={suggestOrganizeTaskIds.has(task.id)}
                                        onOrganizeTask={onOrganizeTask}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )
            ))}
        </div>
    );
}
