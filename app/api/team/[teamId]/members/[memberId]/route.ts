import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { TeamMember } from "@prisma/client";

export async function DELETE(
    req: NextRequest,
    { params }: { params: { teamId: string; memberId: string } }
) {
    try {
        const session = await getAuthSession();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const teamId = params.teamId;
        const memberIdToRemove = params.memberId; // This is the userId of the member to remove
        const currentUserId = session.user.id; // This is the userId of the user making the request

        // Find the team member record for the user making the request to check their role
        const currentUserTeamMember = await db.teamMember.findUnique({
            where: {
                userId_teamId: { // Composite unique key
                    userId: currentUserId,
                    teamId: teamId,
                },
            },
        });

        // Check if the user making the request is an owner of the team
        if (!currentUserTeamMember || currentUserTeamMember.role !== "owner") {
            return new NextResponse("Forbidden: Only team owners can remove members", { status: 403 });
        }

        // Prevent an owner from removing themselves (optional, but good practice)
        if (currentUserId === memberIdToRemove) {
            return new NextResponse("Bad Request: Cannot remove yourself as a team owner", { status: 400 });
        }

        // Find the team member record to remove
        const memberToRemove = await db.teamMember.findUnique({
            where: {
                userId_teamId: { // Composite unique key
                    userId: memberIdToRemove,
                    teamId: teamId,
                },
            },
        });

        if (!memberToRemove) {
            return new NextResponse("Not Found: Team member not found in this team", { status: 404 });
        }

        // Delete the team member record
        await db.teamMember.delete({
            where: {
                userId_teamId: { // Composite unique key
                    userId: memberIdToRemove,
                    teamId: teamId,
                },
            },
        });

        return NextResponse.json({ message: "Team member removed successfully" });

    } catch (error) {
        console.error("[API_DELETE_TEAM_MEMBER] Error:", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
} 