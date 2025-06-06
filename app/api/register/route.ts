import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, name, password, bio, location, website, invitationToken } = body;

        if (!email || !name || !password) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        let teamId: string | null = null;
        let invitationId: string | null = null;

        // If an invitation token is provided, validate it and get teamId and invitationId
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

            // IMPORTANT: We allow email mismatch here if the user is trying to register
            // The check below for existing user will handle the case where email is provided.
            // The frontend should ideally pre-fill the email from the token.
            teamId = invitation.teamId;
            invitationId = invitation.id;
        }

        // Check if user already exists
        const existingUser = await db.user.findUnique({
            where: {
                email,
            },
        });

        // --- Modified Logic Here ---
        // If user exists AND a valid invitation token was used, add them to the team instead of blocking
        if (existingUser && teamId && invitationId) {
            try {
                await db.$transaction(async (tx) => {
                    // Create team membership for the existing user
                    await tx.teamMember.create({
                        data: {
                            userId: existingUser.id,
                            teamId: teamId,
                            role: "member"
                        }
                    });
                    // Delete the invitation
                    await tx.invitation.delete({
                        where: { id: invitationId }
                    });
                });
                // Redirect to login with a success message or dashboard
                return NextResponse.json({ message: "You are already registered and have been added to the team. Please log in." }, { status: 200 });
            } catch (transactionError) {
                if (transactionError instanceof PrismaClientKnownRequestError && transactionError.code === 'P2002') {
                    // Handle case where user is already a member of the team
                    // Optionally delete the invitation if they are already a member
                    try {
                        if (invitationId) {
                            await db.invitation.delete({ where: { id: invitationId } });
                        }
                    } catch (deleteErr) {
                        console.error("Failed to delete invitation after finding existing team member:", deleteErr);
                    }
                    return new NextResponse("You are already a member of this team. Please log in.", { status: 409 });
                }
                console.error("[REGISTER] Transaction error during team member creation for existing user:", transactionError);
                return new NextResponse("Internal error during team association", { status: 500 });
            }

        }

        // If user exists but NO valid invitation token was used, then it's a genuine duplicate registration attempt
        if (existingUser) {
            return new NextResponse("Email already exists", { status: 400 });
        }

        // --- End Modified Logic ---

        // If user does not exist, proceed with standard registration

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user and team membership in a transaction (only if invitationToken was present)
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

            // If there's a team ID from the invitation, create team membership for the NEW user
            if (teamId && invitationId) {
                await tx.teamMember.create({
                    data: {
                        userId: user.id,
                        teamId: teamId,
                        role: "member"
                    }
                });

                // Delete the invitation
                await tx.invitation.delete({
                    where: { id: invitationId }
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
        // Check if the error is a Prisma unique constraint error (P2002) on the email field
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002' && error.meta?.target === 'User_email_key') {
            return new NextResponse("Email already exists", { status: 400 });
        }
        return new NextResponse("Internal error", { status: 500 });
    }
} 