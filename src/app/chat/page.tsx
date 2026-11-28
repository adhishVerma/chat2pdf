import React from 'react'
import ChatSidebar from '@/components/chat/ChatSidebar'
import ChatShell from '@/components/chat/ChatShell'
import PDFUpload from '@/components/pdf/PDFUpload'

const page = async () => {
    return <ChatShell sidebar={<ChatSidebar chatId='' />} main={<PDFUpload />} />
}

export default page
