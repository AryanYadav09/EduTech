import React from 'react'
import { assets } from '../../assets/assets'

const CallToAction = () => {
  return (
    <div className='section-shell modern-card flex flex-col items-center gap-4 pt-12 pb-16 px-8 md:px-12 mt-6'>
      <h1 data-animate="heading" className='text-xl md:text-4xl text-slate-900 font-semibold'>Learn anything, anytime, anywhere</h1>
      <p data-animate="text" className='animate-copy sm:text-sm'>Incididunt sint fugiat pariatur cupidatat consectetur sit cillum anim id veniam aliqua proident excepteur commodo do ea.</p>
      <div className='flex items-center font-medium gap-6 mt-4'>
        <button data-animate="button" className='modern-btn px-10 py-3'>Get started</button>
        <button data-animate="button" className='outline-btn flex items-center gap-2'>Learn more <img src={assets.arrow_icon} alt="arrow_icon" /></button>
      </div>
    </div>
  )
}

export default CallToAction
