import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const includePeople = {
    user: { select: { id: true, name: true, email: true } },
    claimedBy: { select: { id: true, name: true, email: true } },
} as const;

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const task = await prisma.task.findFirst({
        where: {
            id,
            sharedSpaceId: { not: null },
            sharedSpace: { members: { some: { userId: session.user.id } } },
        },
    });

    if (!task) return NextResponse.json({ error: "Shared task not found" }, { status: 404 });
    if (task.completed) return NextResponse.json({ error: "Completed tasks cannot be claimed" }, { status: 409 });

    if (task.claimedById === session.user.id) {
        const released = await prisma.task.update({
            where: { id },
            data: { claimedById: null, claimedAt: null },
            include: includePeople,
        });
        await prisma.taskActivity.create({
            data: {
                type: "TASK_RELEASED",
                taskText: task.text,
                sharedSpaceId: task.sharedSpaceId!,
                taskId: task.id,
                actorId: session.user.id,
            },
        });
        return NextResponse.json(released);
    }

    if (task.claimedById) {
        return NextResponse.json({ error: "Someone else has already claimed this task" }, { status: 409 });
    }

    const result = await prisma.task.updateMany({
        where: { id, claimedById: null, completed: false },
        data: { claimedById: session.user.id, claimedAt: new Date() },
    });
    if (result.count === 0) {
        return NextResponse.json({ error: "Someone else just claimed this task" }, { status: 409 });
    }

    const claimed = await prisma.task.findUnique({ where: { id }, include: includePeople });
    await prisma.taskActivity.create({
        data: {
            type: "TASK_CLAIMED",
            taskText: task.text,
            sharedSpaceId: task.sharedSpaceId!,
            taskId: task.id,
            actorId: session.user.id,
        },
    });
    return NextResponse.json(claimed);
}
