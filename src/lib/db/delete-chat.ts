import { and, eq, ne } from "drizzle-orm";
import { db } from ".";
import { messages, chats } from "./schema"
import { deleteFromS3 } from "../s3";


export async function deleteChat(chatId: number) {
    if (chatId) {
        try {
            const chatdata = await db.select().from(chats).where(eq(chats.id, chatId));
            if (chatdata.length) {
                // messages and document chunks are removed by ON DELETE CASCADE,
                // but clear messages explicitly for databases created before that.
                await db.delete(messages).where(eq(messages.chatId, chatId));
                
                // delete the S3 object, unless another chat points at the same key
                // (possible for chats created before keys were tied to their owner)
                const shared = await db.select({ id: chats.id }).from(chats)
                    .where(and(eq(chats.file_key, chatdata[0].file_key), ne(chats.id, chatId)));
                if (!shared.length) await deleteFromS3(chatdata[0].file_key);
                
                // delete the particular chat
                await db.delete(chats).where(eq(chats.id, chatId));
                
                return { message: "success" }
            }
        } catch (err) {
            console.log(err);
            return {message : "failed"}
        }
    }
}