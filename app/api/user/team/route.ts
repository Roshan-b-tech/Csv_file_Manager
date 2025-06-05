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

        // Find the user and include their team membership and the team details
        const userWithTeam = await db.user.findUnique({
            where: { id: session.user.id },
            include: {
                teams: {
                    include: {
                        team: {
                            include: { // Include members of the team
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
                    // Assuming a user is primarily associated with one team for this view,
                    // we might filter or take the first one. For simplicity, we'll assume
                    // the first team member entry includes the relevant team.
                    take: 1,
                },
            },
        });

        if (!userWithTeam || userWithTeam.teams.length === 0) {
            // User is not part of a team
            return NextResponse.json(null, { status: 200 });
        }

        // Extract the team data from the result
        const team = userWithTeam.teams[0]?.team;

        if (!team) {
            return NextResponse.json(null, { status: 200 });
        }

        // Format the response to include team details and a list of members
        const teamData = {
            id: team.id,
            name: team.name,
            members: team.members.map(member => ({
                id: member.user.id,
                name: member.user.name,
                email: member.user.email,
                image: member.user.image,
                role: member.role, // Include the member's role
            })),
        };

        return NextResponse.json(teamData);

    } catch (error) {
        console.error("[API_GET_USER_TEAM] Error:", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
} 