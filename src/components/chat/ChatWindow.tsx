"use client"
import React, { useEffect, useRef, useState } from 'react';
import { Message } from 'ai'
import { getSources, initialMessagesTemplate, scrollToEnd } from '@/lib/utils';
import ChatBubble from './ChatBubble';
import { useChat } from 'ai/react';
import ChatInput from './ChatInput';
import { useAStore } from '@/store/store';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { storeMessage } from '@/lib/db/store-message';


type Props = {
  chatId: string
}

const ChatWindow = (props: Props) => {
  const { chatId } = props;

  const pdfKey = useAStore((state) => state.pdfKey);
  const setPdfKey = useAStore((state) => state.setPdfKey);
  const [initialMessages, setInitialMessages] = useState([])

  // fetch the chat details from chatId
  const { mutate } = useMutation({
    mutationFn: async (chatId: string) => {
      const response = await axios.get(`/api/chat/${chatId}`)
      // get the data and return it
      return response.data;
    },
  })


  const { messages, input, handleInputChange, handleSubmit, isLoading, data } = useChat({
    initialMessages: (initialMessages.length > 0) ? initialMessages : initialMessagesTemplate,
    sendExtraMessageFields: true,
    body: {
      file_key: pdfKey,
      chatId: chatId
    },
    onFinish: (res: Message) => {
      console.log(res);
      storeMessage(res, chatId);
    },
  });

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setTimeout(() => scrollToEnd(containerRef), 100)
  }, [messages])

  useEffect(() => {
    mutate(chatId, {
      onSuccess: (data: any) => {
        setInitialMessages(data.messages);
        setPdfKey(data.file_key);
      }
    })
    // setPdfKey(props.chatId);

  }, [useMutation])

  return (<>
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
    <ChatInput inputChangeHandler={handleInputChange} input={input} submitHandler={handleSubmit} isLoading={isLoading} /></>
  )
}

export default ChatWindow