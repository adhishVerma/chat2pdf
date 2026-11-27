import React, { Suspense } from 'react'
import AuthForm from '@/components/auth/AuthForm'

const page = () => {
  return (
    <div className='flex mt-44 justify-center px-4'>
      <Suspense>
        <AuthForm mode='sign-in' />
      </Suspense>
    </div>
  )
}

export default page
