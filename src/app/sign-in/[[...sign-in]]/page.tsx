import { SignIn } from '@clerk/nextjs'
import React from 'react'

const page = () => {
  return (
    <div className='flex mt-44 justify-center'><SignIn /></div>
  )
}

export default page