import React from 'react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import axios from 'axios'
import { navigate } from '@/app/chat/actions'


interface Props {
    children: React.ReactNode,
    itemId: number
}


export default function ChatDeleteDialog({ children, itemId }: Props) {

    const itemDeletion = async (event: any) => {
        event.stopPropagation();
        try {
            const url = `/api/chat/${itemId}`
            const res = await axios.delete(url);
            if(res.status === 200){
                navigate('/chat');
            }            
        } catch (err : any) {
            throw Error(err.message);
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger>{children}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the document and the chat history.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={itemDeletion}>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    )
}

