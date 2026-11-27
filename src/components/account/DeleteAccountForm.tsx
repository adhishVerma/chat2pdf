"use client"

import React, { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function DeleteAccountForm({ pdfCount }: { pdfCount: number }) {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmText, setConfirmText] = useState('');
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const confirmed = confirmText.trim().toLowerCase() === 'delete';

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirmed) return;
        setPending(true);
        setError(null);
        try {
            await axios.delete('/api/account', { data: { password } });
            router.replace('/');
            router.refresh();
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'Something went wrong');
            setPending(false);
        }
    }

    return (
        <Card className='border-red-300 dark:border-red-900'>
            <form onSubmit={onSubmit} aria-label='Delete account'>
                <CardHeader>
                    <CardTitle>Delete account</CardTitle>
                    <CardDescription>
                        Permanently deletes your account{pdfCount > 0 && <>, your {pdfCount === 1 ? 'PDF' : `${pdfCount} PDFs`} and every conversation</>}. This can&apos;t be undone.
                    </CardDescription>
                </CardHeader>
                <CardContent className='flex flex-col gap-4'>
                    <div className='flex flex-col gap-2'>
                        <Label htmlFor='delete-password'>Password</Label>
                        <Input id='delete-password' type='password' autoComplete='current-password' required value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <div className='flex flex-col gap-2'>
                        <Label htmlFor='delete-confirm'>Type <span className='font-mono'>delete</span> to confirm</Label>
                        <Input id='delete-confirm' autoComplete='off' value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
                    </div>
                    {error && <p role='alert' className='text-sm text-red-600 dark:text-red-400'>{error}</p>}
                </CardContent>
                <CardFooter>
                    <Button type='submit' variant='destructive' disabled={pending || !confirmed || !password}>
                        {pending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                        Delete my account
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
