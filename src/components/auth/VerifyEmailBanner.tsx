"use client"

import { useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export default function VerifyEmailBanner({ email }: { email: string }) {
    const [sending, setSending] = useState(false);
    const resend = async () => {
        setSending(true);
        try {
            const { data } = await axios.post('/api/auth/resend-verification');
            toast(data.message);
        } catch (err: any) {
            toast(err?.response?.data?.message ?? "Couldn't send the email");
        } finally {
            setSending(false);
        }
    }
    return (
        <div role='status' className='mt-2 flex flex-wrap items-center justify-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm dark:border-amber-800 dark:bg-amber-950'>
            <span>Confirm your email ({email}) to upload PDFs. Check your inbox for the link.</span>
            <Button size='sm' variant='outline' onClick={resend} disabled={sending}>Resend email</Button>
        </div>
    )
}
