import React from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../../assets/assets'

const quickLinks = [
  { label: 'Dashboard', to: '/educator' },
  { label: 'Add Course', to: '/educator/add-course' },
  { label: 'My Courses', to: '/educator/my-courses' },
  { label: 'Students', to: '/educator/student-enrolled' },
]

const socialLinks = [
  { icon: assets.facebook_icon, label: 'Facebook', href: 'https://facebook.com' },
  { icon: assets.twitter_icon, label: 'Twitter', href: 'https://x.com' },
  { icon: assets.instagram_icon, label: 'Instagram', href: 'https://instagram.com' },
]

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className='w-full px-4 md:px-8 pb-5'>
      <div data-animate="card" className='modern-card bg-white/75 px-5 md:px-7 py-5 text-slate-700'>
        <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-5'>
          <div className='flex items-center gap-4'>
            <img className='w-24' src={assets.logo} alt="EduTech logo" />
            <p className='text-xs sm:text-sm text-slate-500'>
              Built for educators who ship high-quality learning experiences.
            </p>
          </div>

          <div className='flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600'>
            {quickLinks.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className='transition-colors duration-200 hover:text-blue-600'
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className='flex items-center gap-3'>
            {socialLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target='_blank'
                rel='noreferrer'
                aria-label={item.label}
                className='h-9 w-9 rounded-full border border-slate-300/80 bg-white/70 flex items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:border-blue-400'
              >
                <img src={item.icon} alt={item.label} className='h-4 w-4' />
              </a>
            ))}
          </div>
        </div>

        <div className='mt-4 pt-4 border-t border-slate-300/70 text-xs sm:text-sm text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2'>
          <p>Copyright {year} (c) EduTech Educator. All rights reserved.</p>
          <p>v1 Dashboard UI</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
