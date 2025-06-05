import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        // First, check if we can connect to the database
        console.log("[TEST_DB] Testing database connection...");

        // Try to create a test user if it doesn't exist
        const testUser = await db.user.upsert({
            where: { clerkId: userId },
            update: {},
            create: {
                clerkId: userId,
                email: "test@example.com", // This will be updated by Clerk
                name: "Test User"
            }
        });

        console.log("[TEST_DB] User created/updated:", testUser);

        // Try to create a test CSV file
        const testFile = await db.csvFile.create({
            data: {
                name: "Test CSV File",
                userId: testUser.id,
                columns: {
                    create: [
                        { name: "Column1", type: "string" },
                        { name: "Column2", type: "string" }
                    ]
                },
                rows: {
                    create: [
                        {
                            data: { Column1: "Test1", Column2: "Value1" },
                            rowIndex: 0
                        },
                        {
                            data: { Column1: "Test2", Column2: "Value2" },
                            rowIndex: 1
                        }
                    ]
                }
            },
            include: {
                columns: true,
                rows: true
            }
        });

        console.log("[TEST_DB] Test file created:", testFile);

        return NextResponse.json({
            success: true,
            message: "Database connection successful",
            data: {
                user: testUser,
                file: testFile
            }
        });
    } catch (error) {
        console.error("[TEST_DB] Error:", error);
        return NextResponse.json({
            error: "Database connection failed",
            details: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
} 