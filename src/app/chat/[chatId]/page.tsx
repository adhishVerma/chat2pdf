import React from 'react'
import {
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import ChatSidebar from '@/components/chat/ChatSidebar'
import ChatWindow from '@/components/chat/ChatWindow'
import PDFviewer from '@/components/pdf/PDFviewer'
import { Skeleton } from "@/components/ui/skeleton"


type Props = {
    'params': {
        chatId: string
    }
}

const ChatPage = ({ params: { chatId } }: Props) => {

    return (
        <div className='w-full rounded-sm mx-auto h-full'>
            <ResizablePanelGroup direction="horizontal" className='w-full py-2'>
                <ResizablePanel defaultSize={15}>
                    <ChatSidebar chatId={chatId} />
                </ResizablePanel>
                <ResizablePanel defaultSize={45} className='relative border w-full h-full p-4'>
                    <div className='w-full h-full absolute top-0 left-0 -z-10 p-4'>
                        <Skeleton className="w-full h-full rounded-lg " />
                    </div>
                    <PDFviewer />
                </ResizablePanel>
                <ResizablePanel defaultSize={40} className='w-full flex flex-col p-4 border'>
                    <ChatWindow chatId={chatId} />
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
}


export default ChatPage