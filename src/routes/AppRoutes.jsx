import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import VerifyOTP from "../pages/VerifyOTP";

import ProtectedRoute from "../components/ProtectedRoute";
import StudentDashboard from "../pages/student/Dashboard";
import LecturerDashboard from "../pages/lecturer/Dashboard";
import AdminDashboard from "../pages/admin/Dashboard";
import StartAttendance from "../pages/lecturer/StartAttendance";
import MyCourses from "../pages/lecturer/MyCourses";
import Courses from "../pages/admin/Courses";
import AssignCourse from "../pages/admin/AssignCourse";
import ScanQR from "../pages/student/ScanQR";
import AttendanceHistory from "../pages/lecturer/AttendanceHistory";
import AttendanceDetails from "../pages/lecturer/AttendanceDetails";
import ForgotPassword from "../pages/auth/ForgotPassword";
import Loading from "../components/Loading";
import Students from "../pages/admin/Students";
import Lecturers from "../pages/admin/Lecturers";
import Reports from "../pages/admin/Reports";
import Attendance from "../pages/student/Attendance";
import Profile from "../pages/student/Profile";
import LecturerProfile from "../pages/lecturer/Profile";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/lecturer/start-attendance"
        element={
          <ProtectedRoute>
            <StartAttendance />
          </ProtectedRoute>
        }
      />

      <Route
        path="/lecturer/dashboard"
        element={
          <ProtectedRoute>
            <LecturerDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/courses"
        element={
          <ProtectedRoute>
            <Courses />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/assign-course"
        element={
          <ProtectedRoute>
            <AssignCourse />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/scan"
        element={
          <ProtectedRoute>
            <ScanQR />
          </ProtectedRoute>
        }
      />
      <Route
    path="/lecturer/attendance"
    element={
        <ProtectedRoute>
            <AttendanceHistory />
        </ProtectedRoute>
    }
/>
      <Route
    path="/lecturer/attendance/:sessionId"
    element={
        <ProtectedRoute>
            <AttendanceDetails />
        </ProtectedRoute>
    }
/>
      
      <Route
    path="/forgot-password"
    element={<ForgotPassword />}
/>

<Route
    path="/admin/students"
    element={
        <ProtectedRoute>
            <Students />
        </ProtectedRoute>
    }
/>

<Route
      path="/admin/lecturers"
      element={<Lecturers />}
    />

    <Route
  path="/admin/reports"
  element={<Reports />}
/>

<Route
  path="/student/history"
  element={<Attendance />}
/>
<Route
  path="/student/profile"
  element={<Profile />}
/>

<Route
  path="/lecturer/profile"
  element={<LecturerProfile />}
/>

    </Routes>
  );
}

export default AppRoutes; 



