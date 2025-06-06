import Link from "next/link";
import { getAuthSession } from "@/lib/auth";
import SidebarNav from "@/components/sidebar-nav";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import SessionProviderWrapper from "@/components/session-provider-wrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();
  const user = session?.user;
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/70 backdrop-blur-md border-b border-white/30 z-50 flex items-center px-4">
        <Button variant="ghost" size="icon" className="mr-2" id="mobile-menu-button">
          <Menu className="h-6 w-6" />
        </Button>
        <div className="font-semibold">Dashboard</div>
      </div>

      {/* Sidebar Container */}
      <div className="relative z-50 md:w-64 w-0 transition-width duration-300 ease-in-out">
        <SidebarNav user={user} />
      </div>

      {/* Main content */}
      <main className="flex-1 pt-16 md:pt-0 overflow-y-auto">
        <div className="container mx-auto p-4 md:p-6">
          <SessionProviderWrapper>
            {children}
          </SessionProviderWrapper>
        </div>
      </main>
    </div>
  );
}