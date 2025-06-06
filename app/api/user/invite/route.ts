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

        console.log(`[INVITE] Received invitation request for: ${email}`);

        // Find the inviting user's team where they are the owner
        let team = await db.team.findFirst({
            where: {
                members: {
                    some: {
                        userId: session.user.id,
                        role: "owner"
                    }
                }
            }
        });

        if (!team) {
            // This case should ideally not happen if the frontend button is only shown to owners,
            // but as a fallback, create a default team if user has none.
            console.warn(`[INVITE] User ${session.user.email} is not an owner of any team, creating a new one.`);
            team = await db.team.create({
                data: {
                    name: `${session.user.name || 'My'}'s Team`,
                    members: {
                        create: {
                            userId: session.user.id,
                            role: "owner"
                        }
                    }
                },
            });
        }

        // Check if user already exists
        const existingUser = await db.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            // User exists, check if they are already a member of this team
            const existingMembership = await db.teamMember.findFirst({
                where: {
                    userId: existingUser.id,
                    teamId: team.id,
                },
            });

            if (existingMembership) {
                return NextResponse.json({ message: "User is already a member of this team." }, { status: 400 });
            }

            // User exists but is not a member, add them directly to the team
            await db.teamMember.create({
                data: {
                    userId: existingUser.id,
                    teamId: team.id,
                    role: "member", // Default role for invited members
                },
            });

            console.log(`[INVITE] Added existing user ${email} to team ${team.id}`);
            return NextResponse.json({ message: "User added to the team successfully." }, { status: 200 });
        }

        // User does not exist, proceed with the invitation process

        const token = generateVerificationToken();

        try {
            // Check for existing active invitation for this email and team
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
                // Count active invitations for this email (across all teams)
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
                console.error("[INVITE] Concurrent token generation detected, retrying might be needed.", error);
                return NextResponse.json({ message: "Failed to generate unique invitation token, please try again." }, { status: 500 });
            }
            console.error("[INVITE] Error managing invitation in DB:", error);
            return NextResponse.json({ message: "Internal server error during invitation management" }, { status: 500 });
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

            // Return a specific error for email issues
            const errorMessage = emailError instanceof Error ? emailError.message : String(emailError);

            return NextResponse.json({
                message: "Failed to send invitation email",
                details: errorMessage,
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