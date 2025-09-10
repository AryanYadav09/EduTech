import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/student/Loading'
import { assets } from '../../assets/assets'
import humanizeDuration from 'humanize-duration'
import Footer from '../../components/student/Footer'
import Youtube from 'react-youtube';
import axios from 'axios'
import { toast } from 'react-toastify'

const CourseDetails = () => {
  const { id } = useParams()
  const [courseData, setCourseData] = useState(null)
  const [openSection, setOpenSection] = useState({})
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false);
  const [playerData, setPlayerData] = useState(false);
  const { allCourses, calculateRating, calculateChapterTime, currency, calculateNoOfLectures, calculateCourseDuration, backendUrl, userData, getToken } = useContext(AppContext)
  const [loading, setLoading] = useState(true);

  const fetchCourseData = async () => {
   try {
    const {data} = await axios.get(backendUrl + '/api/course/' + id)
    if(data?.success){
      setCourseData(data.course)
    }else{
      toast.error(data?.message || 'Could not fetch course details')
    }
   } catch (error) {
    toast.error(error.message)
   }finally{
    setLoading(false);
   }
  }

  const enrollCourse = async () =>{
    try {
      if(!userData){
        return toast.error('Please login to enroll the course')
      }
      if(isAlreadyEnrolled){
        return toast.warn('You are already enrolled in this course')
      }
      const token = await getToken()
      const {data} = await axios.post(backendUrl + '/api/course/purchase', { courseId: courseData._id }, { headers: { Authorization: `Bearer ${token}` } })
      if(data?.success){
        const {session_url} = data;
      window.location.replace(session_url);
        toast.success('Successfully enrolled in the course')
      }else{
        toast.error(data?.message || 'Could not enroll in the course')
      }

    } catch (error) {
      toast.error(error.message)  
    }
  }


  useEffect(() => {
     fetchCourseData()
  }, [])
  useEffect(() => {
     if(userData && courseData){
      setIsAlreadyEnrolled(userData.enrolledCourses.includes(courseData._id))
     }
  }, [userData, courseData])

  const toggleSection = (index) => {
    setOpenSection((prev) => ({ ...prev, [index]: !prev[index] }))
  }
  if (loading) return <Loading />
  if (!courseData) return <p>Course not found</p>;

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-cyan-100 via-white to-gray-200 pt-20">
      {/* page background gradient */}
      <div className="absolute top-0 left-0 w-full h-[50vh] -z-10 bg-gradient-to-b from-cyan-100 via-white to-gray-200" />

      {/* page container: same padding as your Navbar */}
      <div className="w-full px-4 sm:px-10 md:px-14 lg:px-36">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* LEFT: description & structure */}
          <div className="lg:col-span-7">
            <div className="text-gray-700">
              <h1 className="md:text-4xl text-2xl font-semibold text-gray-900">
                {courseData.courseTitle}
              </h1>

              <div
                className="pt-4 md:text-base text-sm text-gray-700"
                dangerouslySetInnerHTML={{ __html: courseData.courseDescription.slice(0, 200) }}
              />

              <div className="flex flex-wrap items-center gap-3 pt-3 pb-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{calculateRating(courseData)}</span>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <img
                        key={i}
                        src={i < Math.floor(calculateRating(courseData)) ? assets.star : assets.star_blank}
                        alt=""
                        className="w-4 h-4"
                      />
                    ))}
                  </div>
                </div>

                <div className="text-blue-600 text-sm">
                  ({courseData.courseRatings.length} {courseData.courseRatings.length > 1 ? 'ratings' : 'rating'})
                </div>

                <div className="text-sm">
                  ({courseData.enrolledStudents.length}) {courseData.enrolledStudents.length > 1 ? 'students' : 'student'}
                </div>
              </div>

              <p className="text-sm mt-1">
                Course by <span className="text-blue-600 underline">GreatStack</span>
              </p>
            </div>

            {/* Course Structure */}
            <div className="pt-10">
              <h2 className="text-xl font-semibold text-gray-900">Course Structure</h2>

              <div className="pt-5">
                {courseData.courseContent.map((chapter, index) => (
                  <div key={index} className="border border-gray-300 bg-white mb-3 rounded-lg shadow-sm">
                    <div
                      className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                      onClick={() => toggleSection(index)}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          className={`w-4 transform transition-transform ${openSection[index] ? 'rotate-180' : ''}`}
                          src={assets.down_arrow_icon}
                          alt="arrow"
                        />
                        <p className="font-medium md:text-base text-sm">{chapter.chapterTitle}</p>
                      </div>
                      <p className="text-sm text-gray-600">
                        {chapter.chapterContent.length} lectures - {calculateChapterTime(chapter)}
                      </p>
                    </div>

                    <div className={`overflow-hidden transition-all duration-300 ${openSection[index] ? 'max-h-96' : 'max-h-0'}`}>
                      <ul className="list-disc md:pl-10 pl-4 pr-4 py-2 text-gray-600 border-t border-gray-300">
                        {chapter.chapterContent.map((lecture, i) => (
                          <li key={i} className="flex items-start gap-2 py-1">
                            <img src={assets.play_icon} alt="play" className="w-4 h-4 mt-1" />
                            <div className="flex items-center justify-between w-full text-gray-800 text-xs md:text-sm"> 
                              <p>{lecture.lectureTitle}
                                  
                              </p>
                              <div className="flex gap-3 items-center">
                                {lecture.isPreviewFree && <p
                                  onClick={() => setPlayerData({ videoId: lecture.lectureUrl.split('/').pop()
                                  })}
                                className="text-blue-500 cursor-pointer">Preview</p>}
                                <p className="text-gray-600">
                                  {humanizeDuration(lecture.lectureDuration * 60 * 1000, { units: ['h', 'm'] })}
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* full description */}
            <div className="pt-14">
              <h3 className="text-xl font-semibold text-gray-900">Course Description</h3>
              <div
                className="pt-3 rich-text leading-relaxed text-gray-700 max-w-[760px]"
                dangerouslySetInnerHTML={{ __html: courseData.courseDescription }}
              />
            </div>
          </div>

          {/* RIGHT: Thumbnail Card */}
          <div className="lg:col-span-5 flex justify-end">
            <div className="w-full max-w-[420px] flex-shrink-0">
              <div className="sticky top-16">
                {/* Card */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  {/* Thumbnail with overlay content */}
                  <div className="relative">
                    {
                      playerData ?
                        <Youtube videoId={playerData.videoId} opts={{
                          playerVars: {
                            autoplay: 1,
                          }
                        }} iframeClassName='w-full aspect-video' />
                        : <img
                          src={courseData.courseThumbnail}
                          alt="Course Thumbnail"
                          className="w-full h-52 object-cover"
                        />
                    }

                    
                  </div>

                  {/* Bottom details */}
                  <div className="px-6 py-5">
                    <div className="flex items-center gap-2 text-sm text-red-500 mb-2">

                   <img className="w-4" src={assets.time_left_clock_icon} alt="clock" />
                        
                      <span>
                        <span className="font-medium">5 days</span> left at this price!
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <p className="text-gray-800 text-2xl md:text-3xl font-bold">
                        {currency}
                        {(courseData.coursePrice - courseData.discount * courseData.coursePrice / 100).toFixed(2)}
                      </p>
                      <p className="text-gray-500 line-through text-lg">
                        {currency}{courseData.coursePrice}
                      </p>
                      <p className="text-gray-500 text-lg">{courseData.discount}% off</p>
                    </div>

                    <div className='flex items-center text-sm md:text-default gap-4 pt-2 md:pt-4 text-gray-500'>
                      <div className='flex items-center gap-1'>
                        <img src={assets.star} alt="star icon" />
                        <p>{calculateRating(courseData)}</p>
                      </div>
                      <div className='h-4 w-px bg-gray-500/40'></div>
                      <div className='flex items-center gap-1'>
                        <img src={assets.time_clock_icon} alt="clock icon" />
                        <p>{calculateCourseDuration(courseData)}</p>
                      </div>
                      <div className='h-4 w-px bg-gray-500/40'></div>
                      <div className='flex items-center gap-1'>
                        <img src={assets.lesson_icon} alt="clock icon" />
                        <p>{calculateNoOfLectures(courseData)} lessons</p>
                      </div>
                    </div>


                    <button onClick={enrollCourse} className='md:mt-6 mt-4 w-full py-3 rounded bg-blue-600 text-white font-medium'>
                      {isAlreadyEnrolled ? 'Already Enrolled' : 'Enroll Now'}
                    </button>

                    <div className='pt-6'>
                      <p className='md:text-xl text-lg font-medium text-gray-800'>what's in the course?</p>
                      <ul className='ml-4 pt-2 text-sm md:text-default list-disc text-gray-500'>
                        <li>Lifetime access with free updates.</li>
                        <li>Step-by-step, hands-on project guidance.</li>
                        <li>Downloadable resources and source code.</li>
                        <li>Quizzes to test your knowledge.</li>
                        <li>Certificate of completion.</li>
                      </ul>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>

        </div> {/* grid */}
      </div> {/* container */}
      <Footer/>
    </div>
  )
}

export default CourseDetails
