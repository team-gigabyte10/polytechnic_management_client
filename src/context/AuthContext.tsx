import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User } from '../types';
import { authAPI } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  console.log('AuthReducer: Action:', action.type, action.payload);
  console.log('AuthReducer: Current state:', state);
  
  let newState: AuthState;
  
  switch (action.type) {
    case 'SET_LOADING':
      newState = { ...state, isLoading: action.payload };
      break;
    case 'LOGIN_SUCCESS':
      newState = {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        isAuthenticated: true,
      };
      break;
    case 'LOGOUT':
      newState = {
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      };
      break;
    default:
      newState = state;
  }
  
  console.log('AuthReducer: New state:', newState);
  return newState;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialState = {
    user: null,
    token: null,
    isLoading: false,
    isAuthenticated: false,
  };
  
  console.log('AuthProvider: Initial state:', initialState);
  
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    console.log('AuthProvider: useEffect running, checking localStorage');
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    console.log('AuthContext: Checking localStorage:', { token: !!token, userData: !!userData });
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        console.log('AuthContext: Restoring user session:', { user, token });
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } else {
      console.log('AuthContext: No stored session found');
    }
  }, []);

  const login = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await authAPI.login(email, password);
      console.log('Login response:', response.data);
      console.log('Response structure:', {
        hasData: !!response.data,
        hasDataData: !!response.data?.data,
        dataKeys: response.data ? Object.keys(response.data) : 'no data',
        dataDataKeys: response.data?.data ? Object.keys(response.data.data) : 'no data.data'
      });
      
      // Handle different possible response structures
      let user, token;
      
      if (response.data.data && response.data.data.user && response.data.data.token) {
        // Expected structure: { data: { user, token } }
        user = response.data.data.user;
        token = response.data.data.token;
      } else if (response.data.user && response.data.token) {
        // Alternative structure: { user, token }
        user = response.data.user;
        token = response.data.token;
      } else {
        // Fallback: try to find user and token anywhere in the response
        console.warn('Unexpected response structure, attempting to find user and token');
        user = response.data.user || response.data.data?.user || response.data;
        token = response.data.token || response.data.data?.token || response.data.accessToken || response.data.access_token;
      }
      
      if (!user || !token) {
        throw new Error('Invalid response: missing user or token');
      }
      
      console.log('Extracted user and token:', { user, token });
      
      console.log('Storing in localStorage:', { token, user });
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
      console.log('Login successful, user authenticated:', { user, token });
    } catch (error) {
      console.error('Login error:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };

  console.log('AuthProvider: Providing context value:', { ...state, hasLogin: !!login, hasLogout: !!logout });
  
  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error('useAuth must be used within an AuthProvider');
    // Return a safe fallback instead of throwing
    return {
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      login: async () => {
        console.warn('Login function called outside of AuthProvider');
        throw new Error('Authentication context not available');
      },
      logout: () => {
        console.warn('Logout function called outside of AuthProvider');
      },
    };
  }
  
  console.log('useAuth hook called, returning context:', context);
  return context;
};