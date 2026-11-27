"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState('');
    const [pending, setPending] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPending(true);
        setError(null);
        try {
            const { data } = await axios.post('/api/auth/forgot-password', { email });
            setMessage(data.message);
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'Something went wrong');
        } finally {
            setPending(false);
        }
    }

    return (
        <Card className='w-full max-w-sm'>
            <form onSubmit={onSubmit}>
                <CardHeader>
                    <CardTitle>Reset your password</CardTitle>
                    <CardDescription>We&apos;ll email you a link to choose a new one.</CardDescription>
                </CardHeader>
                <CardContent className='flex flex-col gap-4'>
                    {message ? <p className='text-sm'>{message}</p> : (
                        <div className='flex flex-col gap-2'>
                            <Label htmlFor='email'>Email</Label>
                            <Input id='email' type='email' autoComplete='email' required value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                    )}
                    {error && <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>}
                </CardContent>
                <CardFooter className='flex flex-col gap-3'>
                    {!message && (
                        <Button type='submit' className='w-full' disabled={pending}>
                            {pending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                            Send reset link
                        </Button>
                    )}
                    <Link className='text-sm underline opacity-75' href='/sign-in'>Back to sign in</Link>
                </CardFooter>
            </form>
        </Card>
    )
}
