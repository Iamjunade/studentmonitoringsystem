import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Spinner from './Spinner';
import './StudentList.css'; // Assuming you have some CSS for styles

const StudentList = ({ students, isLoading, error }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredStudents, setFilteredStudents] = useState(students);

    useEffect(() => {
        setFilteredStudents(
            students.filter(student =>
                student.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [searchTerm, students]);

    const handleChange = (e) => {
        setSearchTerm(e.target.value);
    };

    return (
        <div className="student-list">
            <h1 className="heading" aria-label="Student List">Student List</h1>
            <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={handleChange}
                aria-label="Search students"
                className="search-input"
            />
            {isLoading && <Spinner />}
            {error && <div className="error-message" role="alert">{error}</div>}
            <ul>
                {filteredStudents.map(student => (
                    <li key={student.id} aria-label={`Student: ${student.name}`}> {student.name} </li>
                ))}
            </ul>
        </div>
    );
};

StudentList.propTypes = {
    students: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
    })).isRequired,
    isLoading: PropTypes.bool.isRequired,
    error: PropTypes.string,
};

export default StudentList;