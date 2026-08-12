import { useEffect, useState } from "react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageHeader from "../../components/PageHeader";
import Loading from "../../components/Loading";

import "../../styles/assignCourse.css";
import API_URL from "../../config/api";

function AssignCourse() {

    const [lecturers, setLecturers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [assignments, setAssignments] = useState([]);

    const [loading, setLoading] = useState(true);

    const [message, setMessage] = useState("");

    const [lecturer, setLecturer] = useState("");
    const [course, setCourse] = useState("");
    const [academicYear, setAcademicYear] = useState("2026/2027");
    const [semester, setSemester] = useState("First Semester");

    useEffect(() => {

        fetchData();

    }, []);

    const fetchData = async () => {

        try {

            const lecturerResponse =
                await fetch(`${API_URL}/api/users/lecturers`);

            const lecturerData =
                await lecturerResponse.json();

            setLecturers(lecturerData.lecturers);

            const courseResponse =
                await fetch(`${API_URL}/api/courses`);

            const courseData =
                await courseResponse.json();

            setCourses(courseData.courses);

            const assignmentResponse =
                await fetch(`${API_URL}/api/course-assignments`);

            const assignmentData =
                await assignmentResponse.json();

            setAssignments(
                assignmentData.assignments
            );

        } catch (error) {

            setMessage(error.message);

        }

        setLoading(false);

    };

    const assignCourse = async (e) => {

        e.preventDefault();

        try {

            const response = await fetch(
                `${API_URL}/api/course-assignments`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({

                        lecturer,

                        course,

                        academicYear,

                        semester,

                    }),

                }
            );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(data.message);

            }

            setMessage(data.message);

            setLecturer("");
            setCourse("");

            fetchData();

        } catch (error) {

            setMessage(error.message);

        }

    };

    if (loading) {

        return <Loading />;

    }

    return (

        <DashboardLayout
            title="Assign Courses"
            role="admin"
        >

            <PageHeader

                title="Assign Course"

                subtitle="Assign courses to lecturers"

            />

            {message && (

                <div className="success-message">

                    {message}

                </div>

            )}

            <form
                className="assign-form"
                onSubmit={assignCourse}
            >

                <label>

                    Lecturer

                </label>

                <select

                    value={lecturer}

                    onChange={(e) =>
                        setLecturer(e.target.value)
                    }

                    required
                >

                    <option value="">

                        Select Lecturer

                    </option>

                    {

                        lecturers.map((item) => (

                            <option
                                key={item._id}
                                value={item._id}
                            >

                                {item.name}
                                {" - "}
                                {item.staffId}

                            </option>

                        ))

                    }

                </select>

                <label>

                    Course

                </label>

                <select

                    value={course}

                    onChange={(e) =>
                        setCourse(e.target.value)
                    }

                    required
                >

                    <option value="">

                        Select Course

                    </option>

                    {

                        courses.map((item) => (

                            <option
                                key={item._id}
                                value={item._id}
                            >

                                {item.courseName}
                                {" ("}
                                {item.courseCode}
                                {")"}

                            </option>

                        ))

                    }

                </select>

                <label>

                    Academic Year

                </label>

                <input

                    value={academicYear}

                    onChange={(e)=>

                        setAcademicYear(
                            e.target.value
                        )

                    }

                />

                <label>

                    Semester

                </label>

                <select

                    value={semester}

                    onChange={(e)=>

                        setSemester(
                            e.target.value
                        )

                    }

                >

                    <option>

                        First Semester

                    </option>

                    <option>

                        Second Semester

                    </option>

                </select>

                <button>

                    Assign Course

                </button>

            </form>

            <div className="assignment-table">

                <table>

                    <thead>

                        <tr>

                            <th>

                                Lecturer

                            </th>

                            <th>

                                Staff ID

                            </th>

                            <th>

                                Course

                            </th>

                            <th>

                                Course Code

                            </th>

                            <th>

                                Academic Year

                            </th>

                            <th>

                                Semester

                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            assignments.map((item)=>(

                                <tr key={item._id}>

                                    <td>

                                        {item.lecturer?.name}

                                    </td>

                                    <td>

                                        {item.lecturer?.staffId}

                                    </td>

                                    <td>

                                        {item.course?.courseName}

                                    </td>

                                    <td>

                                        {item.course?.courseCode}

                                    </td>

                                    <td>

                                        {item.academicYear}

                                    </td>

                                    <td>

                                        {item.semester}

                                    </td>

                                </tr>

                            ))

                        }

                    </tbody>

                </table>

            </div>

        </DashboardLayout>

    );

}

export default AssignCourse;