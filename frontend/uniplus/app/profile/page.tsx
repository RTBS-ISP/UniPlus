// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import Navbar from "../components/navbar";
// import Image from 'next/image';

// interface UserProfile {
//   id: number;
//   username: string;
//   email: string;
//   first_name: string;
//   last_name: string;
//   phone_number: string;
//   role: string;
//   about_me: string;
//   profile_picture: string | null;
//   verification_status: string;
//   creation_date: string | null;
//   updated_date: string | null;
// }

// function ProfilePage() {
//   const [user, setUser] = useState<UserProfile | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [isEditing, setIsEditing] = useState(false);
//   const [editForm, setEditForm] = useState({
//     first_name: '',
//     last_name: '',
//     phone_number: '',
//     role: '',
//     about_me: ''
//   });
//   const router = useRouter();

//   // Fetch user profile on component mount
//   useEffect(() => {
//     fetchUserProfile();
//   }, []);

//   const fetchUserProfile = async () => {
//     try {
//       // Get CSRF token first
//       const csrfRes = await fetch("http://localhost:8000/api/set-csrf-token", {
//         method: "GET",
//         credentials: "include",
//       });

//       if (!csrfRes.ok) {
//         throw new Error("Failed to get CSRF token");
//       }

//       const csrfData = await csrfRes.json();

//       // Fetch user profile
//       const res = await fetch("http://localhost:8000/api/user/profile", {
//         method: "GET",
//         credentials: "include",
//         headers: {
//           "X-CSRFToken": csrfData.csrftoken,
//         },
//       });

//       if (res.status === 401) {
//         // User not authenticated, redirect to login
//         router.push('/login');
//         return;
//       }

//       if (!res.ok) {
//         throw new Error("Failed to fetch user profile");
//       }

//       const data = await res.json();
//       setUser(data);
      
//       // Initialize edit form with current user data
//       setEditForm({
//         first_name: data.first_name || '',
//         last_name: data.last_name || '',
//         phone_number: data.phone_number || '',
//         role: data.role || 'Attendee',
//         about_me: data.about_me || ''
//       });
//     } catch (err) {
//       console.error('Error fetching profile:', err);
//       setError(err instanceof Error ? err.message : "Failed to load profile");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEditToggle = () => {
//     setIsEditing(!isEditing);
//     if (!isEditing && user) {
//       // Reset form to current user data when starting to edit
//       setEditForm({
//         first_name: user.first_name || '',
//         last_name: user.last_name || '',
//         phone_number: user.phone_number || '',
//         role: user.role || 'Attendee',
//         about_me: user.about_me || ''
//       });
//     }
//   };

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setEditForm(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleSaveProfile = async () => {
//     try {
//       // Get CSRF token
//       const csrfRes = await fetch("http://localhost:8000/api/set-csrf-token", {
//         method: "GET",
//         credentials: "include",
//       });

//       if (!csrfRes.ok) {
//         throw new Error("Failed to get CSRF token");
//       }

//       const csrfData = await csrfRes.json();

//       // Update user profile
//       const res = await fetch("http://localhost:8000/api/user/profile", {
//         method: "PUT",
//         credentials: "include",
//         headers: {
//           "Content-Type": "application/json",
//           "X-CSRFToken": csrfData.csrftoken,
//         },
//         body: JSON.stringify(editForm),
//       });

//       if (!res.ok) {
//         throw new Error("Failed to update profile");
//       }

//       const updatedData = await res.json();
//       setUser(updatedData);
//       setIsEditing(false);
      
//       // Show success message (you can add a toast notification here)
//       console.log('Profile updated successfully');
//     } catch (err) {
//       console.error('Error updating profile:', err);
//       setError(err instanceof Error ? err.message : "Failed to update profile");
//     }
//   };

//   const handleLogout = async () => {
//     try {
//       // Get CSRF token
//       const csrfRes = await fetch("http://localhost:8000/api/set-csrf-token", {
//         method: "GET",
//         credentials: "include",
//       });

//       if (!csrfRes.ok) {
//         throw new Error("Failed to get CSRF token");
//       }

//       const csrfData = await csrfRes.json();

//       // Logout from Django backend
//       await fetch("http://localhost:8000/api/logout", {
//         method: "POST",
//         credentials: "include",
//         headers: {
//           "X-CSRFToken": csrfData.csrftoken,
//         },
//       });

//       // Redirect to login page
//       router.push('/login');
//     } catch (err) {
//       console.error('Error logging out:', err);
//     }
//   };

//   if (loading) {
//     return (
//       <main>
//         <Navbar />
//         <div className='flex items-center justify-center min-h-screen bg-[#E9E9F4]'>
//           <div className='text-xl'>Loading profile...</div>
//         </div>
//       </main>
//     );
//   }

//   if (error) {
//     return (
//       <main>
//         <Navbar />
//         <div className='flex items-center justify-center min-h-screen bg-[#E9E9F4]'>
//           <div className='text-xl text-red-500'>Error: {error}</div>
//         </div>
//       </main>
//     );
//   }

//   const displayName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username : 'User';
//   const displayRole = user?.role || 'Attendee';
//   const verificationBadge = user?.verification_status === 'verified' ? '✓' : '';

//   return (
//     <main>
//       <Navbar />
//       <div className='flex flex-col min-h-screen bg-[#E9E9F4]'>
//         <div className='flex flex-col w-full px-20 py-10 mb-6'>
//           <div className="bg-white rounded-2xl shadow-2xl flex justify-between p-6">
//             {/*Left Side*/}
//             <div className="flex flex-row gap-x-6">
//               <div className="relative">
//                 {user?.profile_picture ? (
//                   <img 
//                     src={`http://localhost:8000${user.profile_picture}`} 
//                     alt="Profile" 
//                     className='w-64 h-64 object-cover rounded-xl'
//                   />
//                 ) : (
//                   <Image 
//                     src="/images/logo.png" 
//                     alt="Default Profile" 
//                     width={256} 
//                     height={256} 
//                     className='rounded-xl'
//                   />
//                 )}
//               </div>
              
//               <div className="flex flex-col">
//                 {isEditing ? (
//                   <>
//                     <div className='flex gap-2 mb-2'>
//                       <input
//                         type="text"
//                         name="first_name"
//                         value={editForm.first_name}
//                         onChange={handleInputChange}
//                         placeholder="First Name"
//                         className='text-black font-bold text-2xl py-1 px-2 border rounded'
//                       />
//                       <input
//                         type="text"
//                         name="last_name"
//                         value={editForm.last_name}
//                         onChange={handleInputChange}
//                         placeholder="Last Name"
//                         className='text-black font-bold text-2xl py-1 px-2 border rounded'
//                       />
//                     </div>
//                     <input
//                       type="tel"
//                       name="phone_number"
//                       value={editForm.phone_number}
//                       onChange={handleInputChange}
//                       placeholder="Phone Number"
//                       className='text-gray-600 text-base py-1 px-2 mb-2 border rounded'
//                     />
//                     <select
//                       name="role"
//                       value={editForm.role}
//                       onChange={handleInputChange}
//                       className='text-gray-600 text-base py-1 px-2 mb-2 border rounded'
//                     >
//                       <option value="Attendee">Attendee</option>
//                       <option value="Student">Student</option>
//                       <option value="Instructor">Instructor</option>
//                       <option value="Admin">Admin</option>
//                     </select>
//                     <textarea
//                       name="about_me"
//                       value={editForm.about_me}
//                       onChange={handleInputChange}
//                       placeholder="About me..."
//                       rows={3}
//                       className='text-gray-600 text-sm py-1 px-2 mb-2 border rounded resize-none'
//                     />
//                   </>
//                 ) : (
//                   <>
//                     <div className='text-black font-extrabold text-4xl py-2 flex items-center gap-2'>
//                       {displayName}
//                       {verificationBadge && (
//                         <span className='text-green-500 text-2xl'>✓</span>
//                       )}
//                     </div>
//                     <div className='text-gray-500 text-base py-1'>
//                       @{user?.username}
//                     </div>
//                     <div className='text-gray-400 text-base py-1'>
//                       {user?.email}
//                     </div>
//                     {user?.phone_number && (
//                       <div className='text-gray-400 text-base py-1'>
//                         📱 {user.phone_number}
//                       </div>
//                     )}
//                     <div className='text-indigo-600 font-medium text-base py-1'>
//                       {displayRole}
//                     </div>
//                     {user?.about_me && (
//                       <div className='text-gray-600 text-sm py-2 max-w-md'>
//                         {user.about_me}
//                       </div>
//                     )}
//                     {user?.creation_date && (
//                       <div className='text-gray-400 text-xs py-1'>
//                         Member since {new Date(user.creation_date).toLocaleDateString()}
//                       </div>
//                     )}
//                   </>
//                 )}
                
//                 <div className="mt-4 flex gap-2">
//                   {isEditing ? (
//                     <>
//                       <button
//                         onClick={handleSaveProfile}
//                         className="px-5 py-2.5 font-medium bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm"
//                       >
//                         Save Changes
//                       </button>
//                       <button
//                         onClick={handleEditToggle}
//                         className="px-5 py-2.5 font-medium bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg text-sm"
//                       >
//                         Cancel
//                       </button>
//                     </>
//                   ) : (
//                     <>
//                       <button
//                         onClick={handleEditToggle}
//                         className="px-5 py-2.5 font-medium bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-600 text-indigo-500 rounded-lg text-sm"
//                       >
//                         Edit Profile
//                       </button>
//                       <button
//                         onClick={handleLogout}
//                         className="px-5 py-2.5 font-medium bg-red-50 hover:bg-red-100 hover:text-red-600 text-red-500 rounded-lg text-sm"
//                       >
//                         Logout
//                       </button>
//                     </>
//                   )}
//                 </div>
//               </div>
//             </div>
            
//             {/*Right Side*/}
//             <div className="grid grid-cols-3 gap-6 items-center px-6">
//               <div className="text-center bg-indigo-50 rounded-lg px-12 py-5 shadow">
//                 <div className="text-sm text-gray-500">Registered</div>
//                 <div className="text-2xl font-bold text-indigo-600">12</div>
//               </div>
//               <div className="text-center bg-indigo-50 rounded-lg px-12 py-5 shadow">
//                 <div className="text-sm text-gray-500">Finished</div>
//                 <div className="text-2xl font-bold text-indigo-600">8</div>
//               </div>
//               <div className="text-center bg-indigo-50 rounded-lg px-12 py-5 shadow">
//                 <div className="text-sm text-gray-500">Saved</div>
//                 <div className="text-2xl font-bold text-indigo-600">5</div>
//               </div>
//             </div>
//           </div>
//         </div>
        
//         <div className='flex flex-col w-full px-20 py-10'>
//           <div className="bg-white rounded-2xl shadow-2xl flex flex-row gap-x-4 p-6">
//             <div className='flex flex-row gap-x-8'>
//               <button className='text-xl text-black font-extrabold hover:text-indigo-600'>
//                 History
//               </button>
//               <button className='text-xl text-black font-extrabold hover:text-indigo-600'>
//                 Registered
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// }

// export default ProfilePage;

import React from 'react'
import Navbar from "../components/navbar";
import Image from 'next/image';

function ProfilePage() {
  return (
    <main>
        <Navbar />
        <div className='flex flex-col min-h-screen bg-[#E9E9F4]'>
            <div className='flex flex-col w-full px-20 py-10 mb-6'>
                <div className="bg-white rounded-2xl shadow-2xl flex justify-between p-6">
                    {/*Left Side*/}
                    <div className="flex flex-row gap-x-6">
                      <Image src="/images/logo.png" alt="logo" width={256} height={297} className='rounded-xl'/>
                      <div className="flex flex-col">
                        <div className='text-black font-extrabold text-4xl py-2'>
                            Peerapat Seenato
                        </div>
                        <div className='text-gray-400 text-base py-2'>
                            Software and Knowledge Engineering
                        </div>
                        <div className='text-gray-400 text-base py-2'>
                            Student
                        </div>
                        <div className="mt-4">
                          <a href="#_" className="px-5 py-2.5 font-medium bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-600 text-indigo-500 rounded-lg text-sm">
                              Edit Profile
                          </a>
                        </div>
                      </div>
                    </div>
                    

                    {/*Right Side*/}
                    <div className="grid grid-cols-3 gap-6 items-center px-6">
                      <div className="text-center bg-indigo-50 rounded-lg px-12 py-5 shadow">
                        <div className="text-sm text-gray-500">Registered</div>
                        <div className="text-2xl font-bold text-indigo-600">12</div>
                      </div>
                      <div className="text-center bg-indigo-50 rounded-lg px-12 py-5 shadow">
                        <div className="text-sm text-gray-500">Finished</div>
                        <div className="text-2xl font-bold text-indigo-600">8</div>
                      </div>
                      <div className="text-center bg-indigo-50 rounded-lg px-12 py-5 shadow">
                        <div className="text-sm text-gray-500">Saved</div>
                        <div className="text-2xl font-bold text-indigo-600">5</div>
                      </div>
                    </div>
                </div>
            </div>
            
            <div className='flex flex-col w-full px-20 py-10'>
                <div className="bg-white rounded-2xl shadow-2xl flex flex-row gap-x-4 p-6">
                    <div className='flex flex-row gap-x-8'>
                        <div className='text-xl text-black font-extrabold'>History</div>
                        <div className='text-xl text-black font-extrabold'>Registered</div>
                    </div>
                </div>
            </div>
        </div>
    </main>
    
  )
}
export default ProfilePage