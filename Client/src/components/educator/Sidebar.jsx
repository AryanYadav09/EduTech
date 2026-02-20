import React, { useContext } from 'react'
import { AppContext } from '../../context/AppContext';
import { NavLink } from 'react-router-dom';
import { assets } from '../../assets/assets';

const Sidebar = () => {

  const {isEducator} = useContext(AppContext);

  const menuItems = [
    { name: 'Dashboard', path: '/educator', icon: assets.home_icon },
    { name: 'Add Course', path: '/educator/add-course', icon: assets.add_icon },
    { name: 'My Courses', path: '/educator/my-courses', icon: assets.my_course_icon },
    { name: 'Student Enrolled', path: '/educator/student-enrolled', icon: assets.person_tick_icon },
  ];

  return isEducator && (
    <div className='md:w-64 w-16 border-r min-h-screen text-base border-slate-200/70 py-2 flex flex-col backdrop-blur-md bg-white/60'>
      {menuItems.map((item) => (
        <NavLink to={item.path} key={item.name} end={item.path === '/educator'} 
          className={({ isActive }) => `flex items-center md:flex-row flex-col md:justify-start justify-center py-3.5 md:px-10 gap-3 transition-all duration-300 ${isActive ? 'bg-blue-100/80 border-r-[6px] border-blue-500/90 text-blue-700' : 'hover:bg-slate-100/90 border-r-[6px] border-transparent hover:border-slate-100/90 text-slate-600'}`}
        >
          <img src={item.icon} alt="" className="w-6 h-6" />
          <p className='md:block hidden text-center'>{item.name}</p>
        </NavLink>
      ))}
    </div>
  )
}

export default Sidebar
