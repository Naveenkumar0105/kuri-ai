"use client";
import { Folder, Inbox, CheckSquare, Hash, LogOut, Settings, ChevronUp, User } from "lucide-react";
import { Category } from "@/types";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

interface SidebarProps {
    selectedCategory: Category | "All Tasks";
    onSelectCategory: (category: Category | "All Tasks") => void;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (isOpen: boolean) => void;
    counts: Record<string, number>;
    dynamicListCounts: Record<string, number>;
    visibleLists: string[];
}

const NAV_SELECTED = "bg-card text-foreground shadow-sm border border-border";
const NAV_DEFAULT = "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent";

export function Sidebar({ selectedCategory, onSelectCategory, isMobileMenuOpen, setIsMobileMenuOpen, counts, dynamicListCounts, visibleLists }: SidebarProps) {
    return (
        <aside className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 bg-secondary/50 dark:bg-[#18181A] border-r border-border flex flex-col transition-transform duration-300 md:relative md:translate-x-0",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            {/* Mobile overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-[-1] md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <div className="p-5 pb-3">
                <h2 className="text-[15px] font-bold text-foreground tracking-tight flex items-center gap-2">
                    <div className="w-5 h-5 rounded-[6px] bg-[#5E5CE6] flex items-center justify-center shadow-sm">
                        <CheckSquare className="w-3 h-3 text-white" />
                    </div>
                    Kuri AI
                </h2>
            </div>

            <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
                {/* All Tasks */}
                <button
                    onClick={() => { onSelectCategory("All Tasks"); setIsMobileMenuOpen(false); }}
                    className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-[14px] font-medium transition-all duration-200",
                        selectedCategory === "All Tasks" ? NAV_SELECTED : NAV_DEFAULT
                    )}
                >
                    <div className="flex items-center gap-2.5">
                        <Inbox className={cn("w-4 h-4", selectedCategory === "All Tasks" ? "text-[#5E5CE6]" : "text-muted-foreground")} />
                        All Tasks
                    </div>
                    <span className="text-[12px] tabular-nums font-semibold text-muted-foreground/70">{counts["All Tasks"] || 0}</span>
                </button>

                {/* Dynamic categories */}
                {visibleLists.length > 0 && (
                    <>
                        <div className="pt-5 pb-1.5 px-3">
                            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                                Lists
                            </h3>
                        </div>

                        {visibleLists.map((category) => {
                            const isSelected = selectedCategory === category;
                            return (
                                <button
                                    key={category}
                                    onClick={() => { onSelectCategory(category as Category); setIsMobileMenuOpen(false); }}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-[14px] font-medium transition-all duration-200",
                                        isSelected ? NAV_SELECTED : NAV_DEFAULT
                                    )}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Hash className={cn("w-4 h-4", isSelected ? "text-[#5E5CE6]" : "text-muted-foreground")} />
                                        {category}
                                    </div>
                                    <span className="text-[12px] tabular-nums font-semibold text-muted-foreground/70">{dynamicListCounts[category] || 0}</span>
                                </button>
                            );
                        })}
                    </>
                )}

                {/* System */}
                <div className="pt-5 pb-1.5 px-3">
                    <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                        System
                    </h3>
                </div>

                <button
                    onClick={() => { onSelectCategory("Uncategorized"); setIsMobileMenuOpen(false); }}
                    className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-[14px] font-medium transition-all duration-200",
                        selectedCategory === "Uncategorized" ? NAV_SELECTED : NAV_DEFAULT
                    )}
                >
                    <div className="flex items-center gap-2.5">
                        <Folder className={cn("w-4 h-4", selectedCategory === "Uncategorized" ? "text-[#5E5CE6]" : "text-muted-foreground")} />
                        Uncategorized
                    </div>
                    <span className="text-[12px] tabular-nums font-semibold text-muted-foreground/70">{counts["Uncategorized"] || 0}</span>
                </button>

                <button
                    onClick={() => { onSelectCategory("Completed"); setIsMobileMenuOpen(false); }}
                    className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-[14px] font-medium transition-all duration-200",
                        selectedCategory === "Completed" ? NAV_SELECTED : NAV_DEFAULT
                    )}
                >
                    <div className="flex items-center gap-2.5">
                        <CheckSquare className={cn("w-4 h-4", selectedCategory === "Completed" ? "text-green-600 dark:text-green-500" : "text-muted-foreground")} />
                        Completed
                    </div>
                    <span className="text-[12px] tabular-nums font-semibold text-muted-foreground/70">{counts["Completed"] || 0}</span>
                </button>
            </nav>

            <div className="p-3 mt-auto border-t border-border">
                <UserProfile />
            </div>
        </aside>
    );
}

function UserProfile() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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

    return (
        <div className="relative" ref={menuRef}>
            {isOpen && (
                <div className="absolute bottom-full left-0 w-full mb-2 bg-card rounded-xl shadow-lg border border-border p-1.5 z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-1 duration-200">
                    <div className="px-3 py-2.5 border-b border-border mb-1.5">
                        <p className="font-semibold text-[13px] text-foreground truncate">
                            {session.user.name || "User"}
                        </p>
                        <p className="text-[12px] text-muted-foreground truncate">
                            {session.user.email}
                        </p>
                    </div>
                    <button
                        onClick={() => { setIsOpen(false); window.dispatchEvent(new Event('open-settings')); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-foreground hover:bg-secondary rounded-lg transition-colors"
                    >
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        Settings
                    </button>
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-lg transition-colors duration-200",
                    isOpen ? "bg-secondary" : "hover:bg-secondary"
                )}
                aria-label="Account menu"
            >
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 border border-border">
                    <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-[14px] text-foreground truncate">
                        {session.user.name?.split(' ')[0] || session.user.email?.split('@')[0] || "Account"}
                    </p>
                </div>
                <ChevronUp className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
            </button>
        </div>
    );
}
