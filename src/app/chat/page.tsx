import React from 'react'
import {
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import ChatSidebar from '@/components/chat/ChatSidebar'
import PDFUpload from '@/components/pdf/PDFUpload'

type Props = {}

const page = async (props: Props) => {
    return (
        <div className='w-full rounded-sm max-w-7xl mx-auto h-full'>
            <ResizablePanelGroup direction='horizontal' className='w-full h-full py-2'>
                <ResizablePanel defaultSize={25}>
                    <ChatSidebar />
                </ResizablePanel>
                <ResizablePanel defaultSize={75} className='flex justify-center items-center border'>
                    <PDFUpload />
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
}

export default page