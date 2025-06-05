import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parse } from "papaparse";
import { Prisma } from "@prisma/client";
import { getAuthSession } from "@/lib/auth";
import { sendCsvImportNotification } from "@/lib/email";

export async function POST(req: NextRequest) {
    try {
        const session = await getAuthSession();
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized", details: "User not authenticated" },
                { status: 401 }
            );
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const name = formData.get("name") as string;

        if (!file || !name) {
            return NextResponse.json(
                { error: "Bad Request", details: "Missing required fields" },
                { status: 400 }
            );
        }

        // Parse CSV file
        const text = await file.text();
        const { data, meta } = parse<Record<string, string>>(text, {
            header: true,
            skipEmptyLines: true,
        });

        if (!data || data.length === 0) {
            return NextResponse.json(
                { error: "Bad Request", details: "CSV file is empty or invalid" },
                { status: 400 }
            );
        }

        // Filter out empty column names and clean the data
        const validColumns = meta.fields?.filter(field => field && field.trim() !== "") || [];
        const cleanedData = data.map(row => {
            const cleanedRow: Record<string, string> = {};
            validColumns.forEach(col => {
                const value = row[col];
                if (value !== undefined && value !== null) {
                    cleanedRow[col] = String(value);
                }
            });
            return cleanedRow;
        });

        // Get user from database
        const user = await db.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized", details: "User not found" },
                { status: 401 }
            );
        }

        console.log('User fetched in upload route:', user);

        // Create CSV file record
        const csvFile = await db.csvFile.create({
            data: {
                name: name,
                userId: user.id,
                columns: {
                    create: validColumns.map(field => ({
                        name: field,
                        type: "string"
                    }))
                },
                rows: {
                    create: cleanedData.map((row, index) => ({
                        data: row as Prisma.JsonObject,
                        rowIndex: index
                    }))
                }
            },
            include: {
                columns: true,
                _count: {
                    select: {
                        rows: true
                    }
                }
            }
        });

        // Log user activity
        await db.userActivity.create({
            data: {
                userId: user.id,
                action: "uploaded_csv",
                csvFileId: csvFile.id,
                details: {
                    fileName: csvFile.name,
                    rowCount: csvFile._count.rows,
                },
            },
        });

        // Send email notification if enabled
        console.log('User notification preference:', user.receiveCsvImportNotifications);
        if (user.receiveCsvImportNotifications) {
            await sendCsvImportNotification(
                user.email,
                csvFile.name,
                csvFile._count.rows
            );
        }

        return NextResponse.json({
            id: csvFile.id,
            fileName: csvFile.name,
            originalName: name,
            uploadedAt: csvFile.createdAt,
            columnHeaders: csvFile.columns.map(col => col.name),
            rowCount: csvFile._count.rows,
        });
    } catch (error) {
        console.error("[CSV_UPLOAD]", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
} 