import React from 'react'
import {
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import ChatSidebar from '@/components/chat/ChatSidebar'
import ChatWindow from '@/components/chat/ChatWindow'
import PDFviewer from '@/components/pdf/PDFviewer'

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
                    <ChatSidebar chatId={chatId}/>
                </ResizablePanel>
                <ResizablePanel defaultSize={45}>
                    <PDFviewer />
                </ResizablePanel>
                <ResizablePanel defaultSize={40} className='w-full flex flex-col p-4 border'>
                    <ChatWindow chatId={chatId}/>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
}


export default ChatPage