import React from 'react'
import { Button } from '../ui/button'

type Props = {
    name: string,
    selected: boolean,
    clickHandler : React.MouseEventHandler<HTMLButtonElement>
}

const ChatItem = (props: Props) => {

    return (
        <div className='w-full my-2'>
            <Button data-item-id={props.name} onClick={props.clickHandler} className='w-full flex justify-between' variant={props.selected ? 'default' : 'ghost'}>{props.name}</Button>
        </div>
    )
}

export default ChatItem