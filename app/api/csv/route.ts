import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getAuthSession();
        if (!session?.user?.id || !session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            include: {
                teams: {
                    where: {
                        userId: session.user.id
                    },
                    include: {
                        team: true
                    }
                }
            }
        });

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Get the user's team ID if they are part of a team
        const userTeamId = user.teams.length > 0 ? user.teams[0].teamId : null;

        const csvFiles = await db.csvFile.findMany({
            where: {
                OR: [
                    { userId: user.id }, // Files owned by the user
                    ...(userTeamId ? [{ teamId: userTeamId }] : []), // Files associated with the user's team (if user is in a team)
                ],
            },
            include: {
                columns: true,
                _count: {
                    select: {
                        rows: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(
            csvFiles.map(file => ({
                id: file.id,
                fileName: file.name,
                originalName: file.name,
                uploadedAt: file.createdAt,
                columnHeaders: file.columns.map(col => col.name),
                rowCount: file._count.rows,
                teamId: file.teamId,
            }))
        );
    } catch (error) {
        console.error("[CSV_LIST]", error);
        return new NextResponse(
            JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
            { status: 500 }
        );
    }
} 