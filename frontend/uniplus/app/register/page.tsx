import React from 'react'
import Link from 'next/link'

function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-[#E9E9F4]">
        <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
            <div className="bg-white rounded-2xl shadow-2xl flex-col w-170 max-w-4xl">
                <div className='py-15'>
                    <h2 className="text-4xl font-bold mb-5"> Register</h2>
                    <div className="flex flex-col items-center">
                        <div>
                            <label className='flex items-start text-xs px-2 py-2'>Username</label>
                            <div className='bg-gray-100 border-[0.5px] border-black w-130 p-2 flex items-center mb-5 rounded-full'>   
                                <input type='username' name='username' placeholder='Enter your username' className='bg-gray-100 outline-none text-sm w-130 px-3'></input>
                            </div>
                            <label className='flex items-start text-xs px-2 py-2'>Password</label>
                            <div className='bg-gray-100 border-[0.5px] border-black w-130 p-2 flex items-center mb-5 rounded-full'>
                                <input type='password' name='password' placeholder='Enter your password' className='bg-gray-100 outline-none text-smw-130 px-3'></input>
                            </div>
                            <label className='flex items-start text-xs px-2 py-2'>Confirm Passwowrd</label>
                            <div className='bg-gray-100 border-[0.5px] border-black w-130 p-2 flex items-center mb-5 rounded-full'>
                                <input type='password' name='password' placeholder='Confirm your password' className='bg-gray-100 outline-none text-sm w-130 px-3'></input>
                            </div>
                            <label className='flex items-start text-xs px-2 py-2'>Email</label>
                            <div className='bg-gray-100 border-[0.5px] border-black w-130 p-2 flex items-center mb-5 rounded-full'>
                                <input type='email' name='email' placeholder='Enter your email' className='bg-gray-100 outline-none text-sm w-130 px-3'></input>
                            </div>
                            <div className="flex justify-end w-130 py-5 gap-3">
                                <Link className='text-gray-500 hover:underline flex item-center text-xs py-3' href='/'> Cancel</Link>
                                <a href='#' className='border-2 bg-black border-black text-white rounded-full px-4 py-1 inline-block font-semibold hover:bg-black hover:text-[#E9E9F4]'>
                                Confirm
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
  )
}
export default RegisterPage