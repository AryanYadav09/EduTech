import React, { useContext, useEffect, useMemo, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import { useParams } from 'react-router-dom';
import SearchBar from '../../components/student/SearchBar';
import CourseCard from '../../components/student/CourseCard';
import Footer from '../../components/student/Footer';
import { assets } from '../../assets/assets';

const CoursesList = () => {

  const {navigate, allCourses} = useContext(AppContext);
  const { input } = useParams();
  const [filteredCourse, setFilteredCourse] = useState([])
  const normalizedInput = useMemo(() => {
    if (!input) return '';
    try {
      return decodeURIComponent(input).trim();
    } catch {
      return input.trim();
    }
  }, [input]);

  useEffect(() => {
    if (!allCourses || allCourses.length === 0) {
      setFilteredCourse([]);
      return;
    }

    const tempCourses = allCourses.slice();

    if (!normalizedInput) {
      setFilteredCourse(tempCourses);
      return;
    }

    const lowerInput = normalizedInput.toLowerCase();
    setFilteredCourse(
      tempCourses.filter((item) => {
        const title = item.courseTitle?.toLowerCase() || '';
        const subtitle = item.courseSubtitle?.toLowerCase() || '';
        const educatorName = item.educator?.name?.toLowerCase() || '';
        return (
          title.includes(lowerInput) ||
          subtitle.includes(lowerInput) ||
          educatorName.includes(lowerInput)
        );
      })
    );
  }, [allCourses, normalizedInput])

  
  return (
    <>
    <div className='relative w-full px-4 sm:px-10 md:px-14 lg:px-36 pt-20 text-left'>
      <div className='flex md:flex-row flex-col gap-6 items-start justify-between w-full'>
        <div>
          <h1 data-animate="heading" className='text-4xl font-semibold text-slate-900'>Course List</h1>
          <p data-animate="text" className='animate-copy'>
            <span className='text-blue-600 cursor-pointer' onClick={() => navigate('/')}>Home</span> / <span>Course List</span>
          </p>
        </div>
        <SearchBar data={normalizedInput} />
      </div>
        {
          normalizedInput && <div data-animate="card" className='glass-surface inline-flex items-center gap-4 px-4 py-2 mt-8 mb-8 text-slate-600'>
            <p>{normalizedInput}</p>
            <img
              src={assets.cross_icon}
              alt=""
              className='cursor-pointer'
              onClick={() => navigate('/course-list')}
            />
          </div>
        }
        <div className="grid [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))] my-14 gap-5">
          {filteredCourse.map((course, index) =>
            <CourseCard key={index} course={course} />
          )}
        </div>
        {filteredCourse.length === 0 && (
          <p data-animate="text" className='animate-copy -mt-8 pb-12'>
            No courses found{normalizedInput ? ` for "${normalizedInput}"` : ''}.
          </p>
        )}
    </div>
    <Footer />
    </>
  )
}

export default CoursesList
