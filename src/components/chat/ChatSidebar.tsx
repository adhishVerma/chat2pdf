"use client"

import React from 'react'
import ChatItem from './ChatItem'
import { navigate } from '@/app/chat/actions'
import { useAStore } from '@/store/store'



const chats = ['chat1', 'chat2', 'chat3', 'chat4', 'chat5']


const ChatSidebar = () => {
  const chatId = useAStore((state) => state.chatId);
  const setChatId = useAStore((state) => state.setChatId);

  const onClickItem = (event: any) => {
    // itemId inside dataset
    navigate(`/chat/${event.target.dataset.itemId}`);
    setChatId(event.target.dataset.itemId)
  }

  return (
    <div className='h-full bg-primary-foreground p-2 rounded'>
      <h2 className='opacity-75 font-semibold text-center mb-5'>Your previous chats</h2>
      {chats.map((item, index) => {
        const selected = item === chatId;
        return (<ChatItem key={index} name={item} selected={selected} clickHandler={onClickItem} />)
      })}
    </div>
  )
}

export default ChatSidebar