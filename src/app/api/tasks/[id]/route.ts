import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const taskPeople = {
    user: { select: { id: true, name: true, email: true } },
    claimedBy: { select: { id: true, name: true, email: true } },
} as const;

async function accessibleTask(id: string, userId: string) {
    return prisma.task.findFirst({
        where: {
            id,
            OR: [
                { userId, sharedSpaceId: null },
                { sharedSpace: { members: { some: { userId } } } },
            ],
        },
        include: {
            ...taskPeople,
            sharedSpace: {
                select: { members: { where: { userId }, select: { role: true } } },
            },
        },
    });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const current = await accessibleTask(id, session.user.id);
        if (!current) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }
        const body = await req.json();
        const data: Prisma.TaskUpdateInput = {};
        if (typeof body.text === "string" && body.text.trim()) data.text = body.text.trim();
        if (typeof body.category === "string") data.category = body.category;
        if (typeof body.completed === "boolean") data.completed = body.completed;
        if (body.priority !== undefined) data.priority = body.priority;
        if (body.description !== undefined) data.description = body.description;
        if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
        if (body.dateType !== undefined) data.dateType = body.dateType;

        if (current.sharedSpaceId && body.completed === true && !current.claimedById) {
            data.claimedBy = { connect: { id: session.user.id } };
            data.claimedAt = new Date();
        }

        const task = await prisma.task.update({
            where: { id },
            data,
            include: taskPeople,
        });

        if (current.sharedSpaceId) {
            let activityType: string | null = null;
            if (typeof body.completed === "boolean" && body.completed !== current.completed) {
                activityType = body.completed ? "TASK_COMPLETED" : "TASK_REOPENED";
            } else if (["text", "category", "priority", "description", "dueDate", "dateType"].some(key => body[key] !== undefined)) {
                activityType = "TASK_UPDATED";
            }
            if (activityType) {
                await prisma.taskActivity.create({
                    data: {
                        type: activityType,
                        taskText: task.text,
                        sharedSpaceId: current.sharedSpaceId,
                        taskId: task.id,
                        actorId: session.user.id,
                    },
                });
            }
        }

        return NextResponse.json(task);
    } catch (error) {
        console.error("Failed to update task", error);
        return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const task = await accessibleTask(id, session.user.id);
        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        const isSpaceOwner = task.sharedSpace?.members[0]?.role === "OWNER";
        if (task.userId !== session.user.id && !isSpaceOwner) {
            return NextResponse.json({ error: "Only the task creator or space owner can delete this task" }, { status: 403 });
        }

        await prisma.task.delete({ where: { id } });
        if (task.sharedSpaceId) {
            await prisma.taskActivity.create({
                data: {
                    type: "TASK_DELETED",
                    taskText: task.text,
                    sharedSpaceId: task.sharedSpaceId,
                    actorId: session.user.id,
                },
            });
        }

        return NextResponse.json({ message: "Task deleted" });
    } catch (error) {
        console.error("Failed to delete task", error);
        return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
    }
}
