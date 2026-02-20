import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import { useParams } from 'react-router-dom'
import humanizeDuration from 'humanize-duration'
import { assets } from '../../assets/assets'
import YouTube from 'react-youtube'
import Footer from '../../components/student/Footer'
import Rating from '../../components/student/Rating'
import Loading from '../../components/student/Loading'
import axios from 'axios'
import { toast } from 'react-toastify'

const getYoutubeVideoId = (url = '') => {
  try {
    if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1].split(/[?&]/)[0];
    }
    const parsedUrl = new URL(url);
    return parsedUrl.searchParams.get('v') || parsedUrl.pathname.split('/').pop();
  } catch {
    return url.split('/').pop()?.split(/[?&]/)[0] || '';
  }
};

const isYoutubeUrl = (url = '') => /(?:youtu\.be|youtube\.com)/i.test(url);

const Player = () => {
  const { enrolledCourses, calculateChapterTime, backendUrl, getToken, userData, fetchUserEnrolledCourses } = useContext(AppContext)
  const { courseId } = useParams()
  const [courseData, setCourseData] = useState(null)
  const [openSection, setOpenSection] = useState([])
  const [playerData, setPlayerData] = useState(null)
  const [progressData, setProgressData] = useState(null)
  const [initialRating, setInitialRating] = useState(0)

  const getCourseData = () => {
    const matchedCourse = enrolledCourses.find((course) => course._id === courseId)
    if (!matchedCourse) return

    setCourseData(matchedCourse)
    const myRating = matchedCourse.courseRatings?.find((item) => item.userId === userData?._id)?.rating || 0
    setInitialRating(myRating)
  }

  const toggleSection = (index) => {
    setOpenSection((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  useEffect(() => {
    if (enrolledCourses.length > 0) getCourseData()
  }, [courseId, enrolledCourses])

  const markLectureAsCompleted = async (currentCourseId, lectureId) => {
    try {
      const token = await getToken()
      const { data } = await axios.post(
        `${backendUrl}/api/user/update-course-progress`,
        { courseId: currentCourseId, lectureId },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        toast.success(data.message)
        getCourseProgress()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const getCourseProgress = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.post(
        `${backendUrl}/api/user/get-course-progress`,
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        setProgressData(data.progressData)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleRate = async (rating) => {
    try {
      const token = await getToken()
      const { data } = await axios.post(
        `${backendUrl}/api/user/add-rating`,
        { courseId, rating },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        toast.success(data.message)
        setInitialRating(rating)
        fetchUserEnrolledCourses()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (courseId) getCourseProgress()
  }, [courseId])

  return courseData ? (
    <>
      <div className='section-shell p-4 sm:p-10 flex flex-col-reverse md:grid md:grid-cols-2 gap-10 md:px-24'>
        <div className='text-gray-800'>
          <h2 data-animate="heading" className='text-xl font-semibold'>Course Structure</h2>

          <div className="pt-5">
            {courseData.courseContent.map((chapter, index) => (
              <div key={index} data-animate="card" className="modern-card bg-white mb-3">
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
                        <img
                          src={progressData && progressData.lectureCompleted.includes(lecture.lectureId) ? assets.blue_tick_icon : assets.play_icon}
                          alt="play"
                          className="w-4 h-4 mt-1"
                        />
                        <div className="flex items-center justify-between w-full text-gray-800 text-xs md:text-sm">
                          <p>{lecture.lectureTitle}</p>
                          <div className="flex gap-3 items-center">
                            {lecture.lectureUrl && (
                              <p
                                onClick={() => setPlayerData({ ...lecture, chapter: index + 1, lecture: i + 1 })}
                                className="text-blue-500 cursor-pointer"
                              >
                                Watch
                              </p>
                            )}
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

          <div className='flex items-center gap-2 py-3 mt-10'>
            <h1 className="text-xl font-bold">Rate this Course:</h1>
            <Rating initialRating={initialRating} onRate={handleRate} />
          </div>
        </div>

        <div className='md:mt-10 flex flex-col h-full'>
          {playerData ? (
            <div className="flex flex-col h-full modern-card p-3">
              {isYoutubeUrl(playerData.lectureUrl)
                ? (
                  <YouTube
                    videoId={getYoutubeVideoId(playerData.lectureUrl)}
                    iframeClassName="w-full h-[50vh] rounded-lg"
                  />
                ) : (
                  <video
                    src={playerData.lectureUrl}
                    controls
                    controlsList='nodownload'
                    className="w-full h-[50vh] rounded-lg bg-black"
                  />
                )
              }
              <div className='flex justify-between items-center mt-2'>
                <p>{playerData.chapter}.{playerData.lecture} {playerData.lectureTitle}</p>
                <button
                  data-animate="button"
                  onClick={() => markLectureAsCompleted(courseData._id, playerData.lectureId)}
                  className='outline-btn px-3 py-1 text-blue-600'
                >
                  {progressData && progressData.lectureCompleted.includes(playerData.lectureId) ? 'Completed' : 'Mark Complete'}
                </button>
              </div>
            </div>
          ) : (
            <img
              src={courseData.courseThumbnail}
              alt=""
              className="w-full h-[50vh] object-cover rounded-lg modern-card"
            />
          )}
        </div>
      </div>

      <Footer />
    </>
  ) : <Loading />
}

export default Player
