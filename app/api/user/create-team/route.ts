import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getAuthSession();

        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Check if user is already part of a team (especially as owner)
        const existingTeamMembership = await db.teamMember.findFirst({
            where: {
                userId: session.user.id,
            },
        });

        if (existingTeamMembership) {
            // User is already in a team, prevent creating a new one directly
            return NextResponse.json({ message: "You are already part of a team." }, { status: 400 });
        }

        // Create a new team and make the user the owner in a transaction
        const newTeam = await db.$transaction(async (tx) => {
            const team = await tx.team.create({
                data: {
                    // You might want to allow the user to name the team later
                    name: `${session.user.name || 'Your'} Team`,
                    members: {
                        create: {
                            userId: session.user.id,
                            role: "owner"
                        }
                    }
                },
            });
            return team;
        });

        return NextResponse.json({ message: "Team created successfully", team: newTeam }, { status: 201 });

    } catch (error) {
        console.error("[CREATE_TEAM]", error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
        return NextResponse.json({ message: "Internal server error", error: errorMessage }, { status: 500 });
    }
} 