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
        const categories = await prisma.category.findMany({
            where: { userId: session.user.id },
            orderBy: { name: "asc" },
        });
        return NextResponse.json(categories);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        let { name } = body;
        
        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }
        
        name = name.trim();
        const normalized = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

        // upsert
        const category = await prisma.category.upsert({
            where: {
                userId_name: {
                    userId: session.user.id,
                    name: normalized,
                }
            },
            update: {},
            create: {
                name: normalized,
                userId: session.user.id,
            }
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("Failed to create category:", error);
        return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
}
