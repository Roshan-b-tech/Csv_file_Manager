import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await getAuthSession();

        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await db.user.findUnique({
            where: {
                id: session.user.id,
            },
            select: {
                id: true,
                name: true,
                email: true,
                receiveCsvImportNotifications: true,
                receiveProductUpdates: true,
            },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        return NextResponse.json(user);

    } catch (error) {
        console.error("Error fetching user data:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
} 