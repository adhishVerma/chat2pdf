"use client"
import React, { useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Spinner from './spinner'

type ChatInputProps = {
    inputChangeHandler: React.ChangeEventHandler<HTMLTextAreaElement>
    submitHandler: React.FormEventHandler<HTMLFormElement>
    input: string;
    isLoading: boolean
}

const resizeTextArea = (containerRef: React.RefObject<HTMLElement>) => {
    if (containerRef.current) {
        if (containerRef.current.innerHTML.length < 50) {
            containerRef.current.style.height = '0px'
        }
        containerRef.current.style.height = `${containerRef.current.scrollHeight}px`
    }
}

const ChatInput = ({ inputChangeHandler, submitHandler, input, isLoading }: ChatInputProps) => {
    const textArearef = useRef<HTMLTextAreaElement | null>(null)

    useEffect(() => {
        if (textArearef) {
            resizeTextArea(textArearef);
        }
    }, [input])

    return (
        <form className='flex w-full items-end space-x-2 grow-0' id='chat-input-form' onSubmit={submitHandler}>
            <div className='flex-1'>
                <Label htmlFor="message">Your message</Label>
                <Textarea ref={textArearef} form='chat-input-form' className='min-h-10' placeholder="Type your message here." id="message" value={input} onChange={inputChangeHandler} /></div>
            <Button type="submit" disabled={isLoading}>{isLoading ? <Spinner /> : "Ask"}</Button></form>
    )
}

export default ChatInput