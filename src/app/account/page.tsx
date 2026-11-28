import { redirect } from 'next/navigation'
import { count, eq } from 'drizzle-orm'
import { getSession, emailVerificationRequired } from '@/lib/auth'
import { db } from '@/lib/db'
import { chats, users } from '@/lib/db/schema'
import { usageSummary } from '@/lib/usage'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ChangePasswordForm from '@/components/account/ChangePasswordForm'
import DeleteAccountForm from '@/components/account/DeleteAccountForm'

export const metadata = { title: 'Account · ChatPdf' }

export default async function AccountPage() {
  const session = await getSession()
  if (!session) redirect('/sign-in?next=/account')

  const [[user], [pdfs], usage] = await Promise.all([
    db.select({ createdAt: users.createdAt }).from(users).where(eq(users.id, session.userId)),
    db.select({ n: count() }).from(chats).where(eq(chats.userId, session.userId)),
    usageSummary(session.userId),
  ])
  const fmt = (n: number) => n.toLocaleString('en-US')

  // the root layout fixes the page height, so this page scrolls on its own
  return (
    <div className='h-full overflow-y-auto'>
    <div className='mx-auto mt-10 flex w-full max-w-lg flex-col gap-6 px-4 pb-16'>
      <h1 className='text-2xl font-semibold'>Account</h1>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your sign-in details.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className='grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm'>
            <dt className='opacity-70'>Email</dt>
            <dd className='break-all'>{session.email}</dd>
            <dt className='opacity-70'>Email confirmed</dt>
            <dd>{session.emailVerified ? 'Yes' : emailVerificationRequired() ? 'Not yet. Check your inbox.' : 'No'}</dd>
            <dt className='opacity-70'>Member since</dt>
            <dd>{user?.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</dd>
            <dt className='opacity-70'>PDFs</dt>
            <dd>{pdfs?.n ?? 0}</dd>
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
          <CardDescription>AI tokens used by your questions and uploads.</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-3 text-sm'>
          <div>
            <div className='flex justify-between'>
              <span className='opacity-70'>Chat today</span>
              <span>{fmt(usage.chatTokensToday)}{usage.dailyChatLimit ? ` of ${fmt(usage.dailyChatLimit)}` : ''}</span>
            </div>
            {usage.dailyChatLimit > 0 && (
              <div className='mt-2 h-2 w-full overflow-hidden rounded bg-muted' role='progressbar' aria-label='Chat usage today'
                aria-valuemin={0} aria-valuemax={usage.dailyChatLimit} aria-valuenow={Math.min(usage.chatTokensToday, usage.dailyChatLimit)}>
                <div className='h-full bg-primary' style={{ width: `${Math.min(100, (usage.chatTokensToday / usage.dailyChatLimit) * 100)}%` }} />
              </div>
            )}
            {usage.dailyChatLimit > 0 && <p className='mt-1 text-xs opacity-60'>Resets at midnight UTC.</p>}
          </div>
          <div className='flex justify-between'>
            <span className='opacity-70'>Last 30 days, all use</span>
            <span>{fmt(usage.totalTokens30d)}</span>
          </div>
        </CardContent>
      </Card>
      {session.isDemo ? (
        <p className='text-sm text-muted-foreground'>This is the shared demo account, so its password can&apos;t be changed and it can&apos;t be deleted.</p>
      ) : (
        <>
          <ChangePasswordForm />
          <DeleteAccountForm pdfCount={pdfs?.n ?? 0} />
        </>
      )}
    </div>
    </div>
  )
}
