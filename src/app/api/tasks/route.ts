import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const tasks = await prisma.task.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(tasks);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { text, category, priority, description, dueDate, dateType } = body;

        const task = await prisma.task.create({
            data: {
                text,
                category,
                priority,
                description,
                dueDate: dueDate ? new Date(dueDate) : null,
                dateType,
                userId: session.user.id,
            },
        });

        // Trigger Calendar Sync if dueDate exists
        if (task.dueDate) {
            // We start this asynchronously and don't await strictly to prevent slow UI
            // In a real serverless env, we might need a queue or await it.
            // For Vercel, await is safer to ensure it finishes before lambda freezes.
            const { addToGoogleCalendar } = await import("@/lib/calendar");
            await addToGoogleCalendar(
                task.text,
                task.description || "Created via Kuri AI",
                task.dueDate.toISOString()
            );
        }

        return NextResponse.json(task);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }
}
