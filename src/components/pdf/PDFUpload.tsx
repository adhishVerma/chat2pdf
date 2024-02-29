"use client"

import { useAStore } from '@/store/store';
import { Inbox, Loader2 } from 'lucide-react';
import React from 'react'
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import { toast } from "sonner"
import { uploadToS3 } from '@/lib/s3';
import axios from 'axios'
import { useRouter } from 'next/navigation';

const PDFUpload = () => {

    const setPdfKey = useAStore((state) => state.setPdfKey);
    const router = useRouter();
    const { mutate, isPending } = useMutation({
        mutationFn: async ({ file_key, file_name }: { file_key: string, file_name: string }) => {
            const response = await axios.post(`/api/create-chat`, {
                file_key,
                file_name
            })
            return response.data;
        }
    })

    const { getRootProps, getInputProps } = useDropzone({
        accept: { 'application/pdf': [".pdf"] },
        maxFiles: 1,
        onDrop: async (acceptedFiles) => {
            console.log(acceptedFiles);
            const file = acceptedFiles[0];
            const res = await uploadToS3(file);
            // after uploading the file to s3
            if (!res.file_key || !res.file_name) {
                toast("something went wrong");
                return;
            }
            mutate(res, {
                onSuccess: (data) => {
                    console.log(data);
                    toast("Pdf ready to interact with");
                    router.push(`/chat/${data.chat_id}`);
                    setPdfKey(res.file_key);
                },
                onError: (err) => {
                    console.error(err)
                    toast("Something went wrong");
                }
            });
        }
    });

    return (
        <div className='p-2 rounded-xl w-full max-w-sm'>
            <div {...getRootProps({
                className: 'border-dashed border-2 border-red-200 dark:border-green-200 rounded-xl cursor-pointer bg-gray-50 dark:bg-neutral-800 py-8 flex justify-center items-center flex-col'
            })} >
                <input {...getInputProps()} />
                {!isPending ? <>
                    <Inbox className='w-10 h-10' />
                    <p className='mt-2 text-sm'>Drop your PDF here</p>
                </> : <div className='w-full -h-full flex justify-center items-center gap-3 animate-pulse'>
                    <Loader2 className='h-6 w-6 animate-spin' />
                    <h3 className='text-xl'>Processing..</h3>
                </div>}
            </div>

        </div>
    )
}

export default PDFUpload