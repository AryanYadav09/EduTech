import React, { useContext, useEffect, useMemo, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'

const emptyDashboardData = {
  totalCourses: 0,
  totalEarnings: 0,
  enrolledStudentsData: [],
};

const Dashboard = () => {
  const { currency, backendUrl, getToken, isEducator, navigate } = useContext(AppContext)
  const [dashboardData, setDashboardData] = useState(emptyDashboardData)
  const [isLoading, setIsLoading] = useState(false)

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const token = await getToken()
      const { data } = await axios.get(`${backendUrl}/api/educator/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data?.success) {
        setDashboardData({
          totalCourses: Number(data.dashboardData?.totalCourses) || 0,
          totalEarnings: Number(data.dashboardData?.totalEarnings) || 0,
          enrolledStudentsData: Array.isArray(data.dashboardData?.enrolledStudentsData) ? data.dashboardData.enrolledStudentsData : [],
        })
      } else {
        setDashboardData(emptyDashboardData);
        toast.error(data?.message || 'Could not fetch dashboard data');
      }
    } catch (error) {
      setDashboardData(emptyDashboardData);
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isEducator) fetchDashboardData()
  }, [isEducator])

  const analytics = useMemo(() => {
    const totalEnrollments = dashboardData.enrolledStudentsData.length;
    const uniqueStudents = new Set(
      dashboardData.enrolledStudentsData
        .map((item) => item?.student?._id)
        .filter(Boolean)
    ).size;
    const averageEnrollments = dashboardData.totalCourses > 0
      ? (totalEnrollments / dashboardData.totalCourses).toFixed(1)
      : '0.0';

    return {
      totalEnrollments,
      uniqueStudents,
      averageEnrollments,
    };
  }, [dashboardData]);

  return (
    <div className='min-h-screen flex flex-col items-start gap-8 md:p-8 p-4 pt-8'>
      <div>
        <h1 className='text-2xl font-semibold text-slate-900'>Educator Dashboard</h1>
        <p className='text-sm text-slate-500 mt-1'>
          {isLoading ? 'Refreshing analytics...' : 'Overview of your courses, enrollments, and earnings.'}
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
          <img src={assets.appointments_icon} alt="courses" />
          <div>
            <p className='text-2xl font-semibold text-slate-800'>{dashboardData.totalCourses}</p>
            <p className='text-sm text-slate-500'>Total Courses</p>
          </div>
        </div>
        <div data-animate="card" className='modern-card flex items-center gap-3 p-4'>
          <img src={assets.earning_icon} alt="earnings" />
          <div>
            <p className='text-2xl font-semibold text-slate-800'>{currency}{dashboardData.totalEarnings.toFixed(2)}</p>
            <p className='text-sm text-slate-500'>Total Earnings</p>
          </div>
        </div>
        <div data-animate="card" className='modern-card flex items-center gap-3 p-4'>
          <img src={assets.person_tick_icon} alt="students" />
          <div>
            <p className='text-2xl font-semibold text-slate-800'>{analytics.uniqueStudents}</p>
            <p className='text-sm text-slate-500'>Unique Students</p>
          </div>
        </div>
      </div>

      <div className='grid sm:grid-cols-2 gap-5 w-full max-w-5xl'>
        <div data-animate="card" className='modern-card px-4 py-4'>
          <p className='text-xs uppercase tracking-wide text-slate-500'>Avg. Enrollments per Course</p>
          <p className='text-2xl font-semibold text-slate-900 mt-1'>{analytics.averageEnrollments}</p>
        </div>
        <div data-animate="card" className='modern-card px-4 py-4'>
          <p className='text-xs uppercase tracking-wide text-slate-500'>Earnings per Enrollment</p>
          <p className='text-2xl font-semibold text-slate-900 mt-1'>
            {currency}
            {analytics.totalEnrollments > 0
              ? (dashboardData.totalEarnings / analytics.totalEnrollments).toFixed(2)
              : '0.00'}
          </p>
        </div>
      </div>

      <div className='w-full max-w-5xl'>
        <h2 className="pb-4 text-lg font-medium text-slate-900">Latest Enrollments</h2>
        <div data-animate="card" className="modern-card flex flex-col items-center w-full overflow-hidden bg-white">
          <table className="table-fixed md:table-auto w-full overflow-hidden">
            <thead className="text-slate-900 border-b border-slate-300/70 text-sm text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-center hidden sm:table-cell">#</th>
                <th className="px-4 py-3 font-semibold">Student Name</th>
                <th className="px-4 py-3 font-semibold">Course Title</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-600">
              {dashboardData.enrolledStudentsData.length === 0 && (
                <tr>
                  <td colSpan={3} className='px-4 py-10 text-center'>
                    <p className='text-slate-700 font-medium'>No enrollments yet.</p>
                    <p className='text-slate-500 text-sm mt-1'>Publish a course and share it to start getting enrollments.</p>
                    <button
                      onClick={() => navigate('/educator/add-course')}
                      className='modern-btn mt-4 px-5 py-2 text-white'
                    >
                      Add New Course
                    </button>
                  </td>
                </tr>
              )}
              {dashboardData.enrolledStudentsData.map((item, index) => (
                <tr key={`${item.student?._id || 'student'}-${index}`} className="border-b border-slate-200/80">
                  <td className="px-4 py-3 text-center hidden sm:table-cell">{index + 1}</td>
                  <td className="md:px-4 px-2 py-3">
                    <div className='flex items-center space-x-3'>
                      <img
                        src={item.student?.imageUrl || assets.user_icon}
                        alt="Profile"
                        className="w-9 h-9 rounded-full object-cover"
                      />
                      <span className="truncate">{item.student?.name || 'Learner'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 truncate">{item.courseTitle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
