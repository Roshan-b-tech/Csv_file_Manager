"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Settings, User, X, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function SidebarNav({ user }: {
    user?: {
        id?: string | null;
        name?: string | null;
        email?: string | null;
        image?: string | null;
        teamName?: string | null;
    }
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const handleClick = () => setIsMobileMenuOpen(prev => !prev);

        mobileMenuButton?.addEventListener('click', handleClick);
        return () => mobileMenuButton?.removeEventListener('click', handleClick);
    }, []);

    return (
        <>
            {/* Mobile menu overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed md:relative flex flex-col h-screen w-64 bg-white/70 backdrop-blur-md border-r border-white/30 shadow-xl rounded-2xl m-4 overflow-hidden z-50 transition-transform duration-300",
                "md:translate-x-0",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Close button for mobile */}
                <button
                    className="md:hidden absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Gradient accent bar */}
                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-l-2xl" />

                {/* User profile */}
                <div className="flex flex-col items-center py-8 px-4">
                    <Avatar className="h-16 w-16 border-4 border-white shadow-md">
                        <AvatarImage src={user?.image || undefined} />
                        <AvatarFallback>{user?.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="mt-2 text-center">
                        <div className="font-semibold text-base">{user?.name || "Guest"}</div>
                        <div className="text-xs text-muted-foreground">{user?.email || "guest@example.com"}</div>
                        {user?.teamName && (
                            <div className="text-xs text-blue-700 dark:text-blue-300 mt-1 font-medium">Team: {user.teamName}</div>
                        )}
                    </div>
                </div>

                <div className="px-6"><hr className="border-white/30 mb-2" /></div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-2">
                    <NavItem href="/" icon={<Home className="h-5 w-5 mr-3" />} onClick={() => setIsMobileMenuOpen(false)}>Dashboard</NavItem>
                    <NavItem href="/csv-manager" icon={<FileText className="h-5 w-5 mr-3" />} onClick={() => setIsMobileMenuOpen(false)}>CSV Manager</NavItem>
                    <NavItem href="/team" icon={<Users className="h-5 w-5 mr-3" />} onClick={() => setIsMobileMenuOpen(false)}>Team</NavItem>
                    <NavItem href="/settings" icon={<Settings className="h-5 w-5 mr-3" />} onClick={() => setIsMobileMenuOpen(false)}>Settings</NavItem>
                    <NavItem href="/profile" icon={<User className="h-5 w-5 mr-3" />} onClick={() => setIsMobileMenuOpen(false)}>Profile</NavItem>
                </nav>

                {/* Logout button at the bottom */}
                <div className="px-4 pb-6 mt-auto">
                    <form action="/api/auth/signout" method="post">
                        <Button variant="ghost" className="w-full flex gap-2 justify-center bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-lg hover:scale-105 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" /></svg>
                            Logout
                        </Button>
                    </form>
                </div>
            </aside>
        </>
    );
}

function NavItem({
    href,
    icon,
    children,
    onClick
}: {
    href: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    onClick?: () => void;
}) {
    const pathname = usePathname();
    const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href));

    return (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                "flex items-center py-2 px-3 rounded-full text-sm transition-colors font-medium gap-2",
                isActive
                    ? "bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-md scale-[1.03]"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-primary"
            )}
        >
            {icon}
            {children}
        </Link>
    );
} 