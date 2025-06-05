import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, name, password, bio, location, website, invitationToken } = body;

        if (!email || !name || !password) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // If an invitation token is provided, validate it
        let teamId: string | null = null;
        if (invitationToken) {
            const invitation = await db.invitation.findUnique({
                where: {
                    token: invitationToken,
                },
                include: {
                    team: true
                }
            });

            if (!invitation) {
                return new NextResponse("Invalid invitation token", { status: 400 });
            }

            if (invitation.expires < new Date()) {
                // Delete expired invitation
                await db.invitation.delete({
                    where: { token: invitationToken },
                });
                return new NextResponse("Invitation token has expired", { status: 400 });
            }

            if (invitation.email !== email) {
                return new NextResponse("Email does not match invitation", { status: 400 });
            }

            teamId = invitation.teamId;
        }

        // Check if user already exists
        const existingUser = await db.user.findUnique({
            where: {
                email,
            },
        });

        if (existingUser) {
            return new NextResponse("Email already exists", { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user and team membership in a transaction
        const result = await db.$transaction(async (tx) => {
            // Create user
            const user = await tx.user.create({
                data: {
                    email,
                    name,
                    password: hashedPassword,
                    bio: bio || null,
                    location: location || null,
                    website: website || null,
                },
            });

            // If there's a team ID, create team membership
            if (teamId) {
                await tx.teamMember.create({
                    data: {
                        userId: user.id,
                        teamId: teamId,
                        role: "member"
                    }
                });

                // Delete the invitation
                await tx.invitation.delete({
                    where: { token: invitationToken }
                });
            }

            return user;
        });

        return NextResponse.json({
            id: result.id,
            name: result.name,
            email: result.email,
            bio: result.bio,
            location: result.location,
            website: result.website,
        });
    } catch (error) {
        console.error("[REGISTER]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
} 