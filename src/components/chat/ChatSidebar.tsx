import React from 'react'
import ChatItem from './ChatItem'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { chats } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { Button } from '../ui/button'
import Link from 'next/link'

type Props = {
  chatId: string
}

const ChatSidebar = async (props: Props) => {
  const session = await getSession();
  if (!session) {
    return redirect(`/sign-in`);
  }

  const _chats = await db.select().from(chats).where(eq(chats.userId, session.userId)).orderBy(desc(chats.createdAt));
  return (
    <div className='h-full bg-primary-foreground p-2 rounded'>
      <Link href={`/chat`}>
        <Button className='w-full bg-inherit my-2' variant="outline">Create new chat</Button></Link>
      {_chats.map((item) => {
        return (<ChatItem key={item.id} item={item} chatId={props.chatId} />)
      })}
      <h2 className='opacity-75 font-light text-sm text-center mb-5 text-opacity-50 mt-12'>Your previous chats</h2>
    </div>
  )
}

export default ChatSidebar