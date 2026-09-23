import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        return NextResponse.json({ preference: user?.aiConfirmationPreference || "SPLIT_ONLY" });
    } catch (error) {
        return NextResponse.json({ error: "Error fetching preference" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { preference } = await req.json();
        const updated = await prisma.user.update({
            where: { email: session.user.email },
            data: { aiConfirmationPreference: preference }
        });
        return NextResponse.json({ preference: updated.aiConfirmationPreference });
    } catch (error) {
        return NextResponse.json({ error: "Error updating preference" }, { status: 500 });
    }
}
