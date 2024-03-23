"use client"

import React from 'react'
import { Button } from '../ui/button'
import { navigate } from '@/app/chat/actions'
import { Trash } from 'lucide-react'
import ChatDeleteDialog from './ChatDeleteDialog'
import { useAStore } from '@/store/store'

type Props = {
    item: {
        pdfName: string;
        id: number;
    }
    chatId: string
}

const ChatItem = (props: Props) => {
    const setPdfKey = useAStore((state)=> state.setPdfKey);

    const { item, chatId } = props
    const onClickItem = (event: any) => {
        // itemId inside dataset
        const itemId = event.target.dataset.itemId
        if (itemId) {
            setPdfKey('');
            navigate(`/chat/${itemId}`);
        }
    }

    const selected = (parseInt(chatId!, 10) === item.id)

    return (
        <div data-item-id={item.id} onClick={onClickItem} className={`w-full p-2 cursor-pointer my-2 text-sm flex rounded justify-between overflow-clip ${selected ? 'backdrop-brightness-85 bg-stone-300 dark:bg-slate-700' : `backdrop-brightness-100`}`} ><span className='pointer-events-none grow text-left overflow-hidden text-ellipsis '>{item.pdfName}</span>
            <ChatDeleteDialog itemId={item.id}><Trash className='size-4 flex-shrink-0 opacity-45 hover:opacity-75  hover:text-red-600 dark:hover:text-red-200' /></ChatDeleteDialog>
        </div>
    )
}

export default ChatItem