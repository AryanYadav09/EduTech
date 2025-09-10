// src/context/AppContext.jsx
import { createContext, useEffect, useState } from "react";
import humanizeDuration from "humanize-duration";
import { useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import axios from "axios";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
    // keep name backendUrl (camelCase) so other components using backendUrl work
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const currency = import.meta.env.VITE_CURRENCY || "₹";
    const navigate = useNavigate();

    const { getToken } = useAuth() || {};
    const { user } = useUser() || {};

    const [allCourses, setAllCourses] = useState([]);
    const [isEducator, setIsEducator] = useState(false);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [userData, setUserData] = useState(null);

    // Fetch all courses (public endpoint)
    const fetchAllCourses = async () => {
        try {
            const url = `${backendUrl}/api/course/all`;
            // debug helpful log
            // console.log("fetchAllCourses -> GET", url);
            const { data } = await axios.get(url);
            if (data?.success) {
                setAllCourses(data.courses || []);
            } else {
                toast.error(data?.message || "Could not fetch courses");
            }
        } catch (error) {
            console.error("fetchAllCourses error:", error?.response?.data ?? error.message);
            toast.error(error?.response?.data?.message || error.message || "Could not fetch courses");
        }
    };

    // FETCH USERDATA (protected)
    const fetchUserData = async () => {
        if (!user) return;
        try {
            // account for Clerk SDK differences in metadata property names
            const role = user?.publicMetadata?.role ?? user?.public_metadata?.role;
            if (role === "educator") setIsEducator(true);

            if (!getToken) {
                console.warn("getToken() not available yet from Clerk");
                return;
            }
            const token = await getToken();
            if (!token) {
                console.warn("No token returned from getToken()");
                return;
            }

            const url = `${backendUrl}/api/user/data`;
            const { data } = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (data?.success) {
                setUserData(data.user || null);
            } else {
                toast.error(data?.message || "Could not fetch user data");
            }
        } catch (error) {
            console.error("fetchUserData error:", error?.response?.data ?? error.message);
            toast.error(error?.response?.data?.message || error.message || "Could not fetch user data");
        }
    };

    // Function to Calculate Course Chapter Time
    const calculateChapterTime = (chapter) => {
        if (!chapter || !Array.isArray(chapter.chapterContent)) return "0m";
        let time = 0;
        chapter.chapterContent.forEach((lecture) => {
            time += Number(lecture.lectureDuration) || 0;
        });
        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
    };

    // Function to calculate average rating of course
    const calculateRating = (course) => {
        if (!course || !Array.isArray(course.courseRatings) || course.courseRatings.length === 0) {
            return 0;
        }
        let totalRating = 0;
        course.courseRatings.forEach((r) => {
            totalRating += Number(r.rating) || 0;
        });
        // you can change rounding as needed
        return Math.round((totalRating / course.courseRatings.length) * 10) / 10;
    };

    // Function to Calculate Course Duration
    const calculateCourseDuration = (course) => {
        if (!course || !Array.isArray(course.courseContent)) return "0m";
        let time = 0;
        course.courseContent.forEach((chapter) =>
            chapter.chapterContent.forEach((lecture) => (time += Number(lecture.lectureDuration) || 0))
        );
        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
    };

    // Function calculate to No of Lectures in the course
    const calculateNoOfLectures = (course) => {
        if (!course || !Array.isArray(course.courseContent)) return 0;
        let totalLectures = 0;
        course.courseContent.forEach((chapter) => {
            if (Array.isArray(chapter.chapterContent)) totalLectures += chapter.chapterContent.length;
        });
        return totalLectures;
    };

    const fetchUserEnrolledCourses = async () => {
        try {
            if (!getToken) return;
            const token = await getToken();
            if (!token) return;
            const url = `${backendUrl}/api/user/enrolled-courses`;
            const { data } = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (data?.success) {
                setEnrolledCourses(Array.isArray(data.enrolledCourses) ? data.enrolledCourses.reverse() : []);
            } else {
                toast.error(data?.message || "Could not fetch enrolled courses");
            }
        } catch (error) {
            console.error("fetchUserEnrolledCourses error:", error?.response?.data ?? error.message);
            toast.error(error?.response?.data?.message || error.message || "Could not fetch enrolled courses");
        }
    };

    useEffect(() => {
        fetchAllCourses();
    }, []);

    useEffect(() => {
        if (user) {
            fetchUserData();
            fetchUserEnrolledCourses();
        }
    }, [user]);

    const value = {
        currency,
        allCourses,
        navigate,
        calculateRating,
        isEducator,
        setIsEducator,
        calculateCourseDuration,
        calculateNoOfLectures,
        calculateChapterTime,
        enrolledCourses,
        setEnrolledCourses,
        fetchUserEnrolledCourses,
        backendUrl, // <--- exported name matches usage elsewhere
        userData,
        fetchUserData,
        getToken,
        setUserData,
        fetchAllCourses,
    };

    return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};
