"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileSpreadsheet, Clock, Database } from "lucide-react";

type CsvFile = {
  id: string;
  fileName: string;
  originalName: string;
  uploadedAt: string;
  columnHeaders: string[];
  rowCount: number;
  teamId: string | null;
};

export function CsvFileList() {
  const [files, setFiles] = useState<CsvFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch("/api/csv");
        if (!response.ok) {
          throw new Error("Failed to fetch files");
        }
        const data = await response.json();
        setFiles(data);
      } catch (error) {
        console.error("Error fetching CSV files:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, []);

  if (isLoading) {
    return (
      <>
        <FileListSkeleton />
        <FileListSkeleton />
        <FileListSkeleton />
      </>
    );
  }

  if (files.length === 0) {
    return (
      <Card className="h-52 flex flex-col items-center justify-center">
        <CardContent className="flex flex-col items-center justify-center pt-6">
          <Database className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No CSV Files</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Upload your first CSV file to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {files.map((file) => (
        <Card
          key={file.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push(`/csv-manager/${file.id}`)}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-lg truncate" title={file.originalName}>
                  {file.originalName}
                </h3>
                <div className="flex items-center mt-1 text-muted-foreground text-sm">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  <span>
                    {formatDistanceToNow(new Date(file.uploadedAt), { addSuffix: true })}
                  </span>
                </div>
                {file.teamId && (
                  <span className="mt-1 inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Team File
                  </span>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between bg-muted/50 px-6 py-3">
            <span className="text-sm">{file.columnHeaders.length} columns</span>
            <span className="text-sm">{file.rowCount} rows</span>
          </CardFooter>
        </Card>
      ))}
    </>
  );
}

function FileListSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="flex-1">
            <Skeleton className="h-5 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between bg-muted/50 px-6 py-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </CardFooter>
    </Card>
  );
}