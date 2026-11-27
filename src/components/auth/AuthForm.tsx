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

type Props = { mode: 'sign-in' | 'sign-up' }

export default function AuthForm({ mode }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);
    const isSignUp = mode === 'sign-up';

    // only allow same-site relative redirects
    const nextParam = searchParams.get('next');
    const next = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/chat';

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setPending(true);
        try {
            await axios.post(`/api/auth/${mode}`, { email, password });
            router.replace(next);
            router.refresh();
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'Something went wrong');
            setPending(false);
        }
    }

    return (
        <Card className='w-full max-w-sm'>
            <form onSubmit={onSubmit}>
                <CardHeader>
                    <CardTitle>{isSignUp ? 'Create an account' : 'Sign in'}</CardTitle>
                    <CardDescription>{isSignUp ? 'Start chatting with your PDFs.' : 'Welcome back.'}</CardDescription>
                </CardHeader>
                <CardContent className='flex flex-col gap-4'>
                    <div className='flex flex-col gap-2'>
                        <Label htmlFor='email'>Email</Label>
                        <Input id='email' type='email' autoComplete='email' required value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className='flex flex-col gap-2'>
                        <div className='flex items-center justify-between'>
                            <Label htmlFor='password'>Password</Label>
                            {!isSignUp && <Link className='text-xs underline opacity-75' href='/forgot-password'>Forgot password?</Link>}
                        </div>
                        <Input id='password' type='password' autoComplete={isSignUp ? 'new-password' : 'current-password'} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    {error && <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>}
                </CardContent>
                <CardFooter className='flex flex-col gap-3'>
                    <Button type='submit' className='w-full' disabled={pending}>
                        {pending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                        {isSignUp ? 'Sign up' : 'Sign in'}
                    </Button>
                    <p className='text-sm opacity-75'>
                        {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                        <Link className='underline' href={isSignUp ? '/sign-in' : '/sign-up'}>{isSignUp ? 'Sign in' : 'Sign up'}</Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    )
}
