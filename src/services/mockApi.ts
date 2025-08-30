import { AuthResponse } from '../types';

// Mock API for testing
export const mockAuthAPI = {
  login: (email: string, password: string): Promise<{ data: AuthResponse }> => {
    return new Promise((resolve, reject) => {
      // Simulate API delay
      setTimeout(() => {
        // Check credentials (you can modify these)
        if (email === 'admin@polytechnic.com' && password === 'Admin123') {
          const mockResponse: AuthResponse = {
            success: true,
            message: 'Login successful',
            data: {
              user: {
                id: 1,
                name: 'Admin User',
                email: 'admin@polytechnic.com',
                role: 'admin' as const,
                isActive: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              token: 'mock-jwt-token-' + Date.now(),
            },
          };
          
          console.log('Mock API: Login successful', mockResponse);
          resolve({ data: mockResponse });
        } else {
          console.log('Mock API: Login failed - invalid credentials');
          reject(new Error('Invalid credentials'));
        }
      }, 1000); // 1 second delay to simulate network
    });
  },
};

export const mockDashboardAPI = {
  getDashboardData: (): Promise<{ data: any }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockData = {
          success: true,
          data: {
            counts: {
              students: 150,
              teachers: 25,
              guestTeachers: 8,
              departments: 6,
              courses: 45,
            },
            financials: {
              salaries: {
                total: 2500000,
                paid: 2000000,
                pending: 500000,
              },
              expenses: 150000,
              studentPayments: 800000,
            },
            attendance: {
              total: 150,
              present: 142,
              absent: 5,
              late: 3,
            },
            filters: {},
          },
        };
        
        console.log('Mock API: Dashboard data loaded', mockData);
        resolve({ data: mockData });
      }, 500);
    });
  },
};
