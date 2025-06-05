import { NextResponse } from 'next/server';
import { db } from "@/lib/db";
import { sendInvitationEmail } from "@/lib/email";
import { generateVerificationToken } from "@/lib/tokens"; // Assuming a utility for token generation
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { email } = body;

        if (!email || typeof email !== 'string') {
            return new NextResponse("Email is required", { status: 400 });
        }

        console.log(`Received invitation request for: ${email}`);

        // Check if user already exists
        const existingUser = await db.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return new NextResponse("User already exists", { status: 400 });
        }

        // Check if invitation already exists
        const existingInvitation = await db.invitation.findUnique({
            where: { email }
        });

        if (existingInvitation) {
            return new NextResponse("Invitation already sent", { status: 400 });
        }

        // Get the inviting user
        const invitingUser = await db.user.findUnique({
            where: { email: session.user.email },
        });

        if (!invitingUser) {
            return new NextResponse("Inviting user not found", { status: 404 });
        }

        // Create or get the user's team
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
            // Create a new team for the inviting user
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

        // Generate invitation token
        const token = generateVerificationToken();

        // Create invitation
        const invitation = await db.invitation.create({
            data: {
                email,
                token,
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                teamId: team.id
            },
        });

        // Construct the full invitation link using NEXTAUTH_URL
        const invitationLink = `${process.env.NEXTAUTH_URL}/register?token=${token}`;

        // Send invitation email
        await sendInvitationEmail(email, invitationLink);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[INVITE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
} 