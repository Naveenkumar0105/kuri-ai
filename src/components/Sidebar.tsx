import { Category, Task } from "@/types";
import { cn } from "@/lib/utils";
import {
    LayoutGrid,
    Briefcase,
    User,
    ShoppingCart,
    Heart,
    HelpCircle,
    CheckSquare,
    Hash
} from "lucide-react";

interface SidebarProps {
    selectedCategory: Category | "All";
    onSelectCategory: (category: Category | "All") => void;
    tasks: Task[];
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (isOpen: boolean) => void;
}

const DEFAULT_CATEGORIES: { id: Category | "All"; label: string; icon: React.ElementType }[] = [
    { id: "All Tasks", label: "All Tasks", icon: LayoutGrid },
    { id: "Work", label: "Work", icon: Briefcase },
    { id: "Personal", label: "Personal", icon: User },
    { id: "Shopping", label: "Shopping", icon: ShoppingCart },
    { id: "Health", label: "Health", icon: Heart },
];

export function Sidebar({ selectedCategory, onSelectCategory, tasks, isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
    // Calculate dynamic categories from active tasks
    const activeTasks = tasks.filter(t => !t.completed);
    const dynamicCategories = Array.from(new Set(activeTasks.map(t => t.category)))
        .filter(cat => !DEFAULT_CATEGORIES.some(dc => dc.id === cat) && cat !== "Uncategorized" && cat !== "Completed");

    return (
        <aside className="w-64 flex-shrink-0 hidden md:block border-r border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl h-screen sticky top-0 p-6">
            <div className="mb-8 px-2">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                    Kuri AI
                </h2>
            </div>

            <nav className="space-y-1">
                {/* Default Categories */}
                {DEFAULT_CATEGORIES.map((category) => {
                    const Icon = category.icon;
                    const isSelected = selectedCategory === category.id;

                    return (
                        <button
                            key={category.id}
                            onClick={() => onSelectCategory(category.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                                isSelected
                                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
                            )}
                        >
                            <Icon className={cn("w-4 h-4", isSelected ? "text-blue-600 dark:text-blue-400" : "text-gray-400")} />
                            {category.label}
                        </button>
                    );
                })}

                {/* Dynamic Categories */}
                {dynamicCategories.length > 0 && (
                    <>
                        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4">
                            Projects
                        </div>
                        {dynamicCategories.map((category) => {
                            const isSelected = selectedCategory === category;
                            return (
                                <button
                                    key={category}
                                    onClick={() => onSelectCategory(category)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                                        isSelected
                                            ? "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 shadow-sm"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
                                    )}
                                >
                                    <Hash className={cn("w-4 h-4", isSelected ? "text-purple-600 dark:text-purple-400" : "text-gray-400")} />
                                    {category}
                                </button>
                            );
                        })}
                    </>
                )}

                <div className="my-2 border-t border-gray-100 dark:border-gray-800" />

                {/* Fixed Bottom Categories */}
                <button
                    onClick={() => onSelectCategory("Uncategorized")}
                    className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                        selectedCategory === "Uncategorized"
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 shadow-sm"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
                    )}
                >
                    <HelpCircle className={cn("w-4 h-4", selectedCategory === "Uncategorized" ? "text-blue-600 dark:text-blue-400" : "text-gray-400")} />
                    Uncategorized
                </button>

                <button
                    onClick={() => onSelectCategory("Completed")}
                    className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                        selectedCategory === "Completed"
                            ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 shadow-sm"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
                    )}
                >
                    <CheckSquare className={cn("w-4 h-4", selectedCategory === "Completed" ? "text-green-600 dark:text-green-400" : "text-gray-400")} />
                    Completed
                </button>
            </nav>

            <div className="mt-auto pt-4">
                <UserProfile />
            </div>
        </aside>
    );
}

import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { LogOut, ChevronUp } from "lucide-react";

function UserProfile() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!session?.user) return null;

    const initials = session.user.name
        ? session.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : session.user.email?.[0].toUpperCase() || "U";

    return (
        <div className="relative" ref={menuRef}>
            {isOpen && (
                <div className="absolute bottom-full left-0 w-full mb-3 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-gray-100 dark:border-neutral-800 p-2 z-50 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-neutral-800 mb-1">
                        <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                            {session.user.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {session.user.email}
                        </p>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-xl transition-all duration-200 group",
                    isOpen ? "bg-gray-100 dark:bg-neutral-800" : "hover:bg-white dark:hover:bg-neutral-800/50 shadow-sm border border-gray-100 dark:border-neutral-800"
                )}
            >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs shadow-inner ring-2 ring-white dark:ring-neutral-900">
                    {initials}
                </div>
                <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {session.user.name?.split(' ')[0] || "User"}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">
                        View Account
                    </p>
                </div>
                <ChevronUp className={cn("w-4 h-4 text-gray-400 transition-transform duration-200", isOpen && "rotate-180")} />
            </button>
        </div>
    );
}
