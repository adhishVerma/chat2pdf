"use client"
import React from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"


const ChatInput = () => {

    return (
        <div className='flex w-full items-end space-x-2'>
            <div className='flex-1'>
                <Label htmlFor="message">Your message</Label>
                <Textarea className='min-h-10 max-h-screen' placeholder="Type your message here." id="message" /></div>
            <Button type="submit">Submit</Button></div>
    )
}

export default ChatInput