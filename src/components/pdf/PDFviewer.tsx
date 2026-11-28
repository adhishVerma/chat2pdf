"use client"

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { FileText, Loader2 } from 'lucide-react'
import { useAStore } from '@/store/store'
import { Button } from '@/components/ui/button'

// pdf.js is large, so its code is only downloaded once the user asks to see the PDF
const PdfJsViewer = dynamic(() => import('./PdfJsViewer'), {
    ssr: false,
    loading: () => <div className='flex h-full items-center justify-center'><Loader2 className='size-8 animate-spin' /></div>,
})

type Props = { chatId: string }

// The API route checks ownership, then redirects to a short-lived signed S3 URL.
const PDFviewer = ({ chatId }: Props) => {
    const pdfPage = useAStore((state) => state.pdfPage);
    const [open, setOpen] = useState(false);
    // clicking a page reference in an answer opens the viewer at that page
    useEffect(() => { if (pdfPage) setOpen(true) }, [pdfPage]);

    if (!chatId) return null;
    const url = `/api/chat/${chatId}/pdf`;

    if (!open) {
        return (
            <div className='flex h-full w-full flex-col items-center justify-center gap-3 bg-background p-4 text-center'>
                <FileText className='size-10 opacity-40' />
                <Button onClick={() => setOpen(true)}>View PDF</Button>
                <a href={url} target='_blank' rel='noopener noreferrer' className='text-xs underline opacity-70'>or open it in a new tab</a>
            </div>
        )
    }
    return <PdfJsViewer url={url} target={pdfPage} />
}

export default PDFviewer
