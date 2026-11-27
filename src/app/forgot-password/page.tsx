import React, { Suspense } from 'react'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'

const page = () => {
  return (
    <div className='flex mt-44 justify-center px-4'>
      <Suspense>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  )
}

export default page
