"use client"

import React, { useState } from 'react'
import axios from 'axios'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function ChangePasswordForm() {
    const [currentPassword, setCurrent] = useState('');
    const [newPassword, setNew] = useState('');
    const [confirm, setConfirm] = useState('');
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirm) {
            setError("New passwords don't match");
            return;
        }
        setPending(true);
        setError(null);
        try {
            await axios.post('/api/account/password', { currentPassword, newPassword });
            setCurrent(''); setNew(''); setConfirm('');
            toast.success('Password updated. Other devices have been signed out.');
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'Something went wrong');
        } finally {
            setPending(false);
        }
    }

    return (
        <Card>
            <form onSubmit={onSubmit} aria-label='Change password'>
                <CardHeader>
                    <CardTitle>Change password</CardTitle>
                    <CardDescription>This signs you out on every other device.</CardDescription>
                </CardHeader>
                <CardContent className='flex flex-col gap-4'>
                    <div className='flex flex-col gap-2'>
                        <Label htmlFor='current-password'>Current password</Label>
                        <Input id='current-password' type='password' autoComplete='current-password' required value={currentPassword} onChange={(e) => setCurrent(e.target.value)} />
                    </div>
                    <div className='flex flex-col gap-2'>
                        <Label htmlFor='new-password'>New password</Label>
                        <Input id='new-password' type='password' autoComplete='new-password' required minLength={8} value={newPassword} onChange={(e) => setNew(e.target.value)} />
                    </div>
                    <div className='flex flex-col gap-2'>
                        <Label htmlFor='confirm-password'>Confirm new password</Label>
                        <Input id='confirm-password' type='password' autoComplete='new-password' required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                    </div>
                    {error && <p role='alert' className='text-sm text-red-600 dark:text-red-400'>{error}</p>}
                </CardContent>
                <CardFooter>
                    <Button type='submit' disabled={pending}>
                        {pending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                        Update password
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
