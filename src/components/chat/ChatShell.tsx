"use client"

import React, { useEffect, useState, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { Loader2, Menu, X } from 'lucide-react'
import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Button } from '@/components/ui/button'
import { useAStore } from '@/store/store'

// Below this width the three-panel layout gets too cramped, so we switch to
// one pane at a time with the chat list in a slide-over. Matches Tailwind's `lg`.
const DESKTOP_QUERY = '(min-width: 1024px)'

function useIsDesktop(): boolean | null {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(DESKTOP_QUERY)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => null, // unknown on the server; render a placeholder until hydrated
  )
}

type Props = {
  sidebar: React.ReactNode
  // the /chat page: just an upload box next to the sidebar
  main?: React.ReactNode
  // a chat page: the PDF and the conversation
  chatId?: string
  pdf?: React.ReactNode
  chat?: React.ReactNode
}

function ChatListSheet({ sidebar }: { sidebar: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  // close after picking a chat or starting a new one
  useEffect(() => setOpen(false), [pathname])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant='outline' size='sm' aria-label='Show chats' className='gap-2'>
          <Menu className='size-4' /> Chats
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className='fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0' />
        <Dialog.Content className='fixed inset-y-0 left-0 z-50 flex w-[85vw] max-w-xs flex-col bg-background p-2 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left'>
          <div className='flex items-center justify-between px-2 pt-1'>
            <Dialog.Title className='text-sm font-medium'>Your chats</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant='ghost' size='icon' aria-label='Close chats'><X className='size-4' /></Button>
            </Dialog.Close>
          </div>
          <Dialog.Description className='sr-only'>Open a previous chat or start a new one.</Dialog.Description>
          <div className='min-h-0 grow overflow-y-auto'>{sidebar}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function MobileChat({ sidebar, chatId, pdf, chat }: { sidebar: React.ReactNode; chatId: string; pdf: React.ReactNode; chat: React.ReactNode }) {
  const [tab, setTab] = useState<'chat' | 'pdf'>('chat')
  // tapping a page reference in an answer should show that page
  const pdfPage = useAStore((s) => s.pdfPage)
  useEffect(() => { if (pdfPage) setTab('pdf') }, [pdfPage])

  const tabClass = (t: string) =>
    `px-3 py-1 rounded-sm text-sm ${tab === t ? 'bg-background shadow-sm font-medium' : 'opacity-70'}`

  return (
    <div className='flex h-full w-full flex-col gap-2 px-1 pb-1'>
      <div className='flex items-center justify-between gap-2'>
        <ChatListSheet sidebar={sidebar} />
        <div role='tablist' aria-label='View' className='flex rounded-md bg-muted p-1'>
          <button role='tab' aria-selected={tab === 'chat'} className={tabClass('chat')} onClick={() => setTab('chat')}>Chat</button>
          <button role='tab' aria-selected={tab === 'pdf'} className={tabClass('pdf')} onClick={() => setTab('pdf')}>PDF</button>
        </div>
      </div>
      {/* both panes stay mounted so the conversation and the PDF keep their state */}
      <div role='tabpanel' aria-label='Chat' className={`${tab === 'chat' ? 'flex' : 'hidden'} min-h-0 grow flex-col`}>{chat}</div>
      <div role='tabpanel' aria-label='PDF' className={`${tab === 'pdf' ? 'flex' : 'hidden'} min-h-0 grow flex-col`}>
        <div className='relative min-h-0 grow overflow-hidden rounded border'>{pdf}</div>
      </div>
    </div>
  )
}

export default function ChatShell({ sidebar, main, chatId, pdf, chat }: Props) {
  const isDesktop = useIsDesktop()

  if (isDesktop === null) {
    return (
      <div className='flex h-full w-full items-center justify-center'>
        <Loader2 className='h-10 w-10 animate-spin' />
      </div>
    )
  }

  if (!isDesktop) {
    if (chatId) return <MobileChat sidebar={sidebar} chatId={chatId} pdf={pdf} chat={chat} />
    return (
      <div className='flex h-full w-full flex-col gap-2 px-1 pb-1'>
        <div><ChatListSheet sidebar={sidebar} /></div>
        <div className='flex min-h-0 grow items-center justify-center rounded border p-3'>{main}</div>
      </div>
    )
  }

  return (
    <div className='w-full rounded-sm mx-auto h-full'>
      <ResizablePanelGroup direction='horizontal' className='w-full h-full py-2'>
        <ResizablePanel defaultSize={15} className='!overflow-y-auto'>
          {sidebar}
        </ResizablePanel>
        {chatId ? (
          <>
            <ResizablePanel defaultSize={45} className='border w-full h-full'>
              {pdf}
            </ResizablePanel>
            <ResizablePanel defaultSize={40} className='w-full flex flex-col p-4 border'>
              {chat}
            </ResizablePanel>
          </>
        ) : (
          <ResizablePanel defaultSize={85} className='flex justify-center items-center border'>
            {main}
          </ResizablePanel>
        )}
      </ResizablePanelGroup>
    </div>
  )
}
