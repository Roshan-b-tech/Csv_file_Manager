import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { CsvFile, CsvColumn, Prisma } from "@prisma/client";

// Add type for CSV row data
type CsvRowData = {
    [key: string]: string | number | boolean | null;
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

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const sortColumn = searchParams.get("sortColumn");
        const sortDirection = searchParams.get("sortDirection");
        const filters = searchParams.get("filters") ? JSON.parse(searchParams.get("filters")!) : {};

        console.log("[CSV_ROWS_GET] Fetching rows for file:", fileId, "for user:", user.id, "teamId:", userTeamId, {
            page,
            limit,
            sortColumn,
            sortDirection,
            filters
        });

        // Base where clause for rows: owned by user or shared with user's team
        const baseWhere: Prisma.CsvRowWhereInput = {
            csvFile: {
                id: fileId,
                OR: [
                    { userId: user.id }, // File owned by the user
                    ...(userTeamId ? [{ teamId: userTeamId }] : []), // File associated with the user's team
                ],
            },
        };

        // Build dynamic filter conditions for JSONB data
        const filterConditions: Prisma.CsvRowWhereInput[] = Object.entries(filters)
            .filter(([key, value]) => value !== '') // Only include filters with non-empty values
            .map(([key, value]) => ({
                data: {
                    path: [key],
                    string_contains: String(value), // Case-insensitive search not directly supported for string_contains
                    // A workaround would be to convert both the stored value and filter value to lower case
                    // in the query, but this is complex with Prisma's JSON filtering.
                    // Sticking to basic contains for now.
                },
            }));

        // Combine base where clause with filter conditions
        const finalWhere: Prisma.CsvRowWhereInput = {
            AND: [baseWhere, ...filterConditions]
        };

        // Get total count of rows *after* filtering
        const totalFilteredRows = await db.csvRow.count({
            where: finalWhere,
        });

        // Get all filtered rows (without pagination or direct DB sorting)
        const allFilteredRows = await db.csvRow.findMany({
            where: finalWhere,
            orderBy: { rowIndex: 'asc' }, // Keep a default order for consistent fetching before in-memory sort
        });

        // Perform in-memory sorting
        let sortedRows = allFilteredRows;
        if (sortColumn) {
            sortedRows = sortedRows.sort((a, b) => {
                const aValue = a.data && (a.data as any)[sortColumn];
                const bValue = b.data && (b.data as any)[sortColumn];

                // Handle nulls and undefined values during sorting
                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
                if (aValue === bValue) return 0;

                // Basic comparison (handles strings and numbers)
                if (sortDirection === "desc") {
                    return aValue < bValue ? 1 : -1;
                } else {
                    return aValue < bValue ? -1 : 1;
                }
            });
        }

        // Manually apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedRows = sortedRows.slice(startIndex, endIndex);

        console.log("[CSV_ROWS_GET] Found filtered and paginated rows:", {
            total: totalFilteredRows,
            returned: paginatedRows.length,
            page: page,
            limit: limit,
        });

        return NextResponse.json({
            rows: paginatedRows,
            total: totalFilteredRows,
        });
    } catch (error) {
        console.error("[CSV_ROWS_GET] Error:", error);
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
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { rowId, column, value } = body;

        console.log("[CSV_ROWS_PATCH] Received request to update row:", rowId, "column:", column, "value:", value, "for file:", id);

        // Verify the CSV file belongs to the user and fetch the row
        const rowToUpdate = await db.csvRow.findUnique({
            where: {
                id: rowId,
                csvFileId: id,
            },
            select: {
                id: true,
                data: true,
                csvFileId: true,
            }
        });

        if (!rowToUpdate) {
            return new NextResponse("Row not found in this file", { status: 404 });
        }

        // Verify the CSV file belongs to the user using the file ID from the row
        const csvFile = await db.csvFile.findUnique({
            where: {
                id: rowToUpdate.csvFileId,
                userId: user.id,
            },
        });

        if (!csvFile) {
            // This case should ideally not happen if the above check passes and fileId is correct,
            // but it's a safeguard.
            return new NextResponse("CSV file not found or you are not the owner", { status: 404 });
        }

        // Create a new data object with the updated column value
        const updatedData = {
            ...(rowToUpdate.data as Prisma.JsonObject),
            [column]: value,
        };

        // Update the row with the new data object
        const updatedRow = await db.csvRow.update({
            where: {
                id: rowId,
            },
            data: {
                data: updatedData as Prisma.InputJsonValue,
            },
        });

        console.log("[CSV_ROWS_PATCH] Successfully updated row:", updatedRow.id);

        return NextResponse.json(updatedRow);
    } catch (error) {
        console.error("[CSV_ROWS_PATCH] Error:", error);
        return new NextResponse("Internal error", { status: 500 });
    }
} 