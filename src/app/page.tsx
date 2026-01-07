"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Sidebar } from "@/components/Sidebar";
import { TaskList } from "@/components/TaskList";
import { TaskInput } from "@/components/TaskInput";
import { TaskDetailsModal } from "@/components/TaskDetailsModal";
import { DecompositionModal } from "@/components/DecompositionModal";
import { Task, Category } from "@/types";
import { ListTree, ArrowUpDown } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All Tasks");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [sortByPriority, setSortByPriority] = useState(false);

  // Decomposition Modal State
  const [isDecompositionModalOpen, setIsDecompositionModalOpen] = useState(false);
  const [pendingSubtasks, setPendingSubtasks] = useState<any[]>([]);
  const [pendingOriginalTask, setPendingOriginalTask] = useState<string>("");

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch tasks from API
  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/tasks")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            // Ensure dates are properly converted if needed, though JSON returns strings
            setTasks(data);
          }
        })
        .catch((err) => console.error("Failed to fetch tasks", err));
    }
  }, [status]);

  const addTask = async (text: string) => {
    try {
      // Optimistic update (optional, but let's wait for API for now to get ID)
      // Actually, we can use local ID but API assigns one? No, Prisma assigns CUID.
      // So we should wait for API response.

      // AI Categorization
      const response = await fetch("/api/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          userLocalTime: new Date().toString()
        }),
      });

      const data = await response.json();



      if (data.decomposition && data.decomposition.length > 0) {
        // Show modal for confirmation
        setPendingSubtasks(data.decomposition);
        setPendingOriginalTask(text);
        setIsDecompositionModalOpen(true);
        return;
      }

      // If no decomposition, add directly
      const tasksToAdd = data.tasks || [{ text, category: "Uncategorized" }];
      await saveTasks(tasksToAdd);

    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const saveTasks = async (tasksToSave: any[]) => {
    for (const t of tasksToSave) {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: t.text,
          category: selectedCategory !== "All Tasks" ? selectedCategory : t.category,
          dueDate: t.dueDate,
          dateType: t.dateType,
        }),
      });
      const savedTask = await res.json();
      setTasks((prev) => [savedTask, ...prev]);
    }
  };

  const handleConfirmDecomposition = async (editedSubtasks: any[]) => {
    setIsDecompositionModalOpen(false);
    await saveTasks(editedSubtasks);
    setPendingSubtasks([]);
    setPendingOriginalTask("");
  };

  const handleUseOriginal = async () => {
    setIsDecompositionModalOpen(false);
    // Re-categorize the original task as a single task if needed, or just add it
    // For simplicity, let's just add it with a default category or re-use the one from the first attempt if available
    // But we don't have the category from the first attempt for the single task if it decomposed.
    // So let's just add it as "Uncategorized" or "Personal" for now, or re-fetch categorization for single task?
    // Better: Just add it.
    await saveTasks([{ text: pendingOriginalTask, category: "Personal" }]);
    setPendingSubtasks([]);
    setPendingOriginalTask("");
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const newCompleted = !task.completed;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: newCompleted } : t))
    );

    await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: newCompleted }),
    });
  };

  const deleteTask = async (id: string) => {
    // Optimistic update
    setTasks((prev) => prev.filter((t) => t.id !== id));

    await fetch(`/api/tasks/${id}`, {
      method: "DELETE",
    });
  };

  const updateTask = async (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );

    await fetch(`/api/tasks/${updatedTask.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedTask),
    });
  };

  // ... (Rest of the filtering and sorting logic remains similar)

  const categories = Array.from(
    new Set(tasks.filter((t) => !t.completed).map((t) => t.category))
  );

  const filteredTasks = tasks.filter((task) => {
    if (selectedCategory === "All Tasks") return !task.completed;
    if (selectedCategory === "Completed") return task.completed;
    return task.category === selectedCategory && !task.completed;
  });

  const finalSortedTasks = [...filteredTasks].sort((a, b) => {
    // 1. Primary Sort: Priority (if enabled)
    if (sortByPriority) {
      const priorityOrder = { High: 3, Medium: 2, Low: 1 };
      // Treat undefined/null as 0 (lowest)
      const pA = a.priority && priorityOrder[a.priority as keyof typeof priorityOrder] ? priorityOrder[a.priority as keyof typeof priorityOrder] : 0;
      const pB = b.priority && priorityOrder[b.priority as keyof typeof priorityOrder] ? priorityOrder[b.priority as keyof typeof priorityOrder] : 0;

      if (pA !== pB) {
        return pB - pA; // Descending (High -> Low -> None)
      }
    }

    // 2. Secondary Sort: Date Created (Newest First)
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (status === "unauthenticated") {
    return null; // Will redirect
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-neutral-950 transition-colors duration-300">
      <Sidebar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        tasks={tasks}
      />

      <main className="flex-1 p-4 lg:p-8 w-full max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800">
              <ListTree className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {selectedCategory}
                {sortByPriority && (
                  <span className="text-xs font-normal px-2 py-1 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300 rounded-full">
                    Priority
                  </span>
                )}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {finalSortedTasks.length} tasks
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortByPriority(!sortByPriority)}
              className={`p-2 rounded-lg transition-colors ${sortByPriority
                ? "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
                : "text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800"
                }`}
              title="Sort by Priority"
            >
              <ArrowUpDown className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {selectedCategory !== "Completed" && (
            <TaskInput onAddTask={addTask} isProcessing={false} />
          )}

          <TaskList
            tasks={finalSortedTasks}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
            onTaskClick={(task) => {
              setSelectedTask(task);
              setIsDetailsModalOpen(true);
            }}
            selectedCategory={selectedCategory}
          />
        </div>
      </main>

      {/* Modals */}
      <TaskDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        task={selectedTask}
        onUpdateTask={updateTask}
        categories={categories}
      />

      <DecompositionModal
        isOpen={isDecompositionModalOpen}
        onClose={() => setIsDecompositionModalOpen(false)}
        originalTaskText={pendingOriginalTask}
        subtasks={pendingSubtasks}
        onConfirm={handleConfirmDecomposition}
        onUseOriginal={handleUseOriginal}
      />
    </div>
  );
}
