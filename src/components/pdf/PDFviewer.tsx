"use client"

import React from 'react'

type Props = { chatId: string }

// The API route checks ownership, then redirects to a short-lived signed S3 URL.
const PDFviewer = ({ chatId }: Props) => {
    if (!chatId) return null;
    return (
        <iframe src={`/api/chat/${chatId}/pdf`} height="100%" width="100%" loading='eager'></iframe>
    )
}

export default PDFviewer
