"use client"

import React from 'react'
import { useAStore } from '@/store/store'

type Props = { chatId: string }

// The API route checks ownership, then redirects to a short-lived signed S3 URL.
// `#page=N` is understood by the built-in PDF viewers in Chrome, Edge, Firefox and Safari.
const PDFviewer = ({ chatId }: Props) => {
    const pdfPage = useAStore((state) => state.pdfPage);
    if (!chatId) return null;
    const src = `/api/chat/${chatId}/pdf${pdfPage ? `#page=${pdfPage.page}` : ''}`;
    return (
        <iframe key={pdfPage?.nonce ?? 0} src={src} title='PDF document' height="100%" width="100%" loading='eager'></iframe>
    )
}

export default PDFviewer
