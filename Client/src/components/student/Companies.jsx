import React from 'react'
import { assets } from '../../assets/assets'

const Companies = () => {
  return (
    <div className='pt-16 section-shell px-6'>
      <p data-animate="text" className='text-base animate-copy'>Trusted by learners from</p>
      <div className='flex flex-wrap items-center justify-center gap-4 md:gap-8 md:mt-10 mt-5'>
        {[assets.microsoft_logo, assets.walmart_logo, assets.accenture_logo, assets.adobe_logo, assets.paypal_logo].map((logo, index) => (
          <div key={index} data-animate="card" className='modern-card px-6 py-5 md:px-8 md:py-6 bg-white/70'>
            <img src={logo} alt="trusted-company" className='w-20 md:w-28' />
          </div>
        ))}
      </div>
    </div>
  )
}

export default Companies
