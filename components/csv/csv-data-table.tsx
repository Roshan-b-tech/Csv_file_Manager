"use client";

import { useState, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronUp, Settings2, Filter, SortAsc, Columns, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";

type SortDirection = "asc" | "desc" | null;

interface CsvDataTableProps {
  fileId: string;
  columnHeaders: string[];
}

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function CsvDataTable({ fileId, columnHeaders }: CsvDataTableProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(columnHeaders);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const rowsPerPage = 5;
  const [filterInputs, setFilterInputs] = useState<Record<string, string>>({});
  const firstFilterInputRef = useRef<HTMLInputElement>(null);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [savingCell, setSavingCell] = useState<{ row: number; col: string } | null>(null);
  const [savedCell, setSavedCell] = useState<{ row: number; col: string } | null>(null);

  // Move handleFilter above debouncedHandleFilter
  const handleFilter = (column: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };
  const debouncedHandleFilter = useRef(debounce(handleFilter, 300)).current;

  // Local input change handler
  const handleFilterInputChange = (column: string, value: string) => {
    setFilterInputs(prev => ({ ...prev, [column]: value }));
    debouncedHandleFilter(column, value);
  };

  // Sync local filterInputs with filters and columnHeaders
  useEffect(() => {
    setFilterInputs(filters);
  }, [filters, columnHeaders]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const filtersParam = encodeURIComponent(JSON.stringify(filters));
        const sortParams = sortColumn ? `&sortColumn=${sortColumn}&sortDirection=${sortDirection || 'asc'}` : '';
        const response = await fetch(`/api/csv/${fileId}/rows?page=${currentPage}&limit=${rowsPerPage}&filters=${filtersParam}${sortParams}`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const result = await response.json();
        setData(result.rows);
        setTotalPages(Math.ceil(result.total / rowsPerPage));
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fileId, currentPage, filters, sortColumn, sortDirection]);

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Handle column visibility
  const toggleColumn = (column: string) => {
    setVisibleColumns(prev =>
      prev.includes(column)
        ? prev.filter(col => col !== column)
        : [...prev, column]
    );
  };

  // Handle cell editing
  const handleCellEdit = (rowIndex: number, column: string, value: string) => {
    setEditingCell({ row: rowIndex, col: column });
    setEditValue(value);
  };

  const handleCellSave = async () => {
    if (!editingCell) return;
    setSavingCell(editingCell);
    try {
      const rowToSave = data[editingCell.row];
      if (!rowToSave || !rowToSave.id) {
        console.error("Could not find row data or row ID to save.", editingCell);
        // TODO: Show an error notification to the user
        return;
      }
      await fetch(`/api/csv/${fileId}/rows`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rowId: rowToSave.id,
          column: editingCell.col,
          value: editValue
        })
      });
      setData(prev =>
        prev.map((row, index) =>
          index === editingCell.row
            ? { ...row, data: { ...row.data, [editingCell.col]: editValue } }
            : row
        )
      );
      setSavedCell(editingCell);
      setTimeout(() => setSavedCell(null), 1000);
    } catch (err) {
      console.error('Failed to save cell:', err);
      // TODO: Show error notification
    } finally {
      setSavingCell(null);
      setEditingCell(null);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!editingCell) return;

    if (e.key === 'Enter') {
      handleCellSave();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-4">{error}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap justify-center sm:justify-between items-center gap-2 mb-4">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-center sm:justify-start">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 w-full xs:w-full sm:w-auto"
            onClick={() => firstFilterInputRef.current?.focus()}
          >
            <Filter className="h-3.5 w-3.5" />
            Filter
          </Button>
          <DropdownMenu open={sortMenuOpen} onOpenChange={setSortMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 w-full xs:w-full sm:w-auto">
                <SortAsc className="h-3.5 w-3.5" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={sortColumn || ""}
                onValueChange={(col) => {
                  setSortColumn(col);
                  setSortMenuOpen(false);
                  setSortDirection("asc");
                }}
              >
                {visibleColumns.map((col) => (
                  <DropdownMenuRadioItem key={col} value={col}>
                    {col}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Direction</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={sortDirection || "asc"}
                onValueChange={(dir) => {
                  setSortDirection(dir as SortDirection);
                  setSortMenuOpen(false);
                }}
              >
                <DropdownMenuRadioItem value="asc">Ascending</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="desc">Descending</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSortColumn(null);
                  setSortDirection(null);
                  setSortMenuOpen(false);
                }}
              >
                Clear Sort
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 w-full xs:w-full sm:w-auto">
                <Columns className="h-3.5 w-3.5" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columnHeaders.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column}
                  checked={visibleColumns.includes(column)}
                  onCheckedChange={() => toggleColumn(column)}
                >
                  {column}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div> {/* Closing div for controls */}

      {/* Data Table Container */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((column) => (
                <TableHead key={column} className="min-w-[150px] px-4 py-2">
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort(column)}
                  >
                    {column}
                    {sortColumn === column && (
                      <span className="ml-2">
                        {sortDirection === "asc" ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </span>
                    )}
                  </div>
                  <Input
                    ref={column === visibleColumns[0] ? firstFilterInputRef : null}
                    className="mt-2 h-8 text-sm px-2 py-1 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Filter ${column}...`}
                    value={filterInputs[column] || ""}
                    onChange={(e) => handleFilterInputChange(column, e.target.value)}
                    onClick={e => e.stopPropagation()} // Prevent sorting when clicking filter input
                  />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow key={row.id || rowIndex}>
                {visibleColumns.map((column) => (
                  <TableCell
                    key={column}
                    className={cn(
                      "relative",
                      editingCell?.row === rowIndex && editingCell?.col === column && "z-10",
                      savedCell?.row === rowIndex && savedCell?.col === column && "bg-green-100"
                    )}
                    onClick={() => handleCellEdit(rowIndex, column, row.data?.[column]?.toString() || "")}
                  >
                    {editingCell?.row === rowIndex && editingCell?.col === column ? (
                      <Input
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={handleCellSave}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="absolute inset-0 w-full h-full p-2 border rounded bg-white focus:outline-none"
                      />
                    ) : (
                      <span className="block truncate">
                        {savingCell?.row === rowIndex && savingCell?.col === column ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          row.data?.[column]?.toString()
                        )}
                      </span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center">
        <Pagination>
          <PaginationContent className="flex-wrap">
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) setCurrentPage(currentPage - 1);
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
            {/* Render pagination items dynamically or a simplified version for mobile */}
            {/* Logic to display a limited range of pages */}
            {
              totalPages <= 7 ? (
                // Show all pages if total pages are small
                Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <PaginationItem key={page} className="hidden sm:block">
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page);
                      }}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))
              ) : (
                // Show a limited range with ellipsis for larger total pages
                <>{
                  // Always show first page
                  <PaginationItem key={1} className="hidden sm:block">
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(1);
                      }}
                      isActive={currentPage === 1}
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                }
                  {
                    // Show ellipsis if current page is far from the beginning
                    currentPage > 4 && (
                      <PaginationItem key="ellipsis-start" className="hidden sm:block">
                        ...
                      </PaginationItem>
                    )
                  }
                  {
                    // Show pages around the current page
                    Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => page >= Math.max(2, currentPage - 2) && page <= Math.min(totalPages - 1, currentPage + 2))
                      .map(page => (
                        <PaginationItem key={page} className="hidden sm:block">
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page);
                            }}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))
                  }
                  {
                    // Show ellipsis if current page is far from the end
                    currentPage < totalPages - 3 && (
                      <PaginationItem key="ellipsis-end" className="hidden sm:block">
                        ...
                      </PaginationItem>
                    )
                  }
                  {
                    // Always show last page if total pages > 1
                    totalPages > 1 && (
                      <PaginationItem key={totalPages} className="hidden sm:block">
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(totalPages);
                          }}
                          isActive={currentPage === totalPages}
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  }</>
              )
            }
            <PaginationItem className="sm:hidden">
              <PaginationLink href="#" isActive>{currentPage}</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                }}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}