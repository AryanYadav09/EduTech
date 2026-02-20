import React from 'react'
import { assets } from '../../assets/assets';
import { UserButton, useUser } from '@clerk/clerk-react'
import { Link } from 'react-router-dom';

const Navbar = () => {
  const { user } = useUser()

  return (
    <div className='sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 border-b border-slate-200/80 py-3 backdrop-blur-xl bg-white/80'>
      <Link to='/'>
        <img src={assets.logo} alt="Logo" className="w-28 lg:w-32" />
      </Link>
      <div className="flex items-center gap-5 text-slate-600 relative">
        <p>Hi! {user ? user.fullName : 'Developers'}</p>
        {user ? <UserButton /> : <img className='max-w-8' src={assets.profile_img} />}
      </div>
    </div>
  )
}

export default Navbar
