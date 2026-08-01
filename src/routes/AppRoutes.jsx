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
import ScanQR from "../pages/student/scanQR";


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
    </Routes>
  );
}

export default AppRoutes; 



