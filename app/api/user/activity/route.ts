import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await getAuthSession();

        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const activities = await db.userActivity.findMany({
            where: {
                userId: session.user.id,
                action: { in: ["uploaded_csv", "deleted_csv"] }, // Include deleted activities
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 20, // Increase to 20 to show more recent activities
            include: {
                csvFile: { // Include related CSV file info
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        console.log('Activities fetched from backend:', activities); // Log fetched activities

        return NextResponse.json(activities);

    } catch (error) {
        console.error("Error fetching user activities:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
} 