import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getAuthSession();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const fileId = id;

        // Find the user and their team
        const userWithTeam = await db.user.findUnique({
            where: { id: session.user.id },
            include: {
                teams: {
                    where: {
                        userId: session.user.id,
                        role: "owner", // Assuming only the owner can share for now
                    },
                    include: {
                        team: true
                    },
                    take: 1, // Get the primary team
                },
            },
        });

        if (!userWithTeam || userWithTeam.teams.length === 0) {
            return NextResponse.json({ message: "User is not the owner of a team" }, { status: 403 });
        }

        const userTeamId = userWithTeam.teams[0]?.teamId;

        if (!userTeamId) {
            return new NextResponse("Could not find user's team", { status: 404 });
        }

        // Find the CSV file and ensure the current user is the owner
        const csvFile = await db.csvFile.findUnique({
            where: {
                id: fileId,
                userId: session.user.id, // Ensure only the owner can share their own file
            },
        });

        if (!csvFile) {
            return new NextResponse("CSV file not found or you are not the owner", { status: 404 });
        }

        // Check if the file is already shared with the team
        if (csvFile.teamId === userTeamId) {
            return NextResponse.json({ message: "File is already shared with your team" }, { status: 200 });
        }

        // Update the CSV file to associate it with the user's team
        const updatedCsvFile = await db.csvFile.update({
            where: { id: fileId },
            data: {
                teamId: userTeamId,
            },
        });

        return NextResponse.json({ message: "File shared with team successfully", file: updatedCsvFile });

    } catch (error) {
        console.error("[API_SHARE_CSV] Error:", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
} 