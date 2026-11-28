import React from 'react'
import ChatSidebar from '@/components/chat/ChatSidebar'
import ChatShell from '@/components/chat/ChatShell'
import ChatWindow from '@/components/chat/ChatWindow'
import PDFviewer from '@/components/pdf/PDFviewer'

type Props = {
    'params': Promise<{
        chatId: string
    }>
}

const ChatPage = async ({ params }: Props) => {
    const { chatId } = await params

    return (
        <ChatShell
            chatId={chatId}
            sidebar={<ChatSidebar chatId={chatId} />}
            pdf={<PDFviewer chatId={chatId} />}
            chat={<ChatWindow chatId={chatId} />}
        />
    )
}

export default ChatPage
