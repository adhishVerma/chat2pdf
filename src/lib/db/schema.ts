import { boolean, customType, index, integer, jsonb, pgEnum, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const EMBEDDING_DIMENSIONS = 1536; // OpenAI text-embedding-ada-002 / text-embedding-3-small

// pgvector column, serialized as '[0.1,0.2,...]'
const vector = customType<{ data: number[]; driverData: string }>({
    dataType() {
        return `vector(${EMBEDDING_DIMENSIONS})`;
    },
    toDriver(value) {
        return `[${value.join(",")}]`;
    },
    fromDriver(value) {
        return JSON.parse(value);
    },
});

export const userEnum = pgEnum('userEnum', ['assistant', 'user'])

export const users = pgTable('users', {
    id: varchar('id', { length: 64 }).primaryKey(),
    email: varchar('email', { length: 320 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const chats = pgTable('chats', {
    id: serial('id').primaryKey(),
    pdfName: text('pdf_name').notNull(),
    pdfUrl: text('pdf_url').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    userId: varchar('userId', { length: 256 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    file_key: text('file_key').notNull(),
    processed: boolean('processed').notNull().default(false)
})

export const messages = pgTable('messages', {
    id: serial('id').primaryKey(),
    chatId: integer('chat_id').references(() => chats.id, { onDelete: 'cascade' }).notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    role: userEnum('role').notNull()
})

// PDF chunks and their embeddings (replaces Pinecone)
export const documentChunks = pgTable('document_chunks', {
    id: serial('id').primaryKey(),
    chatId: integer('chat_id').references(() => chats.id, { onDelete: 'cascade' }).notNull(),
    content: text('content').notNull(),
    metadata: jsonb('metadata').notNull().default({}),
    embedding: vector('embedding').notNull(),
}, (table) => ({
    chatIdx: index('document_chunks_chat_id_idx').on(table.chatId),
}))
