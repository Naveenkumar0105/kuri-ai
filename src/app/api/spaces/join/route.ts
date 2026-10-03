import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { inviteCode } = await req.json();
        if (typeof inviteCode !== "string" || !inviteCode.trim()) {
            return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
        }

        const space = await prisma.sharedSpace.findUnique({
            where: { inviteCode: inviteCode.trim().toUpperCase() },
        });
        if (!space) return NextResponse.json({ error: "That invite code is not valid" }, { status: 404 });

        const existingMembership = await prisma.sharedSpaceMember.findUnique({
            where: { sharedSpaceId_userId: { sharedSpaceId: space.id, userId: session.user.id } },
        });
        const membership = await prisma.sharedSpaceMember.upsert({
            where: { sharedSpaceId_userId: { sharedSpaceId: space.id, userId: session.user.id } },
            update: {},
            create: { sharedSpaceId: space.id, userId: session.user.id, role: "MEMBER" },
        });
        if (!existingMembership) {
            await prisma.taskActivity.create({
                data: {
                    type: "MEMBER_JOINED",
                    taskText: space.name,
                    sharedSpaceId: space.id,
                    actorId: session.user.id,
                },
            });
        }
        const memberCount = await prisma.sharedSpaceMember.count({ where: { sharedSpaceId: space.id } });

        return NextResponse.json({
            id: space.id,
            name: space.name,
            inviteCode: space.inviteCode,
            role: membership.role,
            memberCount,
            unreadActivityCount: 0,
        });
    } catch (error) {
        console.error("Failed to join space", error);
        return NextResponse.json({ error: "Failed to join space" }, { status: 500 });
    }
}
