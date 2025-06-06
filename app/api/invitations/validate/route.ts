import { NextResponse } from 'next/server';
import { db } from "@/lib/db"; // Assuming your Prisma client is exported as db

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.json({ message: 'Token is missing' }, { status: 400 });
    }

    try {
        const invitation = await db.invitation.findFirst({
            where: {
                token,
                expires: {
                    gt: new Date()
                }
            },
            include: {
                team: true
            }
        });

        if (!invitation) {
            return NextResponse.json({ message: 'Invalid or expired invitation token' }, { status: 404 });
        }

        // Token is valid and not expired, return the associated email and team info
        return NextResponse.json({
            email: invitation.email,
            teamId: invitation.teamId,
            teamName: invitation.team.name
        });

    } catch (error) {
        console.error('Error validating invitation token:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
} 