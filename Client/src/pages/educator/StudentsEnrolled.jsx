import React, { useContext, useEffect, useMemo, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import { toast } from 'react-toastify'
import axios from 'axios'

const StudentsEnrolled = () => {
  const { backendUrl, getToken, isEducator, navigate } = useContext(AppContext)
  const [enrolledStudents, setEnrolledStudents] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchEnrolledStudents = async () => {
    try {
      setIsLoading(true);
      const token = await getToken()
      const { data } = await axios.get(`${backendUrl}/api/educator/enrolled-students`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (data?.success) {
        const list = Array.isArray(data.enrolledStudents) ? data.enrolledStudents.slice().reverse() : [];
        setEnrolledStudents(list)
      } else {
        setEnrolledStudents([]);
        toast.error(data?.message || 'Could not fetch enrolled students');
      }
    } catch (error) {
      setEnrolledStudents([]);
      toast.error(error?.response?.data?.message || error.message)
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isEducator) fetchEnrolledStudents()
  }, [isEducator])

  const analytics = useMemo(() => {
    const totalEnrollments = enrolledStudents.length;
    const uniqueStudents = new Set(enrolledStudents.map((item) => item.student?._id).filter(Boolean)).size;
    const coursesWithEnrollments = new Set(enrolledStudents.map((item) => item.courseTitle).filter(Boolean)).size;

    const latestEnrollmentDate = enrolledStudents.length > 0
      ? new Date(
        Math.max(
          ...enrolledStudents
            .map((item) => new Date(item.purchaseDate).getTime())
            .filter((value) => Number.isFinite(value))
        )
      )
      : null;

    return {
      totalEnrollments,
      uniqueStudents,
      coursesWithEnrollments,
      latestEnrollmentDate,
    };
  }, [enrolledStudents]);

  return (
    <div className="min-h-screen flex flex-col items-start gap-8 md:p-8 p-4 pt-8">
      <div>
        <h1 className='text-2xl font-semibold text-slate-900'>Students Enrolled</h1>
        <p className='text-sm text-slate-500 mt-1'>
          {isLoading ? 'Refreshing student analytics...' : 'Analytics and list of all student enrollments.'}
        </p>
      </div>

      <div className='grid sm:grid-cols-2 xl:grid-cols-4 gap-5 w-full max-w-5xl'>
        <div data-animate="card" className="modern-card flex items-center gap-3 p-4">
          <img src={assets.patients_icon} alt="enrollments" />
          <div>
            <p className='text-2xl font-semibold text-slate-800'>{analytics.totalEnrollments}</p>
            <p className='text-sm text-slate-500'>Total Enrollments</p>
          </div>
        </div>
        <div data-animate="card" className="modern-card flex items-center gap-3 p-4">
          <img src={assets.person_tick_icon} alt="students" />
          <div>
            <p className='text-2xl font-semibold text-slate-800'>{analytics.uniqueStudents}</p>
            <p className='text-sm text-slate-500'>Unique Students</p>
          </div>
        </div>
        <div data-animate="card" className="modern-card flex items-center gap-3 p-4">
          <img src={assets.my_course_icon} alt="courses" />
          <div>
            <p className='text-2xl font-semibold text-slate-800'>{analytics.coursesWithEnrollments}</p>
            <p className='text-sm text-slate-500'>Courses With Enrollments</p>
          </div>
        </div>
        <div data-animate="card" className="modern-card flex items-center gap-3 p-4">
          <img src={assets.time_clock_icon} alt="latest" />
          <div>
            <p className='text-base font-semibold text-slate-800'>
              {analytics.latestEnrollmentDate
                ? analytics.latestEnrollmentDate.toLocaleDateString()
                : 'N/A'}
            </p>
            <p className='text-sm text-slate-500'>Latest Enrollment</p>
          </div>
        </div>
      </div>

      <div data-animate="card" className="modern-card flex flex-col items-center max-w-5xl w-full overflow-hidden bg-white">
        <table className='table-fixed md:table-auto w-full overflow-hidden pb-4'>
          <thead className="text-slate-900 border-b border-slate-300/70 text-sm text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-center hidden sm:table-cell">#</th>
              <th className="px-4 py-3 font-semibold">Student Name</th>
              <th className="px-4 py-3 font-semibold">Course Title</th>
              <th className="px-4 py-3 font-semibold hidden sm:table-cell">Date</th>
            </tr>
          </thead>

          <tbody className='text-slate-600'>
            {enrolledStudents.length === 0 && (
              <tr>
                <td colSpan={4} className='px-4 py-10 text-center'>
                  <p className='text-slate-700 font-medium'>No students enrolled yet.</p>
                  <p className='text-sm text-slate-500 mt-1'>Upload and publish courses to start getting enrollments.</p>
                  <button
                    onClick={() => navigate('/educator/add-course')}
                    className='modern-btn mt-4 px-5 py-2 text-white'
                  >
                    Upload Course
                  </button>
                </td>
              </tr>
            )}
            {enrolledStudents.map((item, index) => (
              <tr key={`${item.student?._id || 'student'}-${index}`} className="border-b border-slate-200/80">
                <td className="px-4 py-3 text-center hidden sm:table-cell">{index + 1}</td>
                <td className="md:px-4 px-2 py-3">
                  <div className='flex items-center space-x-3'>
                    <img
                      src={item.student?.imageUrl || assets.user_icon}
                      alt="student"
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <span className="truncate">{item.student?.name || 'Learner'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 truncate">{item.courseTitle}</td>
                <td className="px-4 py-3 hidden sm:table-cell">{new Date(item.purchaseDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default StudentsEnrolled
