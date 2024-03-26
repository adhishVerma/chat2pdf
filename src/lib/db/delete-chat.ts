import { eq } from "drizzle-orm";
import { db } from ".";
import { messages, chats } from "./schema"
import { deleteFromS3 } from "../s3";
import { dropNamespace } from "../vector-store";


export async function deleteChat(chatId: number) {
    if (chatId) {
        try {
            const chatdata = await db.select().from(chats).where(eq(chats.id, chatId));
            if (chatdata) {
                // deleting all the chat in messages table in a particular chat.
                await db.delete(messages).where(eq(messages.chatId, chatId));
                
                // deleting the s3 object
                await deleteFromS3(chatdata[0].file_key);
                
                // deleting the namespace created.
                await dropNamespace(chatdata[0].file_key);

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