import { createContext, useEffect, useState } from "react";
import { dummyCourses } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import humanizeDuration from "humanize-duration";
import { useAuth, useUser } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import axios from "axios";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
    // This is where you can define any state or functions that you want to provide to the context

    const currency = import.meta.env.VITE_CURRENCY || '₹'; // Default to ₹ if not set in .env
    const navigate = useNavigate();

    const backendURL = import.meta.env.VITE_BACKEND_URL;

    const { getToken } = useAuth()
    const { user } = useUser()

    const [allCourses, setAllCourses] = useState([]);
    const [isEducator, setIsEducator] = useState(false);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [userData, setUserData] = useState(null)

    const fetchAllCourses = async () => {
        try {
            const { data } = await axios.get(backendURL + '/api/course/all')

            if(data?.success) {
                setAllCourses(data.courses)
            }else{
                toast.error(data?.message || 'Could not fetch courses' )
            }
            
        } catch (error) {
            toast.error(error.message)
            
        }
    }

    //FETCH USERDATA
    const fetchUserData = async ()=>{

        if(user.publicMetadata.role === 'educator'){
            setIsEducator(true)
        }

        try {
            const token = await getToken()
            const {data} = await axios.get(backendURL + '/api/user/data', {headers: {Authorization: `Bearer ${token}`}})
            if(data?.success){
                setUserData(data?.user)
            }else{
                toast.error(data?.message || 'Could not fetch user data' )
            }
        } catch (error) {
            toast.error(error.message)  
        }
    }


    // Function to Calculate Course Chapter Time
    const calculateChapterTime = (chapter) => {
        let time = 0
        chapter.chapterContent.map((lecture) => time += lecture.lectureDuration)
        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] })
    }

    // Function to calculate average rating of course
    const calculateRating = (course) => {
        if (course.courseRatings.length == 0) {
            return 0;
        }
        let totalRating = 0
        course.courseRatings.forEach(rating => {
            totalRating += rating.rating
        })
        return Math.floor(totalRating / course.courseRatings.length)
    }

    // Function to Calculate Course Duration
    const calculateCourseDuration = (course) => {
        let time = 0

        course.courseContent.map((chapter) => chapter.chapterContent.map(
            (lecture) => time += lecture.lectureDuration
        ))
        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] })
    }
    // Function calculate to No of Lectures in the course
    const calculateNoOfLectures = (course) => {
        let totalloctunes = 0;
        course.courseContent.forEach(chapter => {
            if (Array.isArray(chapter.chapterContent)) {
                totalloctunes += chapter.chapterContent.length;
            }
        });
        return totalloctunes;
    }

    const fetchUserEnrolledCourses = async () => {
        try {
            const token = await getToken()
            const {data} = await axios.get(backendURL + '/api/user/enrolled-courses', {headers: {Authorization: `Bearer ${token}`}})
            if(data?.success){
                setEnrolledCourses(data.enrolledCourses.reverse())
            }else{
                toast.error(data?.message || 'Could not fetch enrolled courses' )
            }
        } catch (error) {
            toast.error(error.message)
        }
    }


    useEffect(() => {
        fetchAllCourses();
       
    }, []);

  

    useEffect(() => {
        if (user) {
            
            fetchUserData()
            fetchUserEnrolledCourses()
        }
    }, [user])

    const value = {
        currency, allCourses, navigate, calculateRating, isEducator, setIsEducator, calculateCourseDuration, calculateNoOfLectures, calculateChapterTime, enrolledCourses, setEnrolledCourses, fetchUserEnrolledCourses, backendURL, userData, fetchUserData, getToken, setUserData, fetchAllCourses
    };
    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}


