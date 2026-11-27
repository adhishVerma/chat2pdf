"use client"

import { AlertTriangle, Loader2, RotateCw } from 'lucide-react'
import { Button } from '../ui/button'

export type ProcessingState = {
    status: 'pending' | 'processing' | 'ready' | 'failed'
    error: string | null
    attempts: number
}

type Props = {
    state: ProcessingState
    onRetry: () => void
    retrying: boolean
}

// Shows where the PDF is in the processing pipeline, with a retry for failures.
export default function ProcessingBanner({ state, onRetry, retrying }: Props) {
    if (state.status === 'ready') return null;

    if (state.status === 'failed') {
        return (
            <div role='alert' className='mb-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm dark:border-red-800 dark:bg-red-950'>
                <div className='flex items-start gap-2'>
                    <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400' />
                    <div className='grow'>
                        <p className='font-medium'>We couldn&apos;t process this PDF.</p>
                        {state.error && <p className='mt-1 opacity-75 break-words'>{state.error}</p>}
                    </div>
                    <Button size='sm' variant='outline' onClick={onRetry} disabled={retrying}>
                        {retrying ? <Loader2 className='mr-1 h-3 w-3 animate-spin' /> : <RotateCw className='mr-1 h-3 w-3' />}
                        Retry
                    </Button>
                </div>
            </div>
        )
    }

    const retryNote = state.attempts > 1 ? ` (attempt ${state.attempts})` : '';
    return (
        <div role='status' className='mb-3 flex items-center gap-2 rounded-lg border p-3 text-sm'>
            <Loader2 className='h-4 w-4 animate-spin' />
            <span>
                {state.status === 'pending' && state.attempts > 0 && state.error
                    ? `Processing hit a problem, trying again shortly${retryNote}…`
                    : `Reading your PDF so you can ask questions about it${retryNote}…`}
            </span>
        </div>
    )
}
