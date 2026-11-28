"use client"
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { initialMessagesTemplate, scrollToEnd, type Message } from '@/lib/utils';
import ChatBubble from './ChatBubble';
import { useChatStream } from './useChatStream';
import ChatInput from './ChatInput';
import ProcessingBanner, { type ProcessingState } from './ProcessingBanner';
import { useAStore } from '@/store/store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { navigate } from '@/app/chat/actions';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Props = {
  chatId: string
}

type ChatDetails = {
  messages: { id: number; role: 'user' | 'assistant'; content: string }[]
  file_key: string
  processing: ProcessingState
}

const POLL_MS = 2000;

const ChatWindow = ({ chatId }: Props) => {
  const setPdfKey = useAStore((state) => state.setPdfKey);
  const queryClient = useQueryClient();
  const [retrying, setRetrying] = useState(false);

  const showError = useCallback((message: string) => toast(message), []);
  const { messages, setMessages, input, setInput, isLoading, send } = useChatStream(chatId, showError);

  // chat details; polled while the PDF is still being processed
  const { data, isPending, isError } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => (await axios.get<ChatDetails>(`/api/chat/${chatId}`)).data,
    refetchInterval: (query) => {
      const status = query.state.data?.processing.status;
      return status === 'pending' || status === 'processing' ? POLL_MS : false;
    },
  });

  // load saved messages once per chat
  const loadedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!data || loadedFor.current === chatId) return;
    loadedFor.current = chatId;
    const saved: Message[] = data.messages.map((m) => ({ id: String(m.id), role: m.role, content: m.content }));
    setMessages(saved.length ? saved : initialMessagesTemplate);
    setPdfKey(data.file_key);
  }, [data, chatId, setMessages, setPdfKey]);

  useEffect(() => {
    if (isError) {
      toast("Something went wrong");
      navigate('/chat');
    }
  }, [isError]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    setTimeout(() => scrollToEnd(containerRef), 100)
  }, [messages])

  const retry = async () => {
    setRetrying(true);
    try {
      await axios.post(`/api/chat/${chatId}/retry`);
      await queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
    } catch {
      toast("Couldn't restart processing");
    } finally {
      setRetrying(false);
    }
  };

  if (isPending || !data) {
    return (
      <div className='flex w-full h-full justify-center items-center'>
        <Loader2 className='animate-spin h-10 w-10' />
      </div>
    )
  }

  const ready = data.processing.status === 'ready';

  return (
    <>
      <ProcessingBanner state={data.processing} onRetry={retry} retrying={retrying} />
      <div className='overflow-auto mb-3 grow no-scrollbar' ref={containerRef}>
        {messages.map(({ id, role, content, sources }: Message) => (
          <ChatBubble
            key={id}
            id={id}
            role={role}
            content={content}
            sources={sources ?? []}
          />
        ))}
      </div>
      <ChatInput
        inputChangeHandler={(e) => setInput(e.target.value)}
        input={input}
        submitHandler={(e) => { e.preventDefault(); if (ready) send(input); }}
        isLoading={isLoading}
        disabled={!ready}
      />
    </>
  )
}

export default ChatWindow
