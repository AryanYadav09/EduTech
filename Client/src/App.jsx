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
import MyCourses from './pages/educator/MyCourses.jsx';
import StudentsEnrolled from './pages/educator/StudentsEnrolled.jsx';
import "quill/dist/quill.snow.css";
import { ToastContainer, toast } from 'react-toastify';

import Navbar from './components/student/Navbar.jsx';

const App = () => {

  const isEducatorRoute = useMatch('/educator/*')
 
  return (
    <div className='text-default min-h-screen bg-white'>
      <ToastContainer/>
      {!isEducatorRoute && <Navbar />}
      <Routes>
        {/* Student routes */}
        <Route path="/" element={<Home />} />
        <Route path="/course-list" element={<CoursesList />} />
        <Route path="/course/:id" element={<CourseDetail />} />
        <Route path="/payment/:courseId" element={<Payment />} />
        <Route path="/my-enrollments" element={<MyEnrollments />} />
        <Route path="/player/:courseId" element={<Player />} />
        <Route path="/loading/:path" element={<Loading />} />

        {/* Educator routes */}
        <Route path="/educator" element={<Educator />}>
          <Route index element={<Dashboard />} />
          <Route path="add-course" element={<AddCourse />} />
          <Route path="my-courses" element={<MyCourses />} />
          <Route path="student-enrolled" element={<StudentsEnrolled />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;
