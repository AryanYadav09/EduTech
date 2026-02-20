import React, { useContext } from 'react'
import {assets} from '../../assets/assets'
import { AppContext } from '../../context/AppContext';
import { Link } from 'react-router-dom';

const CourseCard = ({course}) => {

  const {currency, calculateRating} = useContext(AppContext);

  return (
    <Link
      to={'/course/' + course._id}
      onClick={() => scrollTo(0, 0)}
      data-animate="card"
      className='modern-card pb-6 overflow-hidden h-full flex flex-col'
    >
      <img className='w-full h-44 object-cover transition-transform duration-500 hover:scale-105 flex-shrink-0' src={course.courseThumbnail} alt="" />
      <div className='p-3 text-left flex-1'>
        <h3 className='text-base font-semibold text-slate-900'>{course.courseTitle}</h3>
        <p className='text-slate-500'>{course.educator.name}</p>
        <div className='flex items-center space-x-2'>
          <p>{calculateRating(course)}</p>
          <div className='flex'>
            {[...Array(5)].map((_, i) => (
              <img
                key={i}
                src={i < Math.floor(calculateRating(course)) ? assets.star : assets.star_blank}
                alt=""
                className='w-3.5 h-3.5'
              />
            ))}
          </div>
          <p className='text-slate-500'>{course.courseRatings.length}</p>
        </div>
        <p className="text-base font-semibold text-slate-900">
          {currency}{(course.coursePrice - course.discount * course.coursePrice / 100).toFixed(2)}
        </p>
      </div>
    </Link>
  )
}

export default CourseCard
