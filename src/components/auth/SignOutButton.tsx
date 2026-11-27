"use client"

import axios from 'axios'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function SignOutButton() {
    const router = useRouter();
    const signOut = async () => {
        await axios.post('/api/auth/sign-out');
        router.replace('/');
        router.refresh();
    }
    return <Button variant='outline' size='sm' onClick={signOut}>Sign out</Button>
}
