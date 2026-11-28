import { DEMO_TTL_MINUTES, demoConfig } from '@/lib/demo-config'
import TryDemoButton from './TryDemoButton'

// Shown on the landing and sign-in pages. Renders nothing when the demo is off.
export default function DemoCredentials({ className = '' }: { className?: string }) {
    const cfg = demoConfig()
    if (!cfg.enabled) return null
    return (
        <div className={`flex w-full max-w-sm flex-col gap-3 rounded-xl border border-dashed p-4 text-sm ${className}`} data-demo-credentials>
            <div>
                <p className='font-medium'>Just looking? Use the demo account.</p>
                <dl className='mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-xs'>
                    <dt className='font-sans opacity-70'>Email</dt><dd className='select-all break-all'>{cfg.email}</dd>
                    <dt className='font-sans opacity-70'>Password</dt><dd className='select-all break-all'>{cfg.password}</dd>
                </dl>
            </div>
            <TryDemoButton variant='secondary' className='w-full'>Sign in to the demo</TryDemoButton>
            <p className='text-xs text-muted-foreground'>
                Everyone shares this account, so don&apos;t upload anything private. PDFs and chats are deleted {DEMO_TTL_MINUTES} minutes after
                upload, and demo sign-ins last {DEMO_TTL_MINUTES} minutes.
            </p>
        </div>
    )
}
