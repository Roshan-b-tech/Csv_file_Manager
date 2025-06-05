'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function SharePage() {
    const [emailToShare, setEmailToShare] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleShare = async () => {
        if (!emailToShare) {
            toast({
                title: "Error",
                description: "Please enter an email address.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/user/invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: emailToShare }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send invitation');
            }

            toast({
                title: "Success",
                description: data.message || "Invitation sent.",
            });
            setEmailToShare(''); // Clear the input on success

        } catch (error: any) {
            console.error('Error sending invitation:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to send invitation.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

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
                <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6 gap-4">
                    <Button variant="outline" size="icon" asChild className="mr-auto sm:mr-4 bg-white/80 backdrop-blur-md border border-white/30 shadow-lg hover:scale-105 transition-transform">
                        <Link href="/">
                            <ChevronLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-sm truncate">
                            Share with Team
                        </h1>
                        <p className="mt-1 text-white/90 drop-shadow-sm text-sm sm:text-base">
                            Collaborate and share access to your data.
                        </p>
                    </div>
                </div>

                {/* Page Content Goes Here */}
                <Card className="bg-white/80 backdrop-blur-md border border-white/30 shadow-lg rounded-2xl p-6">
                    <CardHeader>
                        <CardTitle>Sharing Options</CardTitle>
                        <CardDescription>Configure how you want to share.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Sharing UI elements will be added here */}
                        <div className="space-y-2">
                            <Label htmlFor="share-email">Email Address</Label>
                            <Input
                                id="share-email"
                                placeholder="Enter email to share with"
                                type="email"
                                value={emailToShare}
                                onChange={(e) => setEmailToShare(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={handleShare}
                            disabled={isLoading || !emailToShare}
                            className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg hover:scale-105 transition-transform"
                        >
                            {isLoading ? 'Sending...' : 'Share'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 