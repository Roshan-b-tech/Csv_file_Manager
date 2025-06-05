import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getAuthSession();
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await db.user.findUnique({
            where: {
                email: session.user.email
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                bio: true,
                location: true,
                website: true,
            }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("[PROFILE_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await getAuthSession();
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, bio, location, website, image } = body;

        const user = await db.user.update({
            where: {
                email: session.user.email
            },
            data: {
                name,
                bio,
                location,
                website,
                image,
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                bio: true,
                location: true,
                website: true,
            }
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("[PROFILE_PATCH]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
} 