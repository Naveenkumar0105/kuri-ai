"use client";

import { Bell, Check, CirclePlus, Pencil, RotateCcw, Trash2, UserCheck, UserPlus, Users, X } from "lucide-react";
import { TaskActivity } from "@/types";

interface ActivityPanelProps {
    isOpen: boolean;
    spaceName: string;
    activities: TaskActivity[];
    onClose: () => void;
}

const activityIcon = {
    SPACE_CREATED: Users,
    MEMBER_JOINED: UserPlus,
    TASK_CREATED: CirclePlus,
    TASK_UPDATED: Pencil,
    TASK_CLAIMED: UserCheck,
    TASK_RELEASED: RotateCcw,
    TASK_COMPLETED: Check,
    TASK_REOPENED: RotateCcw,
    TASK_DELETED: Trash2,
};

const actionText = {
    SPACE_CREATED: "created the space",
    MEMBER_JOINED: "joined the space",
    TASK_CREATED: "added",
    TASK_UPDATED: "updated",
    TASK_CLAIMED: "claimed",
    TASK_RELEASED: "released",
    TASK_COMPLETED: "completed",
    TASK_REOPENED: "reopened",
    TASK_DELETED: "deleted",
};

function personName(activity: TaskActivity) {
    return activity.actor?.name?.split(" ")[0] || activity.actor?.email?.split("@")[0] || "A member";
}

function relativeTime(value: string) {
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return days < 7 ? `${days}d ago` : new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ActivityPanel({ isOpen, spaceName, activities, onClose }: ActivityPanelProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[65] bg-black/20" onMouseDown={onClose}>
            <aside className="absolute inset-y-0 right-0 w-full max-w-sm bg-card border-l border-border shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-border">
                    <div>
                        <h2 className="font-bold text-foreground flex items-center gap-2"><Bell className="w-4 h-4 text-[#5E5CE6]" />Activity</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">What happened in {spaceName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:bg-secondary" aria-label="Close activity">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="overflow-y-auto h-[calc(100%-81px)] p-3">
                    {activities.length === 0 ? (
                        <div className="py-16 text-center">
                            <Bell className="w-7 h-7 mx-auto text-muted-foreground/50" />
                            <p className="text-sm font-medium mt-3">No activity yet</p>
                            <p className="text-xs text-muted-foreground mt-1">Actions in this space will appear here.</p>
                        </div>
                    ) : activities.map((activity) => {
                        const Icon = activityIcon[activity.type] || Bell;
                        const showTask = !["SPACE_CREATED", "MEMBER_JOINED"].includes(activity.type);
                        return (
                            <div key={activity.id} className="flex gap-3 p-3 rounded-xl hover:bg-secondary/60">
                                <div className="w-8 h-8 flex-shrink-0 rounded-full bg-[#5E5CE6]/10 text-[#5E5CE6] flex items-center justify-center">
                                    <Icon className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm leading-snug text-foreground">
                                        <span className="font-semibold">{personName(activity)}</span>{" "}{actionText[activity.type]}
                                        {showTask && <span className="font-medium"> “{activity.taskText}”</span>}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-1">{relativeTime(activity.createdAt)}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </aside>
        </div>
    );
}
