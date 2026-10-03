"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { TaskList } from "@/components/TaskList";
import { SettingsModal } from "@/components/SettingsModal";
import { TaskInput } from "@/components/TaskInput";
import { TaskDetailsModal } from "@/components/TaskDetailsModal";
import { DecompositionModal } from "@/components/DecompositionModal";
import { SharedSpacesModal } from "@/components/SharedSpacesModal";
import { ActivityPanel } from "@/components/ActivityPanel";
import { Task, Category, SharedSpace, TaskActivity } from "@/types";
import { ArrowUpDown, Bell, CircleDashed, UserCheck, Clock3 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [spaces, setSpaces] = useState<SharedSpace[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState("personal");
  const [isSpacesModalOpen, setIsSpacesModalOpen] = useState(false);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [unreadActivityCount, setUnreadActivityCount] = useState(0);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [attentionFilter, setAttentionFilter] = useState<"all" | "unclaimed" | "mine" | "overdue">("all");
  const [categoriesRegistry, setCategoriesRegistry] = useState<string[]>(["Work", "Personal", "Shopping", "Health"]);

  // Derived State Logic
  const permanentLists = ["Work", "Personal", "Shopping", "Health"];
  const scopedTasks = tasks.filter(task => selectedSpaceId === "personal" ? !task.sharedSpaceId : task.sharedSpaceId === selectedSpaceId);
  
  const parentIds = new Set(scopedTasks.filter(t => t.parentId).map(t => t.parentId));
  const counts = { "All Tasks": 0, "Uncategorized": 0, "Completed": 0 } as Record<string, number>;
  const dynamicListCounts = {} as Record<string, number>;
  permanentLists.forEach(list => dynamicListCounts[list] = 0);

  scopedTasks.forEach(task => {
      if (task.completed) {
          counts["Completed"]++;
          return; // completed tasks don't count towards active list counts
      }
      if (parentIds.has(task.id)) return; // skip active parents (they are just containers for subtasks)

      counts["All Tasks"]++;

      // Normalize category capitalization
      const category = (task.category || "Uncategorized").trim();
      const normalizedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();

      if (normalizedCategory === "Uncategorized" || normalizedCategory === "Project") {
          counts["Uncategorized"]++;
      } else {
          if (dynamicListCounts[normalizedCategory] === undefined) {
              dynamicListCounts[normalizedCategory] = 0;
          }
          dynamicListCounts[normalizedCategory]++;
      }
  });

  const visibleLists = Object.keys(dynamicListCounts).filter(list => 
      permanentLists.includes(list) || dynamicListCounts[list] > 0
  );

  const [selectedCategory, setSelectedCategory] = useState<string>("All Tasks");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [sortByPriority, setSortByPriority] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Decomposition Modal State
  const [isDecompositionModalOpen, setIsDecompositionModalOpen] = useState(false);
  const [pendingSubtasks, setPendingSubtasks] = useState<any[]>([]);
  const [pendingOriginalTask, setPendingOriginalTask] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [organizingTaskId, setOrganizingTaskId] = useState<string | null>(null);
  const [suggestOrganizeTaskIds, setSuggestOrganizeTaskIds] = useState<Set<string>>(new Set());
  const [aiPreference, setAiPreference] = useState<string>("SPLIT_ONLY");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string, onUndo?: () => void } | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/user/preference")
        .then(res => res.json())
        .then(data => {
            if (data.preference) setAiPreference(data.preference);
        });
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated" || selectedSpaceId === "personal") return;
    const loadActivity = () => fetch(`/api/spaces/${selectedSpaceId}/activity`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.activities)) setActivities(data.activities);
        if (typeof data.unreadCount === "number") {
          setUnreadActivityCount(data.unreadCount);
          setSpaces(prev => prev.map(space => space.id === selectedSpaceId ? { ...space, unreadActivityCount: data.unreadCount } : space));
        }
      })
      .catch(err => console.error("Failed to fetch activity", err));
    void loadActivity();
    const interval = window.setInterval(loadActivity, 5000);
    return () => window.clearInterval(interval);
  }, [selectedSpaceId, status]);

  useEffect(() => {
    if (status === "authenticated") {
      const loadSpaces = () => fetch("/api/spaces")
          .then(res => res.json())
          .then(data => { if (Array.isArray(data)) setSpaces(data); })
          .catch(err => console.error("Failed to fetch spaces", err));
      void loadSpaces();
      const interval = window.setInterval(loadSpaces, 15000);
      return () => window.clearInterval(interval);
    }
  }, [status]);

  useEffect(() => {
    const handleOpen = () => setIsSettingsOpen(true);
    window.addEventListener('open-settings', handleOpen);
    return () => window.removeEventListener('open-settings', handleOpen);
  }, []);

  const handlePreferenceChange = async (pref: string) => {
    setAiPreference(pref);
    fetch("/api/user/preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preference: pref })
    });
  };

  const showToast = (message: string, onUndo?: () => void) => {
    setToast({ message, onUndo });
    setTimeout(() => setToast(null), 6000);
  };


  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch tasks from API
  useEffect(() => {
    if (status === "authenticated") {
      const loadTasks = () => {
        if (document.visibilityState === "hidden") return;
        fetch("/api/tasks")
          .then((res) => res.json())
          .then((data) => { if (Array.isArray(data)) setTasks(data); })
          .catch((err) => console.error("Failed to fetch tasks", err));
      };
      loadTasks();
      const interval = window.setInterval(loadTasks, 5000);
      window.addEventListener("focus", loadTasks);
      return () => {
        window.clearInterval(interval);
        window.removeEventListener("focus", loadTasks);
      };
    }
  }, [status]);


  
  const registerCategory = async (name: string) => {
      const normalized = name.trim().charAt(0).toUpperCase() + name.trim().slice(1).toLowerCase();
      if (!categoriesRegistry.includes(normalized)) {
          setCategoriesRegistry(prev => [...prev, normalized].sort());
      }
      try {
          await fetch("/api/categories", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: normalized })
          });
      } catch (e) { console.error("Failed to register category", e); }
  };

  const addTask = async (text: string, useAI: boolean = false, targetSpaceId: string = selectedSpaceId): Promise<boolean> => {
    try {
      setError(null);

      if (!useAI) {
        // Quick Add Path
        const tempId = `temp-${Date.now()}`;
        const isAddingToCurrentSpace = targetSpaceId === selectedSpaceId;
        const categoryToUse = isAddingToCurrentSpace && selectedCategory !== "All Tasks" && selectedCategory !== "Completed" ? selectedCategory : "Uncategorized";
        const optimisticTask: Task = {
            id: tempId,
            text,
            category: categoryToUse as Category,
            completed: false,
            userId: session?.user?.id || "temp",
            sharedSpaceId: targetSpaceId === "personal" ? null : targetSpaceId,
            createdAt: Date.now()
        };

        setTasks((prev) => [optimisticTask, ...prev]);
        const hasDateOrMulti = /\b(at|by|on|in|tomorrow|today|mon|tue|wed|thu|fri|sat|sun|\d{1,2}:\d{2}|\d{1,2}\s*[ap]m|and|then)\b/i.test(text);

        const res = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, category: categoryToUse, sharedSpaceId: targetSpaceId === "personal" ? null : targetSpaceId }),
        });

        if (!res.ok) {
            setTasks(prev => prev.filter(task => task.id !== tempId));
            throw new Error("Failed to save task");
        }
        const savedTask = await res.json();
        
        setTasks((prev) => prev.map(t => t.id === tempId ? savedTask : t));

        if (hasDateOrMulti) {
            setSuggestOrganizeTaskIds(prev => new Set(prev).add(savedTask.id));
        }
        return true;
      }

      // AI Path
      setIsProcessing(true);
      const response = await fetch("/api/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, userLocalTime: new Date().toString() }),
      });

      const data = await response.json();

      const tasksGenerated = data.tasks || [];
      const hasDecomp = data.decomposition && data.decomposition.length > 0;
      const firstTask = tasksGenerated[0] || { text, category: "Uncategorized" };
      
      const hasDate = !!firstTask.dueDate;
      const isCategoryChanged = firstTask.category !== "Uncategorized" && firstTask.category !== "Project";
      const isMultiTask = tasksGenerated.length > 1;

      const isMeaningful = hasDecomp || hasDate || isMultiTask || isCategoryChanged;

      let shouldConfirm = false;
      if (aiPreference === "ALWAYS" && isMeaningful) shouldConfirm = true;
      if (aiPreference === "SPLIT_ONLY" && (hasDecomp || isMultiTask)) shouldConfirm = true;
      // NEVER asks are never true.

      if (shouldConfirm) {
        setPendingSubtasks(hasDecomp ? data.decomposition : tasksGenerated);
        setPendingOriginalTask(text);
        setIsDecompositionModalOpen(true);
      } else {
        // Apply instantly
        if (hasDecomp || isMultiTask) {
            const listToUse = hasDecomp ? data.decomposition : tasksGenerated;
            const parentCategory = listToUse.length > 0 ? listToUse[0].category : "Project";
            const [parentTask] = await saveTasks([{ text, category: parentCategory }]);
            let subtasksSaved = [];
            if (parentTask && parentTask.id) {
                subtasksSaved = await saveTasks(listToUse, parentTask.id);
            }
            showToast(`Task split into ${listToUse.length} parts`, async () => {
                if (parentTask?.id) {
                   await fetch(`/api/tasks/${parentTask.id}`, { method: "DELETE" });
                   setTasks(prev => prev.filter(t => t.id !== parentTask.id && t.parentId !== parentTask.id));
                   await saveTasks([{ text, category: "Uncategorized" }]);
                }
            });
        } else {
            const [saved] = await saveTasks(tasksGenerated);
            let msg = "Changes applied";
            if (hasDate) msg = `Date extracted for "${text}"`;
            else if (isCategoryChanged) msg = `Categorized as ${firstTask.category}`;
            
            showToast(msg, async () => {
                if (saved?.id) {
                    await fetch(`/api/tasks/${saved.id}`, { method: "DELETE" });
                    setTasks(prev => prev.filter(t => t.id !== saved.id));
                    await saveTasks([{ text, category: "Uncategorized" }]);
                }
            });
        }
      }
      return true;
    } catch (error) {
      console.error("Error adding task:", error);
      setError("Failed to process task. You can retry or Quick Add.");
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const organizeTask = async (task: Task) => {
    try {
        setError(null);
        setIsProcessing(true);
        const response = await fetch("/api/categorize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: task.text, userLocalTime: new Date().toString() }),
        });

        const data = await response.json();
        
        setSuggestOrganizeTaskIds(prev => {
            const next = new Set(prev);
            next.delete(task.id);
            return next;
        });

        const tasksGenerated = data.tasks || [];
        const hasDecomp = data.decomposition && data.decomposition.length > 0;
        const firstTask = tasksGenerated[0] || { text: task.text, category: task.category };

        const hasDate = !!firstTask.dueDate;
        const isCategoryChanged = firstTask.category !== task.category;
        const isMultiTask = tasksGenerated.length > 1;
        const isMeaningful = hasDecomp || hasDate || isMultiTask || isCategoryChanged;

        let shouldConfirm = false;
        if (aiPreference === "ALWAYS" && isMeaningful) shouldConfirm = true;
        if (aiPreference === "SPLIT_ONLY" && (hasDecomp || isMultiTask)) shouldConfirm = true;

        if (shouldConfirm) {
            setPendingSubtasks(hasDecomp ? data.decomposition : tasksGenerated);
            setPendingOriginalTask(task.text);
            setOrganizingTaskId(task.id);
            setIsDecompositionModalOpen(true);
        } else if (isMeaningful) {
            // Apply instantly
            const originalState = { ...task };
            if (hasDecomp || isMultiTask) {
                const listToUse = hasDecomp ? data.decomposition : tasksGenerated;
                const parentCategory = listToUse.length > 0 ? listToUse[0].category : task.category;
                await updateTask({ ...task, category: parentCategory as Category });
                const subtasksSaved = await saveTasks(listToUse, task.id);
                showToast(`Task split into ${listToUse.length} parts`, async () => {
                    await updateTask(originalState);
                    for (const s of subtasksSaved) {
                        await fetch(`/api/tasks/${s.id}`, { method: "DELETE" });
                    }
                    setTasks(prev => prev.filter(t => t.parentId !== task.id));
                });
            } else {
                const updated = { ...task, ...firstTask };
                await updateTask(updated);
                
                let msg = "Changes applied";
                if (hasDate) msg = `Date extracted`;
                else if (isCategoryChanged) msg = `Categorized as ${firstTask.category}`;
                
                showToast(msg, async () => {
                    await updateTask(originalState);
                });
            }
        }
    } catch (err) {
        setError("Failed to organize task. Please try again.");
    } finally {
        setIsProcessing(false);
    }
  };

  const saveTasks = async (tasksToSave: any[], parentId?: string) => {
    const saved = [];
    for (const t of tasksToSave) {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: t.text,
          category: t.category || (selectedCategory !== "All Tasks" && selectedCategory !== "Completed" ? selectedCategory : "Uncategorized"),
          dueDate: t.dueDate,
          dateType: t.dateType,
          priority: t.priority,
          parentId: parentId || undefined,
          sharedSpaceId: selectedSpaceId === "personal" ? null : selectedSpaceId,
        }),
      });
      const savedTask = await res.json();
      setTasks((prev) => [savedTask, ...prev]);
      if (savedTask.category && savedTask.category !== "Uncategorized" && savedTask.category !== "Project") {
          registerCategory(savedTask.category);
      }
      saved.push(savedTask);
    }
    return saved;
  };

  const handleConfirmDecomposition = async (editedSubtasks: any[]) => {
    setIsDecompositionModalOpen(false);
    
    if (organizingTaskId) {
        const parentTask = tasks.find(t => t.id === organizingTaskId);
        const originalState = { ...parentTask };
        if (parentTask) {
            if (editedSubtasks.length === 1) {
                await updateTask({ ...parentTask, ...editedSubtasks[0] });
                showToast("Task updated", async () => { await updateTask(originalState as Task) });
            } else {
                const parentCategory = editedSubtasks[0].category;
                await updateTask({ ...parentTask, category: parentCategory as Category });
                const subs = await saveTasks(editedSubtasks, parentTask.id);
                showToast(`Task split into ${editedSubtasks.length} parts`, async () => {
                    await updateTask(originalState as Task);
                    for (const s of subs) await fetch(`/api/tasks/${s.id}`, { method: "DELETE" });
                    setTasks(prev => prev.filter(t => t.parentId !== parentTask.id));
                });
            }
        }
        setOrganizingTaskId(null);
    } else {
        if (editedSubtasks.length === 1) {
            const [saved] = await saveTasks(editedSubtasks);
            showToast("Task created", async () => {
                if(saved?.id) {
                    await fetch(`/api/tasks/${saved.id}`, { method: "DELETE" });
                    setTasks(prev => prev.filter(t => t.id !== saved.id));
                    await saveTasks([{ text: pendingOriginalTask, category: "Uncategorized" }]);
                }
            });
        } else {
            const parentCategory = editedSubtasks.length > 0 ? editedSubtasks[0].category : "Project";
            const [parentTask] = await saveTasks([{ text: pendingOriginalTask, category: parentCategory }]);
            if (parentTask && parentTask.id) {
                const subs = await saveTasks(editedSubtasks, parentTask.id);
                showToast(`Task split into ${editedSubtasks.length} parts`, async () => {
                   if (parentTask.id) {
                      await fetch(`/api/tasks/${parentTask.id}`, { method: "DELETE" });
                      setTasks(prev => prev.filter(t => t.id !== parentTask.id && t.parentId !== parentTask.id));
                      await saveTasks([{ text: pendingOriginalTask, category: "Uncategorized" }]);
                   }
                });
            }
        }
    }

    setPendingSubtasks([]);
    setPendingOriginalTask("");
  };

  const handleUseOriginal = async () => {
    setIsDecompositionModalOpen(false);
    if (!organizingTaskId) {
        await saveTasks([{ text: pendingOriginalTask, category: "Personal" }]);
    }
    setOrganizingTaskId(null);
    setPendingSubtasks([]);
    setPendingOriginalTask("");
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const isCompleting = !task.completed;
    const children = tasks.filter((t) => t.parentId === id);
    const parentId = task.parentId;
    const parent = parentId ? tasks.find(t => t.id === parentId) : null;
    
    // Store original state for Undo
    const originalTasks = [...tasks];

    const tasksToUpdate = [{ id: task.id, completed: isCompleting }];
    let toastMessage = null;

    if (children.length > 0) {
        // Parent was clicked
        if (isCompleting) {
            const incompleteChildren = children.filter(c => !c.completed);
            if (incompleteChildren.length > 0) {
                // Complete all children as well
                incompleteChildren.forEach(c => tasksToUpdate.push({ id: c.id, completed: true }));
                toastMessage = `Completed "${task.text}" and ${incompleteChildren.length} subtasks`;
            } else {
                toastMessage = `Completed "${task.text}"`;
            }
        } else {
            // Uncompleting parent doesn't auto-uncomplete children unless we want it to, 
            // but standard behavior is usually just uncomplete the parent.
        }
    } else if (parentId && parent) {
        // Child was clicked
        if (isCompleting) {
            const siblings = tasks.filter(t => t.parentId === parentId && t.id !== task.id);
            const allSiblingsCompleted = siblings.every(s => s.completed);
            if (allSiblingsCompleted && !parent.completed) {
                // Auto-complete parent
                tasksToUpdate.push({ id: parent.id, completed: true });
                toastMessage = `All subtasks done! "${parent.text}" completed.`;
            }
        } else {
            if (parent.completed) {
                // Uncomplete parent
                tasksToUpdate.push({ id: parent.id, completed: false });
            }
        }
    }

    // Apply Optimistic Update
    const updateIds = new Set(tasksToUpdate.map(t => t.id));
    const completionMap = new Map(tasksToUpdate.map(t => [t.id, t.completed]));
    
    setTasks((prev) =>
        prev.map((t) => (updateIds.has(t.id) ? { ...t, completed: completionMap.get(t.id) ?? t.completed } : t))
    );

    // Call APIs in parallel
    Promise.all(tasksToUpdate.map(t => 
        fetch(`/api/tasks/${t.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ completed: t.completed }),
        })
    )).catch(err => {
        console.error("Failed to toggle tasks:", err);
        setTasks(originalTasks); // rollback
    });

    if (toastMessage) {
        showToast(toastMessage, async () => {
            setTasks(originalTasks);
            // Revert all
            Promise.all(tasksToUpdate.map(t => 
                fetch(`/api/tasks/${t.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    // revert to !t.completed (the original state)
                    body: JSON.stringify({ completed: !t.completed }),
                })
            ));
        });
    }
  };

  const deleteTask = async (id: string) => {
    const previousTasks = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));

    const response = await fetch(`/api/tasks/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setTasks(previousTasks);
      const data = await response.json().catch(() => ({}));
      showToast(data.error || "Could not delete this task");
    }
  };

  const claimTask = async (task: Task) => {
    const response = await fetch(`/api/tasks/${task.id}/claim`, { method: "POST" });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.error || "Could not claim this task");
      return;
    }
    setTasks(prev => prev.map(item => item.id === task.id ? data : item));
    showToast(data.claimedById ? "Task claimed" : "Task released");
  };

  const handleSpaceAdded = (space: SharedSpace) => {
    setSpaces(prev => [...prev.filter(item => item.id !== space.id), space]);
    setSelectedSpaceId(space.id);
    setSelectedCategory("All Tasks");
    setAttentionFilter("all");
    setActivities([]);
    setUnreadActivityCount(0);
    setIsSpacesModalOpen(false);
  };

  const selectSpace = (spaceId: string) => {
    setSelectedSpaceId(spaceId);
    setSelectedCategory("All Tasks");
    setAttentionFilter("all");
    setIsActivityOpen(false);
    setActivities([]);
    setUnreadActivityCount(0);
  };

  const selectCategory = (category: string) => {
    setSelectedCategory(category);
    setAttentionFilter("all");
  };

  const openActivity = () => {
    if (selectedSpaceId === "personal") return;
    setIsActivityOpen(true);
    setUnreadActivityCount(0);
    setSpaces(prev => prev.map(space => space.id === selectedSpaceId ? { ...space, unreadActivityCount: 0 } : space));
    void fetch(`/api/spaces/${selectedSpaceId}/activity`, { method: "POST" });
  };

  const updateTask = async (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    if (updatedTask.category && updatedTask.category !== "Uncategorized" && updatedTask.category !== "Project") {
        registerCategory(updatedTask.category);
    }

    await fetch(`/api/tasks/${updatedTask.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedTask),
    });
  };

  // ... (Rest of the filtering and sorting logic remains similar)

  const categories = categoriesRegistry;

  const isTaskInSelectedCategory = (task: Task): boolean => {
    if (selectedCategory === "All Tasks") return !task.completed;
    if (selectedCategory === "Completed") return task.completed;
    
    if (task.completed) return false;
    
    if (!task.parentId) {
      return task.category === selectedCategory;
    }
    
    const parent = scopedTasks.find(t => t.id === task.parentId);
    
    const cat = (task.category || "Uncategorized").trim();
    const normalized = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
    return parent ? isTaskInSelectedCategory(parent) : normalized === selectedCategory;
  };

  const activeSpace = spaces.find(space => space.id === selectedSpaceId);
  const isOverdueTask = (task: Task) => Boolean(task.dueDate && (!task.dateType || task.dateType === "due") && new Date(task.dueDate) < new Date() && !task.completed);
  const attentionCounts = {
    all: scopedTasks.filter(task => !task.completed).length,
    unclaimed: scopedTasks.filter(task => !task.completed && !task.claimedById).length,
    mine: scopedTasks.filter(task => !task.completed && task.claimedById === session?.user?.id).length,
    overdue: scopedTasks.filter(isOverdueTask).length,
  };
  const filteredTasks = scopedTasks
    .filter(isTaskInSelectedCategory)
    .filter(task => {
      if (!activeSpace || selectedCategory === "Completed" || attentionFilter === "all") return true;
      if (attentionFilter === "unclaimed") return !task.claimedById;
      if (attentionFilter === "mine") return task.claimedById === session?.user?.id;
      return isOverdueTask(task);
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
    <div className="flex h-[100dvh] overflow-hidden bg-background text-foreground transition-colors duration-300">
      <Sidebar
        selectedCategory={selectedCategory}
        onSelectCategory={selectCategory}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        counts={counts}
        dynamicListCounts={dynamicListCounts}
        visibleLists={visibleLists}
        spaces={spaces}
        selectedSpaceId={selectedSpaceId}
        onSelectSpace={selectSpace}
        onManageSpaces={() => setIsSpacesModalOpen(true)}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <main className="w-full max-w-[860px] mx-auto p-6 md:px-12 md:py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
              {activeSpace ? `${activeSpace.name} · ${selectedCategory}` : selectedCategory}
              {sortByPriority && (
                <span className="text-[11px] font-medium px-2 py-0.5 bg-[#5E5CE6]/10 text-[#5E5CE6] rounded-md">
                  Priority
                </span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {selectedCategory === "All Tasks" || selectedCategory === "Completed" || selectedCategory === "Uncategorized" ? counts[selectedCategory] : dynamicListCounts[selectedCategory] || 0} task{(selectedCategory === "All Tasks" || selectedCategory === "Completed" || selectedCategory === "Uncategorized" ? counts[selectedCategory] : dynamicListCounts[selectedCategory]) !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeSpace && (
              <button
                onClick={openActivity}
                className="relative p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                title="Space activity"
                aria-label={`Space activity${unreadActivityCount ? `, ${unreadActivityCount} unread` : ""}`}
              >
                <Bell className="w-4 h-4" />
                {unreadActivityCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#EF4444] text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadActivityCount > 9 ? "9+" : unreadActivityCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setSortByPriority(!sortByPriority)}
              className={`p-2 rounded-lg transition-colors ${sortByPriority
                ? "bg-[#5E5CE6]/10 text-[#5E5CE6]"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              title="Sort by Priority"
              aria-label={sortByPriority ? "Disable priority sort" : "Sort by priority"}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {activeSpace && selectedCategory !== "Completed" && (
          <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
            {([
              { id: "all", label: "Open", icon: CircleDashed },
              { id: "unclaimed", label: "Unclaimed", icon: CircleDashed },
              { id: "mine", label: "Claimed by me", icon: UserCheck },
              { id: "overdue", label: "Overdue", icon: Clock3 },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setAttentionFilter(id); setSelectedCategory("All Tasks"); }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${attentionFilter === id ? "border-[#5E5CE6]/30 bg-[#5E5CE6]/10 text-[#5E5CE6]" : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                <span className="tabular-nums opacity-70">{attentionCounts[id]}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {selectedCategory !== "Completed" && (
            <div className="mb-2">
              <TaskInput onAddTask={addTask} isProcessing={isProcessing} />
            </div>
          )}

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full flex items-center justify-center p-3 mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
          


          <TaskList
            tasks={finalSortedTasks}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
            onTaskClick={(task) => {
              setSelectedTask(task);
              setIsDetailsModalOpen(true);
            }}
            suggestOrganizeTaskIds={suggestOrganizeTaskIds}
            onOrganizeTask={organizeTask}
            selectedCategory={selectedCategory}
            currentUserId={session?.user?.id}
            onClaimTask={claimTask}
          />
        </div>
      </main>
      </div>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-3.5 bg-[#1C1C1E] text-white rounded-full shadow-lg border border-white/10"
            >
                <span className="text-[15px] font-medium tracking-tight">{toast.message}</span>
                {toast.onUndo && (
                    <>
                        <div className="w-px h-4 bg-gray-700" />
                        <button
                            onClick={() => {
                                toast.onUndo?.();
                                setToast(null);
                            }}
                            className="text-sm font-bold text-[#0A84FF] hover:text-[#409CFF] active:opacity-70 transition-colors"
                        >
                            Undo
                        </button>
                    </>
                )}
            </motion.div>
        )}
      </AnimatePresence>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        preference={aiPreference} 
        onPreferenceChange={handlePreferenceChange} 
      />

      <SharedSpacesModal
        isOpen={isSpacesModalOpen}
        spaces={spaces}
        onClose={() => setIsSpacesModalOpen(false)}
        onSpaceAdded={handleSpaceAdded}
      />

      {activeSpace && (
        <ActivityPanel
          isOpen={isActivityOpen}
          spaceName={activeSpace.name}
          activities={activities}
          onClose={() => setIsActivityOpen(false)}
        />
      )}

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
