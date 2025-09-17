import React from 'react'
import Link from 'next/link'

function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-[#E9E9F4]">
        <main className="flex flex-col items-center justify-center w-full px-4 sm:px-10 text-center">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-14">
                <h2 className="text-4xl font-bold mb-5 text-black"> Login</h2>
                
                <div className="flex flex-col space-y-4">
                    {/* Username */}
                    <div className='flex flex-col'>
                        <label className='flex items-start text-xs p-2 text-black'>Username</label>
                        <div className='bg-gray-100 p-2 flex items-center mb-5 rounded-full'>   
                            <input type='username' name='username' placeholder='Enter your username' className='bg-gray-100 text-black outline-none text-sm w-full px-3'></input>
                        </div>
                    </div>

                    {/* Password */}
                    <div className='flex flex-col'>
                        <label className='flex items-start text-xs p-2 text-black'>Password</label>
                        <div className='bg-gray-100 p-2 flex items-center mb-5 rounded-full'>
                            <input type='password' name='password' placeholder='Enter your password' className='bg-gray-100 text-black outline-none text-sm w-full px-3'></input>
                        </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 pt-3">
                        <Link  href='/' className='text-gray-500 hover:underline flex item-center text-sm py-2'> Cancel</Link>
                        <a href="#" className="inline-flex items-center justify-center w-full px-4 py-1 text-base font-bold leading-6 text-white bg-indigo-400 border border-transparent rounded-full md:w-auto hover:bg-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400">
                            Login
                        </a>
                    </div>
                    
                    <hr className="h-px my-5 bg-gray-200 border-0"/>
                    <div className='text-black text-md'>
                        Don't have an account? <Link href="/register" className='underline text-indigo-400'>Sign Up</Link>
                    </div>
                </div>
            </div>
        </main>
    </div>
  )
}
export default LoginPage