'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type CsvFile = {
    id: string;
    fileName: string;
    originalName: string;
    uploadedAt: string;
    columnHeaders: string[];
    rowCount: number;
};

export default function AnalyzePage() {
    const params = useParams();
    const fileId = (params?.id as string) ?? null;

    const [file, setFile] = useState<CsvFile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [rows, setRows] = useState<any[]>([]);
    const [isLoadingRows, setIsLoadingRows] = useState(true);
    const [rowsError, setRowsError] = useState<string | null>(null);

    const [summaryStatistics, setSummaryStatistics] = useState<{ [key: string]: any } | null>(null);

    const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
    const [chartData, setChartData] = useState<any[]>([]);

    const [selectedChartType, setSelectedChartType] = useState<string | null>(null);

    useEffect(() => {
        const fetchFile = async () => {
            try {
                const response = await fetch(`/api/csv/${fileId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch CSV file');
                }
                const data = await response.json();
                setFile(data);
            } catch (err) {
                setError("Failed to load CSV file");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        if (fileId) {
            fetchFile();
        }
    }, [fileId]);

    useEffect(() => {
        const fetchRows = async () => {
            setIsLoadingRows(true);
            setRowsError(null);
            try {
                // Fetching a limited number of rows for overview/preview
                const response = await fetch(`/api/csv/${fileId}/rows?limit=100`);
                if (!response.ok) {
                    throw new Error('Failed to fetch CSV rows');
                }
                const data = await response.json();
                setRows(data.rows);
            } catch (err) {
                setRowsError("Failed to load CSV rows");
                console.error(err);
            } finally {
                setIsLoadingRows(false);
            }
        };

        if (fileId) {
            fetchRows();
        }
    }, [fileId]);

    useEffect(() => {
        if (rows.length > 0 && file?.columnHeaders) {
            const stats: { [key: string]: any } = {};
            file.columnHeaders.forEach(header => {
                const columnData = rows.map(row => row.data?.[header]);
                const nonNullData = columnData.filter(d => d !== null && d !== undefined && d !== '');

                stats[header] = {
                    count: nonNullData.length,
                    dataType: 'unknown',
                    // Add more general stats here
                };

                // Attempt to infer data type and calculate specific stats
                const isNumeric = nonNullData.every(d => !isNaN(Number(d)));
                const isDate = nonNullData.every(d => !isNaN(new Date(d).getTime())); // Basic date check

                if (isNumeric && nonNullData.length > 0) {
                    stats[header].dataType = 'number';
                    const numericData = nonNullData.map(d => Number(d));
                    stats[header].mean = numericData.reduce((sum, d) => sum + d, 0) / numericData.length;
                    stats[header].min = Math.min(...numericData);
                    stats[header].max = Math.max(...numericData);
                    // Could add median, standard deviation etc.
                } else if (isDate && nonNullData.length > 0) {
                    stats[header].dataType = 'date';
                    // Could add min/max dates, frequency etc.
                } else {
                    stats[header].dataType = 'string';
                    const uniqueValues = new Set(nonNullData.map(String));
                    stats[header].uniqueCount = uniqueValues.size;
                    if (uniqueValues.size < 20 && uniqueValues.size > 1) { // Show unique values if not too many
                        stats[header].uniqueValues = Array.from(uniqueValues).slice(0, 10); // Limit list size
                    }
                }
            });
            setSummaryStatistics(stats);
        } else {
            setSummaryStatistics(null);
        }
    }, [rows, file?.columnHeaders]); // Recalculate if rows or headers change

    // Effect to prepare data for chart when rows or selected column change
    useEffect(() => {
        if (selectedColumn && rows.length > 0) {
            console.log('Preparing chart data for column:', selectedColumn);
            const columnData = rows.map(row => row.data?.[selectedColumn]);
            const nonNullData = columnData.filter(d => d !== null && d !== undefined && d !== '');
            const stats = summaryStatistics?.[selectedColumn];

            console.log('Column stats:', stats);

            if (!stats) {
                setChartData([]);
                setSelectedChartType(null);
                console.log('Chart data cleared: No stats available for column.');
                return;
            }

            // Determine available chart types for the selected column's data type
            let availableChartTypes: string[] = [];
            if (stats.dataType === 'number') {
                availableChartTypes = ['Bar Chart', 'Line Chart'];
            } else if (stats.dataType === 'string') {
                if (stats.uniqueCount > 1) {
                    availableChartTypes.push('Bar Chart');
                    if (stats.uniqueCount < 15) {
                        availableChartTypes.push('Pie Chart');
                    }
                }
            }

            console.log('Available chart types based on stats:', availableChartTypes);

            // If no chart type is selected or the selected type is not available for the new column, default to the first available type
            if (!selectedChartType || !availableChartTypes.includes(selectedChartType)) {
                const newChartType = availableChartTypes.length > 0 ? availableChartTypes[0] : null;
                setSelectedChartType(newChartType);
                console.log('Setting new chart type:', newChartType, 'from available:', availableChartTypes);
            }

            // Prepare data based on selected chart type
            let dataForChart: any[] = [];

            if (stats.dataType === 'number') {
                const numericData = nonNullData.map(d => Number(d)).filter(isFinite);
                if (numericData.length > 0) {
                    if (selectedChartType === 'Bar Chart') {
                        // Create histogram bins
                        const min = Math.min(...numericData);
                        const max = Math.max(...numericData);
                        const range = max - min;
                        const binCount = Math.min(10, Math.max(5, Math.ceil(Math.sqrt(numericData.length))));
                        const binSize = range / binCount;

                        const bins = Array(binCount).fill(0).map((_, i) => ({
                            range: `${(min + i * binSize).toFixed(2)} - ${(min + (i + 1) * binSize).toFixed(2)}`,
                            count: 0,
                            value: 0
                        }));

                        numericData.forEach(d => {
                            const binIndex = Math.min(Math.floor((d - min) / binSize), binCount - 1);
                            if (binIndex >= 0) {
                                bins[binIndex].count++;
                                bins[binIndex].value += d;
                            }
                        });

                        // Calculate average for each bin
                        bins.forEach(bin => {
                            bin.value = bin.count > 0 ? bin.value / bin.count : 0;
                        });

                        dataForChart = bins;
                    } else if (selectedChartType === 'Line Chart') {
                        // Sort data for line chart
                        const sortedData = [...numericData].sort((a, b) => a - b);
                        dataForChart = sortedData.map((value, index) => ({
                            index,
                            value
                        }));
                    }
                }
            } else if (stats.dataType === 'string') {
                const counts: { [key: string]: number } = {};
                nonNullData.forEach(d => {
                    const value = String(d);
                    counts[value] = (counts[value] || 0) + 1;
                });

                if (selectedChartType === 'Bar Chart') {
                    dataForChart = Object.entries(counts)
                        .map(([name, value]) => ({ name, value }))
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 20); // Limit to top 20 categories
                } else if (selectedChartType === 'Pie Chart') {
                    dataForChart = Object.entries(counts)
                        .map(([name, value]) => ({ name, value }))
                        .sort((a, b) => b.value - a.value);
                }
            }

            console.log('Prepared chart data:', dataForChart);
            setChartData(dataForChart);
        } else {
            setChartData([]);
            setSelectedChartType(null);
            console.log('Chart data cleared: No column selected or no rows.');
        }
    }, [rows, selectedColumn, summaryStatistics, selectedChartType]);

    // Determine available chart types for rendering the dropdown
    const availableChartTypesForDropdown = (() => {
        if (!selectedColumn || !summaryStatistics?.[selectedColumn]) return [];
        const stats = summaryStatistics[selectedColumn];
        console.log('Stats inside availableChartTypesForDropdown:', stats);
        let types: { value: string; label: string }[] = [];
        if (stats.dataType === 'number') {
            console.log('Data type is number, adding chart types...');
            types.push({ value: 'Bar Chart', label: 'Bar Chart (Histogram)' });
            types.push({ value: 'Line Chart', label: 'Line Chart' });
            console.log('Types after adding numeric charts:', types);
        } else if (stats.dataType === 'string' && stats.uniqueCount > 1) {
            console.log('Data type is string, unique count > 1, adding bar chart...');
            types.push({ value: 'Bar Chart', label: 'Bar Chart (Counts)' });
            if (stats.uniqueCount !== undefined) {
                console.log('String unique count:', stats.uniqueCount);
            }
            if (stats.uniqueCount !== undefined && stats.uniqueCount < 15) {
                console.log('Unique count < 15, adding pie chart...');
                types.push({ value: 'Pie Chart', label: 'Pie Chart' });
            }
        }
        console.log('Returning types:', types);
        return types;
    })();

    console.log('availableChartTypesForDropdown:', availableChartTypesForDropdown);

    return (
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
            {/* File Title */}
            {isLoading ? (
                <Skeleton className="h-8 w-64 mb-6" />
            ) : error ? (
                <h1 className="text-2xl font-bold mb-6 text-destructive">Error Loading File</h1>
            ) : file ? (
                <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Analyze CSV File: {file.originalName}</h1>
            ) : (
                <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Analyze CSV File</h1>
            )}

            {/* Content Grid */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                {/* Data Overview Card */}
                {isLoading ? (
                    <>
                        <Skeleton className="h-48" />
                        <Skeleton className="h-48" />
                    </>
                ) : error ? (
                    <Card className="lg:col-span-2 p-8 text-center">
                        <CardTitle className="text-destructive">Could not load file data.</CardTitle>
                        <CardContent>{error}</CardContent>
                    </Card>
                ) : file ? (
                    <>
                        <Card className="flex flex-col h-full">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">Data Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow text-sm text-gray-700 dark:text-gray-300">
                                <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                                    <p className="mb-2"><span className="font-medium text-gray-900 dark:text-gray-100">File Name:</span> {file.originalName}</p>
                                    <p className="mb-2"><span className="font-medium text-gray-900 dark:text-gray-100">Rows:</span> {file.rowCount}</p>
                                    <p><span className="font-medium text-gray-900 dark:text-gray-100">Columns:</span> {file.columnHeaders.length}</p>
                                </div>

                                <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Column Statistics</h4>
                                {isLoadingRows ? (
                                    <p>Loading statistics...</p>
                                ) : rowsError ? (
                                    <p className="text-destructive">{rowsError}</p>
                                ) : summaryStatistics ? (
                                    <div className="space-y-6 max-h-80 overflow-y-auto pr-2">
                                        {Object.entries(summaryStatistics).map(([header, stats]) => (
                                            <div key={header} className="pb-4 border-b last:border-b-0 border-gray-200 dark:border-gray-700">
                                                <h5 className="font-semibold mb-2 text-base text-gray-900 dark:text-gray-100">{header}</h5>
                                                <div className="space-y-1">
                                                    <p><span className="font-medium">Type:</span> {stats.dataType}</p>
                                                    <p><span className="font-medium">Count:</span> {stats.count}</p>
                                                    {stats.dataType === 'number' && (
                                                        <>
                                                            <p><span className="font-medium">Mean:</span> {stats.mean?.toFixed(2)}</p>
                                                            <p><span className="font-medium">Min:</span> {stats.min}</p>
                                                            <p><span className="font-medium">Max:</span> {stats.max}</p>
                                                        </>
                                                    )}
                                                    {stats.dataType === 'string' && stats.uniqueCount !== undefined && (
                                                        <p><span className="font-medium">Unique Values:</span> {stats.uniqueCount}</p>
                                                    )}
                                                    {stats.dataType === 'string' && stats.uniqueValues && stats.uniqueValues.length > 0 && (
                                                        <p><span className="font-medium">Sample Unique Values:</span> {stats.uniqueValues.join(', ')}{stats.uniqueCount > stats.uniqueValues.length ? '...' : ''}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p>No statistics available (could not load rows or no data).</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Visualizations Card */}
                        <Card className="flex flex-col h-full">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">Visualizations</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow flex flex-col gap-6">
                                {/* Controls: Select Column and Chart Type */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    {/* Select Column */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Column:</span>
                                        <Select onValueChange={setSelectedColumn} value={selectedColumn || ""}>
                                            <SelectTrigger id="column-select" className="w-[200px]">
                                                <SelectValue placeholder="Choose column" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {file?.columnHeaders.map(header => (
                                                    <SelectItem key={header} value={header}>{header}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Chart Type Selector */}
                                    {selectedColumn && availableChartTypesForDropdown.length > 0 && ( // Show chart type selector if column selected and types available
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Chart Type:</span>
                                            <Select onValueChange={setSelectedChartType} value={selectedChartType || ""}>
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue placeholder="Select chart" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableChartTypesForDropdown.map(type => (
                                                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>

                                {/* Chart Display Area */}
                                {isLoadingRows ? (
                                    <p className="text-center text-gray-700 dark:text-gray-300">Loading data for visualizations...</p>
                                ) : rowsError ? (
                                    <p className="text-destructive text-center">{rowsError}</p>
                                ) : selectedColumn && chartData.length > 0 ? (
                                    <div className="relative w-full flex-grow h-96"> {/* Added relative, flex-grow, and set height */}
                                        <ResponsiveContainer width="100%" height="100%">
                                            {selectedChartType === 'Bar Chart' && (
                                                <BarChart data={chartData} margin={{
                                                    top: 5,
                                                    right: 30,
                                                    left: 20,
                                                    bottom: 80, // Adjusted bottom margin for labels and legend
                                                }}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis
                                                        dataKey={summaryStatistics?.[selectedColumn]?.dataType === 'number' ? 'range' : 'name'}
                                                        angle={-45}
                                                        textAnchor="end"
                                                        height={80} // Adjusted height to accommodate truncated labels
                                                        interval={0} // Show all labels initially
                                                        tickFormatter={(value: string) => {
                                                            // Truncate long labels for readability
                                                            if (value.length > 15) { // Adjust truncation length as needed
                                                                return value.substring(0, 12) + '...';
                                                            }
                                                            return value;
                                                        }}
                                                        className="text-xs text-gray-700 dark:text-gray-300"
                                                    />
                                                    <YAxis className="text-xs text-gray-700 dark:text-gray-300" />
                                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', color: '#e2e8f0', border: 'none' }} />
                                                    <Legend
                                                        verticalAlign="bottom"
                                                        wrapperStyle={{ bottom: -20, left: 0, right: 0, textAlign: 'center', fontSize: '12px', color: '#475569' }}
                                                    />
                                                    <Bar
                                                        dataKey={summaryStatistics?.[selectedColumn]?.dataType === 'number' ? 'count' : 'value'}
                                                        fill="#8884d8"
                                                        name={summaryStatistics?.[selectedColumn]?.dataType === 'number' ? 'Frequency' : 'Count'}
                                                    />
                                                </BarChart>
                                            )}
                                            {selectedChartType === 'Line Chart' && (
                                                <LineChart data={chartData} margin={{
                                                    top: 5,
                                                    right: 30,
                                                    left: 20,
                                                    bottom: 20,
                                                }}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="index" className="text-xs text-gray-700 dark:text-gray-300" />
                                                    <YAxis className="text-xs text-gray-700 dark:text-gray-300" />
                                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', color: '#e2e8f0', border: 'none' }} />
                                                    <Legend wrapperStyle={{ fontSize: '12px', color: '#475569' }} />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="value"
                                                        stroke="#8884d8"
                                                        name="Value"
                                                    />
                                                </LineChart>
                                            )}
                                            {selectedChartType === 'Pie Chart' && (
                                                <PieChart margin={{
                                                    top: 20,
                                                    right: 20,
                                                    left: 20,
                                                    bottom: 20,
                                                }}>
                                                    <Pie
                                                        data={chartData}
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={80}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                        nameKey="name"
                                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                                        labelLine={false}
                                                    >
                                                        {chartData.map((entry, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={`hsl(${(index * 360 / chartData.length) % 360}, 70%, 50%)`}
                                                            />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', color: '#e2e8f0', border: 'none' }} />
                                                    <Legend wrapperStyle={{ fontSize: '12px', color: '#475569' }} />
                                                </PieChart>
                                            )}
                                        </ResponsiveContainer>
                                    </div>
                                ) : selectedColumn && chartData.length === 0 && !isLoadingRows && !rowsError ? (
                                    <p className="text-center text-gray-700 dark:text-gray-300">No suitable data or too many unique values in this column for visualization.</p>
                                ) : (
                                    <p className="text-center text-gray-700 dark:text-gray-300">Select a column to generate visualizations.</p>
                                )}
                            </CardContent>
                        </Card>
                    </>
                ) : null /* Handle case where fileId is not available yet */}
            </div>
        </div>
    );
} 