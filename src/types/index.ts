export type Category = string;

export interface Task {
    id: string;
    text: string;
    category: Category;
    completed: boolean;
    createdAt: number;
    priority?: 'Low' | 'Medium' | 'High';
    description?: string | null;
    dueDate?: string | null; // Prisma returns Date object, but we serialize to string in JSON usually, or need to handle Date.
    // Actually, API returns JSON, so dates are strings.
    dateType?: string | null; // 'due' | 'scheduled'
    userId?: string;
    user?: TaskPerson;
    sharedSpaceId?: string | null;
    claimedById?: string | null;
    claimedBy?: TaskPerson | null;
    claimedAt?: string | null;
    parentId?: string | null;
    subtasks?: Task[];
}

export interface TaskPerson {
    id: string;
    name?: string | null;
    email?: string | null;
}

export interface SharedSpace {
    id: string;
    name: string;
    inviteCode: string;
    role: "OWNER" | "MEMBER";
    memberCount: number;
    unreadActivityCount?: number;
}

export type TaskActivityType =
    | "SPACE_CREATED"
    | "MEMBER_JOINED"
    | "TASK_CREATED"
    | "TASK_UPDATED"
    | "TASK_CLAIMED"
    | "TASK_RELEASED"
    | "TASK_COMPLETED"
    | "TASK_REOPENED"
    | "TASK_DELETED";

export interface TaskActivity {
    id: string;
    type: TaskActivityType;
    taskText: string;
    createdAt: string;
    taskId?: string | null;
    actor?: TaskPerson | null;
}
