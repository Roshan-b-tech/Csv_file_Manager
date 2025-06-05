import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { writeFile, mkdir } from "fs/promises";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadDir = join(process.cwd(), "public", "avatars");
        await mkdir(uploadDir, { recursive: true });
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
        const filePath = join(uploadDir, fileName);
        await writeFile(filePath, buffer);
        const url = `/avatars/${fileName}`;
        return NextResponse.json({ url });
    } catch (error) {
        console.error("[AVATAR_UPLOAD]", error);
        return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 });
    }
} 