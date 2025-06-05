"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Upload, File, ArrowUpFromLine, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CsvUploadDialog } from "@/components/csv/csv-upload-dialog";
import { CsvFileList } from "@/components/csv/csv-file-list";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";

type UserActivity = {
  id: string;
  action: string;
  details: any;
  createdAt: string;
  csvFile?: { // Optional because not all activities might relate to a file
    id: string;
    name: string;
  };
};

export default function CsvManagerPage() {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("files");
  const [recentActivities, setRecentActivities] = useState<UserActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (activeTab === "recent") {
      const fetchActivities = async () => {
        setIsLoadingActivities(true);
        setActivitiesError(null);
        try {
          console.log('Fetching recent activities...');
          const response = await fetch("/api/user/activity");
          if (!response.ok) {
            throw new Error("Failed to fetch recent activity");
          }
          const data = await response.json();
          console.log('Received recent activities data:', data);
          setRecentActivities(data);
        } catch (error) {
          console.error("Error fetching activities:", error);
          setActivitiesError("Failed to load recent activity.");
        } finally {
          setIsLoadingActivities(false);
        }
      };

      fetchActivities();
    }
  }, [activeTab]);

  // Helper function to format activity description
  const formatActivity = (activity: UserActivity) => {
    const timeAgo = formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true });
    switch (activity.action) {
      case "uploaded_csv":
        return `Uploaded file '${activity.details?.fileName || "unknown file"}' ${timeAgo}.`;
      case "deleted_csv":
        return `Deleted file '${activity.details?.fileName || "unknown file"}' ${timeAgo}.`;
      // Add other activity types here later (e.g., renamed_csv, edited_cell)
      default:
        return `Performed '${activity.action}' ${timeAgo}.`;
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500">
      {/* Blurred SVG shape for depth, matching dashboard/login/register */}
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 text-center sm:text-left">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">CSV Manager</h1>
            <p className="mt-1 text-white/90 drop-shadow-sm">
              Upload, view, and manage your CSV files
            </p>
          </div>
          <Button onClick={() => setIsUploadDialogOpen(true)} className="gap-2 bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg hover:scale-105 transition-transform">
            <PlusCircle className="h-4 w-4" /> Import CSV
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex justify-center sm:justify-start">
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="space-y-4">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <Card className="h-52 bg-white/80 backdrop-blur-md border border-white/30 shadow-lg rounded-2xl flex flex-col items-center justify-center cursor-pointer border-dashed hover:bg-primary/10 hover:shadow-2xl hover:scale-[1.01] transition-all"
                onClick={() => setIsUploadDialogOpen(true)}>
                <CardContent className="flex flex-col items-center justify-center pt-6">
                  <ArrowUpFromLine className="h-10 w-10 text-blue-500 mb-4 animate-bounce" />
                  <h3 className="text-lg font-medium">Upload New CSV</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Drag and drop or click to upload
                  </p>
                </CardContent>
              </Card>
              <CsvFileList />
            </div>
          </TabsContent>

          <TabsContent value="recent">
            <Card className="bg-white/80 backdrop-blur-md border border-white/30 shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your recent CSV import and editing activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingActivities && (
                  <div className="text-muted-foreground text-center py-8 flex flex-col items-center">
                    <Loader2 className="h-12 w-12 mx-auto mb-3 text-blue-400/80 animate-spin" />
                    <p>Loading recent activity...</p>
                  </div>
                )}
                {activitiesError && (
                  <div className="text-destructive text-center py-8">
                    <p>{activitiesError}</p>
                  </div>
                )}
                {!isLoadingActivities && !activitiesError && recentActivities.length === 0 && (
                  <div className="text-muted-foreground text-center py-8">
                    <File className="h-12 w-12 mx-auto mb-3 text-blue-400/80" />
                    <p>No recent activity</p>
                  </div>
                )}
                {!isLoadingActivities && !activitiesError && recentActivities.length > 0 && (
                  <div className="space-y-4">
                    {recentActivities.map(activity => (
                      <div key={activity.id} className="border-b pb-2 last:border-b-0 last:pb-0 text-sm text-muted-foreground">
                        {formatActivity(activity)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <CsvUploadDialog
          open={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          onSuccess={(fileId) => {
            router.push(`/csv-manager/${fileId}`);
            // Optionally refetch activities after a successful upload
            if (activeTab === 'recent') {
              // This might require a state update or a dedicated refetch function
              // For now, navigating to the file view is the primary action.
              // A more robust solution might involve invalidating a cache or using a state management library.
            }
          }}
        />
      </div>
    </div>
  );
}