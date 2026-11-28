import { DEMO_TTL_MINUTES } from '@/lib/demo-config'

export default function DemoBanner() {
    return (
        <div role='status' className='mt-2 rounded-md border border-sky-300 bg-sky-50 px-3 py-2 text-center text-sm dark:border-sky-800 dark:bg-sky-950'>
            You&apos;re using the shared demo account. Others can see what you upload, and PDFs and chats are deleted {DEMO_TTL_MINUTES} minutes after upload.
        </div>
    )
}
