"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password");
                return;
            }

            router.push("/");
            router.refresh();
        } catch (error) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-2 sm:p-0">
            {/* Modern gradient background */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 animate-gradient-move" />
            {/* Subtle blurred SVG shape */}
            <svg className="absolute -top-32 -left-32 w-[600px] h-[600px] opacity-30 blur-2xl -z-10" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="300" cy="300" r="300" fill="url(#paint0_radial)" />
                <defs>
                    <radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientTransform="translate(300 300) scale(300)" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#a5b4fc" />
                        <stop offset="1" stopColor="#818cf8" stopOpacity="0.2" />
                    </radialGradient>
                </defs>
            </svg>
            {/* Login card */}
            <Card className="w-full max-w-xs sm:max-w-md shadow-xl animate-in fade-in zoom-in-95 bg-white/90 backdrop-blur-md border border-white/30 p-4 sm:p-0">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl sm:text-3xl font-bold">Sign in to your account</CardTitle>
                    <CardDescription className="text-sm">Access your CSV files and profile</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit} autoComplete="off">
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm">Email Address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                autoComplete="off"
                                required
                                className="h-10 text-base"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Your password"
                                autoComplete="current-password"
                                required
                                className="h-10 text-base"
                            />
                        </div>
                        {error && (
                            <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm animate-in fade-in slide-in-from-top-2 text-center">
                                {error}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <Button type="submit" className="w-full transition-all duration-200 h-10 text-base" disabled={loading}>
                            {loading ? "Signing in..." : "Sign in"}
                        </Button>
                        <div className="text-sm text-center mt-2 animate-in fade-in slide-in-from-bottom-2">
                            <Link href="/register" className="font-medium text-primary hover:underline transition-colors">
                                Don't have an account? Sign up
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
} 