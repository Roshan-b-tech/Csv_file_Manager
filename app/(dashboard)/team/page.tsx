"use client";

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

interface TeamMember {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
}

interface TeamData {
    id: string;
    name: string;
    members: TeamMember[];
}

export default function TeamPage() {
    const [team, setTeam] = useState<TeamData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
    const [memberToRemoveId, setMemberToRemoveId] = useState<string | null>(null);
    const { toast } = useToast();

    // Implement remove member logic (now just triggers confirmation)
    const handleRemoveMember = (memberId: string) => {
        setMemberToRemoveId(memberId);
        setIsConfirmingRemove(true);
    };

    // Function to call API and update state after confirmation
    const confirmRemoveMember = async () => {
        if (!team || !memberToRemoveId) return;

        setIsConfirmingRemove(false); // Close the dialog immediately upon confirmation

        try {
            const response = await fetch(`/api/team/${team.id}/members/${memberToRemoveId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (response.ok) {
                // Update local state to remove the member
                setTeam(prevTeam => {
                    if (!prevTeam) return null;
                    return {
                        ...prevTeam,
                        members: prevTeam.members.filter(member => member.id !== memberToRemoveId)
                    };
                });
                toast({
                    title: "Success",
                    description: data.message || "Member removed successfully.",
                });
            } else {
                toast({
                    title: "Error",
                    description: data.message || "Failed to remove member.",
                    variant: "destructive",
                });
            }
        } catch (err: any) {
            console.error('Error removing member:', err);
            toast({
                title: "Error",
                description: err.message || "An error occurred while removing the member.",
                variant: "destructive",
            });
        }
    };

    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                const response = await fetch('/api/user/team');
                if (!response.ok) {
                    // If response is not ok but status is 200, it means user is not in a team
                    if (response.status === 200) {
                        setTeam(null);
                    } else {
                        throw new Error(`Failed to fetch team data: ${response.statusText}`);
                    }
                }
                if (response.status === 200) { // Handle the case where the user is not in a team (null response)
                    const data = await response.json();
                    setTeam(data);
                } else {
                    const data = await response.json();
                    setTeam(data);
                }

            } catch (err: any) {
                console.error('Error fetching team data:', err);
                setError(err.message || 'An error occurred while fetching team data.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTeamData();
    }, []);

    if (isLoading) {
        return <div>Loading team data...</div>; // Basic loading state
    }

    if (error) {
        return <div className="text-destructive">Error: {error}</div>; // Basic error state
    }

    if (!team) {
        return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Your Team</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>You are not currently part of a team.</p>
                    {/* Potentially add options to create or join a team here */}
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Team: {team.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <h3 className="text-lg font-semibold mb-4">Members</h3>
                    <div className="space-y-4">
                        {team.members.map(member => (
                            <div key={member.id} className="flex items-center space-x-4">
                                <Avatar>
                                    <AvatarImage src={member.image || undefined} />
                                    <AvatarFallback>{member.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{member.name || "No Name"}</p>
                                    <p className="text-sm text-muted-foreground">{member.email || "No Email"}</p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400">{member.role}</p>
                                </div>
                                {/* Only allow removing others, not yourself, and only if you are an owner */}
                                {/* Assuming the logged-in user's ID is available in session or context */}
                                {/* For now, a simplified check: button is visible if member role is not owner */}
                                {/* A proper check would involve comparing member.id to the logged-in user's ID */}
                                {member.role !== 'owner' && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleRemoveMember(member.id)} // This now opens the confirmation dialog
                                        className="ml-auto"
                                    >
                                        Remove
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
            {/* Confirmation Dialog */}
            <AlertDialog open={isConfirmingRemove} onOpenChange={setIsConfirmingRemove}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently remove the member from your team.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRemoveMember}>Remove</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
} 