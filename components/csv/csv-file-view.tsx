"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Download, MoreHorizontal, Filter, Columns, SortAsc, BarChart3, PenBox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { CsvFileInfo } from "@/components/csv/csv-file-info";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

type CsvFile = {
    id: string;
    fileName: string;
    originalName: string;
    uploadedAt: string;
    columnHeaders: string[];
    rowCount: number;
    teamId: string | null;
};

export function CsvFileView({ fileId }: { fileId: string }) {
    const [file, setFile] = useState<CsvFile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState("");
    const [renameLoading, setRenameLoading] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchFile = async () => {
            try {
                const response = await fetch(`/api/csv/${fileId}`);
                if (!response.ok) throw new Error('Failed to fetch CSV file');
                const data = await response.json();
                setFile(data);
            } catch (err) {
                setError("Failed to load CSV file");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFile();
    }, [fileId]);

    // Export CSV handler
    const handleExport = async () => {
        if (!file) return;
        // Fetch all rows for this file
        const response = await fetch(`/api/csv/${file.id}/rows?page=1&limit=10000`);
        if (!response.ok) return;
        const result = await response.json();
        const rows = result.rows;
        if (!rows || rows.length === 0) return;
        // Build CSV string
        const headers = file.columnHeaders;
        const csv = [headers.join(",")].concat(
            rows.map((row: { data: { [key: string]: any } }) => headers.map(h => JSON.stringify(row.data[h] ?? "")).join(","))
        ).join("\r\n");
        // Download
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${file.fileName || "data"}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Improved Rename handler
    const handleRename = async () => {
        if (!file || !renameValue.trim() || renameValue.trim() === file.fileName) return;
        setRenameLoading(true);
        const response = await fetch(`/api/csv/${file.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: renameValue.trim() })
        });
        setRenameLoading(false);
        if (response.ok) {
            setFile({ ...file, fileName: renameValue.trim(), originalName: renameValue.trim() });
            setIsRenaming(false);
        }
    };

    // Duplicate handler
    const handleDuplicate = async () => {
        if (!file) return;
        const response = await fetch(`/api/csv/${file.id}/duplicate`, { method: "POST" });
        if (response.ok) {
            const data = await response.json();
            router.push(`/csv-manager/${data.id}`);
        }
    };

    // Delete handler
    const handleDelete = async () => {
        if (!file) return;
        if (!window.confirm("Are you sure you want to delete this file? This action cannot be undone.")) return;
        const response = await fetch(`/api/csv/${file.id}`, { method: "DELETE" });
        if (response.ok) {
            router.push("/csv-manager");
        }
    };

    // Share with Team handler
    const handleShareWithTeam = async () => {
        if (!file) return;
        setIsSharing(true);
        try {
            const response = await fetch(`/api/csv/${file.id}/share`, {
                method: "POST",
            });
            const data = await response.json();

            if (response.ok) {
                // Update the file state to reflect that it's now shared
                setFile(prev => prev ? { ...prev, teamId: data.file?.teamId || 'shared' } : null);
                alert(data.message || "File shared with team.");
            } else {
                alert(data.message || "Failed to share file with team.");
            }
        } catch (error) {
            console.error('Error sharing file:', error);
            alert("An error occurred while sharing the file. Please try again.");
        } finally {
            setIsSharing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6 gap-4">
                    <Button variant="outline" size="icon" asChild className="bg-white/80 backdrop-blur-md border border-white/30 shadow-lg hover:scale-105 transition-transform">
                        <Link href="/csv-manager">
                            <ChevronLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Skeleton className="h-8 w-64" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Skeleton className="h-32" />
                    <Skeleton className="md:col-span-3 h-96" />
                </div>
            </div>
        );
    }

    if (error || !file) {
        return (
            <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6 gap-4">
                    <Button variant="outline" size="icon" asChild className="bg-white/80 backdrop-blur-md border border-white/30 shadow-lg hover:scale-105 transition-transform">
                        <Link href="/csv-manager">
                            <ChevronLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">Error</h1>
                </div>
                <Card className="p-8 text-center bg-white/80 backdrop-blur-md border border-white/30 shadow-lg rounded-2xl">
                    <p className="text-muted-foreground mb-4">
                        {error || "The requested CSV file could not be found."}
                    </p>
                    <Button asChild className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg hover:scale-105 transition-transform">
                        <Link href="/csv-manager">Return to CSV Manager</Link>
                    </Button>
                </Card>
            </div>
        );
    }

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
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center mb-6 gap-4 w-full">
                    <Button variant="outline" size="icon" asChild className="mr-auto sm:mr-4 bg-white/80 backdrop-blur-md border border-white/30 shadow-lg hover:scale-105 transition-transform">
                        <Link href="/csv-manager">
                            <ChevronLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="flex-1 min-w-0 mb-2 sm:mb-0">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-sm truncate">
                            {isRenaming ?
                                <Input
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onBlur={handleRename}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleRename();
                                            // Prevent form submission if this input is part of a form
                                            if (e.currentTarget.form) {
                                                e.preventDefault();
                                            }
                                        }
                                        if (e.key === 'Escape') {
                                            setIsRenaming(false);
                                            setRenameValue(file?.fileName || ''); // Reset value on escape
                                        }
                                    }}
                                    autoFocus
                                    className="inline w-auto text-gray-900"
                                />
                                : file?.fileName}
                        </h1>
                        <p className="mt-1 text-white/90 drop-shadow-sm text-sm sm:text-base">
                            Uploaded on {new Date(file.uploadedAt).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center justify-start w-full sm:w-auto sm:justify-end sm:ml-auto">
                        {/* Rename Button */}
                        {!isRenaming && file && (
                            <Button className="gap-2 bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg hover:scale-105 transition-transform" size="sm" onClick={() => setIsRenaming(true)}>
                                <PenBox className="h-4 w-4" />
                                <span className="hidden sm:inline">Rename</span>
                            </Button>
                        )}
                        {/* Export Button */}
                        <Button className="gap-2 bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg hover:scale-105 transition-transform"
                            onClick={handleExport}
                            size="sm"
                        >
                            <Download className="h-4 w-4" /> <span className="hidden sm:inline">Export</span>
                        </Button>
                        {/* Analyze Button */}
                        <Button className="gap-2 bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg hover:scale-105 transition-transform" size="sm" asChild>
                            <Link href={`/csv-manager/${fileId}/analyze`}>
                                <BarChart3 className="h-4 w-4" /> <span className="hidden sm:inline">Analyze</span>
                            </Link>
                        </Button>

                        {/* More Options Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg hover:scale-105 transition-transform" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleDuplicate}>Duplicate</DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={handleShareWithTeam}
                                    disabled={isSharing || !!file.teamId}
                                >
                                    {isSharing ? "Sharing..." : (file.teamId ? "Shared with Team" : "Share with Team")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleDelete} className="text-red-600">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 flex-1 min-h-0">
                    {/* File Info Card */}
                    <div className="md:col-span-1">
                        <Card className="bg-white/80 backdrop-blur-md border border-white/30 shadow-lg rounded-2xl">
                            <CsvFileInfo file={file} />
                        </Card>
                    </div>

                    {/* The space where the data table used to be */}
                    {/* This section is now removed */}

                </div>
            </div>
        </div>
    );
} 