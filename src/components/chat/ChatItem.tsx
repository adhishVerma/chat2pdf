"use client"

import React from 'react'
import { Button } from '../ui/button'
import { navigate } from '@/app/chat/actions'

type Props = {
    item: {
        pdfName : string;
        id : number;
    }
    chatId : string
}

const ChatItem = (props: Props) => {
    const {item, chatId} = props

    const onClickItem = (event: any) => {
        // itemId inside dataset
        navigate(`/chat/${event.target.dataset.itemId}`);
    }

    const selected = (parseInt(chatId!, 10) === item.id)

    return (
        <div className='w-full my-2'>
            <Button data-item-id={item.id} onClick={onClickItem} className={`w-full flex justify-between text-ellipsis overflow-hidden ${selected?'backdrop-brightness-85':`backdrop-brightness-100`}`} variant={selected ? 'secondary' : 'ghost'}>{item.pdfName}</Button>
        </div>
    )
}

export default ChatItem