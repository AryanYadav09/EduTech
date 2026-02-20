import React, { useContext, useEffect, useMemo, useState } from 'react'
import { AppContext } from '../../context/AppContext';
import { Line } from 'rc-progress'
import Footer from '../../components/student/Footer';
import { toast } from 'react-toastify';
import axios from 'axios';

const getCourseMinutes = (course) => {
  if (!course || !Array.isArray(course.courseContent)) return 0;
  return course.courseContent.reduce((chapterSum, chapter) => {
    const chapterMinutes = Array.isArray(chapter.chapterContent)
      ? chapter.chapterContent.reduce((lectureSum, lecture) => lectureSum + (Number(lecture.lectureDuration) || 0), 0)
      : 0;
    return chapterSum + chapterMinutes;
  }, 0);
};

const getCompletedMinutes = (course, completedLectureIds) => {
  if (!course || !Array.isArray(course.courseContent) || !completedLectureIds?.size) return 0;

  let total = 0;
  course.courseContent.forEach((chapter) => {
    if (!Array.isArray(chapter.chapterContent)) return;
    chapter.chapterContent.forEach((lecture) => {
      if (completedLectureIds.has(lecture.lectureId)) {
        total += Number(lecture.lectureDuration) || 0;
      }
    });
  });

  return total;
};

const MyEnrollments = () => {

  const {
    enrolledCourses,
    allCourses,
    calculateCourseDuration,
    navigate,
    fetchUserEnrolledCourses,
    backendUrl,
    getToken,
    calculateNoOfLectures,
    userData,
  } = useContext(AppContext);

  const [progressByCourse, setProgressByCourse] = useState({})
  const [isProgressLoading, setIsProgressLoading] = useState(false);

  const fallbackEnrolledCourses = useMemo(() => {
    if (!userData?.enrolledCourses?.length || !Array.isArray(allCourses) || allCourses.length === 0) {
      return [];
    }

    const enrolledIds = new Set(userData.enrolledCourses.map((id) => id.toString()));
    return allCourses.filter((course) => enrolledIds.has(course._id?.toString()));
  }, [allCourses, userData]);

  const coursesToDisplay = useMemo(
    () => (enrolledCourses.length > 0 ? enrolledCourses : fallbackEnrolledCourses),
    [enrolledCourses, fallbackEnrolledCourses]
  );

  useEffect(() => {
    if (userData) fetchUserEnrolledCourses()
  }, [userData])

  useEffect(() => {
    let isMounted = true;

    const getCourseProgress = async () => {
      if (!coursesToDisplay.length) {
        setProgressByCourse({});
        setIsProgressLoading(false);
        return;
      }

      try {
        setIsProgressLoading(true);
        const token = await getToken();
        if (!token) {
          if (isMounted) setProgressByCourse({});
          return;
        }

        const progressRequests = coursesToDisplay.map((course) =>
          axios.post(
            `${backendUrl}/api/user/get-course-progress`,
            { courseId: course._id },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        );

        const settledResults = await Promise.allSettled(progressRequests);
        const nextProgressByCourse = {};
        let hasFailedRequest = false;

        settledResults.forEach((result, index) => {
          const course = coursesToDisplay[index];
          const totalLectures = calculateNoOfLectures(course);
          const totalMinutes = getCourseMinutes(course);

          if (result.status !== 'fulfilled' || !result.value.data?.success) {
            hasFailedRequest = true;
            nextProgressByCourse[course._id] = {
              lectureCompleted: 0,
              totalLectures,
              percent: 0,
              completedMinutes: 0,
              totalMinutes,
            };
            return;
          }

          const lectureCompletedArray = Array.isArray(result.value.data.progressData?.lectureCompleted)
            ? result.value.data.progressData.lectureCompleted
            : [];
          const lectureCompleted = Math.min(lectureCompletedArray.length, totalLectures);
          const percent = totalLectures > 0
            ? Math.min(100, Math.round((lectureCompleted * 100) / totalLectures))
            : 0;
          const completedMinutes = getCompletedMinutes(course, new Set(lectureCompletedArray));

          nextProgressByCourse[course._id] = {
            lectureCompleted,
            totalLectures,
            percent,
            completedMinutes,
            totalMinutes,
          };
        });

        if (isMounted) {
          setProgressByCourse(nextProgressByCourse);
          if (hasFailedRequest) {
            toast.error('Some course progress data could not be loaded.');
          }
        }
      } catch (error) {
        if (isMounted) {
          toast.error(error?.response?.data?.message || error.message || 'Could not fetch progress');
        }
      } finally {
        if (isMounted) setIsProgressLoading(false);
      }
    };

    getCourseProgress();

    return () => {
      isMounted = false;
    };
  }, [coursesToDisplay, backendUrl, getToken, calculateNoOfLectures]);

  const analytics = useMemo(() => {
    let totalLectures = 0;
    let completedLectures = 0;
    let completedCourses = 0;
    let inProgressCourses = 0;
    let completedMinutes = 0;
    let totalMinutes = 0;

    coursesToDisplay.forEach((course) => {
      const progress = progressByCourse[course._id] || {
        lectureCompleted: 0,
        totalLectures: calculateNoOfLectures(course),
        percent: 0,
        completedMinutes: 0,
        totalMinutes: getCourseMinutes(course),
      };

      totalLectures += progress.totalLectures;
      completedLectures += progress.lectureCompleted;
      completedMinutes += progress.completedMinutes;
      totalMinutes += progress.totalMinutes;

      if (progress.totalLectures > 0 && progress.percent === 100) {
        completedCourses += 1;
      } else if (progress.lectureCompleted > 0) {
        inProgressCourses += 1;
      }
    });

    const overallProgress = totalLectures > 0 ? Math.round((completedLectures * 100) / totalLectures) : 0;

    return {
      totalCourses: coursesToDisplay.length,
      completedCourses,
      inProgressCourses,
      completedLectures,
      totalLectures,
      overallProgress,
      hoursLearned: (completedMinutes / 60).toFixed(1),
      totalCourseHours: (totalMinutes / 60).toFixed(1),
    };
  }, [coursesToDisplay, progressByCourse, calculateNoOfLectures]);

  return (
    <>
      <div className="section-shell md:px-24 px-8 pt-12">
        <h1 className="text-2xl font-semibold text-slate-900">My Enrollments</h1>
        <p className='animate-copy text-sm mt-2'>
          Track your progress and continue learning where you left off.
        </p>

        <div className='grid grid-cols-2 xl:grid-cols-4 gap-4 mt-8'>
          <div data-animate="card" className='modern-card px-4 py-4'>
            <p className='text-xs uppercase tracking-wide text-slate-500'>Total Courses</p>
            <p className='text-2xl font-semibold text-slate-900 mt-1'>{analytics.totalCourses}</p>
          </div>
          <div data-animate="card" className='modern-card px-4 py-4'>
            <p className='text-xs uppercase tracking-wide text-slate-500'>Overall Progress</p>
            <p className='text-2xl font-semibold text-slate-900 mt-1'>{analytics.overallProgress}%</p>
          </div>
          <div data-animate="card" className='modern-card px-4 py-4'>
            <p className='text-xs uppercase tracking-wide text-slate-500'>Completed Courses</p>
            <p className='text-2xl font-semibold text-slate-900 mt-1'>{analytics.completedCourses}</p>
          </div>
          <div data-animate="card" className='modern-card px-4 py-4'>
            <p className='text-xs uppercase tracking-wide text-slate-500'>Learning Hours</p>
            <p className='text-2xl font-semibold text-slate-900 mt-1'>{analytics.hoursLearned}h</p>
          </div>
        </div>

        {coursesToDisplay.length === 0 ? (
          <div data-animate="card" className='modern-card mt-8 px-6 py-8 text-center'>
            <p className='text-slate-700 font-medium'>No enrolled courses yet.</p>
            <p className='text-sm text-slate-500 mt-1'>Browse courses and start learning to see your analytics here.</p>
            <button data-animate="button" onClick={() => navigate('/course-list')} className='modern-btn mt-5 px-6 py-2 text-white'>
              Browse Courses
            </button>
          </div>
        ) : (
          <div data-animate="card" className="modern-card overflow-hidden mt-8">
            <table className="md:table-auto table-fixed w-full">
              <thead className="text-slate-900 border-b border-slate-300/60 text-sm text-left max-sm:hidden">
                <tr>
                  <th className="px-4 py-3 font-semibold truncate">Course</th>
                  <th className="px-4 py-3 font-semibold truncate">Duration</th>
                  <th className="px-4 py-3 font-semibold truncate">Progress</th>
                  <th className="px-4 py-3 font-semibold truncate">Completed</th>
                  <th className="px-4 py-3 font-semibold truncate">Status</th>
                </tr>
              </thead>
              <tbody className='text-slate-700'>
                {coursesToDisplay.map((course) => {
                  const progress = progressByCourse[course._id] || {
                    lectureCompleted: 0,
                    totalLectures: calculateNoOfLectures(course),
                    percent: 0,
                  };
                  const isCompleted = progress.totalLectures > 0 && progress.percent === 100;

                  return (
                    <tr key={course._id} className='border-b border-slate-300/50'>
                      <td className='md:px-4 pl-2 md:pl-4 py-3'>
                        <div className='flex items-center space-x-3'>
                          <img src={course.courseThumbnail} alt={course.courseTitle} className='w-14 sm:w-24 md:w-28 rounded-md object-cover' />
                          <div className='flex-1 min-w-0'>
                            <p className='mb-1 max-sm:text-sm font-medium truncate'>{course.courseTitle}</p>
                            <Line
                              strokeWidth={3}
                              percent={progress.percent}
                              strokeColor={isCompleted ? '#16a34a' : '#2563eb'}
                              trailColor='rgba(148,163,184,0.35)'
                              className="rounded-full"
                            />
                            <p className='text-xs text-slate-500 mt-1'>{isProgressLoading ? 'Updating progress...' : `${progress.percent}% complete`}</p>
                          </div>
                        </div>
                      </td>
                      <td className='px-4 py-3 max-sm:hidden'>{calculateCourseDuration(course)}</td>
                      <td className='px-4 py-3 max-sm:hidden font-medium'>{progress.percent}%</td>
                      <td className='px-4 py-3 max-sm:hidden'>
                        {progress.lectureCompleted} / {progress.totalLectures} lectures
                      </td>
                      <td className='px-4 py-3 max-sm:text-right'>
                        <button
                          onClick={() => navigate('/player/' + course._id)}
                          className={`px-3 sm:px-5 py-1.5 sm:py-2 max-sm:text-xs rounded-full text-white font-medium ${
                            isCompleted ? 'bg-emerald-600' : 'modern-btn'
                          }`}
                        >
                          {isCompleted ? 'Completed' : 'Continue'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {coursesToDisplay.length > 0 && (
          <p className='text-xs text-slate-500 mt-4'>
            Lectures completed: {analytics.completedLectures}/{analytics.totalLectures}. Total course hours: {analytics.totalCourseHours}h.
          </p>
        )}
      </div>
      <Footer />
    </>
  )
}

export default MyEnrollments
