// Test script to demonstrate attendance marking API
// This shows how to use the POST /api/attendance/mark endpoint

const testAttendanceMarking = async () => {
  const baseURL = 'http://localhost:3000/api';
  
  // Sample attendance data
  const attendanceData = {
    classId: 1,
    date: "2024-01-15",
    attendanceList: [
      { studentId: 1, status: "present" },
      { studentId: 2, status: "late" },
      { studentId: 3, status: "absent" }
    ]
  };

  try {
    console.log('Testing Attendance Marking API...');
    console.log('Request URL:', `${baseURL}/attendance/mark`);
    console.log('Request Method: POST');
    console.log('Request Body:', JSON.stringify(attendanceData, null, 2));
    
    const response = await fetch(`${baseURL}/attendance/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-jwt-token-here' // Replace with actual token
      },
      body: JSON.stringify(attendanceData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Success! Attendance marked successfully');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Error marking attendance');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
};

// Example of how to use the attendance system
console.log('=== Attendance Management System Demo ===\n');

console.log('1. Mark Attendance for a Class:');
console.log('   - Select Department: Computer Science');
console.log('   - Select Class: Data Structures - A101 (Monday)');
console.log('   - Select Date: 2024-01-15');
console.log('   - Mark students as Present/Absent/Late');
console.log('   - Click "Mark Attendance" button\n');

console.log('2. API Request Format:');
console.log('   POST http://localhost:3000/api/attendance/mark');
console.log('   Content-Type: application/json');
console.log('   Authorization: Bearer <token>\n');

console.log('3. Request Body:');
console.log(JSON.stringify({
  classId: 1,
  date: "2024-01-15",
  attendanceList: [
    { studentId: 1, status: "present" },
    { studentId: 2, status: "late" },
    { studentId: 3, status: "absent" }
  ]
}, null, 2));

console.log('\n4. Features Available:');
console.log('   ✅ Department-wise class filtering');
console.log('   ✅ Subject-wise class selection');
console.log('   ✅ Date-wise attendance marking');
console.log('   ✅ Individual student status marking');
console.log('   ✅ Bulk actions (All Present/Absent/Late)');
console.log('   ✅ Real-time attendance statistics');
console.log('   ✅ Attendance reports and analytics');
console.log('   ✅ Rewards and fines management');

// Uncomment the line below to run the actual test (requires server to be running)
// testAttendanceMarking();
