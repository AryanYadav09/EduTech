import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/student/Loading'
import { assets } from '../../assets/assets'
import humanizeDuration from 'humanize-duration'
import Footer from '../../components/student/Footer'
import Youtube from 'react-youtube';
import axios from 'axios'
import { toast } from 'react-toastify'
import Rating from '../../components/student/Rating'

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

const stripHtmlTags = (value = '') => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const CourseDetails = () => {
  const { id } = useParams()
  const [courseData, setCourseData] = useState(null)
  const [openSection, setOpenSection] = useState({})
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false);
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const {
    calculateRating,
    calculateChapterTime,
    currency,
    calculateNoOfLectures,
    calculateCourseDuration,
    backendUrl,
    userData,
    getToken,
    navigate,
    fetchAllCourses,
  } = useContext(AppContext)

  const fetchCourseData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/course/${id}`)
      if (data?.success) {
        setCourseData(data.course)
      } else {
        toast.error(data?.message || 'Could not fetch course details')
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    } finally {
      setLoading(false);
    }
  }

  const handleRateCourse = async (ratingValue) => {
    if (!userData) {
      toast.error('Please login to rate this course');
      return;
    }

    if (!isAlreadyEnrolled) {
      toast.error('You can rate this course after enrollment');
      return;
    }

    try {
      setIsSubmittingRating(true);
      setSelectedRating(ratingValue);
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/user/add-rating`,
        { courseId: id, rating: ratingValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data?.success) {
        toast.success(data.message || 'Rating updated');
        await Promise.all([fetchCourseData(), fetchAllCourses()]);
      } else {
        toast.error(data?.message || 'Could not submit rating');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleEnroll = async () => {
    if (!userData) {
      toast.error('Please login to enroll in this course');
      return;
    }

    if (isAlreadyEnrolled) {
      navigate(`/player/${courseData._id}`);
      return;
    }

    navigate(`/payment/${courseData._id}`);
  };

  useEffect(() => {
    fetchCourseData()
  }, [id])

  useEffect(() => {
    if (!userData || !courseData) return;
    const enrolled = userData.enrolledCourses?.some((courseId) => courseId.toString() === courseData._id);
    setIsAlreadyEnrolled(Boolean(enrolled));
  }, [userData, courseData])

  useEffect(() => {
    if (!userData || !courseData) return;
    const myRating = courseData.courseRatings?.find((item) => item.userId === userData._id)?.rating || 0;
    setSelectedRating(myRating);
  }, [userData, courseData]);

  const ratingSummary = useMemo(() => {
    if (!courseData) return { average: 0, count: 0 };
    return {
      average: calculateRating(courseData),
      count: courseData.courseRatings?.length || 0,
    };
  }, [courseData, calculateRating]);

  const introText = useMemo(() => {
    if (!courseData) return '';
    if (courseData.courseSubtitle?.trim()) return courseData.courseSubtitle.trim();
    if (courseData.courseAbout?.trim()) return courseData.courseAbout.trim();
    return stripHtmlTags(courseData.courseDescription || '').slice(0, 220);
  }, [courseData]);

  if (loading) return <Loading />
  if (!courseData) return <p className='pt-24 px-8'>Course not found</p>;

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-cyan-100 via-white to-gray-200 pt-20">
      <div className="absolute top-0 left-0 w-full h-[50vh] -z-10 bg-gradient-to-b from-cyan-100 via-white to-gray-200" />

      <div className="w-full px-4 sm:px-10 md:px-14 lg:px-36">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-7">
            <div className="text-gray-700">
              <h1 className="md:text-4xl text-2xl font-semibold text-gray-900">
                {courseData.courseTitle}
              </h1>

              {introText && (
                <p className="pt-4 md:text-base text-sm text-gray-700">
                  {introText}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-3 pb-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{ratingSummary.average}</span>
                  <Rating initialRating={ratingSummary.average} readonly className='text-sm' />
                </div>

                <div className="text-blue-600 text-sm">
                  ({ratingSummary.count} {ratingSummary.count > 1 ? 'ratings' : 'rating'})
                </div>

                <div className="text-sm">
                  ({courseData.enrolledStudents.length}) {courseData.enrolledStudents.length > 1 ? 'students' : 'student'}
                </div>
              </div>

              <p className="text-sm mt-1">
                Course by <span className="text-blue-600 underline">{courseData.educator?.name || 'Educator'}</span>
              </p>
            </div>

            <div className="pt-10">
              <h2 className="text-xl font-semibold text-gray-900">Course Structure</h2>

              <div className="pt-5">
                {courseData.courseContent.map((chapter, index) => (
                  <div key={chapter.chapterId || index} className="border border-gray-300 bg-white mb-3 rounded-lg shadow-sm">
                    <div
                      className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                      onClick={() => setOpenSection((prev) => ({ ...prev, [index]: !prev[index] }))}
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
                        {chapter.chapterContent.map((lecture, lectureIndex) => (
                          <li key={lecture.lectureId || lectureIndex} className="flex items-start gap-2 py-1">
                            <img src={assets.play_icon} alt="play" className="w-4 h-4 mt-1" />
                            <div className="flex items-center justify-between w-full text-gray-800 text-xs md:text-sm">
                              <p>{lecture.lectureTitle}</p>
                              <div className="flex gap-3 items-center">
                                {lecture.isPreviewFree && (
                                  <p
                                    onClick={() => setPlayerData({ videoId: getYoutubeVideoId(lecture.lectureUrl) })}
                                    className="text-blue-500 cursor-pointer"
                                  >
                                    Preview
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
            </div>

            {courseData.courseAbout && (
              <div className='pt-10'>
                <h3 className="text-xl font-semibold text-gray-900">About This Course</h3>
                <p className='pt-3 text-gray-700 leading-relaxed'>{courseData.courseAbout}</p>
              </div>
            )}

            {courseData.courseOutcomes?.length > 0 && (
              <div className='pt-10'>
                <h3 className="text-xl font-semibold text-gray-900">What You Will Learn</h3>
                <ul className='list-disc pl-5 pt-3 text-gray-700 space-y-1'>
                  {courseData.courseOutcomes.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {courseData.courseRequirements?.length > 0 && (
              <div className='pt-10'>
                <h3 className="text-xl font-semibold text-gray-900">Requirements</h3>
                <ul className='list-disc pl-5 pt-3 text-gray-700 space-y-1'>
                  {courseData.courseRequirements.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-12">
              <h3 className="text-xl font-semibold text-gray-900">Course Description</h3>
              <div
                className="pt-3 rich-text leading-relaxed text-gray-700 max-w-[760px]"
                dangerouslySetInnerHTML={{ __html: courseData.courseDescription }}
              />
            </div>

            <div className='pt-12 pb-8'>
              <h3 className='text-xl font-semibold text-gray-900'>Student Ratings</h3>

              <div className='flex items-center gap-3 pt-3'>
                <Rating initialRating={selectedRating} onRate={handleRateCourse} className='text-2xl' />
                <p className='text-sm text-gray-600'>
                  {isSubmittingRating ? 'Saving rating...' : (
                    isAlreadyEnrolled ? 'Click stars to rate or update your rating' : 'Enroll first to rate this course'
                  )}
                </p>
              </div>

              <div className='pt-5 space-y-3'>
                {(courseData.courseRatingDetails || []).length === 0 && (
                  <p className='text-sm text-gray-500'>No ratings yet.</p>
                )}

                {(courseData.courseRatingDetails || []).map((item, index) => (
                  <div key={`${item.userId}-${index}`} className='flex items-center justify-between bg-white border rounded-md px-4 py-3'>
                    <div className='flex items-center gap-3'>
                      {item.userImage
                        ? <img src={item.userImage} alt={item.userName} className='w-8 h-8 rounded-full object-cover' />
                        : <div className='w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center'>{item.userName.slice(0, 1)}</div>
                      }
                      <p className='text-sm text-gray-700'>{item.userName}</p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Rating initialRating={item.rating} readonly className='text-base' />
                      <span className='text-sm text-gray-600'>{item.rating}.0</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-end">
            <div className="w-full max-w-[420px] flex-shrink-0">
              <div className="sticky top-16">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="relative">
                    {playerData
                      ? (
                        <Youtube
                          videoId={playerData.videoId}
                          opts={{ playerVars: { autoplay: 1 } }}
                          iframeClassName='w-full aspect-video'
                        />
                      )
                      : (
                        <img
                          src={courseData.courseThumbnail}
                          alt="Course Thumbnail"
                          className="w-full h-52 object-cover"
                        />
                      )
                    }
                  </div>

                  <div className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <p className="text-gray-800 text-2xl md:text-3xl font-bold">
                        {currency}
                        {(courseData.coursePrice - (courseData.discount * courseData.coursePrice) / 100).toFixed(2)}
                      </p>
                      <p className="text-gray-500 line-through text-lg">
                        {currency}{courseData.coursePrice}
                      </p>
                      <p className="text-gray-500 text-lg">{courseData.discount}% off</p>
                    </div>

                    <div className='flex flex-wrap items-center text-sm gap-4 pt-4 text-gray-500'>
                      <div className='flex items-center gap-1'>
                        <img src={assets.star} alt="star icon" />
                        <p>{ratingSummary.average}</p>
                      </div>
                      <div className='h-4 w-px bg-gray-500/40'></div>
                      <div className='flex items-center gap-1'>
                        <img src={assets.time_clock_icon} alt="clock icon" />
                        <p>{calculateCourseDuration(courseData)}</p>
                      </div>
                      <div className='h-4 w-px bg-gray-500/40'></div>
                      <div className='flex items-center gap-1'>
                        <img src={assets.lesson_icon} alt="lesson icon" />
                        <p>{calculateNoOfLectures(courseData)} lessons</p>
                      </div>
                    </div>

                    <div className='text-sm text-gray-500 pt-4'>
                      <p>Level: <span className='text-gray-700'>{courseData.courseLevel || 'All Levels'}</span></p>
                      <p>Language: <span className='text-gray-700'>{courseData.courseLanguage || 'English'}</span></p>
                    </div>

                    <button onClick={handleEnroll} className='md:mt-6 mt-4 w-full py-3 rounded bg-blue-600 text-white font-medium'>
                      {isAlreadyEnrolled ? 'Go to Course' : 'Enroll Now'}
                    </button>

                    <div className='pt-6'>
                      <p className='md:text-xl text-lg font-medium text-gray-800'>What&apos;s in this course?</p>
                      {courseData.courseIncludes?.length > 0 ? (
                        <ul className='ml-4 pt-2 text-sm list-disc text-gray-500 space-y-1'>
                          {courseData.courseIncludes.map((item, index) => (
                            <li key={`${item}-${index}`}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className='pt-2 text-sm text-gray-500'>Course includes will be available soon.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default CourseDetails
