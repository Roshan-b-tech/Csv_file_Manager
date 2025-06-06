import { NextResponse } from 'next/server';
import { db } from "@/lib/db";
import { sendInvitationEmail } from "@/lib/email";
import { generateVerificationToken } from "@/lib/tokens";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

const MAX_ACTIVE_INVITATIONS_PER_EMAIL = 5;

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { email } = body;

        if (!email || typeof email !== 'string') {
            return NextResponse.json({ message: "Email is required" }, { status: 400 });
        }

        console.log(`Received invitation request for: ${email}`);

        const existingUser = await db.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ message: "User with this email already exists" }, { status: 400 });
        }

        const invitingUser = await db.user.findUnique({
            where: { email: session.user.email },
        });

        if (!invitingUser) {
            return NextResponse.json({ message: "Inviting user not found" }, { status: 404 });
        }

        let team = await db.team.findFirst({
            where: {
                members: {
                    some: {
                        userId: invitingUser.id,
                        role: "owner"
                    }
                }
            }
        });

        if (!team) {
            team = await db.team.create({
                data: {
                    name: `${invitingUser.name || 'My'}'s Team`,
                    members: {
                        create: {
                            userId: invitingUser.id,
                            role: "owner"
                        }
                    }
                }
            });
        }

        const token = generateVerificationToken();

        try {
            // Check for existing invitation for this email and team
            const existingInvitation = await db.invitation.findFirst({
                where: {
                    email,
                    teamId: team.id,
                    expires: {
                        gt: new Date()
                    }
                }
            });

            if (existingInvitation) {
                // Update the existing invitation with new token and expiration
                await db.invitation.update({
                    where: { id: existingInvitation.id },
                    data: {
                        token,
                        expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
                    }
                });
                console.log(`[INVITE] Updated existing invitation for ${email} in team ${team.id}`);
            } else {
                // Count active invitations for this email
                const activeInvitationsCount = await db.invitation.count({
                    where: {
                        email,
                        expires: {
                            gt: new Date()
                        }
                    }
                });

                if (activeInvitationsCount >= MAX_ACTIVE_INVITATIONS_PER_EMAIL) {
                    return NextResponse.json({
                        message: `Maximum ${MAX_ACTIVE_INVITATIONS_PER_EMAIL} active invitations allowed per email. Please wait for some invitations to expire or delete them.`
                    }, { status: 400 });
                }

                // Create new invitation
                await db.invitation.create({
                    data: {
                        email,
                        token,
                        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
                        teamId: team.id
                    }
                });
                console.log(`[INVITE] Created new invitation for ${email} in team ${team.id}`);
            }
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002' && error.meta?.target === 'Invitation_token_key') {
                console.error("Concurrent token generation detected, retrying might be needed.", error);
                return NextResponse.json({ message: "Failed to generate unique invitation token, please try again." }, { status: 500 });
            }
            throw error;
        }

        const baseUrl = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
        const invitationLink = `${baseUrl}/register?token=${token}`;

        // Send invitation email
        try {
            console.log('[INVITE] Attempting to send invitation email...');
            await sendInvitationEmail(email, invitationLink);
            console.log(`[INVITE] Invitation email sent successfully to ${email}`);
        } catch (emailError) {
            console.error(`[INVITE] Failed to send invitation email to ${email}:`, emailError);

            // Delete the invitation since email failed
            try {
                await db.invitation.delete({
                    where: { token }
                });
                console.log('[INVITE] Successfully deleted invitation after email failure');
            } catch (deleteError) {
                console.error('[INVITE] Failed to delete invitation after email error:', deleteError);
            }

            // Return a specific error for email issues
            const errorMessage = emailError instanceof Error ? emailError.message : String(emailError);
            console.error('[INVITE] Email error details:', {
                message: errorMessage,
                stack: emailError instanceof Error ? emailError.stack : undefined
            });

            return NextResponse.json({
                message: "Failed to send invitation email",
                details: errorMessage,
                error: emailError instanceof Error ? {
                    name: emailError.name,
                    message: emailError.message,
                    stack: emailError.stack
                } : String(emailError)
            }, { status: 500 });
        }

        // Return JSON for success
        return NextResponse.json({ message: "Invitation sent successfully", success: true });
    } catch (error) {
        console.error("[INVITE] Unexpected error:", error);
        const errorDetails = error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
        } : String(error);

        return NextResponse.json({
            message: "Internal server error",
            details: errorDetails
        }, { status: 500 });
    }
}