import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../../assets/assets'

const MyCourses = () => {
  const { currency, backendUrl, isEducator, getToken, navigate, fetchAllCourses } = useContext(AppContext)

  const [courses, setCourses] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [deletingCourseId, setDeletingCourseId] = useState(null)

  const fetchEducatorCourses = async () => {
    try {
      setIsLoading(true);
      const token = await getToken()
      const { data } = await axios.get(`${backendUrl}/api/educator/courses`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (data?.success) {
        setCourses(Array.isArray(data.courses) ? data.courses : [])
      } else {
        setCourses([])
        toast.error(data?.message || 'Failed to fetch courses')
      }
    } catch (error) {
      setCourses([])
      toast.error(error?.response?.data?.message || `Failed to fetch courses: ${error.message}`)
    } finally {
      setIsLoading(false);
    }
  }

  const handleDeleteCourse = async (courseId) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this course? This cannot be undone.');
    if (!isConfirmed) return;

    try {
      setDeletingCourseId(courseId);
      const token = await getToken();
      const { data } = await axios.delete(`${backendUrl}/api/educator/course/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (data?.success) {
        toast.success(data.message || 'Course deleted');
        setCourses((prev) => prev.filter((course) => course._id !== courseId));
        fetchAllCourses();
      } else {
        toast.error(data?.message || 'Failed to delete course');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setDeletingCourseId(null);
    }
  }

  useEffect(() => {
    if (isEducator) {
      fetchEducatorCourses()
    }
  }, [isEducator])

  return (
    <div className="min-h-screen flex flex-col items-start gap-8 md:p-8 p-4 pt-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">My Courses</h2>
        <p className='text-sm text-slate-500 mt-1'>
          {isLoading ? 'Refreshing courses...' : 'Manage only your uploaded courses here.'}
        </p>
      </div>

      <div className='w-full max-w-5xl'>
        <div data-animate="card" className="modern-card inline-flex items-center gap-3 px-5 py-4">
          <img src={assets.appointments_icon} alt="courses" />
          <div>
            <p className='text-2xl font-semibold text-slate-800'>{courses.length}</p>
            <p className='text-sm text-slate-500'>Total Uploaded Courses</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl">
        <h3 className="pb-4 text-lg font-medium text-slate-900">Course List</h3>
        <div data-animate="card" className="modern-card flex flex-col items-center w-full overflow-hidden bg-white">
          <table className="md:table-auto table-fixed w-full overflow-hidden">
            <thead className="text-gray-900 border-b border-gray-500/20 text-sm text-left">
              <tr>
                <th className="px-4 py-3 font-semibold truncate">All Courses</th>
                <th className="px-4 py-3 font-semibold truncate">Earnings</th>
                <th className="px-4 py-3 font-semibold truncate">Students</th>
                <th className="px-4 py-3 font-semibold truncate">Published On</th>
                <th className="px-4 py-3 font-semibold truncate">Actions</th>
              </tr>
            </thead>

            <tbody className="text-sm text-gray-500">
              {courses.length === 0 && (
                <tr>
                  <td colSpan={5} className='px-4 py-10 text-center'>
                    <p className='text-slate-700 font-medium'>No courses published yet.</p>
                    <p className='text-slate-500 text-sm mt-1'>Create your first course to unlock student and earnings analytics.</p>
                    <button
                      onClick={() => navigate('/educator/add-course')}
                      className='modern-btn mt-4 px-5 py-2 text-white'
                    >
                      Add New Course
                    </button>
                  </td>
                </tr>
              )}

              {courses.map((course) => {
                const students = course.enrolledStudents?.length || 0;
                const revenue = students * ((Number(course.coursePrice) || 0) - ((Number(course.discount) || 0) * (Number(course.coursePrice) || 0)) / 100);

                return (
                  <tr key={course._id} className="border-b border-gray-500/20">
                    <td className="md:px-4 pl-2 md:pl-4 py-3">
                      <div className='flex items-center space-x-3'>
                        <img src={course.courseThumbnail} alt="Course" className="w-16 h-12 object-cover rounded" />
                        <span className="truncate hidden md:block">{course.courseTitle}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{currency}{revenue.toFixed(2)}</td>
                    <td className="px-4 py-3">{students}</td>
                    <td className="px-4 py-3">{new Date(course.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className='flex items-center gap-2'>
                        <button
                          onClick={() => navigate(`/educator/edit-course/${course._id}`)}
                          className='outline-btn px-3 py-1 rounded text-blue-700 hover:bg-blue-100'
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course._id)}
                          disabled={deletingCourseId === course._id}
                          className='px-3 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300'
                        >
                          {deletingCourseId === course._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  )
}

export default MyCourses
