import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { CsvFile, CsvColumn, Prisma } from "@prisma/client";

// Define a type for the CSV file with included relations for the GET handler
type CsvFileWithRelations = CsvFile & {
    columns: CsvColumn[];
    _count: Prisma.CsvFileCountOutputType;
};

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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
                    },
                    take: 1, // Assuming a user is primarily associated with one team for this view
                },
            },
        });

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const fileId = id;
        const userTeamId = user.teams.length > 0 ? user.teams[0].teamId : null;

        console.log("[CSV_FILE_GET] Fetching file:", fileId, "for user:", user.id, "teamId:", userTeamId);

        // Get the CSV file - allow fetching if owned by user OR shared with user's team
        const csvFile = await db.csvFile.findUnique({
            where: {
                id: fileId,
                OR: [
                    { userId: user.id }, // File owned by the user
                    ...(userTeamId ? [{ teamId: userTeamId }] : []), // File associated with the user's team
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
        }) as CsvFileWithRelations | null; // Cast the result to our defined type

        if (!csvFile) {
            console.error("[CSV_FILE_GET] File not found:", fileId, "for user:", user.id);
            return new NextResponse("Not found", { status: 404 });
        }

        console.log("[CSV_FILE_GET] File found:", {
            id: csvFile.id,
            name: csvFile.name,
            columns: csvFile.columns.length,
            rows: csvFile._count.rows
        });

        return NextResponse.json({
            id: csvFile.id,
            fileName: csvFile.name,
            originalName: csvFile.name,
            uploadedAt: csvFile.createdAt,
            columnHeaders: csvFile.columns.map((col: CsvColumn) => col.name), // Explicitly type col
            rowCount: csvFile._count.rows,
            teamId: csvFile.teamId, // Include teamId in the response
        });
    } catch (error) {
        console.error("[CSV_FILE_GET] Error:", error);
        return new NextResponse(
            JSON.stringify({
                error: "Internal server error",
                details: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            }),
            { status: 500 }
        );
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getAuthSession();
        if (!session?.user?.id || !session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            include: {
                teams: {
                    where: {
                        userId: session.user.id,
                        role: "owner", // Check if the user is an owner of any team
                    },
                    include: {
                        team: true
                    },
                    take: 1, // Assuming a user can only be an owner of one team for this context
                },
            },
        });

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name } = body;

        if (!name || typeof name !== "string") {
            return new NextResponse("Invalid name", { status: 400 });
        }

        const fileId = id;

        // Find the CSV file
        const csvFile = await db.csvFile.findUnique({
            where: {
                id: fileId,
            },
        });

        if (!csvFile) {
            return new NextResponse("File not found", { status: 404 });
        }

        // Check if the user is the owner OR if the user is a team owner and the file belongs to their team
        const isOwner = csvFile.userId === user.id;
        const isTeamOwnerAndFileBelongsToTeam = user.teams.length > 0 && csvFile.teamId === user.teams[0].teamId;

        if (!isOwner && !isTeamOwnerAndFileBelongsToTeam) {
            return new NextResponse("You are not authorized to rename this file", { status: 403 });
        }

        const updated = await db.csvFile.update({
            where: {
                id: fileId,
            },
            data: {
                name,
            },
        });

        return NextResponse.json({ id: updated.id, name: updated.name });
    } catch (error) {
        console.error("[CSV_FILE_PATCH]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getAuthSession();
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const fileId = id;

        // Verify the CSV file belongs to the user before deleting
        const csvFile = await db.csvFile.findUnique({
            where: {
                id: fileId,
                userId: user.id,
            },
        });

        if (!csvFile) {
            return new NextResponse("File not found or does not belong to user", { status: 404 });
        }

        // Delete the CSV file
        await db.csvFile.delete({
            where: {
                id: fileId,
            },
        });

        // Optionally, log this activity
        await db.userActivity.create({
            data: {
                userId: user.id,
                action: "deleted_csv",
                csvFileId: fileId,
                details: { fileName: csvFile.name },
            },
        });

        return new NextResponse("File deleted successfully", { status: 200 });

    } catch (error) {
        console.error("[CSV_FILE_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
} 