'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowRight, UploadCloud, BarChart3, Users2, Table2, Database } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

export default function Home() {
  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500">
      <svg className="absolute -top-32 -left-32 w-[600px] h-[600px] opacity-30 blur-2xl -z-10" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="300" cy="300" r="300" fill="url(#paint0_radial)" />
        <defs>
          <radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientTransform="translate(300 300) scale(300)" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a5b4fc" />
            <stop offset="1" stopColor="#818cf8" stopOpacity="0.2" />
          </radialGradient>
        </defs>
      </svg>
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 text-center sm:text-left">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">Dashboard</h1>
            <p className="mt-1 text-white/90 drop-shadow-sm">
              Welcome to CSV Manager
            </p>
          </div>
          <Button asChild className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg hover:scale-105 transition-transform">
            <Link href="/csv-manager">
              Go to CSV Manager
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          <Card className="bg-white/80 backdrop-blur-md border border-white/30 shadow-lg rounded-2xl transition-transform duration-200 hover:shadow-2xl hover:scale-[1.01]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Access</CardTitle>
              <CardDescription>
                Your recently accessed CSV files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <QuickAccessList />
            </CardContent>
          </Card>

          <Card className="md:col-span-2 bg-white/80 backdrop-blur-md border border-white/30 shadow-lg rounded-2xl transition-transform duration-200 hover:shadow-2xl hover:scale-[1.01]">
            <CardHeader>
              <CardTitle className="text-base">Getting Started</CardTitle>
              <CardDescription>
                Learn how to use the CSV Manager
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <GettingStartedCard
                icon={<UploadCloud className="h-6 w-6 text-white" />}
                title="Import CSV File"
                description="Upload and map your CSV data"
                href="/csv-manager"
              />
              <GettingStartedCard
                icon={<Table2 className="h-6 w-6 text-white" />}
                title="Manage Data"
                description="Edit, filter, and organize your data"
                href="/csv-manager"
              />
              <GettingStartedCard
                icon={<BarChart3 className="h-6 w-6 text-white" />}
                title="Analyze Results"
                description="Visualize and analyze your data"
                href="/csv-manager"
              />
              <GettingStartedCard
                icon={<Users2 className="h-6 w-6 text-white" />}
                title="Share with Team"
                description="Collaborate with your team members"
                href="/share"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuickAccessItem({
  title,
  description,
  href
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-primary/10 transition-all duration-150 group"
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
          <FileText className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium group-hover:text-primary transition-colors">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </Link>
  );
}

function GettingStartedCard({
  icon,
  title,
  description,
  href
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full hover:bg-primary/5 hover:shadow-lg rounded-xl transition-all duration-200 group border border-transparent">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              {icon}
            </div>
            <div>
              <h3 className="font-medium group-hover:text-primary transition-colors">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function QuickAccessList() {
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch("/api/csv");
        if (!response.ok) throw new Error("Failed to fetch files");
        const data = await response.json();
        setFiles(data);
      } catch (err) {
        setFiles([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFiles();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="h-10 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!files.length) {
    return (
      <div className="text-muted-foreground text-sm">No CSV files found. Upload a file to get started.</div>
    );
  }

  return (
    <>
      {files.slice(0, 3).map((file) => (
        <QuickAccessItem
          key={file.id}
          title={file.originalName}
          description={formatDistanceToNow(new Date(file.uploadedAt), { addSuffix: true })}
          href={`/csv-manager/${file.id}`}
        />
      ))}
    </>
  );
}