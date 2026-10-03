import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const taskPeople = {
    user: { select: { id: true, name: true, email: true } },
    claimedBy: { select: { id: true, name: true, email: true } },
} as const;

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const tasks = await prisma.task.findMany({
            where: {
                OR: [
                    { userId: session.user.id, sharedSpaceId: null },
                    { sharedSpace: { members: { some: { userId: session.user.id } } } },
                ],
            },
            include: taskPeople,
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(tasks);
    } catch (error) {
        console.error("Failed to fetch tasks", error);
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
        const { text, category, priority, description, dueDate, dateType, parentId, sharedSpaceId } = body;

        if (typeof text !== "string" || !text.trim()) {
            return NextResponse.json({ error: "Task text is required" }, { status: 400 });
        }

        if (sharedSpaceId) {
            const membership = await prisma.sharedSpaceMember.findUnique({
                where: { sharedSpaceId_userId: { sharedSpaceId, userId: session.user.id } },
            });
            if (!membership) {
                return NextResponse.json({ error: "You are not a member of this space" }, { status: 403 });
            }
        }

        if (parentId) {
            const parent = await prisma.task.findFirst({
                where: {
                    id: parentId,
                    sharedSpaceId: sharedSpaceId || null,
                    OR: [
                        { userId: session.user.id, sharedSpaceId: null },
                        { sharedSpace: { members: { some: { userId: session.user.id } } } },
                    ],
                },
            });
            if (!parent) {
                return NextResponse.json({ error: "Parent task is not available in this space" }, { status: 400 });
            }
        }

        const task = await prisma.task.create({
            data: {
                text: text.trim(),
                category: category || "Uncategorized",
                priority,
                description,
                dueDate: dueDate ? new Date(dueDate) : null,
                dateType,
                parentId: parentId || null,
                sharedSpaceId: sharedSpaceId || null,
                userId: session.user.id,
            },
            include: taskPeople,
        });

        if (task.sharedSpaceId) {
            await prisma.taskActivity.create({
                data: {
                    type: "TASK_CREATED",
                    taskText: task.text,
                    sharedSpaceId: task.sharedSpaceId,
                    taskId: task.id,
                    actorId: session.user.id,
                },
            });
        }

        return NextResponse.json(task);
    } catch (error) {
        console.error("Failed to create task", error);
        return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }
}
