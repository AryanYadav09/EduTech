import React from 'react'
import { assets } from '../../assets/assets'
import SearchBar from './SearchBar'

const Hero = () => {
  return (
    <div className='section-shell modern-card flex flex-col items-center justify-center w-[95%] md:pt-36 md:pb-36 pt-20 pb-20 px-7 md:px-16 lg:px-24 space-y-7 text-center mt-8 bg-gradient-to-b from-blue-100/70 via-white to-cyan-50'>

      <h1 data-animate="heading" className='md:text-home-heading-large text-home-heading-small relative font-bold text-slate-900 max-w-3xl mx-auto'>
        Empower your future with the courses designed to
        <span className='text-cyan-700'> fit your choice.</span>
        <img src={assets.sketch} alt="sketch" className='md:block hidden absolute -bottom-7 right-0' />
      </h1>

      <p data-animate="text" className='md:block hidden animate-copy max-w-2xl mx-auto'>
        We bring together world-class instructors, interactive content, and a supportive community to help you achieve your personal and professional goals.
      </p>

      <p data-animate="text" className='md:hidden animate-copy max-w-sm mx-auto'>
        We bring together world-class instructors to help you achieve your professional goals.
      </p>
      <SearchBar/>

    </div>

  )
}

export default Hero
