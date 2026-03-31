import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_BASE_URL from '../config/api';


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Automatically check if user is logged in
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/auth/me`, {

          withCredentials: true
        });
        setUser(data);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/auth/login`, {

        email,
        password,
      }, { withCredentials: true });
      setUser(data);
      toast.success(`Welcome back, ${data.username}!`, {
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed', {
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
      return false;
    }
  };

  const register = async (username, email, password) => {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/auth/register`, {

        username,
        email,
        password,
      }, { withCredentials: true });
      setUser(data);
      toast.success(`Account created successfully!`, {
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed', {
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
      return false;
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, { withCredentials: true });

      setUser(null);
      toast.success('Logged out successfully', {
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
    } catch (error) {
      toast.error('Error logging out', {
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
