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
        const { currentPassword, newPassword } = await req.json();
        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }
        const user = await db.user.findUnique({ where: { email: session.user.email } });
        if (!user || !user.password) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        const isCorrect = await bcrypt.compare(currentPassword, user.password);
        if (!isCorrect) {
            return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
        }
        if (newPassword.length < 6) {
            return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
        }
        const hashed = await bcrypt.hash(newPassword, 10);
        await db.user.update({ where: { email: session.user.email }, data: { password: hashed } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[PASSWORD_UPDATE]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 