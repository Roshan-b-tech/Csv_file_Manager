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
                rows: {
                    skip: (page - 1) * limit,
                    take: limit,
                    orderBy: {
                        rowIndex: 'asc'
                    }
                },
                _count: {
                    select: {
                        rows: true,
                    },
                },
            },
        }) as (CsvFile & { rows: { data: any }[]; _count: Prisma.CsvFileCountOutputType }) | null; // Cast the result to include rows and _count

        if (!csvFile) {
            console.error("[CSV_ROWS_GET] File not found:", fileId, "for user:", user.id);
            return new NextResponse("Not found", { status: 404 });
        }

        // Apply filters and sorting in memory since we can't do it at the database level with JSON
        let filteredRows = csvFile.rows;

        // Apply filters
        if (Object.keys(filters).length > 0) {
            filteredRows = filteredRows.filter(row => {
                return Object.entries(filters).every(([key, value]) => {
                    const rowData = row.data as CsvRowData;
                    const rowValue = rowData[key];
                    return rowValue !== null && String(rowValue).toLowerCase().includes(String(value).toLowerCase());
                });
            });
        }

        // Apply sorting
        if (sortColumn) {
            filteredRows.sort((a, b) => {
                const aData = a.data as CsvRowData;
                const bData = b.data as CsvRowData;
                const aValue = aData[sortColumn];
                const bValue = bData[sortColumn];

                if (aValue === bValue) return 0;
                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;

                const comparison = String(aValue).localeCompare(String(bValue));
                return sortDirection === "desc" ? -comparison : comparison;
            });
        }

        console.log("[CSV_ROWS_GET] Found rows:", {
            total: csvFile._count.rows,
            returned: filteredRows.length
        });

        return NextResponse.json({
            rows: filteredRows,
            total: csvFile._count.rows,
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

        // Verify the CSV file belongs to the user
        const csvFile = await db.csvFile.findUnique({
            where: {
                id: id,
                userId: user.id,
            },
        });

        if (!csvFile) {
            return new NextResponse("Not found", { status: 404 });
        }

        // Update the row
        const updatedRow = await db.csvRow.update({
            where: {
                id: rowId,
                csvFileId: id,
            },
            data: {
                [column]: value,
            },
        });

        return NextResponse.json(updatedRow);
    } catch (error) {
        console.error("[CSV_ROWS_PATCH]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
} 