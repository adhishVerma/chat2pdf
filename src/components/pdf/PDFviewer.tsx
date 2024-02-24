"use client"

import { getS3Url } from '@/lib/s3'
import React from 'react'

type PDFviewerPropType = {
    file_key: string
}

const PDFviewer = ({ file_key }: PDFviewerPropType) => {
    const pdfUrl = getS3Url(file_key)

    if (pdfUrl) {
        return (
            <iframe src={pdfUrl} height="100%" width="100%" ></iframe>
        )
    }


}

export default PDFviewer