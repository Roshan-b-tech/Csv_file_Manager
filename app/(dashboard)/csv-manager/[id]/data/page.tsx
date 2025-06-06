import { CsvDataTable } from "@/components/csv/csv-data-table";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { CsvColumn, CsvFile, Prisma } from "@prisma/client";
import { Metadata } from "next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
    params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const fileId = params.id;
    const file = await db.csvFile.findUnique({
        where: { id: fileId },
        select: {
            name: true,
            columns: {
                select: { name: true }
            }
        },
    });

    return {
        title: file ? `Data: ${file.name}` : "File Data",
    };
}

export default async function CsvDataPage({ params }: Props) {
    const fileId = params.id;

    // Fetch basic file info on the server
    const file = await db.csvFile.findUnique({
        where: { id: fileId },
        select: {
            name: true,
            columns: {
                select: { name: true }
            }
        },
    });

    if (!file) {
        notFound();
    }

    // Note: Data fetching for the table (pagination, sorting, filtering)
    // will happen client-side within the CsvDataTable component or a wrapper

    // Extract column names from the fetched file object
    const columnHeaders = file.columns.map(col => col.name);

    return (
        <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500">
            {/* Blurred SVG shape for depth, matching other sections */}
            <svg className="absolute -top-32 -left-32 w-[600px] h-[600px] opacity-30 blur-2xl -z-10" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="300" cy="300" r="300" fill="url(#paint0_radial)" />
                <defs>
                    <radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientTransform="translate(300 300) scale(300)" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#a5b4fc" />
                        <stop offset="1" stopColor="#818cf8" stopOpacity="0.2" />
                    </radialGradient>
                </defs>
            </svg>

            <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="flex items-center mb-6 gap-4">
                    <Button variant="outline" size="icon" asChild className="bg-white/80 backdrop-blur-md border border-white/30 shadow-lg hover:scale-105 transition-transform">
                        <Link href={`/csv-manager/${fileId}`}>
                            <ChevronLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-sm truncate">
                        File Data: {file.name}
                    </h1>
                </div>

                {/* CSV Data Table Card (Scrollable horizontally) */}
                <Card className="bg-white/80 backdrop-blur-md border border-white/30 shadow-lg rounded-2xl p-6 min-w-full flex-1 flex flex-col min-h-0">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold mb-2 md:mb-0">Data Table</h2>
                    </div>
                    <Separator className="mb-4 bg-white/30" />
                    {/* Ensure table content takes remaining height and is scrollable vertically if needed */}
                    <div className="flex-1 overflow-y-auto">
                        <CsvDataTable fileId={fileId} columnHeaders={columnHeaders} />
                    </div>
                </Card>
            </div>
        </div>
    );
} 