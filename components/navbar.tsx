import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="border-b">
            <div className="flex h-16 items-center px-4">
                <div className="flex items-center space-x-4">
                    <Link href="/dashboard" className="font-bold">
                        CSV Manager
                    </Link>
                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-4">
                        <Link href="/csv-manager" className="text-sm font-medium hover:text-primary">
                            Files
                        </Link>
                        <Link href="/profile" className="text-sm font-medium hover:text-primary">
                            Profile
                        </Link>
                    </div>
                </div>
                <div className="ml-auto flex items-center space-x-4">
                    {/* Mobile Menu Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                </div>
            </div>
            {/* Mobile Navigation */}
            {isMenuOpen && (
                <div className="md:hidden border-t">
                    <div className="flex flex-col space-y-2 p-4">
                        <Link
                            href="/csv-manager"
                            className="text-sm font-medium hover:text-primary py-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Files
                        </Link>
                        <Link
                            href="/profile"
                            className="text-sm font-medium hover:text-primary py-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Profile
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
} 