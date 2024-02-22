// /api/create-chat

import { preparePDF } from "@/scripts/pinecone-embed-docs";
import { NextRequest, NextResponse } from "next/server";

type PromiseBody = {
    file_key: string
}

export async function POST(req: NextRequest) {
    const body : PromiseBody = await req.json();
    const file_key = body.file_key ?? ''
    const data = await preparePDF(file_key);
    if(data.success){
        return Response.json({message : "OK"}, {
            status : 200
        })
    }
}