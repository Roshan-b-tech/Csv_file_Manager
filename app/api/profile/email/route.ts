import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    try {
        const session = await getAuthSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { newEmail, password } = await req.json();
        if (!newEmail || !password) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }
        const user = await db.user.findUnique({ where: { email: session.user.email } });
        if (!user || !user.password) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        const isCorrect = await bcrypt.compare(password, user.password);
        if (!isCorrect) {
            return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
        }
        if (newEmail === user.email) {
            return NextResponse.json({ error: "New email is the same as current email" }, { status: 400 });
        }
        const existing = await db.user.findUnique({ where: { email: newEmail } });
        if (existing) {
            return NextResponse.json({ error: "Email already in use" }, { status: 400 });
        }
        await db.user.update({ where: { email: session.user.email }, data: { email: newEmail } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[EMAIL_UPDATE]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 