"use client"

import ChatBubble from '@/components/chat/ChatBubble'
import ChatInput from '@/components/chat/ChatInput'
import { getSources, initialMessages, scrollToEnd } from '@/lib/utils'
import { Message } from 'ai'
import { useChat } from 'ai/react'
import React, { useEffect, useRef } from 'react'
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import ChatSidebar from '@/components/chat/ChatSidebar'
import PDFviewer from '@/components/pdf-preview/PDFviewer'
import PDFUpload from '@/components/pdf-preview/PDFUpload'
import { useAStore } from '@/store/store'



const ChatPage = () => {

    const pdfKey = useAStore((state) => state.pdfKey);

    const { messages, input, handleInputChange, handleSubmit, isLoading, data } = useChat({
        initialMessages
    });

    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setTimeout(() => scrollToEnd(containerRef), 100)
    }, [messages])

    return (
        <div className='w-full rounded-sm max-w-7xl mx-auto h-full'>
            <ResizablePanelGroup direction="horizontal" className='w-full h-full'>
                <ResizablePanel defaultSize={50}>
                    {/* <ChatSidebar /> */}
                    {!pdfKey ? <PDFUpload /> : <PDFviewer file_key={pdfKey} />}
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={50} className='min-h-full w-full flex flex-col p-4 border'>
                    <div className='overflow-auto mb-3 grow no-scrollbar' ref={containerRef}>
                        {messages.map(({ id, role, content }: Message, index) => (
                            <ChatBubble
                                key={index}
                                role={role}
                                content={content}
                                sources={data?.length ? getSources(data, role, index) : []}
                            />
                        ))}
                    </div>
                    <ChatInput submitHandler={handleSubmit} inputChangeHandler={handleInputChange} input={input} isLoading={isLoading} />
                </ResizablePanel>
            </ResizablePanelGroup>

        </div>
    )
}


export default ChatPage