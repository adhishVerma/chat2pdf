"use client"

import { useAStore } from '@/store/store';
import { Inbox } from 'lucide-react';
import React from 'react'
import { useDropzone } from 'react-dropzone';
import { Button } from '../ui/button';

const PDFUpload = () => {

    const pdfFile = useAStore((state) => state.pdfUrl);
    const setPdf = useAStore((state) => state.setPdf);

    const { getRootProps, getInputProps } = useDropzone({
        accept : {'application/pdf' : [".pdf"]},
        maxFiles : 1,
        onDrop : (acceptedFiles) => {
            console.log(acceptedFiles);
            setPdf(acceptedFiles);
        }
    });

    const getFiles = () => {
        console.log(pdfFile);
        // what to do with the uploaded file
    }

    return (
        <div className='p-2 rounded-xl'>
            <div {...getRootProps({
                className: 'border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 dark:bg-slate-600 py-8 flex justify-center items-center flex-col'
            })} >
                <input {...getInputProps()} />
                <>
                <Inbox className='w-10 h-10 text-blue-500'/>
                <p className='mt-2 text-sm text-slate-400'>Drop PDF here</p>
                </>
            </div>
            <Button className='m-auto my-3' onClick={getFiles}>Click to get files</Button>
        </div>
    )
}

export default PDFUpload