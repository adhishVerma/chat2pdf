import React, { Suspense } from 'react'
import AuthForm from '@/components/auth/AuthForm'
import DemoCredentials from '@/components/demo/DemoCredentials'

const page = () => {
  return (
    // the root layout fixes the page height, so this page scrolls on its own
    <div className='h-full overflow-y-auto'>
      <div className='flex flex-col items-center gap-4 px-4 pb-10 pt-16 sm:pt-28'>
        <Suspense>
          <AuthForm mode='sign-in' />
        </Suspense>
        <DemoCredentials />
      </div>
    </div>
  )
}

export default page
