"use client";

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    role: string; // Role of the current user in this team
    members: TeamMember[];
}

export default function TeamPage() {
    const [teams, setTeams] = useState<TeamData[] | null>(null); // State to hold array of teams
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null); // State to track selected team
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
    const [memberToRemoveId, setMemberToRemoveId] = useState<string | null>(null);
    const [isCreatingTeam, setIsCreatingTeam] = useState(false);
    const [isInviting, setIsInviting] = useState(false);
    const [inviteeEmail, setInviteeEmail] = useState("");
    const [isSendingInvitation, setIsSendingInvitation] = useState(false);

    const { toast } = useToast();
    const { data: session } = useSession();

    // Find the selected team from the teams array
    const selectedTeam = teams?.find(team => team.id === selectedTeamId);
    const isOwner = selectedTeam?.role === 'owner'; // Check if the current user is owner of the selected team

    const handleRemoveMember = (memberId: string) => {
        setMemberToRemoveId(memberId);
        setIsConfirmingRemove(true);
    };

    const confirmRemoveMember = async () => {
        if (!selectedTeam || !memberToRemoveId) return;

        setIsConfirmingRemove(false);

        try {
            const response = await fetch(`/api/team/${selectedTeam.id}/members/${memberToRemoveId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (response.ok) {
                // Update local state to remove the member from the selected team
                setTeams(prevTeams => {
                    if (!prevTeams) return null;
                    return prevTeams.map(team => {
                        if (team.id === selectedTeamId) {
                            return {
                                ...team,
                                members: team.members.filter(member => member.id !== memberToRemoveId)
                            };
                        } else {
                            return team;
                        }
                    });
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

    const handleCreateTeam = async () => {
        setIsCreatingTeam(true);
        setError(null);

        try {
            const response = await fetch('/api/user/create-team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: "Success",
                    description: data.message || "Team created successfully!",
                });
                fetchTeamsData(); // Fetch all teams again to include the new one
            } else {
                setError(data.message || "Failed to create team.");
                toast({
                    title: "Error",
                    description: data.message || "Failed to create team.",
                    variant: "destructive",
                });
            }
        } catch (err: any) {
            console.error('Error creating team:', err);
            setError(err.message || 'An error occurred while creating the team.');
            toast({
                title: "Error",
                description: err.message || "An error occurred while creating the team.",
                variant: "destructive",
            });
        } finally {
            setIsCreatingTeam(false);
        }
    };

    const handleSendInvitation = async () => {
        if (!inviteeEmail || !selectedTeam) return; // Ensure email and selected team data exist

        setIsSendingInvitation(true);

        try {
            const response = await fetch('/api/user/invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: inviteeEmail }),
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: "Success",
                    description: data.message || "Invitation sent successfully.",
                });
                setIsInviting(false); // Close dialog on success
                setInviteeEmail(""); // Clear email input
                // No need to refetch teams immediately, the new member won't appear until they accept
            } else {
                toast({
                    title: "Error",
                    description: data.message || "Failed to send invitation.",
                    variant: "destructive",
                });
            }
        } catch (err: any) {
            console.error('Error sending invitation:', err);
            toast({
                title: "Error",
                description: err.message || "An error occurred while sending the invitation.",
                variant: "destructive",
            });
        } finally {
            setIsSendingInvitation(false);
        }
    };

    const fetchTeamsData = async () => {
        try {
            const response = await fetch('/api/user/team');
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || `Failed to fetch team data: ${response.statusText}`);
            }

            const data: TeamData[] = await response.json();
            setTeams(data);

            // Automatically select the first team if the user is in any team and no team is selected
            if (data && data.length > 0 && !selectedTeamId) {
                setSelectedTeamId(data[0].id);
            }

        } catch (err: any) {
            console.error('Error fetching team data:', err);
            setError(err.message || 'An error occurred while fetching team data.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTeamsData();
    }, []);

    // Handle selecting a different team from the dropdown
    const handleSelectTeam = (teamId: string) => {
        setSelectedTeamId(teamId);
    };

    if (isLoading) {
        return <div>Loading team data...</div>;
    }

    if (error) {
        return <div className="text-destructive">Error: {error}</div>;
    }

    // If the user is not part of any team (teams is null or empty array)
    if (!teams || teams.length === 0) {
        return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Your Team</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center space-y-4">
                    <p className="text-center">You are not currently part of a team.</p>
                    <Button onClick={handleCreateTeam} disabled={isCreatingTeam}>
                        {isCreatingTeam ? "Creating Team..." : "Create Team"}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // If the user is part of one or more teams
    return (
        <>
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        {/* Team Selection Dropdown */}
                        <div className="flex items-center space-x-2">
                            <span>Team:</span>
                            <Select value={selectedTeamId || ''} onValueChange={handleSelectTeam} disabled={!teams || teams.length <= 1}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select a team" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teams.map(team => (
                                        <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Invite Member Button (only for owners of the selected team) */}
                        {isOwner && (
                            <Dialog open={isInviting} onOpenChange={setIsInviting}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">Invite Member</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Invite Member</DialogTitle>
                                        <DialogDescription>
                                            Enter the email address of the person you want to invite to the team: {selectedTeam?.name}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="email" className="text-right">
                                                Email
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={inviteeEmail}
                                                onChange={(e) => setInviteeEmail(e.target.value)}
                                                className="col-span-3"
                                                disabled={isSendingInvitation}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            onClick={handleSendInvitation}
                                            disabled={!inviteeEmail || isSendingInvitation}
                                        >
                                            {isSendingInvitation ? "Sending..." : "Send Invitation"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {selectedTeam ? (
                        <>
                            <h3 className="text-lg font-semibold mb-4">Members ({selectedTeam.members.length})</h3>
                            <div className="space-y-4">
                                {selectedTeam.members.map(member => (
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
                                        {/* Only allow removing others if the current user is an owner of the selected team */}
                                        {isOwner && member.id !== session?.user?.id && (
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleRemoveMember(member.id)}
                                                className="ml-auto"
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p>Please select a team to view its members.</p>
                    )}
                </CardContent>
            </Card>

            {/* Confirmation Dialog */}
            <AlertDialog open={isConfirmingRemove} onOpenChange={setIsConfirmingRemove}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently remove the member from the team: {selectedTeam?.name}.
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