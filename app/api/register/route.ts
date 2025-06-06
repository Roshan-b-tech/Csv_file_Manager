import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, name, password, bio, location, website, invitationToken } = body;

        if (!email || !name || !password) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        let teamId: string | null = null;
        let invitationId: string | null = null;

        // If an invitation token is provided, validate it and get teamId and invitationId
        if (invitationToken) {
            try {
                const invitation = await db.invitation.findUnique({
                    where: {
                        token: invitationToken,
                    },
                    include: {
                        team: true
                    }
                });

                if (!invitation) {
                    return NextResponse.json({ message: "Invalid invitation token" }, { status: 400 });
                }

                if (invitation.expires < new Date()) {
                    // Delete expired invitation
                    await db.invitation.delete({
                        where: { token: invitationToken },
                    });
                    return NextResponse.json({ message: "Invitation token has expired" }, { status: 400 });
                }

                teamId = invitation.teamId;
                invitationId = invitation.id;
            } catch (error) {
                console.error("[REGISTER] Error validating invitation:", error);
                return NextResponse.json({
                    message: "Error validating invitation",
                    error: error instanceof Error ? error.message : "Unknown error"
                }, { status: 500 });
            }
        }

        // Check if user already exists
        try {
            const existingUser = await db.user.findUnique({
                where: {
                    email,
                },
            });

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
                    return NextResponse.json({ message: "You are already registered and have been added to the team. Please log in." }, { status: 200 });
                } catch (transactionError) {
                    console.error("[REGISTER] Transaction error during team member creation:", transactionError);
                    if (transactionError instanceof PrismaClientKnownRequestError && transactionError.code === 'P2002') {
                        try {
                            if (invitationId) {
                                await db.invitation.delete({ where: { id: invitationId } });
                            }
                        } catch (deleteErr) {
                            console.error("Failed to delete invitation after finding existing team member:", deleteErr);
                        }
                        return NextResponse.json({ message: "You are already a member of this team. Please log in." }, { status: 409 });
                    }
                    return NextResponse.json({
                        message: "Internal error during team association",
                        error: transactionError instanceof Error ? transactionError.message : "Unknown error"
                    }, { status: 500 });
                }
            }

            // If user exists but NO valid invitation token was used, then it's a genuine duplicate registration attempt
            if (existingUser) {
                return NextResponse.json({ message: "Email already exists" }, { status: 400 });
            }
        } catch (error) {
            console.error("[REGISTER] Error checking existing user:", error);
            return NextResponse.json({
                message: "Error checking existing user",
                error: error instanceof Error ? error.message : "Unknown error"
            }, { status: 500 });
        }

        // Hash password
        try {
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
            console.error("[REGISTER] Error creating user:", error);
            // Check if the error is a Prisma unique constraint error (P2002) on the email field
            if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002' && error.meta?.target === 'User_email_key') {
                return NextResponse.json({ message: "Email already exists" }, { status: 400 });
            }
            return NextResponse.json({
                message: "Internal server error",
                error: error instanceof Error ? error.message : "Unknown error"
            }, { status: 500 });
        }
    } catch (error) {
        console.error("[REGISTER] Unexpected error:", error);
        return NextResponse.json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
} 