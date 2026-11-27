"use client"

import { useCallback, useState } from 'react'
import type { Message, Source } from '@/lib/utils'

let counter = 0;
const newId = () => `${Date.now()}-${counter++}`;

// Sends the conversation to /api/chat and streams the reply into state.
// The response's first line is JSON with the sources, the rest is the answer.
export function useChatStream(chatId: string, onError: (message: string) => void) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const send = useCallback(async (text: string) => {
        const question = text.trim();
        if (!question || isLoading) return;
        const userMessage: Message = { id: newId(), role: 'user', content: question };
        const assistantId = newId();
        const history = [...messages, userMessage];
        setMessages([...history, { id: assistantId, role: 'assistant', content: '' }]);
        setInput('');
        setIsLoading(true);

        const update = (patch: Partial<Message>) =>
            setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, ...patch } : m)));

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId,
                    messages: history.filter((m) => m.content && m.id !== '0').map(({ role, content }) => ({ role, content })),
                }),
            });
            if (!res.ok || !res.body) {
                throw new Error((await res.text()) || 'Something went wrong');
            }
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let sources: Source[] | null = null;
            let answer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                if (sources === null) {
                    const newline = buffer.indexOf('\n');
                    if (newline === -1) continue;
                    sources = JSON.parse(buffer.slice(0, newline)) as Source[];
                    buffer = buffer.slice(newline + 1);
                    update({ sources });
                }
                answer += buffer;
                buffer = '';
                update({ content: answer });
            }
        } catch (err: any) {
            setMessages((prev) => prev.filter((m) => m.id !== assistantId || m.content));
            onError(err?.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    }, [chatId, isLoading, messages, onError]);

    return { messages, setMessages, input, setInput, isLoading, send };
}
