"use client"

import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { navigate } from '@/app/chat/actions'
import { AlertTriangle, Loader2, Pencil, Trash } from 'lucide-react'
import ChatDeleteDialog from './ChatDeleteDialog'
import { useAStore } from '@/store/store'

type Props = {
    item: {
        pdfName: string;
        title?: string | null;
        id: number;
        status?: 'pending' | 'processing' | 'ready' | 'failed';
    }
    chatId: string
}

const ChatItem = ({ item, chatId }: Props) => {
    const setPdfKey = useAStore((state) => state.setPdfKey);
    const router = useRouter();
    const [name, setName] = useState(item.title || item.pdfName);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => setName(item.title || item.pdfName), [item.title, item.pdfName]);
    useEffect(() => {
        if (editing) inputRef.current?.select();
    }, [editing]);

    const open = () => {
        if (editing) return;
        setPdfKey('');
        navigate(`/chat/${item.id}`);
    }

    const startEditing = (e: React.SyntheticEvent) => {
        e.stopPropagation();
        setDraft(name);
        setEditing(true);
    }

    const save = async () => {
        setEditing(false);
        const title = draft.replace(/\s+/g, ' ').trim();
        if (title === name) return;
        const previous = name;
        setName(title || item.pdfName); // optimistic
        try {
            const res = await axios.patch(`/api/chat/${item.id}`, { title });
            setName(res.data.name);
            router.refresh();
        } catch (err: any) {
            setName(previous);
            toast.error(err?.response?.data?.message ?? "Couldn't rename the chat");
        }
    }

    const selected = parseInt(chatId, 10) === item.id;

    return (
        <div
            role='button'
            tabIndex={0}
            onClick={open}
            onKeyDown={(e) => { if (!editing && e.key === 'Enter') open(); }}
            title={item.title ? `${item.title} (${item.pdfName})` : item.pdfName}
            className={`group w-full p-2 cursor-pointer my-2 text-sm flex items-center gap-1 rounded justify-between overflow-clip ${selected ? 'backdrop-brightness-85 bg-stone-300 dark:bg-slate-700' : 'backdrop-brightness-100'}`}
        >
            {editing ? (
                <input
                    ref={inputRef}
                    aria-label='Chat name'
                    className='grow min-w-0 rounded border bg-background px-1 py-0.5 text-sm'
                    value={draft}
                    maxLength={120}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') save();
                        if (e.key === 'Escape') setEditing(false);
                    }}
                    onBlur={save}
                />
            ) : (
                <span className='grow text-left overflow-hidden text-ellipsis whitespace-nowrap' onDoubleClick={startEditing}>{name}</span>
            )}
            {(item.status === 'pending' || item.status === 'processing') && <Loader2 aria-label='Processing' className='size-4 flex-shrink-0 animate-spin opacity-60' />}
            {item.status === 'failed' && <AlertTriangle aria-label='Processing failed' className='size-4 flex-shrink-0 text-red-600 dark:text-red-400' />}
            {!editing && (
                <button type='button' aria-label='Rename chat' title='Rename' onClick={startEditing}
                    className={`flex-shrink-0 ${selected ? 'opacity-45' : 'opacity-0'} group-hover:opacity-45 focus:opacity-75 hover:!opacity-75`}>
                    <Pencil className='size-4' />
                </button>
            )}
            <span onClick={(e) => e.stopPropagation()} className='flex'>
                <ChatDeleteDialog itemId={item.id}><Trash aria-label='Delete chat' className='size-4 flex-shrink-0 opacity-45 hover:opacity-75 hover:text-red-600 dark:hover:text-red-200' /></ChatDeleteDialog>
            </span>
        </div>
    )
}

export default ChatItem
