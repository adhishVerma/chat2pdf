"use client"

import React from 'react'

const PDFviewer = () => {
    const pdfUrl = 'https://lddashboard.legislative.gov.in/sites/default/files/A1860-45.pdf'

    if(pdfUrl){
        return (
            <iframe src={pdfUrl} height="100%" width="100%" ></iframe>
        )
    }
    
    
}

export default PDFviewer