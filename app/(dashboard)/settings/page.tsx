"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type UserSettings = {
  name: string;
  email: string;
  receiveCsvImportNotifications: boolean;
  receiveProductUpdates: boolean;
};

export default function SettingsPage() {
  const { toast } = useToast();
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [csvImportNotificationsEnabled, setCsvImportNotificationsEnabled] = useState(true);
  const [productUpdatesEnabled, setProductUpdatesEnabled] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/user");
        if (!response.ok) {
          throw new Error("Failed to fetch settings");
        }
        const data: UserSettings = await response.json();
        setUserSettings(data);
        setCsvImportNotificationsEnabled(data.receiveCsvImportNotifications);
        setProductUpdatesEnabled(data.receiveProductUpdates);
      } catch (err) {
        console.error("Error fetching settings:", err);
        setError("Failed to load settings.");
        toast({
          title: "Error",
          description: "Failed to load settings.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiveCsvImportNotifications: csvImportNotificationsEnabled,
          receiveProductUpdates: productUpdatesEnabled,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      // Update local state with saved settings (in case backend applies any transformations)
      const updatedSettings: UserSettings = await response.json();
      setUserSettings(updatedSettings);
      setCsvImportNotificationsEnabled(updatedSettings.receiveCsvImportNotifications);
      setProductUpdatesEnabled(updatedSettings.receiveProductUpdates);

      toast({
        title: "Success",
        description: "Settings saved successfully.",
      });

    } catch (err) {
      console.error("Error saving settings:", err);
      setError("Failed to save settings.");
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-white animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center text-destructive">
        <p>{error}</p>
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
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 text-center sm:text-left">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">Settings</h1>
            <p className="mt-1 text-white/90 drop-shadow-sm">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          <Card className="bg-white/80 backdrop-blur-md border border-white/30 shadow-lg rounded-2xl transition-transform duration-200 hover:shadow-2xl hover:scale-[1.01]">
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Update your personal information and email preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Enter your name" value={userSettings?.name || ''} disabled />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Enter your email" value={userSettings?.email || ''} disabled />
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Email Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="csv-imports">CSV Import Notifications</Label>
                    <Switch
                      id="csv-imports"
                      checked={csvImportNotificationsEnabled}
                      onCheckedChange={setCsvImportNotificationsEnabled}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="updates">Product Updates</Label>
                    <Switch
                      id="updates"
                      checked={productUpdatesEnabled}
                      onCheckedChange={setProductUpdatesEnabled}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="w-full sm:w-auto bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg hover:scale-105 transition-transform"
              >
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-white/80 backdrop-blur-md border border-white/30 shadow-lg rounded-2xl transition-transform duration-200 hover:shadow-2xl hover:scale-[1.01]">
            <CardHeader>
              <CardTitle>CSV Import Settings</CardTitle>
              <CardDescription>
                Configure default settings for CSV imports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="default-batch-type">Default Batch Type</Label>
                  <Input
                    id="default-batch-type"
                    placeholder="e.g., Company"
                    disabled
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-mapping">Enable Auto Field Mapping</Label>
                  <Switch id="auto-mapping" disabled />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full sm:w-auto bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg hover:scale-105 transition-transform" disabled>Save Changes</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}