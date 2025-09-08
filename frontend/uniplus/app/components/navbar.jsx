import React from 'react'
import Link from 'next/link'

function navbar() {
  return (
    <nav className='bg-white text-black py-8 shadow-md'>
        <div className="container mx-auto">
            <div className= 'flex justify-between items-center'>
                <div className='text-2xl font-bold'>
                    <Link href="/">🎓UniPLUS</Link>
                </div>
                
                <ul className='flex space-x-10 text-base font-medium'>
                    <li>
                        <Link href="/" className='hover:underline'>Home</Link>
                    </li>
                    <li>
                        <Link href="/browse" className='hover:underline'>Events</Link>
                    </li>
                    <li>
                        <Link href="/about" className='hover:underline'>Page</Link>
                    </li>
                </ul>

                <ul className='flex space-x-1 text-base font-medium items-center'>
                    <li>
                        <Link href="/register" className='px-4 py-1 inline-block hover:underline text-gray-500'>Sign Up?</Link>
                    </li>
                    <li>
                        <a href='#' className='px-4 py-1 border-2 bg-black border-black text-white rounded-full inline-block font-semibold hover:bg-black hover:text-[#E9E9F4]'>
                            Sign In
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
  )
}
export default navbar