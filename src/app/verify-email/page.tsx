import Link from 'next/link'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { consumeToken } from '@/lib/auth/tokens'
import { Button } from '@/components/ui/button'

type Props = { searchParams: Promise<{ token?: string }> }

export default async function VerifyEmailPage({ searchParams }: Props) {
    const { token } = await searchParams;
    const userId = token ? await consumeToken(token, 'verify_email') : null;
    if (userId) {
        await db.update(users).set({ emailVerifiedAt: sql`COALESCE(${users.emailVerifiedAt}, now())` }).where(eq(users.id, userId));
    }
    return (
        <div className='flex flex-col items-center gap-4 mt-44 px-4 text-center'>
            <h1 className='text-2xl font-semibold'>{userId ? 'Email confirmed' : 'This link has expired'}</h1>
            <p className='opacity-75 max-w-md'>
                {userId
                    ? 'Thanks! You can now upload PDFs and start chatting.'
                    : 'The confirmation link is invalid, expired or already used. Sign in and request a new one from the chat page.'}
            </p>
            <Link href='/chat'><Button>Go to chat</Button></Link>
        </div>
    )
}
