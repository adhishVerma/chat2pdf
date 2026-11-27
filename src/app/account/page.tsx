import { redirect } from 'next/navigation'
import { count, eq } from 'drizzle-orm'
import { getSession, emailVerificationRequired } from '@/lib/auth'
import { db } from '@/lib/db'
import { chats, users } from '@/lib/db/schema'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ChangePasswordForm from '@/components/account/ChangePasswordForm'
import DeleteAccountForm from '@/components/account/DeleteAccountForm'

export const metadata = { title: 'Account · ChatPdf' }

export default async function AccountPage() {
  const session = await getSession()
  if (!session) redirect('/sign-in?next=/account')

  const [[user], [pdfs]] = await Promise.all([
    db.select({ createdAt: users.createdAt }).from(users).where(eq(users.id, session.userId)),
    db.select({ n: count() }).from(chats).where(eq(chats.userId, session.userId)),
  ])

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
      <ChangePasswordForm />
      <DeleteAccountForm pdfCount={pdfs?.n ?? 0} />
    </div>
    </div>
  )
}
