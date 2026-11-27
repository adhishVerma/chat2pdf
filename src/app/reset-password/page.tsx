import React, { Suspense } from 'react'
import ResetPasswordForm from '@/components/auth/ResetPasswordForm'

const page = () => {
  return (
    <div className='flex mt-44 justify-center px-4'>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}

export default page
