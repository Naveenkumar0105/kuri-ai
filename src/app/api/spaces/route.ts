import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const memberships = await prisma.sharedSpaceMember.findMany({
        where: { userId: session.user.id },
        include: { sharedSpace: { include: { _count: { select: { members: true } } } } },
        orderBy: { joinedAt: "asc" },
    });

    const spaces = await Promise.all(memberships.map(async ({ role, sharedSpace, lastViewedActivityAt }) => ({
        id: sharedSpace.id,
        name: sharedSpace.name,
        inviteCode: sharedSpace.inviteCode,
        role,
        memberCount: sharedSpace._count.members,
        unreadActivityCount: await prisma.taskActivity.count({
            where: {
                sharedSpaceId: sharedSpace.id,
                createdAt: { gt: lastViewedActivityAt },
                actorId: { not: session.user.id },
            },
        }),
    })));

    return NextResponse.json(spaces);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { name } = await req.json();
        if (typeof name !== "string" || !name.trim()) {
            return NextResponse.json({ error: "Space name is required" }, { status: 400 });
        }

        const inviteCode = randomBytes(5).toString("hex").toUpperCase();
        const space = await prisma.sharedSpace.create({
            data: {
                name: name.trim(),
                inviteCode,
                createdById: session.user.id,
                members: { create: { userId: session.user.id, role: "OWNER" } },
            },
            include: { _count: { select: { members: true } } },
        });

        await prisma.taskActivity.create({
            data: {
                type: "SPACE_CREATED",
                taskText: space.name,
                sharedSpaceId: space.id,
                actorId: session.user.id,
            },
        });

        return NextResponse.json({
            id: space.id,
            name: space.name,
            inviteCode: space.inviteCode,
            role: "OWNER",
            memberCount: space._count.members,
            unreadActivityCount: 0,
        }, { status: 201 });
    } catch (error) {
        console.error("Failed to create space", error);
        return NextResponse.json({ error: "Failed to create space" }, { status: 500 });
    }
}
