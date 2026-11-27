// /api/create-chat

import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { wakeWorker } from "@/lib/jobs/worker";
import { NextResponse } from "next/server";


type PromiseBody = {
    file_key: string,
    file_name: string
}


export async function POST(req: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, {
            status: 401
        })
    }

    const body: PromiseBody = await req.json();
    const { file_key, file_name } = body
    if (typeof file_key !== "string" || !file_key.startsWith("uploads/") || typeof file_name !== "string" || !file_name) {
        return NextResponse.json({ message: "Invalid file" }, { status: 400 })
    }
    try {
        const chat_id = await db.insert(chats).values({
            file_key: file_key,
            pdfName: file_name,
            pdfUrl: `s3://${process.env.S3_BUCKET_NAME}/${file_key}`,
            userId: session.userId
        }).returning({
            id: chats.id
        })
        // the chat starts as "pending"; the queue worker picks it up
        wakeWorker()
        return Response.json({
            message: "OK",
            chat_id: chat_id[0].id
        }, {
            status: 200
        })
    } catch (err) {
        console.log(err);
        return NextResponse.json({ message: "internal server error" }, {
            status: 500
        })
    }
}