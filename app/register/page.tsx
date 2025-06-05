"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams ? searchParams.get('token') : null;
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        bio: "",
        location: "",
        website: "",
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    invitationToken: token,
                }),
            });

            if (response.ok) {
                router.push("/login?registered=true");
            } else {
                const data = await response.json();
                setError(data.message || "Registration failed");
            }
        } catch (error) {
            setError("An error occurred during registration");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const validateInvitation = async () => {
            if (!token) return;

            try {
                const response = await fetch(`/api/invitations/validate?token=${token!}`);
                const data = await response.json();

                if (response.ok) {
                    if (!formData.email || formData.email !== data.email) {
                        setFormData(prev => ({ ...prev, email: data.email }));
                    }
                } else {
                    setError(data.message || 'Invalid or expired invitation token.');
                    toast({
                        title: "Invitation Error",
                        description: data.message || 'Invalid or expired invitation token.',
                        variant: "destructive",
                    });
                }
            } catch (error) {
                console.error('Error validating invitation token:', error);
                setError('An error occurred validating invitation.');
                toast({
                    title: "Invitation Error",
                    description: 'An error occurred validating invitation.',
                    variant: "destructive",
                });
            }
        };

        validateInvitation();
    }, [token, formData.email, toast]);

    return (
        <Card className="w-full max-w-xs sm:max-w-md shadow-xl animate-in fade-in zoom-in-95 bg-white/90 backdrop-blur-md border border-white/30 p-4 sm:p-0">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl sm:text-3xl font-bold">Create your account</CardTitle>
                <CardDescription className="text-sm">Sign up to manage your CSV files and profile</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit} autoComplete="off">
                <CardContent className="space-y-4">
                    {error && (
                        <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm">Display Name</Label>
                        <Input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Your name"
                            autoComplete="off"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="h-10 text-base"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm">Email Address</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="off"
                            required
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="h-10 text-base"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm">Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Create a password"
                            autoComplete="new-password"
                            required
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            className="h-10 text-base"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bio" className="text-sm">Bio</Label>
                        <Textarea
                            id="bio"
                            name="bio"
                            placeholder="Tell us about yourself"
                            value={formData.bio}
                            onChange={e => setFormData({ ...formData, bio: e.target.value })}
                            className="text-base"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="location" className="text-sm">Location</Label>
                        <Input
                            id="location"
                            name="location"
                            type="text"
                            placeholder="Your location"
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                            className="h-10 text-base"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="website" className="text-sm">Website</Label>
                        <Input
                            id="website"
                            name="website"
                            type="url"
                            placeholder="Your website"
                            value={formData.website}
                            onChange={e => setFormData({ ...formData, website: e.target.value })}
                            className="h-10 text-base"
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button type="submit" className="w-full transition-all duration-200 h-10 text-base" disabled={isLoading}>
                        {isLoading ? "Creating account..." : "Create account"}
                    </Button>
                    <div className="text-sm text-center mt-2 animate-in fade-in slide-in-from-bottom-2">
                        <Link href="/login" className="font-medium text-primary hover:underline transition-colors">
                            Already have an account? Sign in
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}

export default function RegisterPage() {
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
            {/* Registration card */}
            <Suspense fallback={<div>Loading...</div>}>
                <RegisterForm />
            </Suspense>
        </div>
    );
} 