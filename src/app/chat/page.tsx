import ChatBubble from '@/components/chat/ChatBubble'
import ChatInput from '@/components/chat/ChatInput'
import { Message } from 'ai'
import React from 'react'

const ChatPage = () => {
    const messages: Message[] = [
        { role: 'assistant', content: "Hey I am you AI", id: "1" },
        { role: 'user', content: "Hey I am the user", id: "2" }
    ]

    const sources = ["I am Source One", "I am Source two", "I am Source three"]

    return (
        <div className='rounded-2xl border flex flex-col justify-between'>
            <div className='p-4 overflow-auto'>
                {messages.map(({ id, role, content }: Message, index) => (
                    <ChatBubble
                        key={index}
                        role={role}
                        content={content}
                        sources={role !== 'assistant' ? [] : sources}
                    />
                ))}
                <ChatInput />
            </div>
        </div>
    )
}

export default ChatPage