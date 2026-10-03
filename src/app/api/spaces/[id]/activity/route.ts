import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function membershipFor(spaceId: string, userId: string) {
    return prisma.sharedSpaceMember.findUnique({
        where: { sharedSpaceId_userId: { sharedSpaceId: spaceId, userId } },
    });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: sharedSpaceId } = await params;
    const membership = await membershipFor(sharedSpaceId, session.user.id);
    if (!membership) return NextResponse.json({ error: "Space not found" }, { status: 404 });

    const [activities, unreadCount] = await prisma.$transaction([
        prisma.taskActivity.findMany({
            where: { sharedSpaceId },
            orderBy: { createdAt: "desc" },
            take: 50,
            include: { actor: { select: { id: true, name: true, email: true } } },
        }),
        prisma.taskActivity.count({
            where: {
                sharedSpaceId,
                createdAt: { gt: membership.lastViewedActivityAt },
                actorId: { not: session.user.id },
            },
        }),
    ]);

    return NextResponse.json({ activities, unreadCount });
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: sharedSpaceId } = await params;
    const membership = await membershipFor(sharedSpaceId, session.user.id);
    if (!membership) return NextResponse.json({ error: "Space not found" }, { status: 404 });

    await prisma.sharedSpaceMember.update({
        where: { id: membership.id },
        data: { lastViewedActivityAt: new Date() },
    });
    return NextResponse.json({ unreadCount: 0 });
}
