# Students Management System

This document describes the Students functionality implemented in the Polytechnic Management System.

## Features

### 1. Student Data Form
- **Add New Student**: Form to insert new student records
- **Edit Student**: Update existing student information
- **Validation**: Form validation using Yup schema validation

### 2. Student Data Table
- **Display**: Shows all students in a responsive table
- **Actions**: Edit and Delete buttons for each student
- **Responsive**: Mobile-friendly design with horizontal scrolling

### 3. API Integration
- **GET**: Fetches students from `http://localhost:3000/api/students`
- **POST**: Creates new students with the exact API format you specified
- **PUT**: Updates existing students
- **DELETE**: Removes students

## API Format

### Create Student Request
```json
{
  "studentData": {
    "rollNumber": "CSE-2025-001",
    "departmentId": 1,
    "courseId": 1,
    "semester": 1,
    "admissionYear": 2025,
    "guardianName": "Guardian Name",
    "guardianPhone": "0123456789",
    "address": "Student Address"
  }
}
```

### Student Fields
- `rollNumber`: Unique student identifier (e.g., CSE-2025-001)
- `departmentId`: Department ID (numeric)
- `courseId`: Course ID (numeric)
- `semester`: Semester number (1-8)
- `admissionYear`: Year of admission (2020-2030)
- `guardianName`: Name of student's guardian
- `guardianPhone`: Guardian's contact number
- `address`: Student's residential address

## Form Validation Rules

- **Roll Number**: Required, must be unique
- **Department ID**: Required, must be a number
- **Course ID**: Required, must be a number
- **Semester**: Required, must be between 1-8
- **Admission Year**: Required, must be between 2020-2030
- **Guardian Name**: Required
- **Guardian Phone**: Required
- **Address**: Required

## Usage

### Adding a New Student
1. Navigate to `/students` in the application
2. Click "Add Student" button
3. Fill in all required fields
4. Click "Create Student" to save

### Editing a Student
1. Click the edit icon (pencil) next to any student in the table
2. Modify the fields as needed
3. Click "Update Student" to save changes

### Deleting a Student
1. Click the delete icon (trash) next to any student
2. Confirm deletion in the popup dialog

## Navigation

The Students page is accessible through:
- **Sidebar**: Click "Students" in the main navigation
- **URL**: Navigate directly to `/students`

## Permissions

- **Admin**: Full access (create, read, update, delete)
- **Teacher**: Read-only access (view students only)
- **Student**: No access

## Technical Details

- **Framework**: React with TypeScript
- **Form Handling**: React Hook Form with Yup validation
- **Styling**: Tailwind CSS with custom components
- **State Management**: React hooks (useState, useEffect)
- **API Client**: Axios with interceptors for authentication
- **Icons**: Lucide React icons
- **Notifications**: React Hot Toast for success/error messages

## File Structure

```
src/
├── pages/
│   └── Students.tsx          # Main Students component
├── services/
│   └── api.ts               # API service with student endpoints
├── types/
│   └── index.ts             # TypeScript interfaces
└── components/
    └── UI/
        ├── Card.tsx          # Card component wrapper
        └── LoadingSpinner.tsx # Loading spinner component
```

## Dependencies

All required dependencies are already installed:
- `react-hook-form`: Form handling
- `@hookform/resolvers`: Yup validation resolver
- `yup`: Schema validation
- `axios`: HTTP client
- `lucide-react`: Icons
- `react-hot-toast`: Notifications

## Getting Started

1. Ensure your backend API is running on `http://localhost:3000`
2. Start the development server: `npm run dev`
3. Navigate to `/students` in your browser
4. Start managing student data!

## Notes

- The form automatically sets the current year as the default admission year
- Semester is implemented as a dropdown with options 1-8
- All form fields have proper placeholders and validation messages
- The table is responsive and handles empty states gracefully
- Loading states are shown during API operations
- Success/error messages are displayed using toast notifications
