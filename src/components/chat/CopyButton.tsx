"use client"

import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'

// Copies text to the clipboard. Falls back to a hidden textarea where the
// Clipboard API isn't available (older browsers, non-HTTPS origins).
async function copyText(text: string) {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
    }
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    if (!ok) throw new Error('copy failed');
}

export default function CopyButton({ text, label = 'Copy answer' }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;
        const t = setTimeout(() => setCopied(false), 2000);
        return () => clearTimeout(t);
    }, [copied]);

    const onClick = async () => {
        try {
            await copyText(text);
            setCopied(true);
        } catch {
            toast.error("Couldn't copy to the clipboard");
        }
    };

    return (
        <button
            type='button'
            onClick={onClick}
            aria-label={copied ? 'Copied' : label}
            title={copied ? 'Copied' : label}
            className='inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs font-normal text-muted-foreground hover:bg-muted hover:text-foreground'
        >
            {copied ? <Check className='h-3.5 w-3.5 text-green-600 dark:text-green-400' /> : <Copy className='h-3.5 w-3.5' />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
    );
}
