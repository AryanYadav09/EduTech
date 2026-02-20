import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { assets } from '../../assets/assets'

const quickLinks = [
  { label: 'Home', to: '/' },
  { label: 'Courses', to: '/course-list' },
  { label: 'My Enrollments', to: '/my-enrollments' },
  { label: 'Educator Dashboard', to: '/educator' },
]

const legalLinks = [
  { label: 'Terms', to: '/course-list' },
  { label: 'Privacy', to: '/course-list' },
  { label: 'Support', to: '/course-list' },
]

const socialLinks = [
  { icon: assets.facebook_icon, label: 'Facebook', href: 'https://facebook.com' },
  { icon: assets.twitter_icon, label: 'Twitter', href: 'https://x.com' },
  { icon: assets.instagram_icon, label: 'Instagram', href: 'https://instagram.com' },
]

const Footer = () => {
  const [email, setEmail] = useState('');
  const year = new Date().getFullYear();

  const handleSubscribe = (e) => {
    e.preventDefault();
    const value = email.trim();

    if (!value) {
      toast.error('Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      toast.error('Enter a valid email address');
      return;
    }

    toast.success('Thanks for subscribing!');
    setEmail('');
  };

  return (
    <footer className='w-full px-4 sm:px-10 md:px-14 lg:px-36 mt-12 mb-6'>
      <div data-animate="card" className='modern-card relative overflow-hidden px-6 sm:px-8 md:px-10 py-10 text-slate-700'>
        <div className='pointer-events-none absolute -top-20 -left-16 h-56 w-56 rounded-full bg-sky-200/30 blur-3xl' />
        <div className='pointer-events-none absolute -bottom-20 right-0 h-56 w-56 rounded-full bg-cyan-200/20 blur-3xl' />

        <div className='relative grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-10'>
          <div className='xl:col-span-5'>
            <img src={assets.logo} alt="EduTech logo" className='w-32' />
            <p data-animate="text" className='mt-5 max-w-md text-sm md:text-[15px] leading-6 text-slate-600'>
              Learn in-demand skills from expert educators with practical lessons,
              clean learning paths, and a platform designed for consistent growth.
            </p>

            <div className='flex items-center gap-3 mt-6'>
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target='_blank'
                  rel='noreferrer'
                  aria-label={item.label}
                  className='h-10 w-10 rounded-full border border-slate-300/70 bg-white/70 flex items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:border-blue-400'
                >
                  <img src={item.icon} alt={item.label} className='h-4 w-4' />
                </a>
              ))}
            </div>
          </div>

          <div className='xl:col-span-3'>
            <h2 data-animate="heading" className='font-semibold text-slate-900 text-lg'>Quick links</h2>
            <div className='mt-4 flex flex-col gap-2 text-sm text-slate-600'>
              {quickLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className='w-fit transition-colors duration-200 hover:text-blue-600'
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className='xl:col-span-4'>
            <h2 data-animate="heading" className='font-semibold text-slate-900 text-lg'>Stay in the loop</h2>
            <p data-animate="text" className='mt-4 text-sm text-slate-600 leading-6'>
              Get product updates, learning tips, and new course alerts in your inbox.
            </p>
            <form onSubmit={handleSubscribe} className='mt-5 flex flex-col sm:flex-row items-start sm:items-center gap-3'>
              <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='Enter your email'
                className='w-full sm:flex-1 h-11 rounded-full border border-slate-300/80 bg-white/80 px-4 outline-none focus:ring-2 focus:ring-blue-300/60'
              />
              <button data-animate="button" type='submit' className='modern-btn h-11 px-6 text-white'>
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className='relative mt-10 pt-5 border-t border-slate-300/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-slate-500'>
          <p>Copyright {year} (c) EduTech. All rights reserved.</p>
          <div className='flex items-center gap-4'>
            {legalLinks.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className='transition-colors duration-200 hover:text-slate-700'
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
