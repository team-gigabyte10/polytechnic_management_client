// Test script for attendance marking API
// This demonstrates the exact API call format requested

const testAttendanceMarking = async () => {
  const attendanceData = {
    "classScheduleId": 1,
    "date": "2024-01-15",
    "attendanceList": [
      {
        "studentId": 101,
        "status": "present"
      },
      {
        "studentId": 102,
        "status": "absent"
      },
      {
        "studentId": 103,
        "status": "late"
      }
    ]
  };

  try {
    console.log('Testing attendance marking API...');
    console.log('Request payload:', JSON.stringify(attendanceData, null, 2));
    
    // Make API call to mark attendance
    const response = await fetch('/api/attendance/mark', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(attendanceData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Success! Attendance marked:', result);
    
    return result;
  } catch (error) {
    console.error('Error marking attendance:', error);
    throw error;
  }
};

// Example usage in browser console or test environment
if (typeof window !== 'undefined') {
  // Browser environment
  window.testAttendanceMarking = testAttendanceMarking;
  console.log('Test function available as window.testAttendanceMarking()');
} else {
  // Node.js environment
  module.exports = { testAttendanceMarking };
}

// Example of how to use this in the React application:
/*
import { attendanceAPI } from './services/api';

const markAttendance = async () => {
  const payload = {
    classScheduleId: 1,
    date: "2024-01-15",
    attendanceList: [
      { studentId: 101, status: "present" },
      { studentId: 102, status: "absent" },
      { studentId: 103, status: "late" }
    ]
  };

  try {
    const response = await attendanceAPI.markAttendance(payload);
    console.log('Attendance marked successfully:', response.data);
  } catch (error) {
    console.error('Failed to mark attendance:', error);
  }
};
*/
