import React, { useEffect, useState } from 'react';
import './flnView.css';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import { url } from '../../config';

function FlnView() {
    const [grades, setGrades] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState('');
    const [day, setDay] = useState(1);
    const [jumpDay, setJumpDay] = useState('');
    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(false);

    const days = Array.from({ length: 60 }, (_, i) => i + 1);

    const getGrades = () => {
        axios.get(`${url}/api/fln/grades`)
            .then((res) => {
                setGrades(res.data);
                const storedGrade = localStorage.getItem("fln_grade");
                if (res.data.length > 0 && !storedGrade) {
                    setSelectedGrade(res.data[0]);
                } else if (storedGrade) {
                    setSelectedGrade(storedGrade);
                }
            })
            .catch((err) => toast.error("Error fetching grades: " + err.message));
    };

    const loadProgress = () => {
        return JSON.parse(localStorage.getItem("fln-progress")) || {};
    };

    const saveProgress = (data) => {
        localStorage.setItem("fln-progress", JSON.stringify(data));
    };

    const updateDayForGrade = (grade) => {
        const data = loadProgress();
        const today = new Date().toDateString();

        if (!data[grade]) {
            data[grade] = {
                currentDay: 1,
                lastUpdated: today
            };
        } else {
            const lastDate = new Date(data[grade].lastUpdated);
            const now = new Date(today);
            const diffInDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

            if (diffInDays > 0) {
                const newDay = Math.min(60, data[grade].currentDay + diffInDays);
                data[grade].currentDay = newDay;
                data[grade].lastUpdated = today;
            }
        }

        saveProgress(data);
        setDay(data[grade].currentDay);
        setJumpDay(String(data[grade].currentDay));
    };

    const getLessons = () => {
        if (!selectedGrade || !day) {
            toast.error("Please select a grade and day to fetch lessons.");
            return;
        }
        setLoading(true);
        axios.get(`${url}/api/fln`, {
            params: {
                grade: selectedGrade,
                day: day
            }
        })
            .then((res) => {
                setLesson(res.data);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
                toast.error("Failed to fetch lessons. Please reselect the grade and day, then try again.");
            });
    };

    const previousDay = () => {
        const data = loadProgress();
        const current = data[selectedGrade]?.currentDay || 1;
        if (current > 1) {
            data[selectedGrade].currentDay = current - 1;
            saveProgress(data);
            setDay(current - 1);
            setJumpDay(String(current - 1));
        }
    };

    const nextDay = () => {
        const data = loadProgress();
        const current = data[selectedGrade]?.currentDay || 1;
        if (current < 60) {
            data[selectedGrade].currentDay = current + 1;
            saveProgress(data);
            setDay(current + 1);
            setJumpDay(String(current + 1));
        }
    };

    const jumpToDay = (inputDay) => {
        const num = Number(inputDay);
        if (days.includes(num)) {
            const data = loadProgress();
            data[selectedGrade] = {
                currentDay: num,
                lastUpdated: new Date().toDateString()
            };
            saveProgress(data);
            setDay(num);
            setJumpDay(String(num));
        } else {
            toast.error('Please enter a valid day between 1 and 60');
        }
    };

    const handleJumpInput = (e) => {
        const val = Number(e.target.value);
        if (val >= 1 && val <= 60) {
            setJumpDay(e.target.value);
        } else {
            setJumpDay('');
        }
    };

    const exportExcel = () => {
        if (!selectedGrade) {
            toast.error("Please select a grade to download the Excel file.");
            return;
        }
        const downloadUrl = `${url}/api/fln/export-excel?grade=${encodeURIComponent(selectedGrade)}`;
        window.open(downloadUrl, '_blank');
    };

    useEffect(() => {
        getGrades();
    }, []);

    useEffect(() => {
        if (selectedGrade) {
            localStorage.setItem("fln_grade", selectedGrade);
            updateDayForGrade(selectedGrade);
        }
    }, [selectedGrade]);

    useEffect(() => {
        if (selectedGrade && day) {
            getLessons();
        }
    }, [selectedGrade, day]);

    const parsedJump = Number(jumpDay);
    const isValidJump = !isNaN(parsedJump) && parsedJump >= 1 && parsedJump <= 60;
    const effectiveDay = isValidJump ? parsedJump : day;

    return (
        <div id='nav-main'>
            <Toaster richColors position="top-center" />
            <div id='navbar'>
                <h2 id='nav-sik'>Sikshana Foundation</h2>
                <div id='nav-links'>
                    <a
                        href="https://sikshana.org/About/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none', color: 'white' }}
                    >
                        About Us
                    </a>
                </div>
            </div>

            <div id='sticky-header'>
                <div id='fln-book'>
                    <h1 style={{ color: '#0077cc' }}>📘 FLN Teacher Resources</h1>
                    <h5 id='fln-book-foundation'>(Foundational Literacy & Numeracy)</h5>

                    <div id='select-grade'>
                        <label htmlFor='grade-select'>Select grade:</label>
                        <select
                            id='grade-select'
                            value={selectedGrade}
                            onChange={(e) => setSelectedGrade(e.target.value)}
                            style={{ lineHeight: '50px' }}
                        >
                            <option value=''>Select Grade</option>
                            {grades.map((grade, index) => (
                                <option key={index} value={grade}>{grade}</option>
                            ))}
                        </select>

                        <div id='btn-group'>
                            <button onClick={previousDay} disabled={effectiveDay === 1} id='prev-btn'>← Previous Day</button>
                            <button onClick={nextDay} disabled={effectiveDay === 60} id='next-btn'>Next Day →</button>
                        </div>

                        <div id='jump-to'>
                            <label id='label-jump' htmlFor='jump-to'>Jump to:</label>
                            <input
                                type='number'
                                id='input-jump'
                                placeholder='  Enter day number ...'
                                value={jumpDay}
                                onChange={handleJumpInput}
                                required
                            />
                            <button
                                id='jump-btn'
                                onClick={() => jumpToDay(jumpDay)}
                                disabled={!days.includes(parsedJump)}
                            >
                                Go
                            </button>
                        </div>

                        <div id='download-btn'>
                            <button onClick={exportExcel} disabled={!selectedGrade} id='download'>⬇️ Download Excel</button>
                        </div>
                    </div>
                </div>
                <div style={{ width: '90%', marginLeft: '5%' }}><hr /></div>
            </div>

            <div id='content-container'>
                <div id='display-container' className='fade-slide-in'>
                    {loading ? (
                        <div style={{ color: 'black', padding: '20px' }}>Loading...</div>
                    ) : lesson ? (
                        <div id='display'>
                            <h3 style={{ marginTop: '10px', color: '#0077cc' }}>
                                Day {lesson.day} - {lesson.grade}
                            </h3>
                            <p><strong>Learning Outcome:</strong> {lesson.learning_outcome}</p>
                            <p><strong>Concept:</strong> {lesson.concept}</p>
                            <p><strong>Teaching Strategy:</strong> {lesson.teaching_strategy}</p>
                            <p><strong>Activity:</strong> {lesson.activity}</p>
                            <div>
                                <p><strong>Assessment Questions:</strong></p>
                                {lesson.assessment_questions?.map((value, index) => (
                                    <div key={index}><p>{index + 1}. {value}</p></div>
                                ))}
                                <p><strong>Practice Questions:</strong></p>
                                {lesson.practice_questions?.map((value, index) => (
                                    <div key={index}><p>{value}</p></div>
                                ))}
                                <p style={{ marginTop: '2%' }}><strong>Teacher Notes:</strong> {lesson.teacher_notes}</p>
                            </div>
                        </div>
                    ) : (
                        <div><p style={{ color: 'gray' }}>No lesson data available yet.</p></div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default FlnView;
