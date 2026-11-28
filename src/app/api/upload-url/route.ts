// /api/upload-url
// Issues a pre-signed S3 PUT URL so the browser can upload a PDF without ever
// seeing AWS credentials.

import { MAX_UPLOAD_BYTES, buildFileKey, createUploadUrl } from "@/lib/s3";
import { nameChecker } from "@/lib/utils";
import { emailVerificationRequired, getSession } from "@/lib/auth";
import { LIMITS, checkLimits, tooManyRequests, limitSubject } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import z from "zod";

const bodySchema = z.object({
    file_name: z.string().trim().min(1).max(200),
    file_type: z.literal("application/pdf"),
    file_size: z.number().int().positive().max(MAX_UPLOAD_BYTES),
});

export async function POST(req: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (emailVerificationRequired() && !session.emailVerified) {
        return NextResponse.json({ message: "Please confirm your email address before uploading. Check your inbox for the link." }, { status: 403 });
    }

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success || !nameChecker(parsed.data.file_name)) {
        return NextResponse.json({ message: "Only PDF files up to 10 MB are allowed" }, { status: 400 });
    }

    const { file_name, file_size } = parsed.data;

    const limited = await checkLimits([
        [`upload:hour:${limitSubject(session, req)}`, LIMITS.uploadsPerUserHour],
        [`upload:day:${limitSubject(session, req)}`, LIMITS.uploadsPerUserDay],
    ]);
    if (limited) {
        return tooManyRequests(limited, "You've reached the upload limit. Please try again later.");
    }
    try {
        const file_key = buildFileKey(session.userId, file_name);
        const upload_url = await createUploadUrl(file_key, file_size);
        return NextResponse.json({ upload_url, file_key, file_name }, { status: 200 });
    } catch (err) {
        console.error("Failed to create upload URL", err);
        return NextResponse.json({ message: "internal server error" }, { status: 500 });
    }
}
