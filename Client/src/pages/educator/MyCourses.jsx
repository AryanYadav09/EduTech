import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/student/Loading'
import axios from 'axios'
import { toast } from 'react-toastify'

const MyCourses = () => {

  const { currency, backendUrl, isEducator, getToken, navigate, fetchAllCourses } = useContext(AppContext)

  const [courses, setCourses] = useState(null)
  const [deletingCourseId, setDeletingCourseId] = useState(null)

  const fetchEducatorCourses = async () => {
    // Simulate an API call
   try {
    const token = await getToken()
    const {data} = await axios.get(backendUrl + '/api/educator/courses', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    data.success && setCourses(data.courses)
   } catch (error) {
    toast.error("Failed to fetch courses" + error.message)
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

  useEffect(()=>{
    if(isEducator){

      fetchEducatorCourses()
    }
  },[isEducator ])

  return courses? (
    <div className="h-screen flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0">
      <div className="w-full">
        <h2 className="pb-4 text-lg font-medium">My Courses</h2>
        <div className="flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20">
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
              {courses.map((course) => (
                <tr key={course._id} className="border-b border-gray-500/20">
                  <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3 truncate">
                    <img src={course.courseThumbnail} alt="Course Image" className="w-16 h-12 object-cover rounded" />
                    <span className="truncate hidden md:block">{course.courseTitle}</span>
                  </td>
                  <td className="px-4 py-3">
                    {currency}{" "}
                    {Math.floor(
                      course.enrolledStudents.length *
                      (course.coursePrice - (course.discount * course.coursePrice) / 100)
                    )}
                  </td>
                  <td className="px-4 py-3">{course.enrolledStudents.length}</td>
                  <td className="px-4 py-3">
                    {new Date(course.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() => navigate(`/educator/edit-course/${course._id}`)}
                        className='px-3 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100'
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course._id)}
                        disabled={deletingCourseId === course._id}
                        className='px-3 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-70 disabled:cursor-not-allowed'
                      >
                        {deletingCourseId === course._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  ) : <Loading/>
}

export default MyCourses
