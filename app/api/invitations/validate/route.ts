import { NextResponse } from 'next/server';
import { db } from "@/lib/db"; // Assuming your Prisma client is exported as db

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.json({ message: 'Token is missing' }, { status: 400 });
    }

    try {
        const invitation = await db.invitation.findUnique({
            where: {
                token,
            },
        });

        if (!invitation) {
            return NextResponse.json({ message: 'Invalid invitation token' }, { status: 404 });
        }

        // Check if the token has expired
        if (invitation.expires < new Date()) {
            // Optionally delete the expired invitation
            await db.invitation.delete({
                where: { token },
            });
            return NextResponse.json({ message: 'Invitation token has expired' }, { status: 400 });
        }

        // Token is valid and not expired, return the associated email
        return NextResponse.json({ email: invitation.email });

    } catch (error) {
        console.error('Error validating invitation token:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
} 