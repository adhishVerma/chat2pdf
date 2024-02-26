// /api/create-chat

import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { getS3Url } from "@/lib/s3";
import { preparePDF } from "@/scripts/pinecone-embed-docs";
import { auth } from "@clerk/nextjs";

type PromiseBody = {
    file_key: string,
    file_name: string
}

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return Response.json({ message: "Unauthorized" }, {
            status: 401
        })
    }

    const body: PromiseBody = await req.json();
    const { file_key, file_name } = body
    try {
        const data = await preparePDF(file_key);
        const chat_id = await db.insert(chats).values({
            file_key: file_key,
            pdfName: file_name,
            pdfUrl: getS3Url(file_key),
            userId: userId
        }).returning({
            id: chats.id
        })
        if (data.success) {
            return Response.json({
                message: "OK",
                chat_id: chat_id[0].id
            }, {
                status: 200
            })
        }
    } catch (err) {
        console.log(err);
        return Response.json({ message: "internal server error" }, {
            status: 500
        })
    }
}