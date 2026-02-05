import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addToGoogleCalendar } from "@/lib/calendar";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const task = await prisma.task.findUnique({
            where: { id: id, userId: session.user.id },
        });

        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        let startTimeString = "";
        let isAllDay = false;

        if (task.dueDate) {
            startTimeString = task.dueDate.toISOString();
        } else {
            // No due date? Sync as "All Day" for TODAY.
            startTimeString = new Date().toISOString();
            isAllDay = true;
        }

        const result = await addToGoogleCalendar(
            task.text,
            task.description || "Synced from Kuri AI",
            startTimeString,
            "UTC",
            isAllDay
        );

        if (!result) {
            return NextResponse.json({ error: "Failed to sync with Google Calendar" }, { status: 500 });
        }

        return NextResponse.json({ success: true, link: result.htmlLink });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error", details: String(error) }, { status: 500 });
    }
}
