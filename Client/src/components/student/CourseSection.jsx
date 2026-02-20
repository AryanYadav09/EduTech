import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { AppContext } from '../../context/AppContext';
import CourseCard from './CourseCard';

const CourseSection = () => {
  const { allCourses } = useContext(AppContext);

  return (
      <div className='section-shell py-20 md:px-16 px-8'>
          <h2 data-animate="heading" className='text-3xl md:text-4xl font-semibold text-slate-900'>Learn from the best</h2>
          <p data-animate="text" className='text-sm md:text-base animate-copy mt-3'>Discover our top-rated courses across various categories. From coding and design to <br/>business and wellness, our courses are crafted to deliver results.</p>
         
         <div className='grid [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))] md:my-16 my-10 gap-5' >
            {allCourses?.slice(0, 4).map((course,index) => <CourseCard key={index} course={course} /> )}
         </div>
         
         
          <Link data-animate="button" to={'/course-list'} onClick={() => scrollTo(0, 0)} className='outline-btn inline-flex items-center'>
              Show all courses
          </Link>
      </div>
  )
}

export default CourseSection
