import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const { text, category, completed, priority, description, dueDate, dateType } = body;

        const task = await prisma.task.update({
            where: { id: id, userId: session.user.id }, // Ensure user owns task
            data: {
                text,
                category,
                completed,
                priority,
                description,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                dateType,
            },
        });

        return NextResponse.json(task);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update task", details: String(error) }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        await prisma.task.delete({
            where: { id: id, userId: session.user.id }, // Ensure user owns task
        });

        return NextResponse.json({ message: "Task deleted" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
    }
}
