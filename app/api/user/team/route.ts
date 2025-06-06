import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Find the user and include all their team memberships and the team details
        const userWithTeams = await db.user.findUnique({
            where: { id: session.user.id },
            include: {
                teams: {
                    include: {
                        team: {
                            include: { // Include members of each team
                                members: {
                                    include: { // Include user details for each member
                                        user: {
                                            select: { // Select only necessary user fields
                                                id: true,
                                                name: true,
                                                email: true,
                                                image: true,
                                            }
                                        }
                                    }
                                },
                            }
                        },
                    },
                    // Do not use take: 1 here to get all teams the user is a member of
                },
            },
        });

        if (!userWithTeams || userWithTeams.teams.length === 0) {
            // User is not part of any team
            return NextResponse.json([], { status: 200 }); // Return an empty array for no teams
        }

        // Format the response to include details for all teams the user is a member of
        const teamsData = userWithTeams.teams.map(teamMembership => ({
            id: teamMembership.team.id,
            name: teamMembership.team.name,
            role: teamMembership.role, // Include the user's role in this specific team
            members: teamMembership.team.members.map(member => ({
                id: member.user.id,
                name: member.user.name,
                email: member.user.email,
                image: member.user.image,
                role: member.role, // Include the member's role in this specific team
            })),
        }));

        return NextResponse.json(teamsData);

    } catch (error) {
        console.error("[API_GET_USER_TEAMS] Error:", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
} 