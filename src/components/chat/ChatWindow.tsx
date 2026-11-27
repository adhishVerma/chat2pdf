"use client"
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { initialMessagesTemplate, scrollToEnd, type Message } from '@/lib/utils';
import ChatBubble from './ChatBubble';
import { useChatStream } from './useChatStream';
import ChatInput from './ChatInput';
import { useAStore } from '@/store/store';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { navigate } from '@/app/chat/actions';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';


type Props = {
  chatId: string
}

const ChatWindow = (props: Props) => {
  const { chatId } = props;

  const setPdfKey = useAStore((state) => state.setPdfKey);
  const [loading, setLoading] = useState(false);

  // fetch the chat details from chatId
  const { mutate } = useMutation({
    mutationFn: async (chatId: string) => {
      setLoading(true);
      const response = await axios.get(`/api/chat/${chatId}`)
      // get the data and return it
      return response.data;
    },
  })


  const showError = useCallback((message: string) => toast(message), []);
  const { messages, setMessages, input, setInput, isLoading, send } = useChatStream(chatId, showError);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setTimeout(() => scrollToEnd(containerRef), 100)
  }, [messages])

  useEffect(() => {
    mutate(chatId, {
      onSuccess: (data: any) => {
        const saved: Message[] = (data.messages ?? []).map((m: any) => ({ id: String(m.id), role: m.role, content: m.content }));
        setMessages(saved.length ? saved : initialMessagesTemplate);
        setPdfKey(data.file_key);
        setLoading(false);
      },
      onError: (err) => {
        console.log("request error", err);
        toast("Something went wrong");
        return navigate('/chat');
      }
    })

  }, [setPdfKey, mutate, chatId, setMessages])
  

  if(loading){
    return (
      <div className='flex w-full h-full justify-center items-center'>
        <Loader2 className='animate-spin h-10 w-10'/>
      </div>
    )
  }

  return (
  <>
    <div className='overflow-auto mb-3 grow no-scrollbar' ref={containerRef}>
      {messages.map(({ id, role, content, sources }: Message) => (
        <ChatBubble
          key={id}
          role={role}
          content={content}
          sources={sources ?? []}
        />
      ))}
    </div>
    <ChatInput
      inputChangeHandler={(e) => setInput(e.target.value)}
      input={input}
      submitHandler={(e) => { e.preventDefault(); send(input); }}
      isLoading={isLoading}
    />
  </>
  )
}

export default ChatWindow