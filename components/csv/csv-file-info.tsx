"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileSpreadsheet, Clock, Columns, LayoutGrid } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

type CsvFileInfoProps = {
  file: {
    id: string;
    fileName: string;
    originalName: string;
    uploadedAt: string;
    columnHeaders: string[];
    rowCount: number;
  };
};

export function CsvFileInfo({ file }: CsvFileInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">File Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="mr-4 h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium truncate" title={file.originalName}>
                {file.originalName}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(file.uploadedAt), "MMM d, yyyy")}
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground mb-1">Uploaded</span>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1.5 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {formatDistanceToNow(new Date(file.uploadedAt), { addSuffix: true })}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground mb-1">File Type</span>
              <span className="text-sm font-medium">CSV</span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground mb-1">Columns</span>
              <div className="flex items-center">
                <Columns className="h-4 w-4 mr-1.5 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {file.columnHeaders.length}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground mb-1">Rows</span>
              <div className="flex items-center">
                <LayoutGrid className="h-4 w-4 mr-1.5 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {file.rowCount}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <span className="text-sm text-muted-foreground mb-2 block">Columns</span>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {file.columnHeaders.map((header) => (
                <div
                  key={header}
                  className="bg-muted px-2.5 py-1 rounded-full text-xs"
                >
                  {header}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}