import React from 'react'
import {dummyTestimonial} from '../../assets/assets'
import {assets }from '../../assets/assets'

const TestimonialsSection = () => {
  return (
    <div className='pb-16 section-shell px-8 md:px-16'>
      <h2 data-animate="heading" className='text-3xl md:text-4xl font-semibold text-slate-900'>Testimonials</h2>
      <p data-animate="text" className='md:text-base animate-copy mt-3'>Hear from our learners as they share their journeys of transformation, success, and how our <br /> platform has made a difference in their lives.</p>
      <div className='grid grid-cols-auto gap-8 mt-14' >
        {dummyTestimonial.map((testimonial, index) => (
          <div key={index} data-animate="card" className='modern-card text-sm text-left pb-6 overflow-hidden'>
            <div className='flex items-center gap-4 px-5 py-4 bg-slate-100/70'>
              <img className='h-12 w-12 rounded-full' src={testimonial.image} alt={testimonial.name} />
              <div>
                <h1 className='text-lg font-medium text-slate-900'>{testimonial.name}</h1>
                <p className='text-slate-700/80'>{testimonial.role}</p>
              </div>
              
            </div>
            <div className='p-5 pb-7'>
              <div className='flex gap-0.5'>
                {[...Array(5)].map((_, i) => (
                  <img
                    className='h-5'
                    key={i}
                    src={i < Math.floor(testimonial.rating) ? assets.star : assets.star_blank}
                    alt="star"
                  />
                ))}
              </div>
              <p className='animate-copy mt-5'>{testimonial.feedback}</p>
            </div>
            <a href="#" data-animate="button" className='outline-btn ml-5'>Read More</a>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TestimonialsSection
