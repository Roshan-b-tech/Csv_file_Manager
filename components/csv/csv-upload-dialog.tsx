"use client";

import React, { useState, useRef, useCallback, Fragment } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileIcon, X, Upload, Database, FileSpreadsheet, Loader2 } from "lucide-react";
import { parse, ParseResult } from "papaparse";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

type UploadStep = "select-method" | "upload-file" | "map-fields" | "review" | "complete";
type BatchType = "company" | "people";

type CsvUploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (fileId: string) => void;
};

export function CsvUploadDialog({ open, onOpenChange, onSuccess }: CsvUploadDialogProps) {
  const [currentStep, setCurrentStep] = useState<UploadStep>("select-method");
  const [batchName, setBatchName] = useState("");
  const [batchType, setBatchType] = useState<BatchType>("company");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadMethod, setUploadMethod] = useState<"csv" | "integration">("csv");
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const systemFields = [
    { id: "name", label: "Name", required: true },
    { id: "description", label: "Description", required: false },
    { id: "category", label: "Category", required: false },
    { id: "price", label: "Price", required: false },
    { id: "quantity", label: "Quantity", required: false },
  ];

  // Keywords for filtering relevant CSV columns for each system field
  const fieldKeywords: Record<string, string[]> = {
    name: ["name", "full name", "first name", "last name"],
    description: ["description", "desc", "details", "info"],
    category: ["category", "type", "group"],
    price: ["price", "cost", "amount", "value"],
    quantity: ["quantity", "qty", "count", "number", "amount"],
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      const defaultBatchName = selectedFile.name.split('.')[0];
      setBatchName(defaultBatchName);

      parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results: ParseResult<any>) => {
          setParsedData(results.data);
          if (results.data.length > 0) {
            const validHeaders = Object.keys(results.data[0])
              .filter(header => header && typeof header === 'string' && header.trim() !== '');
            setHeaders(validHeaders);
          }
        },
        error: (error: Error) => {
          console.error("Error parsing CSV:", error);
        }
      });

      let uploadProgress = 0;
      const interval = setInterval(() => {
        uploadProgress += 5;
        setProgress(uploadProgress);
        if (uploadProgress >= 100) {
          clearInterval(interval);
          setCurrentStep("map-fields");
        }
      }, 50);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
  });

  const handleSubmit = async () => {
    setIsUploading(true);
    setError(null);

    try {
      if (!file || !batchName) {
        throw new Error("File and batch name are required");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", batchName);

      const response = await fetch("/api/csv/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data?.details || data?.error || "Failed to upload file";
        throw new Error(errorMessage);
      }

      setUploadedFileId(data.id);
      setCurrentStep("complete");
      setTimeout(() => {
        onSuccess(data.id);
      }, 1000);
    } catch (error) {
      console.error("Error uploading CSV:", error);
      setError(error instanceof Error ? error.message : "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep("select-method");
    setFile(null);
    setParsedData([]);
    setHeaders([]);
    setFieldMappings({});
    setProgress(0);
    setIsUploading(false);
    setUploadedFileId(null);
    onOpenChange(false);
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: "upload-file", label: "Upload File", completed: currentStep !== "select-method" },
      { id: "map-fields", label: "Map Fields", completed: ["review", "complete"].includes(currentStep) },
      { id: "review", label: "Review", completed: currentStep === "complete" },
      { id: "complete", label: "Complete", completed: false },
    ];

    if (currentStep === "select-method") return null;

    return (
      <div className="flex items-center justify-between mb-8 w-full">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium",
              step.completed
                ? "bg-primary text-primary-foreground"
                : currentStep === step.id
                  ? "border-2 border-primary text-primary"
                  : "bg-muted text-muted-foreground"
            )}>
              {index + 1}
            </div>
            <span className="ml-2 text-sm hidden sm:block">
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div className={cn(
                "h-0.5 w-12 mx-2",
                step.completed ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderUploadStep = () => {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-2xl">Upload File</DialogTitle>
          <DialogDescription>
            Enter batch information and upload your CSV file
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batchName">Batch Name</Label>
              <Input
                id="batchName"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="Enter batch name"
              />
            </div>

            <div className="space-y-2">
              <Label>Batch Type</Label>
              <RadioGroup
                value={batchType}
                onValueChange={(value) => setBatchType(value as BatchType)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="company" id="company" />
                  <Label htmlFor="company">Company</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="people" id="people" />
                  <Label htmlFor="people">People</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Upload CSV File</Label>
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors",
                isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50"
              )}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                {isDragActive ? "Drop the file here..." : "Drag 'n' drop a CSV file here, or click to select one"}
              </p>
              {file && (
                <div className="mt-4 flex items-center justify-center text-sm text-muted-foreground">
                  <FileIcon className="h-4 w-4 mr-2" />
                  <span>{file.name}</span>
                </div>
              )}
            </div>

            {file && currentStep === "upload-file" && (
              <div className="mt-4">
                <Progress value={progress} />
                <p className="mt-2 text-center text-sm text-muted-foreground">Uploading...</p>
              </div>
            )}

            {error && (
              <div className="mt-4 text-center text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={() => setCurrentStep("map-fields")}
            disabled={!file || isUploading}
          >
            Next
          </Button>
        </DialogFooter>
      </>
    );
  };

  const renderMapFieldsStep = () => {
    // Logic for mapping fields goes here
    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-2xl">Map Fields</DialogTitle>
          <DialogDescription>
            Match your CSV columns to the system fields.
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}

        <div className="space-y-6 py-4">
          <p>Mapping UI goes here.</p>
          {/* Placeholder for mapping UI */}
          {headers.length > 0 && (
            <div className="space-y-4">
              {systemFields.map(systemField => (
                <div key={systemField.id} className="grid grid-cols-[120px_1fr] items-center gap-4">
                  <Label>{systemField.label}{systemField.required && "*"}</Label>
                  <Select
                    onValueChange={(value) => setFieldMappings({ ...fieldMappings, [systemField.id]: value })}
                    value={fieldMappings[systemField.id] || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select CSV Column" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map(header => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
          {headers.length === 0 && !isUploading && (
            <div className="text-center text-muted-foreground">
              No headers found in the CSV file.
            </div>
          )}

          {error && (
            <div className="mt-4 text-center text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setCurrentStep("upload-file")}
            disabled={isUploading}
          >
            Previous
          </Button>
          <Button
            onClick={() => setCurrentStep("review")}
            disabled={isUploading || systemFields.some(field => field.required && !fieldMappings[field.id])}
          >
            Next
          </Button>
        </DialogFooter>
      </>
    );
  };

  const renderReviewStep = () => {
    // Logic for reviewing data goes here
    const previewRows = parsedData.slice(0, 5); // Show first 5 rows as preview
    const mappedHeaders = systemFields.map(field => fieldMappings[field.id] || null).filter(header => header !== null) as string[];
    const unmappedRequiredFields = systemFields.filter(field => field.required && !fieldMappings[field.id]);

    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-2xl">Review Data</DialogTitle>
          <DialogDescription>
            Review the mapped data before importing.
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}

        <div className="space-y-6 py-4 flex-1 overflow-y-auto">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">File Summary</h3>
            <p>File Name: {file?.name}</p>
            <p>Rows Parsed: {parsedData.length}</p>
            {unmappedRequiredFields.length > 0 && (
              <div className="text-orange-600 text-sm">
                Warning: The following required fields are not mapped: {unmappedRequiredFields.map(field => field.label).join(', ')}
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Data Preview (First {previewRows.length} Rows)</h3>
            {mappedHeaders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {mappedHeaders.map(header => (
                        <th key={header} className="border px-4 py-2 text-left text-sm font-semibold bg-gray-100">
                          {systemFields.find(field => fieldMappings[field.id] === header)?.label || header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {mappedHeaders.map((header, colIndex) => (
                          <td key={`${rowIndex}-${colIndex}`} className="border px-4 py-2 text-sm">
                            {row[header]?.toString() || ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">
                No columns mapped for preview.
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 text-center text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setCurrentStep("map-fields")}
            disabled={isUploading}
          >
            Previous
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isUploading || unmappedRequiredFields.length > 0}
          >
            {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</> : "Import Data"}
          </Button>
        </DialogFooter>
      </>
    );
  };

  const renderCompleteStep = () => {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-2xl">Upload Complete!</DialogTitle>
          <DialogDescription>
            Your CSV file has been successfully uploaded and is being processed.
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}

        <div className="space-y-6 py-4 text-center">
          <Database className="mx-auto h-16 w-16 text-green-500" />
          <p className="text-lg font-medium">File ready!</p>
          {uploadedFileId && (
            <Button variant="outline" onClick={() => onSuccess(uploadedFileId)}>
              View File
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleClose}>Close</Button>
        </DialogFooter>
      </>
    );
  };

  const renderSelectMethodStep = () => {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-2xl">Import CSV</DialogTitle>
          <DialogDescription>
            Choose how you want to import your CSV data.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6">
          {/* Upload via CSV File */}
          <Card
            className={cn("flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-transform hover:scale-[1.02]",
              uploadMethod === "csv" ? "border-primary shadow-md" : "border-muted-foreground/20 hover:border-primary/50"
            )}
            onClick={() => setUploadMethod("csv")}
          >
            <FileSpreadsheet className="mx-auto h-12 w-12 text-primary" />
            <h3 className="mt-4 text-lg font-medium">Upload CSV File</h3>
            <p className="mt-2 text-sm text-muted-foreground">Browse or drag and drop a CSV file.</p>
          </Card>

          {/* Import from Integration (Placeholder) */}
          <Card
            className={cn("flex flex-col items-center justify-center p-6 text-center cursor-not-allowed opacity-50",
              uploadMethod === "integration" ? "border-primary shadow-md" : "border-muted-foreground/20"
            )}
            onClick={() => setUploadMethod("integration")}
          >
            <Database className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Import from Integration</h3>
            <p className="mt-2 text-sm text-muted-foreground">Connect to external data sources (Coming Soon).</p>
          </Card>
        </div>

        <DialogFooter>
          <Button onClick={handleClose} variant="outline">Cancel</Button>
          <Button
            onClick={() => setCurrentStep("upload-file")}
            disabled={uploadMethod !== "csv"}
          >
            Continue
          </Button>
        </DialogFooter>
      </>
    );
  }

  const renderContent = () => {
    switch (currentStep) {
      case "select-method":
        return renderSelectMethodStep();
      case "upload-file":
        return renderUploadStep();
      case "map-fields":
        return renderMapFieldsStep();
      case "review":
        return renderReviewStep();
      case "complete":
        return renderCompleteStep();
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] lg:max-w-[600px] flex flex-col h-full sm:h-auto overflow-hidden">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}