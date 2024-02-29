"use client"

import { getS3Url } from '@/lib/s3'
import { useAStore } from '@/store/store'
import React from 'react'


const PDFviewer = () => {
    const pdfKey = useAStore((state) => state.pdfKey)
    const pdfUrl = getS3Url(pdfKey!)

    if (pdfUrl) {
        return (
            <iframe src={pdfUrl} height="100%" width="100%" allowTransparency loading='eager'></iframe>
        )
    }


}

export default PDFviewer