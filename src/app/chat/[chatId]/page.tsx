"use client"

import ChatBubble from '@/components/chat/ChatBubble'
import ChatInput from '@/components/chat/ChatInput'
import { getSources, initialMessages, scrollToEnd } from '@/lib/utils'
import { Message } from 'ai'
import { useChat } from 'ai/react'
import React, { useEffect, useRef } from 'react'
import {
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import ChatSidebar from '@/components/chat/ChatSidebar'

type Props = {
    'params': {
        chatId: string
    }
}

const ChatPage = ({ params: { chatId } }: Props) => {
    const { messages, input, handleInputChange, handleSubmit, isLoading, data } = useChat({
        initialMessages
    });

    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setTimeout(() => scrollToEnd(containerRef), 100)
    }, [messages])

    return (
        <div className='w-full rounded-sm max-w-7xl mx-auto h-full'>
            <ResizablePanelGroup direction="horizontal" className='w-full py-2'>
                <ResizablePanel defaultSize={25}>
                    <ChatSidebar />
                </ResizablePanel>
                <ResizablePanel className='w-full flex flex-col p-4 border'>
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