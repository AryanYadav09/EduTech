import React from 'react';
import './index.css';
import { Routes, Route, useMatch } from 'react-router-dom';
import Home from './pages/student/Home.jsx';
import CoursesList from './pages/student/CoursesList.jsx';
import CourseDetail from './pages/student/CourseDetail.jsx';
import Payment from './pages/student/Payment.jsx';
import MyEnrollments from './pages/student/MyEnrollments.jsx';
import Player from './pages/student/Player.jsx';
import Loading from './components/student/Loading.jsx';
import Educator from './pages/educator/Educator.jsx';
import Dashboard from './pages/educator/Dashboard.jsx';
import AddCourse from './pages/educator/AddCourse.jsx';
import EditCourse from './pages/educator/EditCourse.jsx';
import MyCourses from './pages/educator/MyCourses.jsx';
import StudentsEnrolled from './pages/educator/StudentsEnrolled.jsx';
import "quill/dist/quill.snow.css";
import { ToastContainer } from 'react-toastify';
import useGsapAnimations from './hooks/useGsapAnimations.js';

import Navbar from './components/student/Navbar.jsx';

const App = () => {
  useGsapAnimations();

  const isEducatorRoute = useMatch('/educator/*')
 
  return (
    <div className='text-default min-h-screen bg-page text-slate-900 relative overflow-x-hidden'>
      <div className='pointer-events-none fixed inset-0 -z-10'>
        <div className='absolute -top-32 left-[-12%] h-96 w-96 rounded-full bg-[radial-gradient(circle,_rgba(96,165,250,0.45)_0%,_rgba(96,165,250,0)_72%)]' />
        <div className='absolute top-[26%] right-[-10%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,_rgba(45,212,191,0.35)_0%,_rgba(45,212,191,0)_72%)]' />
        <div className='absolute bottom-[-10%] left-[28%] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,_rgba(56,189,248,0.2)_0%,_rgba(56,189,248,0)_75%)]' />
      </div>
      <ToastContainer/>
      {!isEducatorRoute && <Navbar />}
      <Routes>
        {/* Student routes */}
        <Route path="/" element={<Home />} />
        <Route path="/course-list" element={<CoursesList />} />
        <Route path="/course-list/:input" element={<CoursesList />} />
        <Route path="/course/:id" element={<CourseDetail />} />
        <Route path="/payment/:courseId" element={<Payment />} />
        <Route path="/my-enrollments" element={<MyEnrollments />} />
        <Route path="/player/:courseId" element={<Player />} />
        <Route path="/loading/:path" element={<Loading />} />

        {/* Educator routes */}
        <Route path="/educator" element={<Educator />}>
          <Route index element={<Dashboard />} />
          <Route path="add-course" element={<AddCourse />} />
          <Route path="edit-course/:courseId" element={<EditCourse />} />
          <Route path="my-courses" element={<MyCourses />} />
          <Route path="student-enrolled" element={<StudentsEnrolled />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;
