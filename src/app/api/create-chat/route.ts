// /api/create-chat

import { preparePDF } from "@/scripts/pinecone-embed-docs";

type PromiseBody = {
    file_key: string
}

export async function POST(req: Request) {
    const body: PromiseBody = await req.json();
    const file_key = body.file_key ?? ''
    try {
        const data = await preparePDF(file_key);
        if (data.success) {
            return Response.json({ message: "OK" }, {
                status: 200
            })
        }
    } catch (err) {
        console.log(err);
        return Response.json({ message: "Failed" }, {
            status: 500
        })
    }
}