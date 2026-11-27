"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function ResetPasswordForm() {
    const router = useRouter();
    const token = useSearchParams().get('token') ?? '';
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) {
            setError("Passwords don't match");
            return;
        }
        setPending(true);
        setError(null);
        try {
            await axios.post('/api/auth/reset-password', { token, password });
            router.replace('/chat');
            router.refresh();
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'Something went wrong');
            setPending(false);
        }
    }

    if (!token) {
        return (
            <Card className='w-full max-w-sm'>
                <CardHeader>
                    <CardTitle>Link missing</CardTitle>
                    <CardDescription>Open the link from your email, or request a new one.</CardDescription>
                </CardHeader>
                <CardFooter><Link className='text-sm underline' href='/forgot-password'>Request a new link</Link></CardFooter>
            </Card>
        )
    }

    return (
        <Card className='w-full max-w-sm'>
            <form onSubmit={onSubmit}>
                <CardHeader>
                    <CardTitle>Choose a new password</CardTitle>
                    <CardDescription>This signs you out everywhere else.</CardDescription>
                </CardHeader>
                <CardContent className='flex flex-col gap-4'>
                    <div className='flex flex-col gap-2'>
                        <Label htmlFor='password'>New password</Label>
                        <Input id='password' type='password' autoComplete='new-password' required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <div className='flex flex-col gap-2'>
                        <Label htmlFor='confirm'>Confirm password</Label>
                        <Input id='confirm' type='password' autoComplete='new-password' required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                    </div>
                    {error && <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>}
                </CardContent>
                <CardFooter className='flex flex-col gap-3'>
                    <Button type='submit' className='w-full' disabled={pending}>
                        {pending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                        Update password
                    </Button>
                    {error && <Link className='text-sm underline opacity-75' href='/forgot-password'>Request a new link</Link>}
                </CardFooter>
            </form>
        </Card>
    )
}
