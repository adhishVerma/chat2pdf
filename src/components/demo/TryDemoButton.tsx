"use client"

import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, type ButtonProps } from '@/components/ui/button'

// Signs in to the shared demo account in one click.
export default function TryDemoButton({ children = 'Try the demo', ...props }: ButtonProps) {
    const router = useRouter()
    const [pending, setPending] = useState(false)
    const start = async () => {
        setPending(true)
        try {
            await axios.post('/api/auth/demo')
            router.push('/chat')
            router.refresh()
        } catch (err: any) {
            toast(err?.response?.data?.message ?? "Couldn't start the demo")
            setPending(false)
        }
    }
    return (
        <Button {...props} onClick={start} disabled={pending || props.disabled}>
            {pending && <Loader2 className='mr-2 size-4 animate-spin' />}
            {children}
        </Button>
    )
}
