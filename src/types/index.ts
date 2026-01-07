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
}
