"use client";

import { useState, useEffect } from 'react';

type CsvFile = {
  id: string;
  fileName: string;
  originalName: string;
  uploadedAt: string;
  columnHeaders: string[];
  rowCount: number;
};

export function useCsvFile(fileId: string) {
  const [file, setFile] = useState<CsvFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchFile = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock data based on fileId
        const mockFiles: Record<string, CsvFile> = {
          "csv_abc123": {
            id: "csv_abc123",
            fileName: "customer-data-2023.csv",
            originalName: "Customer Data 2023.csv",
            uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            columnHeaders: ["Name", "Email", "Phone", "Address", "City", "State", "Zip"],
            rowCount: 248
          },
          "csv_def456": {
            id: "csv_def456",
            fileName: "product-inventory.csv",
            originalName: "Product Inventory.csv",
            uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            columnHeaders: ["ID", "Name", "Category", "Price", "Stock", "Description"],
            rowCount: 156
          },
          "csv_ghi789": {
            id: "csv_ghi789",
            fileName: "sales-q1-2023.csv",
            originalName: "Sales Q1 2023.csv",
            uploadedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            columnHeaders: ["Date", "Product", "Quantity", "Price", "Total", "Customer"],
            rowCount: 532
          }
        };
        
        // If the file exists in our mock data, return it
        if (mockFiles[fileId]) {
          setFile(mockFiles[fileId]);
        } else {
          // For random IDs created during runtime
          setFile({
            id: fileId,
            fileName: "uploaded-file.csv",
            originalName: "Uploaded File.csv",
            uploadedAt: new Date().toISOString(),
            columnHeaders: ["Name", "Description", "Category", "Price", "Quantity"],
            rowCount: 35
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch CSV file'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchFile();
  }, [fileId]);

  return { file, isLoading, error };
}